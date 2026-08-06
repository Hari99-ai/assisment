import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { canManageProject, getAccessibleProjectIds, isAdmin } from '../utils/access.js';
import { resolveAttachmentUrl } from '../utils/attachments.js';
import { createNotification } from '../utils/notifications.js';
import { serializeComment, serializeTask, serializeUser } from '../utils/serializers.js';
import { upload } from '../utils/upload.js';
import { isValidDate, normalizeEnum, TASK_PRIORITIES, TASK_STATUSES } from '../utils/validators.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const { status, priority, assignedTo, projectId, search = '', dueDate, page = '1', limit = '10' } = req.query;
  const accessibleProjectIds = await getAccessibleProjectIds(req.user);
  const take = Math.min(Number(limit) || 10, 50);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
  const normalizedStatus = status ? normalizeEnum(status) : '';
  const normalizedPriority = priority ? normalizeEnum(priority) : '';

  if (status && !TASK_STATUSES.includes(normalizedStatus)) {
    return res.status(400).json({ message: 'Invalid task status' });
  }

  if (priority && !TASK_PRIORITIES.includes(normalizedPriority)) {
    return res.status(400).json({ message: 'Invalid task priority' });
  }

  if (dueDate && !isValidDate(dueDate)) {
    return res.status(400).json({ message: 'Invalid due date' });
  }

  const conditions = [{
    ...(projectId ? { projectId: String(projectId) } : {}),
    ...(status ? { status: normalizedStatus } : {}),
    ...(priority ? { priority: normalizedPriority } : {}),
    ...(assignedTo ? { assignedToId: String(assignedTo) } : {}),
    ...(dueDate ? { dueDate: { lte: new Date(String(dueDate)) } } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: String(search), mode: 'insensitive' } },
            { description: { contains: String(search), mode: 'insensitive' } }
          ]
        }
      : {})
  }];

  if (!isAdmin(req.user)) {
    conditions.push({
      OR: [
        { assignedToId: req.user.id },
        { project: { createdById: req.user.id } },
        { projectId: { in: accessibleProjectIds.length ? accessibleProjectIds : ['__none__'] } }
      ]
    });
  }

  const tasks = await prisma.task.findMany({
    where: { AND: conditions },
    include: {
      assignedTo: true,
      assignedBy: true,
      project: true,
      comments: { include: { user: true }, orderBy: { createdAt: 'desc' } }
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take
  });

  const total = await prisma.task.count({ where: { AND: conditions } });

  res.json({
    data: tasks.map(serializeTask),
    pagination: {
      page: Number(page),
      limit: take,
      total,
      pages: Math.ceil(total / take)
    }
  });
});

router.get('/:id', requireAuth, async (req, res) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: {
      assignedTo: true,
      assignedBy: true,
      project: { include: { createdBy: true, members: { include: { user: true } } } },
      comments: { include: { user: true }, orderBy: { createdAt: 'desc' } }
    }
  });

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const allowed = isAdmin(req.user) ||
    task.assignedToId === req.user.id ||
    task.project.createdById === req.user.id ||
    task.project.members.some((member) => member.userId === req.user.id);

  if (!allowed) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  res.json({ data: serializeTask(task) });
});

router.post('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { title, description, priority = 'MEDIUM', status = 'TODO', dueDate, assignedToId, projectId, attachmentUrl } = req.body;

  if (!title || !projectId) {
    return res.status(400).json({ message: 'Title and projectId are required' });
  }

  const normalizedPriority = normalizeEnum(priority);
  const normalizedStatus = normalizeEnum(status);
  if (!TASK_PRIORITIES.includes(normalizedPriority)) {
    return res.status(400).json({ message: 'Invalid task priority' });
  }
  if (!TASK_STATUSES.includes(normalizedStatus)) {
    return res.status(400).json({ message: 'Invalid task status' });
  }
  if (dueDate && !isValidDate(dueDate)) {
    return res.status(400).json({ message: 'Invalid due date' });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true }
  });

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  if (!(await canManageProject(req.user, projectId))) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      priority: normalizedPriority,
      status: normalizedStatus,
      dueDate: dueDate ? new Date(dueDate) : null,
      assignedToId: assignedToId || null,
      assignedById: req.user.id,
      projectId,
      attachmentUrl: attachmentUrl || null
    },
    include: {
      assignedTo: true,
      assignedBy: true,
      project: true,
      comments: { include: { user: true } }
    }
  });

  if (task.assignedToId) {
    await createNotification(task.assignedToId, 'TASK_ASSIGNED', `You were assigned task "${task.title}".`);
  }

  res.status(201).json({ data: serializeTask(task) });
});

router.put('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: {
      assignedTo: true,
      assignedBy: true,
      project: true,
      comments: { include: { user: true } }
    }
  });

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  if (!(await canManageProject(req.user, task.projectId))) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const updated = await prisma.task.update({
    where: { id: task.id },
    data: {
      ...(req.body.title !== undefined ? { title: req.body.title } : {}),
      ...(req.body.description !== undefined ? { description: req.body.description } : {}),
      ...(req.body.priority ? (() => {
        const normalizedPriority = normalizeEnum(req.body.priority);
        if (!TASK_PRIORITIES.includes(normalizedPriority)) {
          throw Object.assign(new Error('Invalid task priority'), { statusCode: 400 });
        }
        return { priority: normalizedPriority };
      })() : {}),
      ...(req.body.status ? (() => {
        const normalizedStatus = normalizeEnum(req.body.status);
        if (!TASK_STATUSES.includes(normalizedStatus)) {
          throw Object.assign(new Error('Invalid task status'), { statusCode: 400 });
        }
        return { status: normalizedStatus };
      })() : {}),
      ...(req.body.dueDate !== undefined ? (() => {
        if (req.body.dueDate && !isValidDate(req.body.dueDate)) {
          throw Object.assign(new Error('Invalid due date'), { statusCode: 400 });
        }
        return { dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null };
      })() : {}),
      ...(req.body.assignedToId !== undefined ? { assignedToId: req.body.assignedToId || null } : {}),
      ...(req.body.attachmentUrl !== undefined ? { attachmentUrl: req.body.attachmentUrl || null } : {})
    },
    include: {
      assignedTo: true,
      assignedBy: true,
      project: true,
      comments: { include: { user: true } }
    }
  });

  if (updated.assignedToId) {
    await createNotification(updated.assignedToId, 'TASK_UPDATED', `Task "${updated.title}" was updated.`);
  }

  res.json({ data: serializeTask(updated) });
});

router.delete('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  if (!(await canManageProject(req.user, task.projectId))) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  await prisma.task.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

router.patch('/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  const normalizedStatus = normalizeEnum(status);
  if (!TASK_STATUSES.includes(normalizedStatus)) {
    return res.status(400).json({ message: 'Invalid task status' });
  }

  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: {
      assignedTo: true,
      assignedBy: true,
      project: { include: { createdBy: true, members: true } },
      comments: { include: { user: true } }
    }
  });

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const allowed = isAdmin(req.user) || task.assignedToId === req.user.id;
  if (!allowed) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const updated = await prisma.task.update({
    where: { id: task.id },
    data: { status: normalizedStatus },
    include: {
      assignedTo: true,
      assignedBy: true,
      project: true,
      comments: { include: { user: true } }
    }
  });

  const message = `Task "${updated.title}" status changed to ${updated.status}.`;
  if (updated.assignedById) {
    await createNotification(updated.assignedById, updated.status === 'COMPLETED' ? 'TASK_COMPLETED' : 'TASK_UPDATED', message);
  }
  if (updated.assignedToId && updated.assignedToId !== updated.assignedById) {
    await createNotification(updated.assignedToId, 'TASK_UPDATED', message);
  }

  res.json({ data: serializeTask(updated) });
});

router.post('/:id/comments', requireAuth, async (req, res) => {
  const { body } = req.body;
  if (!body) {
    return res.status(400).json({ message: 'Comment body is required' });
  }

  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: { project: { include: { members: true } } }
  });

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const allowed = isAdmin(req.user) ||
    task.assignedToId === req.user.id ||
    task.project.createdById === req.user.id ||
    task.project.members.some((member) => member.userId === req.user.id);

  if (!allowed) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const comment = await prisma.comment.create({
    data: {
      body,
      taskId: task.id,
      userId: req.user.id
    },
    include: { user: true }
  });

  if (task.assignedToId && task.assignedToId !== req.user.id) {
    await createNotification(task.assignedToId, 'TASK_UPDATED', `New comment on task "${task.title}".`);
  }

  res.status(201).json({ data: serializeComment(comment) });
});

router.post('/:id/attachment', requireAuth, upload.single('file'), async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  if (!(await canManageProject(req.user, task.projectId))) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'File is required' });
  }

  const attachmentUrl = await resolveAttachmentUrl(req.file);
  const updated = await prisma.task.update({
    where: { id: task.id },
    data: { attachmentUrl },
    include: {
      assignedTo: true,
      assignedBy: true,
      project: true,
      comments: { include: { user: true } }
    }
  });

  res.json({ data: serializeTask(updated) });
});

export default router;

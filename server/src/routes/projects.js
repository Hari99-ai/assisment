import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { canManageProject, isAdmin } from '../utils/access.js';
import { serializeProject, serializeUser } from '../utils/serializers.js';
import { createNotification } from '../utils/notifications.js';
import { isValidDate, normalizeEnum, PROJECT_STATUSES } from '../utils/validators.js';

const router = Router();

function parseDate(value) {
  return value ? new Date(value) : null;
}

router.get('/', requireAuth, async (req, res) => {
  const { search = '', status, page = '1', limit = '10' } = req.query;
  const take = Math.min(Number(limit) || 10, 50);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
  const normalizedStatus = status ? normalizeEnum(status) : '';

  if (status && !PROJECT_STATUSES.includes(normalizedStatus)) {
    return res.status(400).json({ message: 'Invalid project status' });
  }

  const where = {
    ...(search
      ? {
          projectName: { contains: String(search), mode: 'insensitive' }
        }
      : {}),
    ...(status ? { status: normalizedStatus } : {})
  };

  if (!isAdmin(req.user)) {
    where.OR = [
      { createdById: req.user.id },
      { members: { some: { userId: req.user.id } } }
    ];
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        createdBy: true,
        members: { include: { user: true } },
        _count: { select: { tasks: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    }),
    prisma.project.count({ where })
  ]);

  res.json({
    data: projects.map(serializeProject),
    pagination: {
      page: Number(page),
      limit: take,
      total,
      pages: Math.ceil(total / take)
    }
  });
});

router.post('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { projectName, description, deadline, status = 'ACTIVE', memberIds = [] } = req.body;

  if (!projectName) {
    return res.status(400).json({ message: 'Project name is required' });
  }

  const normalizedStatus = normalizeEnum(status);
  if (!PROJECT_STATUSES.includes(normalizedStatus)) {
    return res.status(400).json({ message: 'Invalid project status' });
  }

  if (deadline && !isValidDate(deadline)) {
    return res.status(400).json({ message: 'Invalid deadline' });
  }

  const project = await prisma.project.create({
    data: {
      projectName,
      description,
      deadline: parseDate(deadline) || undefined,
      status: normalizedStatus,
      createdById: req.user.id,
      members: {
        create: [
          {
            userId: req.user.id,
            role: 'ADMIN'
          },
          ...(Array.isArray(memberIds)
            ? [...new Set(memberIds.filter((userId) => userId && userId !== req.user.id))].map((userId) => ({
                userId,
                role: 'MEMBER'
              }))
            : [])
        ]
      }
    },
    include: {
      createdBy: true,
      members: { include: { user: true } }
    }
  });

  res.status(201).json({ data: serializeProject(project) });
});

router.get('/:id', requireAuth, async (req, res) => {
  const accessWhere = isAdmin(req.user)
    ? {}
    : {
        OR: [
          { createdById: req.user.id },
          { members: { some: { userId: req.user.id } } }
        ]
      };

  const project = await prisma.project.findFirst({
    where: {
      id: req.params.id,
      ...accessWhere
    },
    include: {
      createdBy: true,
      members: { include: { user: true } },
      tasks: {
        include: {
          assignedTo: true,
          assignedBy: true,
          comments: { include: { user: true }, orderBy: { createdAt: 'desc' } }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  res.json({ data: serializeProject(project), tasks: project.tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate,
    assignedTo: serializeUser(task.assignedTo),
    assignedBy: serializeUser(task.assignedBy),
    createdAt: task.createdAt,
    comments: task.comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      user: serializeUser(comment.user)
    }))
  })) });
});

router.put('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { projectName, description, deadline, status } = req.body;

  if (status) {
    const normalizedStatus = normalizeEnum(status);
    if (!PROJECT_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({ message: 'Invalid project status' });
    }
  }

  if (deadline !== undefined && deadline !== null && deadline !== '' && !isValidDate(deadline)) {
    return res.status(400).json({ message: 'Invalid deadline' });
  }

  const project = await prisma.project.update({
    where: { id: req.params.id },
    data: {
      ...(projectName ? { projectName } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(deadline !== undefined ? { deadline: parseDate(deadline) } : {}),
      ...(status ? { status: normalizeEnum(status) } : {})
    },
    include: {
      createdBy: true,
      members: { include: { user: true } }
    }
  });

  await prisma.notification.createMany({
    data: project.members.map((member) => ({
      userId: member.userId,
      type: 'PROJECT_UPDATED',
      message: `Project ${project.projectName} was updated.`
    }))
  });

  res.json({ data: serializeProject(project) });
});

router.delete('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  await prisma.project.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

router.post('/:id/members', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { userId, email } = req.body;
  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : email
      ? await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } })
      : null;

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const project = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const member = await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId: req.params.id,
        userId: user.id
      }
    },
    update: {},
    create: {
      projectId: req.params.id,
      userId: user.id,
      role: 'MEMBER'
    },
    include: { user: true }
  });

  await createNotification(user.id, 'PROJECT_UPDATED', 'You were added to a project.');

  res.status(201).json({ data: { id: member.id, user: serializeUser(member.user), role: member.role } });
});

router.delete('/:id/members/:userId', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId: req.params.id,
          userId: req.params.userId
        }
      }
    });
  } catch {
    return res.status(404).json({ message: 'Member not found' });
  }

  res.status(204).send();
});

router.get('/:id/access', requireAuth, async (req, res) => {
  const allowed = await canManageProject(req.user, req.params.id);
  res.json({ allowed });
});

export default router;

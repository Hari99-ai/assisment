import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { getAccessibleProjectIds, isAdmin } from '../utils/access.js';
import { serializeProject, serializeTask, serializeUser } from '../utils/serializers.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const projectFilterIds = await getAccessibleProjectIds(req.user);
  const projectWhere = isAdmin(req.user)
    ? {}
    : {
        OR: [
          { createdById: req.user.id },
          { members: { some: { userId: req.user.id } } }
        ]
      };
  const taskWhere = isAdmin(req.user)
    ? {}
    : {
        OR: [
          { assignedToId: req.user.id },
          { project: { createdById: req.user.id } },
          { projectId: { in: projectFilterIds.length ? projectFilterIds : ['__none__'] } }
        ]
      };

  const [projects, tasks, members, totalProjects, totalTasks, completedTasks, pendingTasks, overdueTasks, teamMembers] = await Promise.all([
    prisma.project.findMany({
      where: projectWhere,
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { createdBy: true, members: { include: { user: true } }, _count: { select: { tasks: true } } }
    }),
    prisma.task.findMany({
      where: taskWhere,
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: { assignedTo: true, assignedBy: true, project: true, comments: { include: { user: true } } }
    }),
    prisma.projectMember.findMany({
      where: isAdmin(req.user) ? {} : { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: true, project: true }
    }),
    prisma.project.count({ where: projectWhere }),
    prisma.task.count({ where: taskWhere }),
    prisma.task.count({ where: { AND: [taskWhere, { status: 'COMPLETED' }] } }),
    prisma.task.count({ where: { AND: [taskWhere, { status: { in: ['TODO', 'IN_PROGRESS'] } }] } }),
    prisma.task.count({ where: { AND: [taskWhere, { status: 'OVERDUE' }] } }),
    isAdmin(req.user)
      ? prisma.user.count()
      : prisma.projectMember.count({ where: { userId: req.user.id } })
  ]);

  const counts = {
    totalProjects,
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    teamMembers,
    completionPercentage: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0
  };

  const statusBreakdown = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  res.json({
    counts,
    projects: projects.map(serializeProject),
    tasks: tasks.map(serializeTask),
    members: members.map((member) => ({
      id: member.id,
      user: serializeUser(member.user),
      project: member.project ? {
        id: member.project.id,
        projectName: member.project.projectName
      } : null,
      createdAt: member.createdAt
    })),
    statusBreakdown
  });
});

export default router;

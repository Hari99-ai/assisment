import { prisma } from '../config/prisma.js';

export function isAdmin(user) {
  return user?.role === 'ADMIN';
}

export async function canManageProject(user, projectId) {
  if (!user) return false;
  if (isAdmin(user)) return true;

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { createdById: user.id },
        { members: { some: { userId: user.id } } }
      ]
    },
    select: { id: true }
  });

  return Boolean(project);
}

export async function getAccessibleProjectIds(user) {
  if (isAdmin(user)) return null;

  const memberships = await prisma.projectMember.findMany({
    where: { userId: user.id },
    select: { projectId: true }
  });

  return memberships.map((m) => m.projectId);
}


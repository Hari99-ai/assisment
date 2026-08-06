import { prisma } from '../config/prisma.js';

export async function createNotification(userId, type, message) {
  if (!userId) return null;
  return prisma.notification.create({
    data: { userId, type, message }
  });
}


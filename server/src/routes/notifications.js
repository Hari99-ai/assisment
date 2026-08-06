import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { serializeNotification } from '../utils/serializers.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  res.json({ data: notifications.map(serializeNotification) });
});

router.patch('/:id/read', requireAuth, async (req, res) => {
  const notification = await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user.id },
    data: { readAt: new Date() }
  });

  res.json({ updated: notification.count > 0 });
});

export default router;


import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { serializeUser } from '../utils/serializers.js';

const router = Router();

router.get('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  res.json({ data: users.map(serializeUser) });
});

router.put('/:id', requireAuth, async (req, res) => {
  const canEdit = req.user.id === req.params.id || req.user.role === 'ADMIN';
  if (!canEdit) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const updates = {};
  if (req.body.name) updates.name = req.body.name;
  if (req.body.profileImage !== undefined) updates.profileImage = req.body.profileImage;
  if (req.body.password) {
    if (req.body.password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    updates.password = await bcrypt.hash(req.body.password, 12);
  }
  if (req.user.role === 'ADMIN' && req.body.role) {
    updates.role = req.body.role;
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: updates
  });

  res.json({ data: serializeUser(user) });
});

router.delete('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;


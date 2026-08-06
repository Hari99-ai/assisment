import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { signToken } from '../utils/jwt.js';
import { serializeUser } from '../utils/serializers.js';
import { isEmail } from '../utils/validators.js';

const router = Router();

function authPayload(user) {
  return {
    token: signToken({ sub: user.id, role: user.role }),
    user: serializeUser(user)
  };
}

router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  if (!isEmail(email)) {
    return res.status(400).json({ message: 'Invalid email address' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  const normalizedEmail = email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return res.status(409).json({ message: 'Email is already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const userCount = await prisma.user.count();
  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: userCount === 0 && role === 'ADMIN' ? 'ADMIN' : 'MEMBER'
    }
  });

  return res.status(201).json(authPayload(user));
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (!isEmail(email)) {
    return res.status(400).json({ message: 'Invalid email address' });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  return res.json(authPayload(user));
});

router.get('/profile', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({ user: serializeUser(user) });
});

router.put('/profile', requireAuth, async (req, res) => {
  const { name, profileImage, password } = req.body;
  const updates = {};

  if (name) updates.name = name;
  if (profileImage !== undefined) updates.profileImage = profileImage;
  if (password) {
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    updates.password = await bcrypt.hash(password, 12);
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: updates
  });

  res.json({ user: serializeUser(user) });
});

export default router;

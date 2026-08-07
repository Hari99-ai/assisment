import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('WARNING: JWT_SECRET is not set in production. Using an insecure fallback secret.');
}

export function signToken(payload) {
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyToken(token) {
  return jwt.verify(token, secret);
}


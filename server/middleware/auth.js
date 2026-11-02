import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { RefreshToken, User } from '../models/index.js';

export const publicUser = user => ({ id: String(user._id), name: user.name, email: user.email, phone: user.phone, role: user.role, status: user.status, addresses: user.addresses || [], avatarUrl: user.avatarUrl || '' });
const signAccess = user => jwt.sign({ sub: String(user._id), role: user.role }, env.accessSecret, { expiresIn: '15m' });
const signRefresh = user => jwt.sign({ sub: String(user._id), type: 'refresh' }, env.refreshSecret, { expiresIn: '30d' });
const digest = value => crypto.createHash('sha256').update(value).digest('hex');

export async function createSession(user) {
  const refreshToken = signRefresh(user);
  await RefreshToken.create({ userRef: user._id, tokenHash: digest(refreshToken), expiresAt: new Date(Date.now() + 30 * 86400000) });
  return { accessToken: signAccess(user), refreshToken, user: publicUser(user) };
}
export async function rotateSession(refreshToken) {
  const payload = jwt.verify(refreshToken, env.refreshSecret);
  if (payload.type !== 'refresh') throw new Error('Invalid refresh token.');
  const record = await RefreshToken.findOneAndDelete({ tokenHash: digest(refreshToken), userRef: payload.sub });
  const user = record && await User.findById(payload.sub);
  if (!user || user.status !== 'active') throw new Error('Session expired.');
  return createSession(user);
}
export async function revokeSession(refreshToken) { if (refreshToken) await RefreshToken.deleteOne({ tokenHash: digest(refreshToken) }); }
export async function authenticateToken(token) {
  const payload = jwt.verify(token, env.accessSecret);
  const user = await User.findById(payload.sub);
  if (!user || user.status !== 'active') throw new Error('Account unavailable.');
  return user;
}
export async function requireAuth(req, res, next) { try { const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''); if (!token) return res.status(401).json({ message: 'Sign in required.' }); req.user = await authenticateToken(token); next(); } catch { res.status(401).json({ message: 'Your session expired. Please sign in again.' }); } }
export const requireRole = (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'You do not have permission for this action.' });
export async function verifyPassword(user, password) { return bcrypt.compare(password, user.passwordHash); }
export const hashPassword = password => bcrypt.hash(password, 12);

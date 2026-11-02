import jwt from 'jsonwebtoken';
import { User } from './models.js';

export function publicUser(user) {
  return { id: String(user._id), uid: String(user._id), name: user.name, displayName: user.name, email: user.email, phone: user.phone, address: user.address, avatarUrl: user.avatarUrl, role: user.role, active: user.active };
}
export function signToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}
export async function requireAuth(req, res, next) {
  try {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ message: 'Sign in required.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || !user.active) return res.status(401).json({ message: 'This account is unavailable.' });
    req.user = user;
    next();
  } catch { res.status(401).json({ message: 'Your session expired. Please sign in again.' }); }
}
export function requireRole(...roles) {
  return (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'You do not have access to this action.' });
}

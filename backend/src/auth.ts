import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { RequestHandler } from 'express';
import { pool } from './db/pool';
import { config } from './config';
import { AuthUser, Role } from './types';

export async function authenticate(email: string, password: string): Promise<AuthUser | null> {
  const result = await pool.query(
    'SELECT id, name, email, password_hash, role, apartment_id FROM users WHERE lower(email) = lower($1) AND status = $2',
    [email, 'ACTIVE'],
  );
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role, apartmentId: user.apartment_id };
}

export const signToken = (user: AuthUser) =>
  jwt.sign(user, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as jwt.SignOptions);

export const requireAuth: RequestHandler = (req, res, next) => {
  const token = req.header('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ success: false, error: 'Authentication required' });
  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload & AuthUser;
    if (!payload.id || !payload.role) throw new Error('Invalid token');
    req.user = {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      apartmentId: payload.apartmentId ?? null,
    };
    return next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

export const requireRole = (...roles: Role[]): RequestHandler => (req, res, next) => {
  if (req.user && roles.includes(req.user.role)) return next();
  return res.status(403).json({ success: false, error: 'Insufficient permissions' });
};

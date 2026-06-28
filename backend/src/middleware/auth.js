import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/connection.js';

const JWT_SECRET = process.env.JWT_SECRET || 'financier-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export const hashPassword = (password) => bcrypt.hash(password, 12);
export const comparePassword = (password, hash) => bcrypt.compare(password, hash);

export const generateToken = (userId) =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    const result = await pool.query('SELECT id, email, name, avatar_url, role FROM users WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = result.rows[0];
    const household = await pool.query(
      'SELECT h.* FROM households h JOIN household_members hm ON h.id = hm.household_id WHERE hm.user_id = $1 LIMIT 1',
      [decoded.userId]
    );
    req.household = household.rows[0] || null;
    next();
  } catch (err) {
    next(err);
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded) {
      const result = await pool.query('SELECT id, email, name, avatar_url, role FROM users WHERE id = $1', [decoded.userId]);
      if (result.rows.length > 0) {
        req.user = result.rows[0];
        const household = await pool.query(
          'SELECT h.* FROM households h JOIN household_members hm ON h.id = hm.household_id WHERE hm.user_id = $1 LIMIT 1',
          [decoded.userId]
        );
        req.household = household.rows[0] || null;
      }
    }
    next();
  } catch (err) {
    next();
  }
};

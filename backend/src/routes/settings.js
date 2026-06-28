import { Router } from 'express';
import pool from '../db/connection.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM settings WHERE user_id = $1 ORDER BY key ASC',
      [req.user.id]
    );

    const settings = {};
    for (const row of result.rows) {
      settings[row.key] = row.value;
    }

    res.json({ data: settings });
  } catch (err) {
    next(err);
  }
});

router.put('/:key', async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      throw new AppError('value is required', 400);
    }

    const result = await pool.query(
      `INSERT INTO settings (key, value, user_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (key, user_id) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [key, value, req.user.id]
    );

    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;

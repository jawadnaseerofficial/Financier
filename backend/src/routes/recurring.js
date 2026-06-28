import { Router } from 'express';
import pool from '../db/connection.js';
import { AppError } from '../middleware/errorHandler.js';
import { validate, parseQueryParams } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const createSchema = {
  name: { required: true, minLength: 1 },
  amount: { required: true, type: 'number' },
  frequency: { required: true, minLength: 1 },
  next_date: { required: true, type: 'date' },
  category: { required: true, minLength: 1 },
};

const updateSchema = {
  name: { minLength: 1 },
  amount: { type: 'number' },
  frequency: { minLength: 1 },
  next_date: { type: 'date' },
  category: { minLength: 1 },
  account_id: { type: 'number' },
  is_active: { type: 'boolean' },
};

const FREQUENCIES = ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];

router.get('/', parseQueryParams, async (req, res, next) => {
  try {
    const { page, limit, offset, sort, order } = req.pagination;
    const { frequency, is_active, category } = req.query;

    let where = 'WHERE r.user_id = $1';
    const params = [req.user.id];
    let paramIndex = 2;

    if (frequency) {
      where += ` AND frequency = $${paramIndex++}`;
      params.push(frequency);
    }
    if (is_active !== undefined) {
      where += ` AND is_active = $${paramIndex++}`;
      params.push(is_active === 'true');
    }
    if (category) {
      where += ` AND category = $${paramIndex++}`;
      params.push(category);
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM recurring r ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const validSortColumns = ['id', 'name', 'amount', 'frequency', 'next_date', 'category', 'is_active'];
    const sortColumn = validSortColumns.includes(sort) ? sort : 'id';
    const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

    const limitParam = paramIndex;
    const offsetParam = paramIndex + 1;

    const result = await pool.query(
      `SELECT r.*, a.name as account_name
       FROM recurring r
       LEFT JOIN accounts a ON r.account_id = a.id
       ${where}
       ORDER BY r.${sortColumn} ${sortOrder}
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      [...params, limit, offset]
    );

    res.json({
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/summary', async (req, res, next) => {
  try {
    const totalResult = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN is_active THEN
          CASE frequency
            WHEN 'weekly' THEN amount * 4.33
            WHEN 'biweekly' THEN amount * 2.17
            WHEN 'monthly' THEN amount
            WHEN 'quarterly' THEN amount / 3
            WHEN 'yearly' THEN amount / 12
            ELSE amount
          END
        ELSE 0 END), 0) as total_monthly
      FROM recurring
      WHERE user_id = $1
    `, [req.user.id]);

    const categoryResult = await pool.query(`
      SELECT
        category,
        COUNT(*) as count,
        COALESCE(SUM(CASE WHEN is_active THEN
          CASE frequency
            WHEN 'weekly' THEN amount * 4.33
            WHEN 'biweekly' THEN amount * 2.17
            WHEN 'monthly' THEN amount
            WHEN 'quarterly' THEN amount / 3
            WHEN 'yearly' THEN amount / 12
            ELSE amount
          END
        ELSE 0 END), 0) as monthly_amount
      FROM recurring
      WHERE user_id = $1
      GROUP BY category
      ORDER BY monthly_amount DESC
    `, [req.user.id]);

    res.json({
      data: {
        totalMonthly: parseFloat(totalResult.rows[0].total_monthly),
        by_category: categoryResult.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/upcoming', async (req, res, next) => {
  try {
    const days = Math.min(90, Math.max(1, parseInt(req.query.days) || 30));
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const result = await pool.query(`
      SELECT r.*, a.name as account_name
      FROM recurring r
      LEFT JOIN accounts a ON r.account_id = a.id
      WHERE r.is_active = true
        AND r.next_date >= $1
        AND r.next_date <= $2
        AND r.user_id = $3
      ORDER BY r.next_date ASC
    `, [today, futureDate, req.user.id]);

    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT r.*, a.name as account_name
       FROM recurring r
       LEFT JOIN accounts a ON r.account_id = a.id
       WHERE r.id = $1 AND r.user_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Recurring item not found', 404);
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const { name, amount, frequency, next_date, category, account_id, is_active } = req.body;

    if (!FREQUENCIES.includes(frequency)) {
      throw new AppError(`Frequency must be one of: ${FREQUENCIES.join(', ')}`, 400);
    }

    const result = await pool.query(
      `INSERT INTO recurring (name, amount, frequency, next_date, category, account_id, is_active, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, amount, frequency, next_date, category, account_id || null, is_active !== false, req.user.id]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validate(updateSchema), async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.body.frequency && !FREQUENCIES.includes(req.body.frequency)) {
      throw new AppError(`Frequency must be one of: ${FREQUENCIES.join(', ')}`, 400);
    }

    const fields = ['name', 'amount', 'frequency', 'next_date', 'category', 'account_id', 'is_active'];
    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        values.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.user.id);
    values.push(id);

    const result = await pool.query(
      `UPDATE recurring SET ${updates.join(', ')} WHERE user_id = $${paramIndex} AND id = $${paramIndex + 1} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError('Recurring item not found', 404);
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put('/:id/toggle', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE recurring SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Recurring item not found', 404);
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM recurring WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.user.id]);

    if (result.rows.length === 0) {
      throw new AppError('Recurring item not found', 404);
    }

    res.json({ data: { id: result.rows[0].id, deleted: true } });
  } catch (err) {
    next(err);
  }
});

export default router;

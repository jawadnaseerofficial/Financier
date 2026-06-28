import { Router } from 'express';
import pool from '../db/connection.js';
import { AppError } from '../middleware/errorHandler.js';
import { validate, parseQueryParams } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const createSchema = {
  name: { required: true, minLength: 1 },
  symbol: { required: true, minLength: 1 },
  shares: { required: true, type: 'number', min: 0 },
  current_price: { required: true, type: 'number', min: 0 },
  total_value: { required: true, type: 'number' },
};

const updateSchema = {
  name: { minLength: 1 },
  symbol: { minLength: 1 },
  shares: { type: 'number', min: 0 },
  current_price: { type: 'number', min: 0 },
  total_value: { type: 'number' },
  day_change: { type: 'number' },
  day_change_percent: { type: 'number' },
};

router.get('/', parseQueryParams, async (req, res, next) => {
  try {
    const { page, limit, offset, sort, order } = req.pagination;
    const { symbol, search } = req.query;

    let where = 'WHERE user_id = $1';
    const params = [req.user.id];
    let paramIndex = 2;

    if (symbol) {
      where += ` AND symbol = $${paramIndex++}`;
      params.push(symbol.toUpperCase());
    }
    if (search) {
      where += ` AND (name ILIKE $${paramIndex} OR symbol ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM investments ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const validSortColumns = ['id', 'name', 'symbol', 'shares', 'current_price', 'total_value', 'day_change'];
    const sortColumn = validSortColumns.includes(sort) ? sort : 'id';
    const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

    const limitParam = paramIndex;
    const offsetParam = paramIndex + 1;

    const result = await pool.query(
      `SELECT * FROM investments ${where} ORDER BY ${sortColumn} ${sortOrder} LIMIT $${limitParam} OFFSET $${offsetParam}`,
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
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_holdings,
        COALESCE(SUM(total_value), 0) as total_value,
        COALESCE(SUM(day_change), 0) as total_day_change,
        CASE WHEN SUM(total_value) > 0
          THEN ROUND((SUM(day_change) / (SUM(total_value) - SUM(day_change)) * 100)::numeric, 2)
          ELSE 0
        END as total_day_change_percent
      FROM investments
      WHERE user_id = $1
    `, [req.user.id]);

    res.json({
      data: {
        totalHoldings: parseInt(result.rows[0].total_holdings),
        totalValue: parseFloat(result.rows[0].total_value),
        dayChange: parseFloat(result.rows[0].total_day_change),
        dayChangePercent: parseFloat(result.rows[0].total_day_change_percent),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/allocation', async (req, res, next) => {
  try {
    const totalResult = await pool.query('SELECT COALESCE(SUM(total_value), 0) as total FROM investments WHERE user_id = $1', [req.user.id]);
    const total = parseFloat(totalResult.rows[0].total);

    const typeResult = await pool.query(`
      SELECT
        name as holding,
        symbol,
        total_value,
        day_change,
        day_change_percent,
        CASE WHEN $1::numeric > 0 THEN ROUND((total_value / $1::numeric * 100)::numeric, 2) ELSE 0 END as allocation_pct
      FROM investments
      WHERE user_id = $2
      ORDER BY total_value DESC
    `, [total, req.user.id]);

    res.json({
      data: {
        total_value: total,
        holdings: typeResult.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM investments WHERE id = $1 AND user_id = $2', [id, req.user.id]);

    if (result.rows.length === 0) {
      throw new AppError('Investment not found', 404);
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const { name, symbol, shares, current_price, total_value, day_change, day_change_percent } = req.body;
    const result = await pool.query(
      `INSERT INTO investments (name, symbol, shares, current_price, total_value, day_change, day_change_percent, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, symbol.toUpperCase(), shares, current_price, total_value, day_change || 0, day_change_percent || 0, req.user.id]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validate(updateSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const fields = ['name', 'symbol', 'shares', 'current_price', 'total_value', 'day_change', 'day_change_percent'];
    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        const value = field === 'symbol' ? req.body[field].toUpperCase() : req.body[field];
        updates.push(`${field} = $${paramIndex++}`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.user.id);
    values.push(id);

    const result = await pool.query(
      `UPDATE investments SET ${updates.join(', ')} WHERE user_id = $${paramIndex} AND id = $${paramIndex + 1} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError('Investment not found', 404);
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM investments WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.user.id]);

    if (result.rows.length === 0) {
      throw new AppError('Investment not found', 404);
    }

    res.json({ data: { id: result.rows[0].id, deleted: true } });
  } catch (err) {
    next(err);
  }
});

export default router;

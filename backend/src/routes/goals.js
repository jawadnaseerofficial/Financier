import { Router } from 'express';
import pool from '../db/connection.js';
import { AppError } from '../middleware/errorHandler.js';
import { validate, parseQueryParams } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const createSchema = {
  name: { required: true, minLength: 1 },
  type: { required: true, minLength: 1 },
  target: { required: true, type: 'number', min: 0.01 },
};

const updateSchema = {
  name: { minLength: 1 },
  type: { minLength: 1 },
  target: { type: 'number', min: 0.01 },
  deadline: { type: 'date' },
  monthly_contribution: { type: 'number', min: 0 },
};

const contributeSchema = {
  amount: { required: true, type: 'number', min: 0.01 },
};

router.get('/', parseQueryParams, async (req, res, next) => {
  try {
    const { page, limit, offset, sort, order } = req.pagination;
    const { type } = req.query;

    let where = 'WHERE user_id = $1';
    const params = [req.user.id];
    let paramIndex = 2;

    if (type) {
      where += ` AND type = $${paramIndex++}`;
      params.push(type);
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM goals ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const validSortColumns = ['id', 'name', 'type', 'target', 'current', 'deadline', 'monthly_contribution', 'created_at'];
    const sortColumn = validSortColumns.includes(sort) ? sort : 'id';
    const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

    const limitParam = paramIndex;
    const offsetParam = paramIndex + 1;

    const result = await pool.query(
      `SELECT *, CASE WHEN target > 0 THEN ROUND((current / target * 100)::numeric, 1) ELSE 0 END as "percentComplete"
       FROM goals ${where}
       ORDER BY ${sortColumn} ${sortOrder}
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
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_goals,
        COALESCE(SUM(target), 0) as total_target,
        COALESCE(SUM(current), 0) as total_current,
        COALESCE(SUM(monthly_contribution), 0) as total_monthly_contribution,
        COUNT(*) FILTER (WHERE current >= target) as completed_goals,
        COALESCE(AVG(CASE WHEN target > 0 THEN (current / target * 100) END), 0) as avg_progress
      FROM goals
      WHERE user_id = $1
    `, [req.user.id]);

    const byType = await pool.query(`
      SELECT
        type,
        COUNT(*) as count,
        SUM(target) as total_target,
        SUM(current) as total_current,
        SUM(monthly_contribution) as total_monthly
      FROM goals
      WHERE user_id = $1
      GROUP BY type
      ORDER BY total_target DESC
    `, [req.user.id]);

    res.json({
      data: {
        totalSaved: parseFloat(result.rows[0].total_current),
        totalTarget: parseFloat(result.rows[0].total_target),
        totalMonthly: parseFloat(result.rows[0].total_monthly_contribution),
        completedGoals: parseInt(result.rows[0].completed_goals),
        overview: result.rows[0],
        by_type: byType.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT *, CASE WHEN target > 0 THEN ROUND((current / target * 100)::numeric, 1) ELSE 0 END as progress_pct
       FROM goals WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Goal not found', 404);
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const { name, type, target, current, deadline, monthly_contribution } = req.body;
    const result = await pool.query(
      `INSERT INTO goals (name, type, target, current, deadline, monthly_contribution, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, type, target, current || 0, deadline || null, monthly_contribution || 0, req.user.id]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/contribute', validate(contributeSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, notes } = req.body;

    const goalResult = await pool.query('SELECT * FROM goals WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (goalResult.rows.length === 0) {
      throw new AppError('Goal not found', 404);
    }

    const goal = goalResult.rows[0];
    const newCurrent = parseFloat(goal.current) + parseFloat(amount);

    const result = await pool.query(
      `UPDATE goals SET current = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3 RETURNING *`,
      [newCurrent, id, req.user.id]
    );

    res.json({
      data: result.rows[0],
      contribution: {
        amount: parseFloat(amount),
        previous: parseFloat(goal.current),
        new_total: newCurrent,
        remaining: Math.max(0, parseFloat(goal.target) - newCurrent),
        completed: newCurrent >= parseFloat(goal.target),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validate(updateSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const fields = ['name', 'type', 'target', 'current', 'deadline', 'monthly_contribution'];
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
      `UPDATE goals SET ${updates.join(', ')} WHERE user_id = $${paramIndex} AND id = $${paramIndex + 1} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError('Goal not found', 404);
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.user.id]);

    if (result.rows.length === 0) {
      throw new AppError('Goal not found', 404);
    }

    res.json({ data: { id: result.rows[0].id, deleted: true } });
  } catch (err) {
    next(err);
  }
});

export default router;

import { Router } from 'express';
import pool from '../db/connection.js';
import { AppError } from '../middleware/errorHandler.js';
import { validate, parseQueryParams } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const createSchema = {
  date: { required: true, type: 'date' },
  merchant: { required: true, minLength: 1 },
  category: { required: true, minLength: 1 },
  amount: { required: true, type: 'number' },
  account_id: { required: true, type: 'number' },
};

const updateSchema = {
  date: { type: 'date' },
  merchant: { minLength: 1 },
  category: { minLength: 1 },
  amount: { type: 'number' },
  status: { oneOf: ['cleared', 'pending', 'reconciled'] },
};

const buildTransactionQuery = (queryParams, { page, limit, offset, sort, order }, userId) => {
  let where = 'WHERE t.user_id = $1';
  const params = [userId];
  let paramIndex = 2;

  if (queryParams.owner) {
    where += ` AND t.owner = $${paramIndex++}`;
    params.push(queryParams.owner);
  }
  if (queryParams.category) {
    where += ` AND t.category = $${paramIndex++}`;
    params.push(queryParams.category);
  }
  if (queryParams.account_id) {
    where += ` AND t.account_id = $${paramIndex++}`;
    params.push(parseInt(queryParams.account_id));
  }
  if (queryParams.status) {
    where += ` AND t.status = $${paramIndex++}`;
    params.push(queryParams.status);
  }
  if (queryParams.start_date) {
    where += ` AND t.date >= $${paramIndex++}`;
    params.push(queryParams.start_date);
  }
  if (queryParams.end_date) {
    where += ` AND t.date <= $${paramIndex++}`;
    params.push(queryParams.end_date);
  }
  if (queryParams.search) {
    where += ` AND (t.merchant ILIKE $${paramIndex} OR t.notes ILIKE $${paramIndex})`;
    params.push(`%${queryParams.search}%`);
    paramIndex++;
  }
  if (queryParams.tags) {
    const tags = Array.isArray(queryParams.tags) ? queryParams.tags : [queryParams.tags];
    where += ` AND t.tags && $${paramIndex++}`;
    params.push(tags);
  }
  if (queryParams.goal_id) {
    where += ` AND t.goal_id = $${paramIndex++}`;
    params.push(parseInt(queryParams.goal_id));
  }

  const validSortColumns = ['id', 'date', 'merchant', 'category', 'amount', 'status', 'created_at'];
  const sortColumn = validSortColumns.includes(sort) ? `t.${sort}` : 't.date';
  const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

  return { where, params, paramIndex, sortColumn, sortOrder };
};

router.get('/', parseQueryParams, async (req, res, next) => {
  try {
    const { page, limit, offset, sort, order } = req.pagination;
    const { where, params, paramIndex, sortColumn, sortOrder } = buildTransactionQuery(req.query, req.pagination, req.user.id);

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM transactions t ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const limitParam = paramIndex;
    const offsetParam = paramIndex + 1;

    const result = await pool.query(
      `SELECT t.*, a.name as account_name
       FROM transactions t
       LEFT JOIN accounts a ON t.account_id = a.id
       ${where}
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
    const { start_date, end_date, owner } = req.query;
    let where = 'WHERE user_id = $1';
    const params = [req.user.id];
    let paramIndex = 2;

    if (owner) {
      where += ` AND owner = $${paramIndex++}`;
      params.push(owner);
    }
    if (start_date) {
      where += ` AND date >= $${paramIndex++}`;
      params.push(start_date);
    }
    if (end_date) {
      where += ` AND date <= $${paramIndex++}`;
      params.push(end_date);
    }

    const monthlyResult = await pool.query(`
      SELECT
        DATE_TRUNC('month', date) as month,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses,
        SUM(amount) as net
      FROM transactions
      ${where}
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month DESC
    `, params);

    const categoryResult = await pool.query(`
      SELECT
        category,
        SUM(ABS(amount)) as total,
        COUNT(*) as count
      FROM transactions
      ${where}
      GROUP BY category
      ORDER BY total DESC
    `, params);

    res.json({
      data: {
        monthly: monthlyResult.rows,
        by_category: categoryResult.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/export', async (req, res, next) => {
  try {
    const { start_date, end_date, owner, category, account_id } = req.query;
    let where = 'WHERE t.user_id = $1';
    const params = [req.user.id];
    let paramIndex = 2;

    if (owner) { where += ` AND t.owner = $${paramIndex++}`; params.push(owner); }
    if (start_date) { where += ` AND t.date >= $${paramIndex++}`; params.push(start_date); }
    if (end_date) { where += ` AND t.date <= $${paramIndex++}`; params.push(end_date); }
    if (category) { where += ` AND t.category = $${paramIndex++}`; params.push(category); }
    if (account_id) { where += ` AND t.account_id = $${paramIndex++}`; params.push(parseInt(account_id)); }

    const result = await pool.query(
      `SELECT t.id, t.date, t.merchant, t.category, t.amount, a.name as account_name, t.status, t.tags, t.notes
       FROM transactions t
       LEFT JOIN accounts a ON t.account_id = a.id
       ${where}
       ORDER BY t.date DESC`,
      params
    );

    const headers = ['id', 'date', 'merchant', 'category', 'amount', 'account', 'status', 'tags', 'notes'];
    const csvRows = [headers.join(',')];

    for (const row of result.rows) {
      const values = headers.map(h => {
        let val = h === 'account' ? row.account_name : row[h];
        if (h === 'tags') val = (val || []).join(';');
        if (val === null || val === undefined) val = '';
        if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      csvRows.push(values.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.send(csvRows.join('\n'));
  } catch (err) {
    next(err);
  }
});

router.get('/bulk-update', async (req, res, next) => {
  try {
    res.status(405).json({ error: 'Use PUT /transactions/bulk-update instead' });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT t.*, a.name as account_name
       FROM transactions t
       LEFT JOIN accounts a ON t.account_id = a.id
       WHERE t.id = $1 AND t.user_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Transaction not found', 404);
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const { date, merchant, category, amount, account_id, status, tags, notes, owner, goal_id, recurrence_id } = req.body;
    const result = await pool.query(
      `INSERT INTO transactions (date, merchant, category, amount, account_id, status, tags, notes, owner, goal_id, recurrence_id, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [date, merchant, category, amount, account_id, status || 'cleared', tags || [], notes || null, owner || null, goal_id || null, recurrence_id || null, req.user.id]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put('/bulk-update', async (req, res, next) => {
  try {
    const { ids, updates } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('ids must be a non-empty array', 400);
    }

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = ['status', 'tags', 'category', 'notes'];
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex++}`);
        values.push(updates[field]);
      }
    }

    if (setClauses.length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.user.id);
    values.push(ids);

    const result = await pool.query(
      `UPDATE transactions SET ${setClauses.join(', ')} WHERE user_id = $${paramIndex} AND id = ANY($${paramIndex + 1}) RETURNING *`,
      values
    );

    res.json({ data: result.rows, updated: result.rowCount });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validate(updateSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const fields = ['date', 'merchant', 'category', 'amount', 'account_id', 'status', 'tags', 'notes', 'goal_id', 'recurrence_id'];
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
      `UPDATE transactions SET ${updates.join(', ')} WHERE user_id = $${paramIndex} AND id = $${paramIndex + 1} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError('Transaction not found', 404);
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.user.id]);

    if (result.rows.length === 0) {
      throw new AppError('Transaction not found', 404);
    }

    res.json({ data: { id: result.rows[0].id, deleted: true } });
  } catch (err) {
    next(err);
  }
});

export default router;

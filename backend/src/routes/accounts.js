import { Router } from 'express';
import pool from '../db/connection.js';
import { AppError } from '../middleware/errorHandler.js';
import { validate, parseQueryParams } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const createSchema = {
  name: { required: true, minLength: 1, maxLength: 255 },
  institution: { required: true, minLength: 1, maxLength: 255 },
  balance: { required: true, type: 'number' },
  type: { required: true, minLength: 1 },
  category: { required: true, minLength: 1 },
};

const updateSchema = {
  name: { minLength: 1, maxLength: 255 },
  institution: { minLength: 1, maxLength: 255 },
  type: { minLength: 1 },
  category: { minLength: 1 },
};

const DYNAMIC_BALANCE = `COALESCE(a.starting_balance, 0) + COALESCE(tx.total, 0)`;

router.get('/', parseQueryParams, async (req, res, next) => {
  try {
    const { page, limit, offset, sort, order } = req.pagination;
    const { category, type, search } = req.query;

    let where = 'WHERE a.user_id = $1';
    const params = [req.user.id];
    let paramIndex = 2;

    if (category) {
      where += ` AND a.category = $${paramIndex++}`;
      params.push(category);
    }
    if (type) {
      where += ` AND a.type = $${paramIndex++}`;
      params.push(type);
    }
    if (search) {
      where += ` AND (a.name ILIKE $${paramIndex} OR a.institution ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM accounts a ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const validSortColumns = ['id', 'name', 'balance', 'type', 'category', 'created_at', 'updated_at'];
    const sortColumn = validSortColumns.includes(sort) ? sort : 'a.id';
    const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

    const limitParam = paramIndex;
    const offsetParam = paramIndex + 1;

    const result = await pool.query(
      `SELECT a.*,
        ${DYNAMIC_BALANCE} as balance
       FROM accounts a
       LEFT JOIN (
         SELECT account_id, SUM(amount) as total
         FROM transactions
         WHERE user_id = $1
         GROUP BY account_id
       ) tx ON a.id = tx.account_id
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
    const result = await pool.query(`
      SELECT
        a.category,
        COUNT(*) as count,
        SUM(${DYNAMIC_BALANCE}) as total_balance
      FROM accounts a
      LEFT JOIN (
        SELECT account_id, SUM(amount) as total
        FROM transactions
        WHERE user_id = $1
        GROUP BY account_id
      ) tx ON a.id = tx.account_id
      WHERE a.user_id = $1
      GROUP BY a.category
      ORDER BY total_balance DESC
    `, [req.user.id]);

    const totals = await pool.query(`
      SELECT
        COUNT(*) as total_accounts,
        COALESCE(SUM(${DYNAMIC_BALANCE}), 0) as total_balance,
        COALESCE(SUM(CASE WHEN ${DYNAMIC_BALANCE} > 0 THEN ${DYNAMIC_BALANCE} ELSE 0 END), 0) as total_positive,
        COALESCE(SUM(CASE WHEN ${DYNAMIC_BALANCE} < 0 THEN ABS(${DYNAMIC_BALANCE}) ELSE 0 END), 0) as total_negative
      FROM accounts a
      LEFT JOIN (
        SELECT account_id, SUM(amount) as total
        FROM transactions
        WHERE user_id = $1
        GROUP BY account_id
      ) tx ON a.id = tx.account_id
      WHERE a.user_id = $1
    `, [req.user.id]);

    res.json({
      data: {
        by_category: result.rows,
        totalBalance: parseFloat(totals.rows[0].total_balance),
        totalAssets: parseFloat(totals.rows[0].total_positive),
        totalLiabilities: parseFloat(totals.rows[0].total_negative),
        totals: totals.rows[0],
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/grouped', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        a.category,
        json_agg(json_build_object(
          'id', a.id,
          'name', a.name,
          'institution', a.institution,
          'balance', ${DYNAMIC_BALANCE},
          'type', a.type,
          'sync_status', a.sync_status,
          'last_synced', a.last_synced
        ) ORDER BY a.name) as accounts,
        SUM(${DYNAMIC_BALANCE}) as total_balance,
        COUNT(*) as count
      FROM accounts a
      LEFT JOIN (
        SELECT account_id, SUM(amount) as total
        FROM transactions
        WHERE user_id = $1
        GROUP BY account_id
      ) tx ON a.id = tx.account_id
      WHERE a.user_id = $1
      GROUP BY a.category
      ORDER BY a.category
    `, [req.user.id]);

    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/net-worth-history', async (req, res, next) => {
  try {
    const range = req.query.range || '1month';
    let intervalDays;
    if (range === '1month') intervalDays = 30;
    else if (range === '3months') intervalDays = 90;
    else if (range === '6months') intervalDays = 180;
    else if (range === '1year') intervalDays = 365;
    else intervalDays = 30;

    const currentNetWorth = await pool.query(`
      SELECT COALESCE(SUM(${DYNAMIC_BALANCE}), 0) as total
      FROM accounts a
      LEFT JOIN (
        SELECT account_id, SUM(amount) as total
        FROM transactions
        WHERE user_id = $1
        GROUP BY account_id
      ) tx ON a.id = tx.account_id
      WHERE a.user_id = $1
    `, [req.user.id]);
    const total = parseFloat(currentNetWorth.rows[0].total);

    const result = await pool.query(`
      WITH dates AS (
        SELECT generate_series(
          CURRENT_DATE - $1::int,
          CURRENT_DATE,
          CASE WHEN $1::int <= 31 THEN '1 day'::interval
               WHEN $1::int <= 90 THEN '3 days'::interval
               WHEN $1::int <= 180 THEN '7 days'::interval
               ELSE '14 days'::interval
          END
        )::date as dt
      )
      SELECT
        d.dt,
        ROUND(($2 - COALESCE(
          (SELECT SUM(t.amount) FROM transactions t WHERE t.date > d.dt AND t.user_id = $3), 0)
        )::numeric, 2) as net_worth
      FROM dates d
      ORDER BY d.dt ASC
    `, [intervalDays, total, req.user.id]);

    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT a.*,
        ${DYNAMIC_BALANCE} as balance
      FROM accounts a
      LEFT JOIN (
        SELECT account_id, SUM(amount) as total
        FROM transactions
        WHERE user_id = $2
        GROUP BY account_id
      ) tx ON a.id = tx.account_id
      WHERE a.id = $1 AND a.user_id = $2
    `, [id, req.user.id]);

    if (result.rows.length === 0) {
      throw new AppError('Account not found', 404);
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const { name, institution, balance, type, category, owner } = req.body;
    const result = await pool.query(
      `INSERT INTO accounts (name, institution, balance, starting_balance, type, category, owner, user_id)
       VALUES ($1, $2, $3, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, institution, balance, type, category, owner || null, req.user.id]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validate(updateSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const fields = ['name', 'institution', 'balance', 'starting_balance', 'type', 'category', 'sync_status', 'owner'];
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
      `UPDATE accounts SET ${updates.join(', ')} WHERE user_id = $${paramIndex} AND id = $${paramIndex + 1} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError('Account not found', 404);
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM accounts WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.user.id]);

    if (result.rows.length === 0) {
      throw new AppError('Account not found', 404);
    }

    res.json({ data: { id: result.rows[0].id, deleted: true } });
  } catch (err) {
    next(err);
  }
});

export default router;

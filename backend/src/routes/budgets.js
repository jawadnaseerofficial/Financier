import { Router } from 'express';
import pool from '../db/connection.js';
import { AppError } from '../middleware/errorHandler.js';
import { validate, parseQueryParams } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const createSchema = {
  category: { required: true, minLength: 1 },
  budgeted: { required: true, type: 'number', min: 0 },
};

const updateSchema = {
  category: { minLength: 1 },
  budgeted: { type: 'number', min: 0 },
  budget_group: { minLength: 1 },
  icon: { minLength: 1 },
  is_income: { type: 'boolean' },
};

router.get('/', async (req, res, next) => {
  try {
    const targetMonth = parseInt(req.query.month) || new Date().getMonth() + 1;
    const targetYear = parseInt(req.query.year) || new Date().getFullYear();

    const budgetsResult = await pool.query(`
      SELECT b.*,
        COALESCE((
          SELECT SUM(ABS(t.amount))
          FROM transactions t
          WHERE t.category = b.category
            AND EXTRACT(MONTH FROM t.date) = $1
            AND EXTRACT(YEAR FROM t.date) = $2
            AND t.amount < 0
            AND t.user_id = $3
        ), 0) as actual_spent,
        COALESCE((
          SELECT SUM(t.amount)
          FROM transactions t
          WHERE t.category = b.category
            AND EXTRACT(MONTH FROM t.date) = $1
            AND EXTRACT(YEAR FROM t.date) = $2
            AND t.amount > 0
            AND t.user_id = $3
        ), 0) as actual_income
      FROM budgets b
      WHERE b.user_id = $3
      ORDER BY b.budget_group, b.category
    `, [targetMonth, targetYear, req.user.id]);

    const budgets = budgetsResult.rows.map(b => {
      const budgeted = parseFloat(b.budgeted);
      const actual = b.is_income ? parseFloat(b.actual_income) : parseFloat(b.actual_spent);
      return {
        ...b,
        budgeted,
        actual,
        remaining: budgeted - actual,
        budget_group: b.budget_group || 'Other',
        icon: b.icon || 'ShoppingCart',
        is_income: Boolean(b.is_income),
      };
    });

    const groups = {};
    budgets.forEach(b => {
      const group = b.budget_group || 'Other';
      if (!groups[group]) groups[group] = [];
      groups[group].push(b);
    });

    const groupTotals = {};
    Object.entries(groups).forEach(([group, items]) => {
      groupTotals[group] = {
        budgeted: items.reduce((s, i) => s + i.budgeted, 0),
        actual: items.reduce((s, i) => s + i.actual, 0),
        remaining: items.reduce((s, i) => s + i.remaining, 0),
      };
    });

    const incomeItems = budgets.filter(b => b.is_income);
    const totalIncome = {
      budgeted: incomeItems.reduce((s, i) => s + i.budgeted, 0),
      actual: incomeItems.reduce((s, i) => s + i.actual, 0),
    };
    totalIncome.remaining = totalIncome.budgeted - totalIncome.actual;

    const expenseItems = budgets.filter(b => !b.is_income);
    const totalExpenses = {
      budgeted: expenseItems.reduce((s, i) => s + i.budgeted, 0),
      actual: expenseItems.reduce((s, i) => s + i.actual, 0),
    };
    totalExpenses.remaining = totalExpenses.budgeted - totalExpenses.actual;

    const leftToBudget = totalIncome.actual - totalExpenses.actual;

    res.json({
      data: { groups, groupTotals, totalIncome, totalExpenses, leftToBudget },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/grouped', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        budget_group,
        json_agg(json_build_object(
          'id', id,
          'category', category,
          'budgeted', budgeted,
          'spent', spent,
          'icon', icon,
          'is_income', is_income,
          'remaining', budgeted - spent
        ) ORDER BY category) as budgets,
        SUM(budgeted) as total_budgeted,
        SUM(spent) as total_spent
      FROM budgets
      WHERE user_id = $1
      GROUP BY budget_group
      ORDER BY budget_group
    `, [req.user.id]);

    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/grouped-with-actuals', async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const result = await pool.query(`
      SELECT
        b.budget_group,
        json_agg(json_build_object(
          'id', b.id,
          'category', b.category,
          'budgeted', b.budgeted,
          'spent', COALESCE(actuals.total, 0),
          'icon', b.icon,
          'is_income', b.is_income,
          'remaining', b.budgeted - COALESCE(actuals.total, 0),
          'percentage', CASE WHEN b.budgeted > 0 THEN ROUND((COALESCE(actuals.total, 0) / b.budgeted * 100)::numeric, 1) ELSE 0 END
        ) ORDER BY b.category) as budgets,
        SUM(b.budgeted) as total_budgeted,
        SUM(COALESCE(actuals.total, 0)) as total_spent
      FROM budgets b
      LEFT JOIN (
        SELECT category, SUM(ABS(amount)) as total
        FROM transactions
        WHERE date >= $1 AND date <= $2 AND amount < 0 AND user_id = $3
        GROUP BY category
      ) actuals ON b.category = actuals.category
      WHERE b.user_id = $3
      GROUP BY b.budget_group
      ORDER BY b.budget_group
    `, [startDate, endDate, req.user.id]);

    res.json({ data: result.rows, period: { month, year, start_date: startDate, end_date: endDate } });
  } catch (err) {
    next(err);
  }
});

router.get('/forecast', async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const months = [];

    for (let month = 1; month <= 12; month++) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const result = await pool.query(`
        SELECT
          COALESCE(SUM(b.budgeted), 0) as total_budgeted,
          COALESCE(SUM(ABS(t.amount)), 0) as total_spent,
          COUNT(DISTINCT b.id) as budget_count
        FROM budgets b
        LEFT JOIN transactions t ON b.category = t.category
          AND t.date >= $1 AND t.date <= $2 AND t.amount < 0 AND t.user_id = $3
        WHERE b.is_income = false AND b.user_id = $3
      `, [startDate, endDate, req.user.id]);

      months.push({
        month,
        year,
        ...result.rows[0],
      });
    }

    res.json({ data: months, year });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM budgets WHERE id = $1 AND user_id = $2', [id, req.user.id]);

    if (result.rows.length === 0) {
      throw new AppError('Budget not found', 404);
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/transactions', parseQueryParams, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page, limit, offset, sort, order } = req.pagination;

    const budgetResult = await pool.query('SELECT category FROM budgets WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (budgetResult.rows.length === 0) {
      throw new AppError('Budget not found', 404);
    }

    const category = budgetResult.rows[0].category;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM transactions WHERE category = $1 AND user_id = $2`,
      [category, req.user.id]
    );
    const total = parseInt(countResult.rows[0].count);

    const validSortColumns = ['id', 'date', 'merchant', 'amount', 'created_at'];
    const sortColumn = validSortColumns.includes(sort) ? sort : 'date';
    const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

    const result = await pool.query(
      `SELECT t.*, a.name as account_name
       FROM transactions t
       LEFT JOIN accounts a ON t.account_id = a.id
       WHERE t.category = $1 AND t.user_id = $2
       ORDER BY ${sortColumn} ${sortOrder}
       LIMIT $3 OFFSET $4`,
      [category, req.user.id, limit, offset]
    );

    res.json({
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const { category, budgeted, budget_group, icon, is_income } = req.body;
    const result = await pool.query(
      `INSERT INTO budgets (category, budgeted, budget_group, icon, is_income, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [category, budgeted, budget_group || 'Expenses', icon || 'ShoppingCart', is_income || false, req.user.id]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return next(new AppError('Budget for this category already exists', 409));
    }
    next(err);
  }
});

router.put('/:id', validate(updateSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const fields = ['category', 'budgeted', 'budget_group', 'icon', 'is_income'];
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
      `UPDATE budgets SET ${updates.join(', ')} WHERE user_id = $${paramIndex} AND id = $${paramIndex + 1} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError('Budget not found', 404);
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return next(new AppError('Budget for this category already exists', 409));
    }
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.user.id]);

    if (result.rows.length === 0) {
      throw new AppError('Budget not found', 404);
    }

    res.json({ data: { id: result.rows[0].id, deleted: true } });
  } catch (err) {
    next(err);
  }
});

export default router;

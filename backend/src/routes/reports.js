import { Router } from 'express';
import pool from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const getDateRange = (req) => {
  const now = new Date();
  const start_date = req.query.start_date || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const end_date = req.query.end_date || now.toISOString().split('T')[0];
  return { start_date, end_date };
};

router.get('/cashflow', async (req, res, next) => {
  try {
    const { start_date, end_date } = getDateRange(req);
    const userId = req.user.id;

    const [monthlyResult, incomeBySourceResult, expensesByCategoryResult, summaryResult, txCountResult] = await Promise.all([
      pool.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM') as month_key,
          TO_CHAR(DATE_TRUNC('month', date), 'Mon YYYY') as month_label,
          SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
          SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses,
          SUM(amount) as net_income
        FROM transactions
        WHERE user_id = $1 AND date >= $2 AND date <= $3
        GROUP BY DATE_TRUNC('month', date)
        ORDER BY DATE_TRUNC('month', date) ASC
      `, [userId, start_date, end_date]),
      pool.query(`
        SELECT
          category as name,
          SUM(amount) as amount,
          COUNT(*) as count
        FROM transactions
        WHERE user_id = $1 AND date >= $2 AND date <= $3 AND amount > 0
        GROUP BY category
        ORDER BY amount DESC
      `, [userId, start_date, end_date]),
      pool.query(`
        SELECT
          category as name,
          SUM(ABS(amount)) as amount,
          COUNT(*) as count
        FROM transactions
        WHERE user_id = $1 AND date >= $2 AND date <= $3 AND amount < 0
        GROUP BY category
        ORDER BY amount DESC
      `, [userId, start_date, end_date]),
      pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_income,
          COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as total_expenses,
          COALESCE(SUM(amount), 0) as net_income
        FROM transactions
        WHERE user_id = $1 AND date >= $2 AND date <= $3
      `, [userId, start_date, end_date]),
      pool.query(`SELECT COUNT(*) as total FROM transactions WHERE user_id = $1 AND date >= $2 AND date <= $3`, [userId, start_date, end_date]),
    ]);

    const totalIncome = parseFloat(summaryResult.rows[0].total_income) || 0;
    const totalExpenses = parseFloat(summaryResult.rows[0].total_expenses) || 0;

    const incomeBySource = incomeBySourceResult.rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount) || 0,
      percentage: totalIncome > 0 ? Math.round((parseFloat(r.amount) / totalIncome) * 100) : 0,
    }));
    const expensesByCategory = expensesByCategoryResult.rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount) || 0,
      percentage: totalExpenses > 0 ? Math.round((parseFloat(r.amount) / totalExpenses) * 100) : 0,
    }));

    res.json({
      data: {
        summary: {
          totalIncome,
          totalExpenses,
          netIncome: parseFloat(summaryResult.rows[0].net_income) || 0,
          savingsRate: totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0,
          totalTransactions: parseInt(txCountResult.rows[0].total) || 0,
        },
        monthlyCashFlow: monthlyResult.rows,
        incomeBySource,
        expensesByCategory,
      },
      period: { start_date, end_date },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/spending', async (req, res, next) => {
  try {
    const { start_date, end_date } = getDateRange(req);
    const userId = req.user.id;

    const [byCategory, monthlySpending, summaryResult, recentTxResult, txCountResult] = await Promise.all([
      pool.query(`
        SELECT
          category as name,
          category,
          SUM(ABS(amount)) as total,
          COUNT(*) as count,
          AVG(ABS(amount)) as avg_transaction
        FROM transactions
        WHERE user_id = $1 AND date >= $2 AND date <= $3 AND amount < 0
        GROUP BY category
        ORDER BY total DESC
      `, [userId, start_date, end_date]),
      pool.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM') as month,
          TO_CHAR(DATE_TRUNC('month', date), 'Mon YYYY') as month_label,
          category,
          SUM(ABS(amount)) as amount
        FROM transactions
        WHERE user_id = $1 AND date >= $2 AND date <= $3 AND amount < 0
        GROUP BY DATE_TRUNC('month', date), category
        ORDER BY DATE_TRUNC('month', date) ASC, amount DESC
      `, [userId, start_date, end_date]),
      pool.query(`
        SELECT
          COALESCE(SUM(ABS(amount)), 0) as total_spending,
          COALESCE(MAX(ABS(amount)), 0) as largest_transaction,
          COALESCE(AVG(ABS(amount)), 0) as avg_transaction,
          COUNT(*) as total_transactions
        FROM transactions
        WHERE user_id = $1 AND date >= $2 AND date <= $3 AND amount < 0
      `, [userId, start_date, end_date]),
      pool.query(`
        SELECT t.*, a.name as account_name
        FROM transactions t
        LEFT JOIN accounts a ON t.account_id = a.id
        WHERE t.user_id = $1 AND t.date >= $2 AND t.date <= $3 AND t.amount < 0
        ORDER BY t.amount ASC
        LIMIT 10
      `, [userId, start_date, end_date]),
      pool.query(`SELECT COUNT(*) as total FROM transactions WHERE user_id = $1 AND date >= $2 AND date <= $3 AND amount < 0`, [userId, start_date, end_date]),
    ]);

    const s = summaryResult.rows[0];

    res.json({
      data: {
        summary: {
          totalSpending: parseFloat(s.total_spending) || 0,
          largestTransaction: parseFloat(s.largest_transaction) || 0,
          avgTransaction: parseFloat(s.avg_transaction) || 0,
          totalTransactions: parseInt(s.total_transactions) || 0,
        },
        spendingByCategory: byCategory.rows.map(r => ({
          ...r,
          amount: parseFloat(r.total) || 0,
          percentage: parseFloat(s.total_spending) > 0 ? Math.round((parseFloat(r.total) / parseFloat(s.total_spending)) * 100) : 0,
        })),
        monthlySpending: monthlySpending.rows,
        recentTransactions: recentTxResult.rows,
      },
      period: { start_date, end_date },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/income', async (req, res, next) => {
  try {
    const { start_date, end_date } = getDateRange(req);
    const userId = req.user.id;

    const [bySource, monthlyIncome, summaryResult, txCountResult] = await Promise.all([
      pool.query(`
        SELECT
          category as name,
          category,
          SUM(amount) as total,
          COUNT(*) as count,
          AVG(amount) as avg_transaction
        FROM transactions
        WHERE user_id = $1 AND date >= $2 AND date <= $3 AND amount > 0
        GROUP BY category
        ORDER BY total DESC
      `, [userId, start_date, end_date]),
      pool.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM') as month,
          TO_CHAR(DATE_TRUNC('month', date), 'Mon YYYY') as month_label,
          category,
          SUM(amount) as amount
        FROM transactions
        WHERE user_id = $1 AND date >= $2 AND date <= $3 AND amount > 0
        GROUP BY DATE_TRUNC('month', date), category
        ORDER BY DATE_TRUNC('month', date) ASC, amount DESC
      `, [userId, start_date, end_date]),
      pool.query(`
        SELECT
          COALESCE(SUM(amount), 0) as total_income,
          COALESCE(MAX(amount), 0) as largest_transaction,
          COALESCE(AVG(amount), 0) as avg_transaction,
          COUNT(*) as total_transactions
        FROM transactions
        WHERE user_id = $1 AND date >= $2 AND date <= $3 AND amount > 0
      `, [userId, start_date, end_date]),
      pool.query(`SELECT COUNT(*) as total FROM transactions WHERE user_id = $1 AND date >= $2 AND date <= $3 AND amount > 0`, [userId, start_date, end_date]),
    ]);

    const s = summaryResult.rows[0];

    res.json({
      data: {
        summary: {
          totalIncome: parseFloat(s.total_income) || 0,
          largestTransaction: parseFloat(s.largest_transaction) || 0,
          avgTransaction: parseFloat(s.avg_transaction) || 0,
          totalTransactions: parseInt(s.total_transactions) || 0,
        },
        incomeBySource: bySource.rows.map(r => ({
          ...r,
          amount: parseFloat(r.total) || 0,
          percentage: parseFloat(s.total_income) > 0 ? Math.round((parseFloat(r.total) / parseFloat(s.total_income)) * 100) : 0,
        })),
        monthlyIncome: monthlyIncome.rows,
      },
      period: { start_date, end_date },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/monthly-comparison', async (req, res, next) => {
  try {
    const now = new Date();
    const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const currentMonthEnd = now.toISOString().split('T')[0];

    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStart = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`;
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

    const userId = req.user.id;

    const [currentResult, lastResult] = await Promise.all([
      pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,
          COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as expenses,
          COALESCE(SUM(amount), 0) as net
        FROM transactions
        WHERE user_id = $1 AND date >= $2 AND date <= $3
      `, [userId, currentMonthStart, currentMonthEnd]),
      pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,
          COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as expenses,
          COALESCE(SUM(amount), 0) as net
        FROM transactions
        WHERE user_id = $1 AND date >= $2 AND date <= $3
      `, [userId, lastMonthStart, lastMonthEnd]),
    ]);

    const current = currentResult.rows[0];
    const last = lastResult.rows[0];

    res.json({
      data: {
        current_month: {
          period: { start: currentMonthStart, end: currentMonthEnd },
          income: parseFloat(current.income),
          expenses: parseFloat(current.expenses),
          net: parseFloat(current.net),
        },
        last_month: {
          period: { start: lastMonthStart, end: lastMonthEnd },
          income: parseFloat(last.income),
          expenses: parseFloat(last.expenses),
          net: parseFloat(last.net),
        },
        change: {
          income: parseFloat(current.income) - parseFloat(last.income),
          expenses: parseFloat(current.expenses) - parseFloat(last.expenses),
          net: parseFloat(current.net) - parseFloat(last.net),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/filters', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [categories, accounts, dateRange] = await Promise.all([
      pool.query('SELECT DISTINCT category FROM transactions WHERE user_id = $1 ORDER BY category', [userId]),
      pool.query('SELECT id, name FROM accounts WHERE user_id = $1 ORDER BY name', [userId]),
      pool.query(`
        SELECT
          MIN(date) as earliest,
          MAX(date) as latest
        FROM transactions
        WHERE user_id = $1
      `, [userId]),
    ]);

    res.json({
      data: {
        categories: categories.rows.map(r => r.category),
        accounts: accounts.rows,
        date_range: dateRange.rows[0],
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;

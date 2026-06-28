import { Router } from 'express';
import pool from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [netWorth, recentTransactions, monthlySummary, budgetProgress, goalsProgress, upcomingRecurring, investmentSummary] = await Promise.all([
      pool.query(`
        SELECT
          COALESCE(SUM(COALESCE(starting_balance, 0) + COALESCE(tx.total, 0)), 0) as total,
          COALESCE(SUM(CASE WHEN COALESCE(starting_balance, 0) + COALESCE(tx.total, 0) > 0 THEN COALESCE(starting_balance, 0) + COALESCE(tx.total, 0) ELSE 0 END), 0) as assets,
          COALESCE(SUM(CASE WHEN COALESCE(starting_balance, 0) + COALESCE(tx.total, 0) < 0 THEN COALESCE(starting_balance, 0) + COALESCE(tx.total, 0) ELSE 0 END), 0) as liabilities
        FROM accounts a
        LEFT JOIN (
          SELECT account_id, SUM(amount) as total
          FROM transactions
          WHERE user_id = $1
          GROUP BY account_id
        ) tx ON a.id = tx.account_id
        WHERE a.user_id = $1
      `, [userId]),
      pool.query(`
        SELECT t.*, a.name as account_name
        FROM transactions t
        LEFT JOIN accounts a ON t.account_id = a.id
        WHERE t.user_id = $1
        ORDER BY t.date DESC, t.created_at DESC
        LIMIT 5
      `, [userId]),
      pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,
          COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as expenses,
          COALESCE(SUM(amount), 0) as net
        FROM transactions
        WHERE user_id = $1
          AND date >= DATE_TRUNC('month', CURRENT_DATE)
          AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
      `, [userId]),
      pool.query(`
        SELECT
          b.category,
          b.budgeted,
          b.icon,
          b.is_income,
          COALESCE(actuals.spent, 0) as spent,
          b.budgeted - COALESCE(actuals.spent, 0) as remaining
        FROM budgets b
        LEFT JOIN (
          SELECT category, SUM(ABS(amount)) as spent
          FROM transactions
          WHERE user_id = $1
            AND date >= DATE_TRUNC('month', CURRENT_DATE)
            AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
            AND amount < 0
          GROUP BY category
        ) actuals ON b.category = actuals.category
        WHERE b.user_id = $1
        ORDER BY b.category
      `, [userId]),
      pool.query(`
        SELECT *,
          CASE WHEN target > 0 THEN ROUND((current / target * 100)::numeric, 1) ELSE 0 END as progress_pct
        FROM goals
        WHERE user_id = $1
        ORDER BY current / NULLIF(target, 0) DESC
      `, [userId]),
      pool.query(`
        SELECT r.*, a.name as account_name
        FROM recurring r
        LEFT JOIN accounts a ON r.account_id = a.id
        WHERE r.user_id = $1
          AND r.is_active = true
          AND r.next_date >= CURRENT_DATE
          AND r.next_date <= CURRENT_DATE + INTERVAL '30 days'
        ORDER BY r.next_date ASC
        LIMIT 10
      `, [userId]),
      pool.query(`
        SELECT
          COUNT(*) as total_holdings,
          COALESCE(SUM(total_value), 0) as total_value,
          COALESCE(SUM(day_change), 0) as total_day_change
        FROM investments
        WHERE user_id = $1
      `, [userId]),
    ]);

    const monthlyIncome = parseFloat(monthlySummary.rows[0].income) || 0;
    const monthlyExpenses = parseFloat(monthlySummary.rows[0].expenses) || 0;
    const totalBudgeted = budgetProgress.rows.reduce((s, r) => s + parseFloat(r.budgeted), 0);
    const totalSpent = budgetProgress.rows.reduce((s, r) => s + parseFloat(r.spent), 0);

    res.json({
      data: {
        netWorth: {
          total: parseFloat(netWorth.rows[0].total),
          assets: parseFloat(netWorth.rows[0].assets),
          liabilities: parseFloat(netWorth.rows[0].liabilities),
        },
        recentTransactions: recentTransactions.rows,
        monthly: {
          income: monthlyIncome,
          expenses: monthlyExpenses,
        },
        budget: {
          totalBudgeted,
          totalSpent,
          percentUsed: totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0,
        },
        goals: {
          totalSaved: goalsProgress.rows.filter(g => g.type === 'save-up').reduce((s, g) => s + parseFloat(g.current), 0),
          totalTarget: goalsProgress.rows.filter(g => g.type === 'save-up').reduce((s, g) => s + parseFloat(g.target), 0),
          totalDebtPaid: goalsProgress.rows.filter(g => g.type === 'pay-down').reduce((s, g) => s + parseFloat(g.current), 0),
          totalDebtTarget: goalsProgress.rows.filter(g => g.type === 'pay-down').reduce((s, g) => s + parseFloat(g.target), 0),
        },
        upcomingRecurring: upcomingRecurring.rows,
        investmentSummary: {
          totalHoldings: parseInt(investmentSummary.rows[0].total_holdings),
          totalValue: parseFloat(investmentSummary.rows[0].total_value),
          totalDayChange: parseFloat(investmentSummary.rows[0].total_day_change),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;

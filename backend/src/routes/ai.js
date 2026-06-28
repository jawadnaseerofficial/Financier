import { Router } from 'express';
import pool from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.post('/', async (req, res, next) => {
  try {
    const { question } = req.body;
    const userId = req.user.id;
    const q = question.toLowerCase();

    // Parse intent
    if (q.includes('spend') || q.includes('spent') || q.includes('expense')) {
      const result = await pool.query(`
        SELECT category, SUM(ABS(amount)) as total, COUNT(*) as count
        FROM transactions WHERE user_id = $1 AND amount < 0
        GROUP BY category ORDER BY total DESC
      `, [userId]);
      const total = result.rows.reduce((s, r) => s + parseFloat(r.total), 0);

      let dateFilter = '';
      const params = [userId];
      let idx = 2;
      if (q.includes('march')) { dateFilter = `AND EXTRACT(MONTH FROM date) = 3`; }
      else if (q.includes('april')) { dateFilter = `AND EXTRACT(MONTH FROM date) = 4`; }
      else if (q.includes('may')) { dateFilter = `AND EXTRACT(MONTH FROM date) = 5`; }
      else if (q.includes('june')) { dateFilter = `AND EXTRACT(MONTH FROM date) = 6`; }
      else if (q.includes('last month')) { dateFilter = `AND date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND date < DATE_TRUNC('month', CURRENT_DATE)`; }
      else if (q.includes('this month')) { dateFilter = `AND date >= DATE_TRUNC('month', CURRENT_DATE)`; }
      else if (q.includes('quarter')) { dateFilter = `AND date >= DATE_TRUNC('quarter', CURRENT_DATE)`; }
      else if (q.includes('year')) { dateFilter = `AND date >= DATE_TRUNC('year', CURRENT_DATE)`; }

      const filtered = await pool.query(`
        SELECT category, SUM(ABS(amount)) as total, COUNT(*) as count
        FROM transactions WHERE user_id = $1 AND amount < 0 ${dateFilter}
        GROUP BY category ORDER BY total DESC
      `, params);
      const filteredTotal = filtered.rows.reduce((s, r) => s + parseFloat(r.total), 0);

      const breakdown = filtered.rows.slice(0, 5).map(r => `${r.category}: $${parseFloat(r.total).toFixed(2)} (${r.count} txns)`).join('\n');
      return res.json({
        data: {
          answer: `You spent $${filteredTotal.toFixed(2)}${dateFilter ? ' in the selected period' : ' total'} across ${filtered.rows.length} categories.\n\nTop categories:\n${breakdown}`,
          data: filtered.rows,
        },
      });
    }

    if (q.includes('income') || q.includes('earned') || q.includes('paycheck')) {
      const result = await pool.query(`
        SELECT category, SUM(amount) as total, COUNT(*) as count
        FROM transactions WHERE user_id = $1 AND amount > 0
        GROUP BY category ORDER BY total DESC
      `, [userId]);
      const total = result.rows.reduce((s, r) => s + parseFloat(r.total), 0);
      const breakdown = result.rows.map(r => `${r.category}: $${parseFloat(r.total).toFixed(2)} (${r.count} txns)`).join('\n');
      return res.json({
        data: {
          answer: `Your total income is $${total.toFixed(2)}.\n\nSources:\n${breakdown}`,
          data: result.rows,
        },
      });
    }

    if (q.includes('net worth') || q.includes('balance')) {
      const result = await pool.query(`SELECT COALESCE(SUM(balance), 0) as net FROM accounts WHERE user_id = $1`, [userId]);
      return res.json({
        data: { answer: `Your current net worth is $${parseFloat(result.rows[0].net).toLocaleString('en-US', { minimumFractionDigits: 2 })}.` },
      });
    }

    if (q.includes('subscription') || q.includes('recurring')) {
      const result = await pool.query(`
        SELECT name, amount, frequency FROM recurring WHERE user_id = $1 AND is_active = true ORDER BY ABS(amount) DESC
      `, [userId]);
      const total = result.rows.reduce((s, r) => {
        const amt = Math.abs(parseFloat(r.amount));
        if (r.frequency === 'monthly') return s + amt;
        if (r.frequency === 'weekly') return s + amt * 4.33;
        if (r.frequency === 'yearly') return s + amt / 12;
        return s + amt;
      }, 0);
      const list = result.rows.map(r => `${r.name}: $${Math.abs(parseFloat(r.amount)).toFixed(2)}/${r.frequency}`).join('\n');
      return res.json({
        data: { answer: `You have ${result.rows.length} active recurring items totaling ~$${total.toFixed(2)}/month.\n\n${list}` },
      });
    }

    if (q.includes('goal') || q.includes('saving')) {
      const result = await pool.query(`
        SELECT name, target, current, ROUND((current / NULLIF(target, 0) * 100)::numeric, 1) as pct
        FROM goals WHERE user_id = $1 ORDER BY current / NULLIF(target, 0) DESC
      `, [userId]);
      const list = result.rows.map(r => `${r.name}: $${parseFloat(r.current).toFixed(0)} / $${parseFloat(r.target).toFixed(0)} (${r.pct}%)`).join('\n');
      return res.json({
        data: { answer: `You have ${result.rows.length} goals:\n${list || 'No goals yet.'}` },
      });
    }

    if (q.includes('biggest') || q.includes('largest') || q.includes('most expensive')) {
      const result = await pool.query(`
        SELECT merchant, amount, date, category FROM transactions
        WHERE user_id = $1 AND amount < 0 ORDER BY amount ASC LIMIT 5
      `, [userId]);
      const list = result.rows.map(r => `$${Math.abs(parseFloat(r.amount)).toFixed(2)} - ${r.merchant} (${r.category})`).join('\n');
      return res.json({
        data: { answer: `Your biggest expenses:\n${list}` },
      });
    }

    if (q.includes('budget')) {
      const result = await pool.query(`
        SELECT b.category, b.budgeted,
          COALESCE((SELECT SUM(ABS(amount)) FROM transactions t WHERE t.category = b.category AND t.user_id = $1 AND t.amount < 0
            AND t.date >= DATE_TRUNC('month', CURRENT_DATE) AND t.date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'), 0) as spent
        FROM budgets b WHERE b.user_id = $1 AND b.is_income = false
      `, [userId]);
      const list = result.rows.map(r => {
        const pct = parseFloat(r.budgeted) > 0 ? Math.round(parseFloat(r.spent) / parseFloat(r.budgeted) * 100) : 0;
        return `${r.category}: $${parseFloat(r.spent).toFixed(0)} / $${parseFloat(r.budgeted).toFixed(0)} (${pct}%)`;
      }).join('\n');
      return res.json({ data: { answer: `Budget status this month:\n${list}` } });
    }

    // Default
    return res.json({
      data: {
        answer: `I can help with:\n• "How much did I spend on groceries?"\n• "What's my income?"\n• "What's my net worth?"\n• "Show my subscriptions"\n• "What are my goals?"\n• "What was my biggest expense?"\n• "How's my budget?"\n\nTry asking about spending, income, net worth, subscriptions, goals, or budget.`,
      },
    });
  } catch (err) { next(err); }
});

export default router;

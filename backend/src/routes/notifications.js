import { Router } from 'express';
import pool from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    const unread = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );
    res.json({ data: result.rows, unreadCount: parseInt(unread.rows[0].count) });
  } catch (err) { next(err); }
});

router.put('/:id/read', async (req, res, next) => {
  try {
    await pool.query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [parseInt(req.params.id), req.user.id]);
    res.json({ data: { message: 'Marked as read' } });
  } catch (err) { next(err); }
});

router.put('/read-all', async (req, res, next) => {
  try {
    await pool.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user.id]);
    res.json({ data: { message: 'All marked as read' } });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [parseInt(req.params.id), req.user.id]);
    res.json({ data: { message: 'Deleted' } });
  } catch (err) { next(err); }
});

// Notification rules
router.get('/rules', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notification_rules WHERE user_id = $1', [req.user.id]
    );
    res.json({ data: result.rows });
  } catch (err) { next(err); }
});

router.post('/rules', async (req, res, next) => {
  try {
    const { type, threshold } = req.body;
    const result = await pool.query(
      'INSERT INTO notification_rules (user_id, type, threshold) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, type, threshold]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/rules/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM notification_rules WHERE id = $1 AND user_id = $2',
      [parseInt(req.params.id), req.user.id]);
    res.json({ data: { message: 'Deleted' } });
  } catch (err) { next(err); }
});

// Check and generate notifications (called periodically)
router.post('/check', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notifications = [];

    // Budget alerts
    const budgetAlerts = await pool.query(`
      SELECT b.*, ba.threshold_percent
      FROM budgets b
      JOIN budget_alerts ba ON b.id = ba.budget_id
      WHERE ba.user_id = $1 AND ba.is_active = true AND b.is_income = false
    `, [userId]);

    for (const b of budgetAlerts.rows) {
      const spent = await pool.query(`
        SELECT COALESCE(SUM(ABS(amount)), 0) as spent FROM transactions
        WHERE user_id = $1 AND category = $2 AND amount < 0
          AND date >= DATE_TRUNC('month', CURRENT_DATE)
          AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
      `, [userId, b.category]);
      const pct = parseFloat(b.budgeted) > 0 ? (parseFloat(spent.rows[0].spent) / parseFloat(b.budgeted)) * 100 : 0;
      if (pct >= b.threshold_percent) {
        const existing = await pool.query(
          `SELECT id FROM notifications WHERE user_id = $1 AND type = 'budget_alert' AND data->>'category' = $2 AND created_at > DATE_TRUNC('month', CURRENT_DATE)`,
          [userId, b.category]
        );
        if (existing.rows.length === 0) {
          await pool.query(
            `INSERT INTO notifications (user_id, type, title, message, data) VALUES ($1, 'budget_alert', $2, $3, $4)`,
            [userId, `${b.category} budget alert`, `You've used ${Math.round(pct)}% of your ${b.category} budget`, JSON.stringify({ category: b.category, percent: pct })]
          );
          notifications.push({ type: 'budget_alert', category: b.category });
        }
      }
    }

    // Upcoming bill reminders
    const upcoming = await pool.query(`
      SELECT * FROM recurring WHERE user_id = $1 AND is_active = true
        AND next_date >= CURRENT_DATE AND next_date <= CURRENT_DATE + INTERVAL '3 days'
    `, [userId]);
    for (const r of upcoming.rows) {
      const existing = await pool.query(
        `SELECT id FROM notifications WHERE user_id = $1 AND type = 'bill_reminder' AND data->>'recurring_id' = $2 AND created_at > CURRENT_DATE - INTERVAL '1 day'`,
        [userId, String(r.id)]
      );
      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, message, data) VALUES ($1, 'bill_reminder', $2, $3, $4)`,
          [userId, `Upcoming: ${r.name}`, `${r.name} of $${Math.abs(parseFloat(r.amount)).toFixed(2)} is due soon`, JSON.stringify({ recurring_id: r.id })]
        );
        notifications.push({ type: 'bill_reminder', name: r.name });
      }
    }

    res.json({ data: { checked: true, generated: notifications.length, notifications } });
  } catch (err) { next(err); }
});

export default router;

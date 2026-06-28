import { Router } from 'express';
import pool from '../db/connection.js';
import { hashPassword, comparePassword, generateToken, authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const registerSchema = {
  email: { required: true, minLength: 5 },
  password: { required: true, minLength: 6 },
  name: { required: true, minLength: 1 },
};

const loginSchema = {
  email: { required: true },
  password: { required: true },
};

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const passwordHash = await hashPassword(password);
    const userResult = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, passwordHash, name]
    );
    const user = userResult.rows[0];

    const household = await pool.query(
      'INSERT INTO households (name, created_by) VALUES ($1, $2) RETURNING *',
      [`${name}'s Household`, user.id]
    );
    await pool.query(
      'INSERT INTO household_members (household_id, user_id, role) VALUES ($1, $2, $3)',
      [household.rows[0].id, user.id, 'owner']
    );
    await pool.query(
      'INSERT INTO user_preferences (user_id) VALUES ($1)',
      [user.id]
    );

    const token = generateToken(user.id);
    res.status(201).json({ data: { user, household: household.rows[0], token } });
  } catch (err) {
    next(err);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = result.rows[0];
    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const household = await pool.query(
      'SELECT h.* FROM households h JOIN household_members hm ON h.id = hm.household_id WHERE hm.user_id = $1 LIMIT 1',
      [user.id]
    );
    const token = generateToken(user.id);
    delete user.password_hash;
    res.json({ data: { user, household: household.rows[0] || null, token } });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const prefs = await pool.query('SELECT * FROM user_preferences WHERE user_id = $1', [req.user.id]);
    res.json({
      data: {
        user: req.user,
        household: req.household,
        preferences: prefs.rows[0] || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { name, avatar_url } = req.body;
    const result = await pool.query(
      'UPDATE users SET name = COALESCE($1, name), avatar_url = COALESCE($2, avatar_url), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, email, name, avatar_url',
      [name, avatar_url, req.user.id]
    );
    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put('/password', authenticate, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const valid = await comparePassword(current_password, user.rows[0].password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    const hash = await hashPassword(new_password);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hash, req.user.id]);
    res.json({ data: { message: 'Password updated' } });
  } catch (err) {
    next(err);
  }
});

// Household management
router.get('/household/members', authenticate, async (req, res, next) => {
  try {
    if (!req.household) return res.json({ data: [] });
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.avatar_url, hm.role, hm.joined_at
       FROM household_members hm JOIN users u ON hm.user_id = u.id
       WHERE hm.household_id = $1`,
      [req.household.id]
    );
    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/household/invite', authenticate, async (req, res, next) => {
  try {
    if (!req.household) return res.status(400).json({ error: 'No household found' });
    const { email } = req.body;
    let user = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      const tempPassword = await hashPassword('temp-password-' + Date.now());
      user = await pool.query(
        'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id',
        [email, tempPassword, email.split('@')[0]]
      );
    }
    const userId = user.rows[0].id;
    const existing = await pool.query(
      'SELECT id FROM household_members WHERE household_id = $1 AND user_id = $2',
      [req.household.id, userId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'User already in household' });
    }
    await pool.query(
      'INSERT INTO household_members (household_id, user_id, role) VALUES ($1, $2, $3)',
      [req.household.id, userId, 'member']
    );
    res.status(201).json({ data: { message: 'Member invited' } });
  } catch (err) {
    next(err);
  }
});

router.delete('/household/members/:userId', authenticate, async (req, res, next) => {
  try {
    if (!req.household) return res.status(400).json({ error: 'No household found' });
    await pool.query(
      'DELETE FROM household_members WHERE household_id = $1 AND user_id = $2',
      [req.household.id, parseInt(req.params.userId)]
    );
    res.json({ data: { message: 'Member removed' } });
  } catch (err) {
    next(err);
  }
});

// Preferences
router.get('/preferences', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM user_preferences WHERE user_id = $1', [req.user.id]);
    res.json({ data: result.rows[0] || {} });
  } catch (err) {
    next(err);
  }
});

router.put('/preferences', authenticate, async (req, res, next) => {
  try {
    const p = req.body;
    const result = await pool.query(
      `INSERT INTO user_preferences (user_id, onboarding_completed, default_view, notification_email, notification_push, notification_budget_alerts, notification_bill_reminders, notification_weekly_recap, currency, date_format, number_format)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (user_id) DO UPDATE SET
         onboarding_completed = COALESCE($2, user_preferences.onboarding_completed),
         default_view = COALESCE($3, user_preferences.default_view),
         notification_email = COALESCE($4, user_preferences.notification_email),
         notification_push = COALESCE($5, user_preferences.notification_push),
         notification_budget_alerts = COALESCE($6, user_preferences.notification_budget_alerts),
         notification_bill_reminders = COALESCE($7, user_preferences.notification_bill_reminders),
         notification_weekly_recap = COALESCE($8, user_preferences.notification_weekly_recap),
         currency = COALESCE($9, user_preferences.currency),
         date_format = COALESCE($10, user_preferences.date_format),
         number_format = COALESCE($11, user_preferences.number_format),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [req.user.id, p.onboarding_completed, p.default_view, p.notification_email, p.notification_push,
       p.notification_budget_alerts, p.notification_bill_reminders, p.notification_weekly_recap,
       p.currency, p.date_format, p.number_format]
    );
    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;

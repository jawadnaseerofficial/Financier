import { Router } from 'express';
import pool from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// Get all custom categories for user
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM custom_categories WHERE user_id = $1 ORDER BY sort_order, name',
      [req.user.id]
    );
    res.json({ data: result.rows });
  } catch (err) { next(err); }
});

// Create custom category
router.post('/', async (req, res, next) => {
  try {
    const { name, icon, color, group_name, is_income } = req.body;
    const result = await pool.query(
      `INSERT INTO custom_categories (user_id, household_id, name, icon, color, group_name, is_income)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, req.household?.id || null, name, icon || 'Tag', color || '#6366f1', group_name || 'Other', is_income || false]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Category already exists' });
    next(err);
  }
});

// Update custom category
router.put('/:id', async (req, res, next) => {
  try {
    const { name, icon, color, group_name, is_income, sort_order } = req.body;
    const result = await pool.query(
      `UPDATE custom_categories SET
        name = COALESCE($1, name), icon = COALESCE($2, icon), color = COALESCE($3, color),
        group_name = COALESCE($4, group_name), is_income = COALESCE($5, is_income),
        sort_order = COALESCE($6, sort_order)
       WHERE id = $7 AND user_id = $8 AND is_system = false RETURNING *`,
      [name, icon, color, group_name, is_income, sort_order, parseInt(req.params.id), req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found or system category' });
    res.json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

// Delete custom category
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM custom_categories WHERE id = $1 AND user_id = $2 AND is_system = false RETURNING id',
      [parseInt(req.params.id), req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found or system category' });
    res.json({ data: { message: 'Deleted' } });
  } catch (err) { next(err); }
});

// Bulk set categories (for onboarding or reset)
router.post('/bulk', async (req, res, next) => {
  try {
    const { categories } = req.body;
    for (const cat of categories) {
      await pool.query(
        `INSERT INTO custom_categories (user_id, household_id, name, icon, color, group_name, is_income)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id, name) DO UPDATE SET icon = $4, color = $5, group_name = $6, is_income = $7`,
        [req.user.id, req.household?.id || null, cat.name, cat.icon || 'Tag', cat.color || '#6366f1', cat.group_name || 'Other', cat.is_income || false]
      );
    }
    res.json({ data: { message: 'Categories saved' } });
  } catch (err) { next(err); }
});

export default router;

import { Router } from 'express';
import pool from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// Auto-categorization rules
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM transaction_rules WHERE user_id = $1 ORDER BY priority DESC, created_at DESC',
      [req.user.id]
    );
    res.json({ data: result.rows });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, field, operator, value, action, action_value, priority } = req.body;
    const result = await pool.query(
      `INSERT INTO transaction_rules (user_id, household_id, name, field, operator, value, action, action_value, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.user.id, req.household?.id || null, name, field, operator, value, action || 'set_category', action_value, priority || 0]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, field, operator, value, action, action_value, priority, is_active } = req.body;
    const result = await pool.query(
      `UPDATE transaction_rules SET
        name = COALESCE($1, name), field = COALESCE($2, field), operator = COALESCE($3, operator),
        value = COALESCE($4, value), action = COALESCE($5, action), action_value = COALESCE($6, action_value),
        priority = COALESCE($7, priority), is_active = COALESCE($8, is_active), updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 AND user_id = $10 RETURNING *`,
      [name, field, operator, value, action, action_value, priority, is_active, parseInt(req.params.id), req.user.id]
    );
    res.json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM transaction_rules WHERE id = $1 AND user_id = $2', [parseInt(req.params.id), req.user.id]);
    res.json({ data: { message: 'Rule deleted' } });
  } catch (err) { next(err); }
});

// Apply rules to uncategorized transactions
router.post('/apply', async (req, res, next) => {
  try {
    const rules = await pool.query(
      'SELECT * FROM transaction_rules WHERE user_id = $1 AND is_active = true ORDER BY priority DESC',
      [req.user.id]
    );
    let updated = 0;
    for (const rule of rules.rows) {
      let where = '';
      const params = [];
      let idx = 1;
      if (rule.field === 'merchant') {
        if (rule.operator === 'contains') { where = `AND merchant ILIKE $${idx++}`; params.push(`%${rule.value}%`); }
        else if (rule.operator === 'equals') { where = `AND merchant = $${idx++}`; params.push(rule.value); }
        else if (rule.operator === 'starts_with') { where = `AND merchant ILIKE $${idx++}`; params.push(`${rule.value}%`); }
      } else if (rule.field === 'amount') {
        if (rule.operator === 'greater_than') { where = `AND ABS(amount) > $${idx++}`; params.push(parseFloat(rule.value)); }
        else if (rule.operator === 'less_than') { where = `AND ABS(amount) < $${idx++}`; params.push(parseFloat(rule.value)); }
        else if (rule.operator === 'equals') { where = `AND ABS(amount) = $${idx++}`; params.push(parseFloat(rule.value)); }
      } else if (rule.field === 'category') {
        if (rule.operator === 'equals') { where = `AND category = $${idx++}`; params.push(rule.value); }
      }
      if (!where) continue;
      let setClause = '';
      if (rule.action === 'set_category') { setClause = `category = $${idx++}`; params.push(rule.action_value); }
      else if (rule.action === 'set_tag') { setClause = `tags = array_append(tags, $${idx++})`; params.push(rule.action_value); }
      else if (rule.action === 'mark_deductible') { setClause = `is_deductible = true`; }
      if (!setClause) continue;
      const result = await pool.query(
        `UPDATE transactions SET ${setClause}, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $${idx++} ${where} RETURNING id`,
        [...params, req.user.id]
      );
      updated += result.rowCount;
    }
    res.json({ data: { updated } });
  } catch (err) { next(err); }
});

export default router;

import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/connection.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticate);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    cb(null, `receipt-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.post('/:transactionId', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400);
    const result = await pool.query(
      `INSERT INTO attachments (transaction_id, user_id, filename, original_name, mime_type, size, url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [parseInt(req.params.transactionId), req.user.id, req.file.filename, req.file.originalname,
       req.file.mimetype, req.file.size, `/uploads/${req.file.filename}`]
    );
    await pool.query('UPDATE transactions SET has_receipt = true WHERE id = $1', [parseInt(req.params.transactionId)]);
    res.status(201).json({ data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/:transactionId', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM attachments WHERE transaction_id = $1 AND user_id = $2',
      [parseInt(req.params.transactionId), req.user.id]
    );
    res.json({ data: result.rows });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM attachments WHERE id = $1 AND user_id = $2 RETURNING transaction_id',
      [parseInt(req.params.id), req.user.id]
    );
    if (result.rows.length > 0) {
      const txId = result.rows[0].transaction_id;
      const remaining = await pool.query('SELECT COUNT(*) as c FROM attachments WHERE transaction_id = $1', [txId]);
      if (parseInt(remaining.rows[0].c) === 0) {
        await pool.query('UPDATE transactions SET has_receipt = false WHERE id = $1', [txId]);
      }
    }
    res.json({ data: { message: 'Deleted' } });
  } catch (err) { next(err); }
});

export default router;

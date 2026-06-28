import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import authRouter from './routes/auth.js';
import accountsRouter from './routes/accounts.js';
import transactionsRouter from './routes/transactions.js';
import budgetsRouter from './routes/budgets.js';
import recurringRouter from './routes/recurring.js';
import goalsRouter from './routes/goals.js';
import investmentsRouter from './routes/investments.js';
import dashboardRouter from './routes/dashboard.js';
import reportsRouter from './routes/reports.js';
import settingsRouter from './routes/settings.js';
import rulesRouter from './routes/rules.js';
import notificationsRouter from './routes/notifications.js';
import categoriesRouter from './routes/categories.js';
import attachmentsRouter from './routes/attachments.js';
import aiRouter from './routes/ai.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { optionalAuth } from './middleware/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// Auth routes (public)
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/accounts', accountsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/recurring', recurringRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/investments', investmentsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/rules', rulesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/attachments', attachmentsRouter);
app.use('/api/ai', aiRouter);

// Semi-public routes (optional auth)
app.use('/api/dashboard', optionalAuth, dashboardRouter);
app.use('/api/settings', optionalAuth, settingsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;

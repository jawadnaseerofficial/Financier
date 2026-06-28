-- Migration: Add auth, rules, notifications, categories, receipt attachments, and all missing features

-- ============================================
-- 1. USERS & AUTH
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'owner',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- 2. HOUSEHOLDS
-- ============================================
CREATE TABLE IF NOT EXISTS households (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL DEFAULT 'My Household',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS household_members (
  id SERIAL PRIMARY KEY,
  household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(household_id, user_id)
);

-- ============================================
-- 3. LINK USERS TO EXISTING DATA
-- ============================================
DO $$ BEGIN
  ALTER TABLE accounts ADD COLUMN user_id INTEGER REFERENCES users(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE transactions ADD COLUMN user_id INTEGER REFERENCES users(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE budgets ADD COLUMN user_id INTEGER REFERENCES users(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE recurring ADD COLUMN user_id INTEGER REFERENCES users(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE goals ADD COLUMN user_id INTEGER REFERENCES users(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE investments ADD COLUMN user_id INTEGER REFERENCES users(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE accounts ADD COLUMN household_id INTEGER REFERENCES households(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE transactions ADD COLUMN household_id INTEGER REFERENCES households(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ============================================
-- 4. TRANSACTION RULES
-- ============================================
CREATE TABLE IF NOT EXISTS transaction_rules (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  household_id INTEGER REFERENCES households(id),
  name VARCHAR(255) NOT NULL,
  field VARCHAR(50) NOT NULL,
  operator VARCHAR(50) NOT NULL,
  value TEXT NOT NULL,
  action VARCHAR(50) NOT NULL DEFAULT 'set_category',
  action_value VARCHAR(255),
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rules_user ON transaction_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_rules_active ON transaction_rules(is_active);

-- ============================================
-- 5. CUSTOM CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS custom_categories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  household_id INTEGER REFERENCES households(id),
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(100) DEFAULT 'Tag',
  color VARCHAR(20) DEFAULT '#6366f1',
  group_name VARCHAR(100),
  is_income BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);

-- ============================================
-- 6. NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  household_id INTEGER REFERENCES households(id),
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);

-- ============================================
-- 7. NOTIFICATION RULES (auto-alerts)
-- ============================================
CREATE TABLE IF NOT EXISTS notification_rules (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  type VARCHAR(100) NOT NULL,
  threshold NUMERIC(15,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 8. ATTACHMENTS (receipts)
-- ============================================
CREATE TABLE IF NOT EXISTS attachments (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  mime_type VARCHAR(100),
  size INTEGER,
  url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attachments_transaction ON attachments(transaction_id);

-- ============================================
-- 9. ACCOUNT BALANCE HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS account_balance_history (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  balance NUMERIC(15,2) NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_balance_history_account ON account_balance_history(account_id);

-- ============================================
-- 10. BUDGET ROLLOVER
-- ============================================
DO $$ BEGIN
  ALTER TABLE budgets ADD COLUMN rollover BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE budgets ADD COLUMN rollover_amount NUMERIC(15,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ============================================
-- 11. BUDGET ALERTS
-- ============================================
CREATE TABLE IF NOT EXISTS budget_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  budget_id INTEGER REFERENCES budgets(id) ON DELETE CASCADE,
  threshold_percent INTEGER DEFAULT 80,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 12. FLEX BUDGET (total-based, not category)
-- ============================================
DO $$ BEGIN
  ALTER TABLE budgets ADD COLUMN budget_mode VARCHAR(50) DEFAULT 'category';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ============================================
-- 13. INVESTMENT ENHANCEMENTS
-- ============================================
DO $$ BEGIN
  ALTER TABLE investments ADD COLUMN cost_basis NUMERIC(15,2);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE investments ADD COLUMN purchase_date DATE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE investments ADD COLUMN asset_class VARCHAR(100);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE investments ADD COLUMN account_id INTEGER REFERENCES accounts(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS dividends (
  id SERIAL PRIMARY KEY,
  investment_id INTEGER REFERENCES investments(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  amount NUMERIC(15,2) NOT NULL,
  payment_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 14. TAX CATEGORIES
-- ============================================
DO $$ BEGIN
  ALTER TABLE transactions ADD COLUMN tax_category VARCHAR(100);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE transactions ADD COLUMN is_deductible BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ============================================
-- 15. ACCOUNT TYPES EXPANSION
-- ============================================
DO $$ BEGIN
  ALTER TABLE accounts ADD COLUMN asset_class VARCHAR(100);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE accounts ADD COLUMN estimated_value NUMERIC(15,2);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE accounts ADD COLUMN last_valued_date DATE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ============================================
-- 16. RECEIPT ATTACHMENTS LINK
-- ============================================
DO $$ BEGIN
  ALTER TABLE transactions ADD COLUMN has_receipt BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ============================================
-- 17. RECURRING ENHANCEMENTS
-- ============================================
DO $$ BEGIN
  ALTER TABLE recurring ADD COLUMN auto_detect BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE recurring ADD COLUMN last_amount NUMERIC(15,2);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ============================================
-- 18. ONBOARDING STATE
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL UNIQUE,
  onboarding_completed BOOLEAN DEFAULT false,
  default_view VARCHAR(100) DEFAULT 'dashboard',
  dashboard_layout JSONB,
  notification_email BOOLEAN DEFAULT true,
  notification_push BOOLEAN DEFAULT true,
  notification_budget_alerts BOOLEAN DEFAULT true,
  notification_bill_reminders BOOLEAN DEFAULT true,
  notification_weekly_recap BOOLEAN DEFAULT true,
  currency VARCHAR(10) DEFAULT 'USD',
  date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
  number_format VARCHAR(20) DEFAULT 'en-US',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 19. ADDITIONAL INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_categories_user ON custom_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_dividends_investment ON dividends(investment_id);
CREATE INDEX IF NOT EXISTS idx_balance_history_account_date ON account_balance_history(account_id, recorded_at);

-- Migration: Add owner columns, settings table, additional indexes
-- Run this once to upgrade the schema

-- Add owner column to accounts
DO $$ BEGIN
  ALTER TABLE accounts ADD COLUMN owner VARCHAR(100) DEFAULT 'Joint';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add owner column to transactions
DO $$ BEGIN
  ALTER TABLE transactions ADD COLUMN owner VARCHAR(100) DEFAULT 'Joint';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add goal_id to transactions for goal tracking
DO $$ BEGIN
  ALTER TABLE transactions ADD COLUMN goal_id INTEGER REFERENCES goals(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add recurrence_id to transactions for recurring linking
DO $$ BEGIN
  ALTER TABLE transactions ADD COLUMN recurrence_id INTEGER REFERENCES recurring(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed default settings
INSERT INTO settings (key, value) VALUES
  ('currency', 'USD'),
  ('date_format', 'MM/DD/YYYY'),
  ('theme', 'light'),
  ('fiscal_year_start', '1'),
  ('default_account_id', NULL)
ON CONFLICT (key) DO NOTHING;

-- Additional indexes for production performance
CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant);
CREATE INDEX IF NOT EXISTS idx_transactions_owner ON transactions(owner);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_account_date ON transactions(account_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_category_date ON transactions(category, date);
CREATE INDEX IF NOT EXISTS idx_accounts_owner ON accounts(owner);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
CREATE INDEX IF NOT EXISTS idx_budgets_is_income ON budgets(is_income);
CREATE INDEX IF NOT EXISTS idx_budgets_budget_group ON budgets(budget_group);
CREATE INDEX IF NOT EXISTS idx_recurring_is_active ON recurring(is_active);
CREATE INDEX IF NOT EXISTS idx_goals_type ON goals(type);
CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline);
CREATE INDEX IF NOT EXISTS idx_investments_symbol ON investments(symbol);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

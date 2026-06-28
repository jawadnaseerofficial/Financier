CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    institution VARCHAR(255) NOT NULL,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    sync_status VARCHAR(20) DEFAULT 'synced',
    owner VARCHAR(255),
    last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    merchant VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    account_id INTEGER REFERENCES accounts(id),
    status VARCHAR(20) DEFAULT 'cleared',
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    owner VARCHAR(255),
    goal_id INTEGER,
    recurrence_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL UNIQUE,
    budgeted DECIMAL(15, 2) NOT NULL,
    spent DECIMAL(15, 2) NOT NULL DEFAULT 0,
    budget_group VARCHAR(100) DEFAULT 'Expenses',
    icon VARCHAR(50) DEFAULT 'ShoppingCart',
    is_income BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recurring (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    next_date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    account_id INTEGER REFERENCES accounts(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    target DECIMAL(15, 2) NOT NULL,
    current DECIMAL(15, 2) NOT NULL DEFAULT 0,
    deadline DATE,
    monthly_contribution DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS investments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    shares DECIMAL(15, 6),
    current_price DECIMAL(15, 2),
    total_value DECIMAL(15, 2) NOT NULL,
    day_change DECIMAL(15, 2) DEFAULT 0,
    day_change_percent DECIMAL(8, 4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_owner ON transactions(owner);
CREATE INDEX idx_accounts_category ON accounts(category);
CREATE INDEX idx_accounts_owner ON accounts(owner);
CREATE INDEX idx_recurring_next_date ON recurring(next_date);
CREATE INDEX idx_settings_key ON settings(key);

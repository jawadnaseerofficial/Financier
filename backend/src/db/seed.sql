-- Seed Accounts
INSERT INTO accounts (name, institution, balance, type, category, sync_status, last_synced) VALUES
-- Cash - Checking
('Premier Checking', 'Schwab Bank', 15744.92, 'checking', 'cash', 'synced', CURRENT_TIMESTAMP),
('High Yield Checking', 'Ally Bank', 5011.02, 'checking', 'cash', 'synced', CURRENT_TIMESTAMP),
-- Cash - Savings
('Emergency Savings', 'Marcus', 12500.00, 'savings', 'cash', 'synced', CURRENT_TIMESTAMP),
('Vacation Fund', 'Capital One', 3200.00, 'savings', 'cash', 'synced', CURRENT_TIMESTAMP),
-- Cash - Business
('Business Operating', 'Chase', 8945.67, 'business', 'cash', 'synced', CURRENT_TIMESTAMP),
-- Credit Cards
('Sapphire Reserve', 'Chase', -2150.45, 'credit', 'credit', 'synced', CURRENT_TIMESTAMP),
('Amex Gold', 'American Express', -1875.23, 'credit', 'credit', 'synced', CURRENT_TIMESTAMP),
('Citi Double Cash', 'Citi', -225.21, 'credit', 'credit', 'error', CURRENT_TIMESTAMP - INTERVAL '1 day'),
-- Loans
('Federal Student Loan', 'Nelnet', -45230.78, 'student_loan', 'loans', 'synced', CURRENT_TIMESTAMP),
('Auto Loan', 'Capital One', -28456.34, 'auto_loan', 'loans', 'synced', CURRENT_TIMESTAMP),
('Home Mortgage', 'Wells Fargo', -113745.44, 'mortgage', 'loans', 'pending', CURRENT_TIMESTAMP - INTERVAL '2 hours');

-- Seed Transactions
INSERT INTO transactions (date, merchant, category, amount, account_id, status, tags) VALUES
('2026-06-26', 'Whole Foods Market', 'Groceries', -85.42, 6, 'cleared', '{}'),
('2026-06-25', 'Netflix', 'Entertainment', -15.99, 7, 'cleared', '{subscription}'),
('2026-06-25', 'Shell Gas Station', 'Transportation', -52.30, 6, 'cleared', '{}'),
('2026-06-24', 'Salary Deposit', 'Income', 3250.00, 1, 'cleared', '{paycheck}'),
('2026-06-24', 'Amazon', 'Shopping', -124.99, 8, 'pending', '{}'),
('2026-06-23', 'Starbucks', 'Food & Drink', -6.75, 7, 'cleared', '{}'),
('2026-06-23', 'Electric Company', 'Utilities', -142.50, 1, 'cleared', '{bills}'),
('2026-06-22', 'Target', 'Shopping', -67.89, 6, 'cleared', '{}'),
('2026-06-22', 'Gym Membership', 'Health & Fitness', -49.99, 7, 'cleared', '{subscription}'),
('2026-06-21', 'Chipotle', 'Food & Drink', -12.50, 8, 'cleared', '{}'),
('2026-06-20', 'Costco', 'Groceries', -234.56, 6, 'cleared', '{}'),
('2026-06-20', 'Uber', 'Transportation', -18.75, 7, 'cleared', '{}'),
('2026-06-19', 'AT&T', 'Utilities', -85.00, 1, 'cleared', '{bills}'),
('2026-06-19', 'Amazon Prime', 'Entertainment', -14.99, 6, 'cleared', '{subscription}'),
('2026-06-18', 'Whole Foods Market', 'Groceries', -112.34, 6, 'cleared', '{}'),
('2026-06-18', 'Shell Gas Station', 'Transportation', -45.20, 6, 'cleared', '{}'),
('2026-06-17', 'Spotify', 'Entertainment', -9.99, 7, 'cleared', '{subscription}'),
('2026-06-17', 'Home Depot', 'Shopping', -89.99, 6, 'cleared', '{}'),
('2026-06-16', 'Salary Deposit', 'Income', 3250.00, 1, 'cleared', '{paycheck}'),
('2026-06-16', 'Walmart', 'Groceries', -67.89, 6, 'cleared', '{}');

-- Seed Budgets
INSERT INTO budgets (category, budgeted, spent, budget_group, icon, is_income) VALUES
('Paychecks', 6500.00, 6500.00, 'Income', 'Wallet', true),
('Business Income', 500.00, 450.00, 'Income', 'Briefcase', true),
('Interest', 25.00, 18.50, 'Income', 'DollarSign', true),
('Charity', 100.00, 0.00, 'Gifts & Donations', 'TrendingUp', false),
('Gifts', 75.00, 45.00, 'Gifts & Donations', 'Gift', false),
('Auto Payment', 350.00, 350.00, 'Auto & Transport', 'Car', false),
('Public Transit', 120.00, 95.00, 'Auto & Transport', 'Bus', false),
('Gas', 200.00, 172.50, 'Auto & Transport', 'Fuel', false),
('Groceries', 500.00, 499.21, 'Food & Dining', 'ShoppingCart', false),
('Restaurants', 250.00, 198.25, 'Food & Dining', 'Utensils', false),
('Entertainment', 200.00, 185.99, 'Entertainment', 'Film', false),
('Shopping', 400.00, 492.88, 'Shopping', 'ShoppingBag', false),
('Utilities', 200.00, 142.50, 'Bills & Utilities', 'Zap', false),
('Health & Fitness', 100.00, 49.99, 'Health & Wellness', 'Dumbbell', false),
('Insurance', 250.00, 125.00, 'Bills & Utilities', 'Shield', false);

-- Seed Recurring
INSERT INTO recurring (name, amount, frequency, next_date, category, account_id, is_active) VALUES
('Netflix', -15.99, 'Monthly', '2026-07-25', 'Entertainment', 7, true),
('Gym Membership', -49.99, 'Monthly', '2026-07-22', 'Health & Fitness', 7, true),
('Spotify', -9.99, 'Monthly', '2026-07-15', 'Entertainment', 6, true),
('Electric Company', -142.50, 'Monthly', '2026-07-23', 'Utilities', 1, true),
('Internet Service', -79.99, 'Monthly', '2026-07-10', 'Utilities', 1, true),
('Car Insurance', -125.00, 'Monthly', '2026-07-01', 'Insurance', 1, true);

-- Seed Goals
INSERT INTO goals (name, type, target, current, deadline, monthly_contribution) VALUES
('Emergency Fund', 'save-up', 25000.00, 12500.00, '2026-12-31', 500.00),
('Vacation to Europe', 'save-up', 8000.00, 3200.00, '2027-06-01', 300.00),
('Pay Off Credit Card', 'pay-down', 4250.89, 0.00, '2026-12-31', 350.00),
('Down Payment', 'save-up', 60000.00, 18500.00, '2028-01-01', 1000.00);

-- Seed Investments
INSERT INTO investments (name, symbol, shares, current_price, total_value, day_change, day_change_percent) VALUES
('Vanguard Total Stock Market', 'VTI', 150, 300.00, 45000.00, 1026.00, 2.34),
('Apple Inc.', 'AAPL', 50, 650.00, 32500.00, 500.00, 1.56),
('Microsoft Corporation', 'MSFT', 25, 1150.00, 28750.00, -258.75, -0.89),
('Vanguard Total Bond Market', 'BND', 200, 95.90, 19180.00, 45.00, 0.24);

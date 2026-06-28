import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: 'postgres',
  password: 'jawad',
  host: 'localhost',
  port: 5432,
  database: 'financier',
});

const categories = {
  income: ['Paycheck', 'Freelance Income', 'Bonus', 'Side Hustle', 'Interest Income', 'Dividends'],
  food: ['Groceries', 'Groceries + Household Items', 'Food & Drink', 'Food & Drink'],
  transport: ['Gas', 'Transportation', 'Auto Maintenance'],
  shopping: ['Shopping', 'Clothing', 'Home Improvement'],
  entertainment: ['Entertainment', 'Subscriptions'],
  utilities: ['Utilities', 'Internet & Cable', 'Phone'],
  health: ['Health & Fitness'],
  insurance: ['Insurance'],
  housing: ['Auto Payment', 'Auto Payment'],
  travel: ['Travel & Vacation'],
};

const merchants = {
  'Paycheck': ['Acme Corp', 'Acme Corp', 'Acme Corp'],
  'Freelance Income': ['Upwork', 'Fiverr Client', 'Consulting gig'],
  'Bonus': ['Acme Corp Bonus'],
  'Side Hustle': ['Etsy Shop', 'Tutoring'],
  'Interest Income': ['Marcus Savings', 'High Yield Savings'],
  'Dividends': ['Vanguard Dividend'],
  'Groceries': ['Whole Foods Market', 'Trader Joe\'s', 'Costco', 'Walmart Grocery', 'Kroger', 'Safeway'],
  'Groceries + Household Items': ['Costco Wholesale', 'Target', 'Walmart', 'Amazon Fresh'],
  'Food & Drink': ['Starbucks', 'Chipotle', 'Uber Eats', 'DoorDash', 'McDonald\'s', 'Chick-fil-A', 'Local Bistro', 'Thai Palace', 'Pizza Hut'],
  'Gas': ['Shell', 'BP', 'Chevron', 'ExxonMobil', 'Gas Station'],
  'Transportation': ['Uber', 'Lyft', 'Metro Transit', 'Parking Garage'],
  'Auto Maintenance': ['Jiffy Lube', 'Tire Plus', 'AutoZone'],
  'Shopping': ['Amazon', 'Target', 'Best Buy', 'Nordstrom', 'Macy\'s', 'HomeGoods'],
  'Clothing': ['Nike Store', 'H&M', 'Zara', 'Uniqlo', 'Gap'],
  'Home Improvement': ['Home Depot', 'Lowe\'s', 'IKEA'],
  'Entertainment': ['Netflix', 'Movie Theater', 'Concert Tickets', 'Spotify', 'Apple Music', 'Steam Games'],
  'Subscriptions': ['Netflix', 'Spotify Premium', 'Disney+', 'Hulu', 'YouTube Premium', 'Adobe Creative Cloud', 'iCloud Storage'],
  'Utilities': ['ConEd Electric', 'National Grid Gas', 'Water Bill'],
  'Internet & Cable': ['Spectrum Internet', 'Verizon Fios'],
  'Phone': ['T-Mobile', 'AT&T'],
  'Health & Fitness': ['Planet Fitness', 'CVS Pharmacy', 'Walgreens', 'Whole Foods Vitamins', 'Gym Membership'],
  'Insurance': ['Geico Auto Insurance', 'State Farm', 'Health Insurance'],
  'Auto Payment': ['Chase Auto Loan', 'Toyota Financial'],
  'Travel & Vacation': ['Delta Airlines', 'Marriott Hotel', 'Airbnb', 'Booking.com', 'Hertz Car Rental', 'Expedia'],
};

const incomeAccounts = [1, 2]; // Premier Checking, High Yield Checking
const creditAccounts = [6, 7, 8]; // Sapphire Reserve, Amex Gold, Citi Double Cash
const savingsAccounts = [3, 4]; // Emergency Savings, Vacation Fund

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomBetween(min, max) { return Math.round((Math.random() * (max - min) + min) * 100) / 100; }
function randomDate(start, end) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return new Date(s + Math.random() * (e - s));
}

async function seed() {
  const txs = [];
  const now = new Date('2026-06-27');
  const sixMonthsAgo = new Date('2025-12-27');

  // 10 income transactions (paychecks, freelance, etc.)
  for (let i = 0; i < 10; i++) {
    const cat = randomItem(categories.income);
    const merchant = randomItem(merchants[cat]);
    const date = randomDate(sixMonthsAgo, now);
    const amount = cat === 'Paycheck' ? randomBetween(3500, 4200) : randomBetween(200, 1500);
    txs.push({
      date: date.toISOString().split('T')[0],
      merchant,
      category: cat,
      amount,
      account_id: randomItem(incomeAccounts),
      status: 'cleared',
      owner: randomItem(['Individual', 'Joint']),
    });
  }

  // 180 expense transactions
  const expenseCategories = Object.entries(categories).filter(([k]) => k !== 'income').flatMap(([, v]) => v);
  for (let i = 0; i < 180; i++) {
    const cat = randomItem(expenseCategories);
    const merchant = randomItem(merchants[cat] || ['Unknown']);
    const date = randomDate(sixMonthsAgo, now);
    let amount;
    switch (cat) {
      case 'Groceries': amount = randomBetween(40, 180); break;
      case 'Groceries + Household Items': amount = randomBetween(60, 250); break;
      case 'Food & Drink': amount = randomBetween(8, 45); break;
      case 'Gas': amount = randomBetween(35, 65); break;
      case 'Transportation': amount = randomBetween(10, 40); break;
      case 'Auto Maintenance': amount = randomBetween(50, 300); break;
      case 'Shopping': amount = randomBetween(15, 200); break;
      case 'Clothing': amount = randomBetween(25, 150); break;
      case 'Home Improvement': amount = randomBetween(20, 500); break;
      case 'Entertainment': amount = randomBetween(10, 80); break;
      case 'Subscriptions': amount = randomBetween(10, 25); break;
      case 'Utilities': amount = randomBetween(80, 200); break;
      case 'Internet & Cable': amount = randomBetween(50, 100); break;
      case 'Phone': amount = randomBetween(50, 120); break;
      case 'Health & Fitness': amount = randomBetween(15, 100); break;
      case 'Insurance': amount = randomBetween(100, 300); break;
      case 'Auto Payment': amount = randomBetween(250, 450); break;
      case 'Travel & Vacation': amount = randomBetween(100, 800); break;
      default: amount = randomBetween(10, 100);
    }
    const isCredit = cat === 'Food & Drink' || cat === 'Shopping' || cat === 'Entertainment' || cat === 'Travel & Vacation';
    const account_id = isCredit ? randomItem(creditAccounts) : randomItem([...incomeAccounts, ...savingsAccounts]);
    txs.push({
      date: date.toISOString().split('T')[0],
      merchant,
      category: cat,
      amount: -amount,
      account_id,
      status: Math.random() > 0.1 ? 'cleared' : 'pending',
      owner: Math.random() > 0.3 ? 'Joint' : randomItem(['Individual', 'Joint']),
    });
  }

  // Sort by date
  txs.sort((a, b) => a.date.localeCompare(b.date));

  let inserted = 0;
  for (const tx of txs) {
    try {
      await pool.query(
        `INSERT INTO transactions (date, merchant, category, amount, account_id, status, owner, tags, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::text[], $9)`,
        [tx.date, tx.merchant, tx.category, tx.amount, tx.account_id, tx.status, tx.owner, '{}', null]
      );
      inserted++;
    } catch (err) {
      console.error(`Failed: ${tx.merchant} - ${err.message}`);
    }
  }

  console.log(`Inserted ${inserted} transactions`);
  await pool.end();
}

seed().catch(console.error);

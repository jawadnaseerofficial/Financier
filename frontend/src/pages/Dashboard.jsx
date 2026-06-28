import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { ArrowRight, Activity, CalendarDays, Download, MapPin, PieChart, Sparkles, TrendingDown, TrendingUp, Wallet, PiggyBank } from 'lucide-react'
import { Link } from 'react-router-dom'

function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const dashboardData = await api.getDashboard()
      setData(dashboardData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-danger">Error: {error}</div>
      </div>
    )
  }

  const { netWorth, recentTransactions = [], budget = {}, goals = {}, monthly = {} } = data
  const income = monthly.income || 0
  const expenses = monthly.expenses || 0
  const savingsRate = getSavingsRate(income, expenses)
  const budgetUsed = Math.min(budget.percentUsed || 0, 100)
  const savingsProgress = goals.totalTarget ? Math.round((goals.totalSaved / goals.totalTarget) * 100) : 0
  const debtProgress = goals.totalDebtTarget ? Math.round((goals.totalDebtPaid / goals.totalDebtTarget) * 100) : 0
  const topSpending = getTopExpenseCategories(recentTransactions)
  const trendSeries = createTrendSeries(recentTransactions)
  const budgetDonutData = buildBudgetDonutData({ income, expenses, budget })

  return (
    <div className="p-6 space-y-6">
      <header className="grid gap-6 xl:grid-cols-[1fr_auto] xl:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-text-secondary">Executive overview</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Dashboard</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
            Track net worth, spending momentum, and goal progress in a modern dark finance workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm text-black hover:border-primary dark:border-[#2e3040] dark:bg-[#11131d] dark:text-text-secondary">
            <Download size={16} /> Export report
          </button>
          <Link to="/transactions" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90">
            Recent activity <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-4">
        <MetricCard
          label="Net worth"
          value={`$${netWorth.total.toLocaleString()}`}
          detail={`Assets $${netWorth.assets.toLocaleString()} · Liabilities $${Math.abs(netWorth.liabilities).toLocaleString()}`}
          icon={<Wallet size={20} className="text-primary" />}
        />
        <MetricCard
          label="Income"
          value={`$${income.toLocaleString()}`}
          detail="This month"
          icon={<TrendingUp size={20} className="text-success" />}
          accent="success"
        />
        <MetricCard
          label="Expenses"
          value={`$${expenses.toLocaleString()}`}
          detail="This month"
          icon={<TrendingDown size={20} className="text-danger" />}
          accent="danger"
        />
        <MetricCard
          label="Budget used"
          value={`${budgetUsed}%`}
          detail={`${budget.totalSpent?.toLocaleString() || 0} / ${budget.totalBudgeted?.toLocaleString() || 0}`}
          icon={<PiggyBank size={20} className="text-warning" />}
          accent="warning"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_0.95fr]">
        <div className="rounded-[32px] border border-border bg-bg-card p-6 shadow-[0_24px_80px_rgba(15,17,26,0.15)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-text-secondary">Cashflow momentum</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Monthly trend</h2>
            </div>
            <div className="inline-flex items-center gap-3 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm text-black dark:border-[#2e3040] dark:bg-[#11131d] dark:text-text-secondary">
              <CalendarDays size={16} /> Since last 30 days
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <TrendItem label="Savings rate" value={`${savingsRate}%`} tone="success" />
            <TrendItem label="Budget utilization" value={`${budgetUsed}%`} tone="warning" />
            <TrendItem label="Debt progress" value={`${debtProgress}%`} tone="danger" />
          </div>

          <div className="mt-8">
            <RevenueAreaChart series={trendSeries} />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[32px] border border-border bg-bg-card p-6 shadow-[0_24px_80px_rgba(15,17,26,0.15)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-text-secondary">Budget snapshot</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Allocation overview</h3>
              </div>
              <PieChart size={20} className="text-primary" />
            </div>
            <p className="mt-4 text-sm leading-6 text-text-secondary">
              A visual view of your spending, savings, and budget left for the current period.
            </p>
            <div className="mt-6 flex flex-col items-center gap-6 xl:flex-row xl:items-center xl:justify-between">
              <BudgetDonutChart data={budgetDonutData} budgetUsed={budgetUsed} />
              <div className="space-y-3">
                {budgetDonutData.map((slice) => (
                  <div key={slice.label} className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: slice.color }} />
                    <div>
                      <p className="text-sm text-white">{slice.label}</p>
                      <p className="text-xs text-text-secondary">{slice.valueLabel}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-border bg-bg-card p-6 shadow-[0_24px_80px_rgba(15,17,26,0.15)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-text-secondary">Goal progress</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Focus areas</h3>
              </div>
              <span className="text-xs uppercase tracking-[0.25em] text-text-secondary">Updated</span>
            </div>
            <div className="mt-6 space-y-5">
              <GoalProgress title="Savings" value={`${savingsProgress}%`} amount={`${goals.totalSaved.toLocaleString()} / ${goals.totalTarget.toLocaleString()}`} color="bg-primary" />
              <GoalProgress title="Debt" value={`${debtProgress}%`} amount={`${goals.totalDebtPaid.toLocaleString()} / ${goals.totalDebtTarget.toLocaleString()}`} color="bg-danger" />
            </div>
          </div>
        </aside>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-[32px] border border-border bg-bg-card p-6 shadow-[0_24px_80px_rgba(15,17,26,0.15)]">
          <div className="flex items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-text-secondary">Recent activity</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Transactions</h3>
            </div>
            <Link to="/transactions" className="text-primary text-sm font-medium">
              View all
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {recentTransactions.length ? (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="rounded-3xl border border-border bg-bg-dark p-4 transition hover:border-primary/40">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{transaction.merchant}</p>
                      <p className="mt-1 text-xs text-text-secondary">{transaction.category}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${Number(transaction.amount) >= 0 ? 'text-success' : 'text-danger'}`}>
                        {Number(transaction.amount) >= 0 ? '+' : '-'}${Math.abs(Number(transaction.amount)).toFixed(2)}
                      </p>
                      <p className="text-xs text-text-secondary">{new Date(transaction.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-secondary">No recent transactions available.</p>
            )}
          </div>
        </section>

        <section className="rounded-[32px] border border-border bg-bg-card p-6 shadow-[0_24px_80px_rgba(15,17,26,0.15)]">
          <div className="flex items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-text-secondary">Top spending</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Categories</h3>
            </div>
            <MapPin size={18} className="text-primary" />
          </div>
          <div className="mt-6 space-y-4">
            {topSpending.length ? (
              topSpending.map((item) => (
                <div key={item.category} className="rounded-3xl border border-border bg-bg-dark p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.category}</p>
                      <p className="mt-1 text-xs text-text-secondary">{item.transactionCount} transactions</p>
                    </div>
                    <p className="text-sm font-semibold text-white">${item.value.toLocaleString()}</p>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-[#11131d]">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${item.share}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-secondary">No spending categories found.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function getSavingsRate(income, expenses) {
  if (!income) return 0
  return Math.max(0, Math.round(((income - expenses) / income) * 100))
}

function getTopExpenseCategories(transactions) {
  const buckets = {}
  transactions.forEach((tx) => {
    const amount = Number(tx.amount) || 0
    if (amount >= 0) return
    const category = tx.category || 'Other'
    buckets[category] = buckets[category] || { value: 0, count: 0 }
    buckets[category].value += Math.abs(amount)
    buckets[category].count += 1
  })

  const entries = Object.entries(buckets).map(([category, stats]) => ({
    category,
    value: stats.value,
    transactionCount: stats.count,
  }))

  const total = entries.reduce((sum, item) => sum + item.value, 0) || 1
  return entries
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((item) => ({
      ...item,
      share: Math.round((item.value / total) * 100),
    }))
}

function createTrendSeries(transactions) {
  const recent = [...transactions]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-8)

  const points = recent.map((tx) => ({
    label: new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: Number(tx.amount) || 0,
  }))

  if (!points.length) {
    return Array.from({ length: 8 }, (_, index) => ({ label: `Day ${index + 1}`, value: 0 }))
  }

  return points
}

function buildBudgetDonutData({ income, expenses, budget }) {
  const saved = Math.max(0, income - expenses)
  const remaining = Math.max(0, (budget.totalBudgeted || 0) - (budget.totalSpent || 0))
  const data = [
    { label: 'Expenses', value: expenses, color: '#fb7185', valueLabel: `$${expenses.toLocaleString()}` },
    { label: 'Savings', value: saved, color: '#34d399', valueLabel: `$${saved.toLocaleString()}` },
  ]

  if (budget.totalBudgeted > 0 && remaining > 0) {
    data.push({
      label: 'Budget left',
      value: remaining,
      color: '#60a5fa',
      valueLabel: `$${remaining.toLocaleString()}`,
    })
  }

  return data.filter((item) => item.value > 0)
}

function RevenueAreaChart({ series }) {
  const width = 680
  const height = 280
  const padding = 44
  const values = series.map((item) => item.value)
  const max = Math.max(...values, 0)
  const min = Math.min(...values, 0)
  const range = Math.max(max - min, 1)
  const step = (width - padding * 2) / Math.max(series.length - 1, 1)

  const points = series.map((item, index) => {
    const x = padding + step * index
    const normalized = (item.value - min) / range
    const y = height - padding - normalized * (height - padding * 2)
    return { ...item, x, y }
  })

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`

  return (
    <div className="rounded-3xl border border-border bg-bg-dark p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[320px]">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3].map((row) => {
          const y = padding + ((height - padding * 2) / 4) * row
          return <line key={row} x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(148,163,184,0.14)" />
        })}

        <path d={areaPath} fill="url(#areaGradient)" />
        <path d={linePath} fill="none" stroke="url(#lineGradient)" strokeWidth="4" strokeLinecap="round" />

        {points.map((point, index) => (
          <g key={index}>
            <circle cx={point.x} cy={point.y} r="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
            <text x={point.x} y={point.y - 14} textAnchor="middle" fontSize="11" fill="#cbd5e1">
              {point.value >= 0 ? '+' : ''}{point.value.toFixed(0)}
            </text>
          </g>
        ))}

        {points.map((point, index) => (
          <text key={`label-${index}`} x={point.x} y={height - padding + 20} textAnchor="middle" fontSize="11" fill="#94a3b8">
            {point.label}
          </text>
        ))}
      </svg>
    </div>
  )
}

function BudgetDonutChart({ data, budgetUsed }) {
  const size = 180
  const radius = 64
  const circumference = 2 * Math.PI * radius
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let cumulative = 0

  if (!total) {
    return (
      <div className="relative inline-flex h-[200px] w-[200px] items-center justify-center rounded-full bg-[#10121d] p-4">
        <div className="flex h-[148px] w-[148px] items-center justify-center rounded-full bg-bg-card text-center">
          <div>
            <p className="text-xs uppercase tracking-[0.30em] text-text-secondary">Budget</p>
            <p className="mt-2 text-2xl font-semibold text-white">0%</p>
            <p className="text-xs text-text-secondary">used</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative inline-flex h-[200px] w-[200px] items-center justify-center rounded-full bg-[#10121d] p-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((item) => {
          const dash = (item.value / total) * circumference
          const strokeDashoffset = cumulative
          cumulative += dash
          return (
            <circle
              key={item.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth="18"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-strokeDashoffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              strokeLinecap="round"
            />
          )
        })}
        <circle cx={size / 2} cy={size / 2} r={radius - 18} fill="var(--bg-card)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-xs uppercase tracking-[0.30em] text-text-secondary">Budget</p>
        <p className="mt-2 text-2xl font-semibold text-white">{Math.round((budgetUsed || 0))}%</p>
        <p className="text-xs text-text-secondary">used</p>
      </div>
    </div>
  )
}

function MetricCard({ label, value, detail, icon, accent }) {
  const accentClasses = accent === 'success'
    ? 'bg-success/10 text-success'
    : accent === 'danger'
      ? 'bg-danger/10 text-danger'
      : accent === 'warning'
        ? 'bg-warning/10 text-warning'
        : 'bg-primary/10 text-primary'

  return (
    <div className="rounded-[28px] border border-border bg-bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-text-secondary">{label}</p>
          <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-3xl ${accentClasses}`}>
          {icon}
        </div>
      </div>
      <p className="mt-4 text-sm text-text-secondary">{detail}</p>
    </div>
  )
}

function TrendItem({ label, value, tone }) {
  const toneClasses = tone === 'success'
    ? 'bg-success/10 text-success'
    : tone === 'danger'
      ? 'bg-danger/10 text-danger'
      : 'bg-warning/10 text-warning'

  return (
    <div className={`rounded-3xl border border-border bg-bg-dark p-4 ${toneClasses}`}>
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}

function InsightBadge({ label, value, tone }) {
  const color = tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-primary'
  return (
    <div className="rounded-3xl border border-border bg-bg-dark p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-text-secondary">{label}</p>
      <p className={`mt-2 text-lg font-semibold ${color}`}>{value}</p>
    </div>
  )
}

function GoalProgress({ title, value, amount, color }) {
  return (
    <div className="rounded-3xl border border-border bg-bg-dark p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-white">{title}</p>
        <p className="text-sm font-semibold text-text-secondary">{value}</p>
      </div>
      <div className="mt-3 h-2 rounded-full bg-[#11131d]">
        <div className={`h-2 rounded-full ${color}`} style={{ width: value }} />
      </div>
      <p className="mt-3 text-sm text-text-secondary">{amount}</p>
    </div>
  )
}

export default Dashboard

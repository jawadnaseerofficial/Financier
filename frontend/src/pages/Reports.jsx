import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import ReportFilter from '../components/reports/ReportFilter'
import {
  Download,
  ChevronDown,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  X,
  Save,
  Settings2,
} from 'lucide-react'

const CATEGORY_COLORS = {
  'Groceries': '#10b981',
  'Entertainment': '#8b5cf6',
  'Transportation': '#f59e0b',
  'Shopping': '#ec4899',
  'Food & Drink': '#0ea5e9',
  'Utilities': '#6366f1',
  'Health & Fitness': '#14b8a6',
  'Income': '#059669',
  'Subscriptions': '#a855f7',
  'Insurance': '#64748b',
  'Auto Payment': '#f97316',
  'Travel & Vacation': '#10b981',
  'Groceries + Household Items': '#f59e0b',
  'Auto Maintenance': '#ef4444',
  'Gas': '#06b6d4',
  'Clothing': '#ec4899',
  'Phone': '#3b82f6',
  'Internet & Cable': '#14b8a6',
  'Home Improvement': '#0ea5e9',
  'Furniture & Housewares': '#10b981',
  'Everything else': '#f59e0b',
  'Savings': '#10b981',
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#0ea5e9', '#14b8a6', '#ef4444', '#64748b', '#a855f7', '#f97316', '#06b6d4', '#3b82f6', '#059669', '#f43f5e', '#84cc16']

const CATEGORY_ICONS = {
  'Income': '💰',
  'Paychecks': '💼',
  'Business Income': '💼',
  'Groceries': '🛒',
  'Food & Drink': '🍽️',
  'Transportation': '⛽',
  'Shopping': '🛍️',
  'Entertainment': '🎬',
  'Health & Fitness': '💪',
  'Utilities': '🏠',
  'Auto Payment': '🚗',
  'Travel & Vacation': '✈️',
  'Auto Maintenance': '🔧',
  'Gas': '⛽',
  'Clothing': '👕',
  'Phone': '📱',
  'Internet & Cable': '📡',
  'Home Improvement': '🔨',
  'Furniture & Housewares': '🪑',
}

function Reports() {
  const [activeTab, setActiveTab] = useState('spending')
  const [cashFlowData, setCashFlowData] = useState(null)
  const [spendingData, setSpendingData] = useState(null)
  const [incomeData, setIncomeData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dateRange, setDateRange] = useState('all')
  const [spendingView, setSpendingView] = useState('donut')
  const [spendingChartType, setSpendingChartType] = useState('totals')
  const [spendingGroupBy, setSpendingGroupBy] = useState('category')
  const [showSpendingGroupBy, setShowSpendingGroupBy] = useState(false)
  const [showDateOptions, setShowDateOptions] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [activeFilters, setActiveFilters] = useState({})
  const [filterTags, setFilterTags] = useState([])
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [cashFlowChartType, setCashFlowChartType] = useState('sankey')
  const [cashFlowGroupBy, setCashFlowGroupBy] = useState('category')
  const [showCashFlowGroupBy, setShowCashFlowGroupBy] = useState(false)

  useEffect(() => {
    loadData()
  }, [dateRange, activeFilters])

  const getDateParams = () => {
    const now = new Date()
    const params = {}
    if (dateRange === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      params.start_date = start.toISOString().split('T')[0]
      params.end_date = now.toISOString().split('T')[0]
    } else if (dateRange === '3months') {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
      params.start_date = start.toISOString().split('T')[0]
    } else if (dateRange === '6months') {
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1)
      params.start_date = start.toISOString().split('T')[0]
    } else if (dateRange === 'year') {
      const start = new Date(now.getFullYear(), 0, 1)
      params.start_date = start.toISOString().split('T')[0]
    }
    return params
  }

  const loadData = async () => {
    setError(null)
    setLoading(true)
    try {
      const params = getDateParams()
      if (activeFilters.categories?.length) params.categories = activeFilters.categories.join(',')
      if (activeFilters.merchants?.length) params.merchants = activeFilters.merchants.join(',')
      if (activeFilters.accounts?.length) params.accounts = activeFilters.accounts.join(',')
      if (activeFilters.tags?.length) params.tags = activeFilters.tags.join(',')
      if (activeFilters.goals?.length) params.goals = activeFilters.goals.join(',')
      if (activeFilters.owners?.length) params.owners = activeFilters.owners.join(',')
      if (activeFilters.amount) {
        if (activeFilters.amount.min) params.min_amount = activeFilters.amount.min
        if (activeFilters.amount.max) params.max_amount = activeFilters.amount.max
      }
      const [cf, sp, inc] = await Promise.all([
        api.getCashFlow(params),
        api.getSpendingReport(params),
        api.getIncomeReport(params)
      ])
      setCashFlowData(cf)
      setSpendingData(sp)
      setIncomeData(inc)
    } catch (err) {
      console.error('Failed to load reports:', err)
      setError(err.message || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const dateLabel = () => {
    const labels = { all: 'All time', month: 'This month', '3months': 'Last 3 months', '6months': 'Last 6 months', year: 'This year' }
    return labels[dateRange] || 'All time'
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
  }

  const handleFilterApply = (filters) => {
    setActiveFilters(filters)
    const tags = []
    if (filters.categories?.length) filters.categories.forEach(c => tags.push({ type: 'categories', label: c }))
    if (filters.merchants?.length) filters.merchants.forEach(m => tags.push({ type: 'merchants', label: m }))
    if (filters.accounts?.length) filters.accounts.forEach(a => tags.push({ type: 'accounts', label: `Account #${a}` }))
    if (filters.tags?.length) filters.tags.forEach(t => tags.push({ type: 'tags', label: t }))
    if (filters.goals?.length) filters.goals.forEach(g => tags.push({ type: 'goals', label: `Goal #${g}` }))
    if (filters.owners?.length) filters.owners.forEach(o => tags.push({ type: 'owners', label: o }))
    if (filters.amount) {
      if (filters.amount.min) tags.push({ type: 'amount', label: `Min $${filters.amount.min}` })
      if (filters.amount.max) tags.push({ type: 'amount', label: `Max $${filters.amount.max}` })
    }
    setFilterTags(tags)
  }

  const removeFilterTag = (tag) => {
    const newFilters = { ...activeFilters }
    if (tag.type === 'amount') {
      delete newFilters.amount
    } else if (newFilters[tag.type]) {
      newFilters[tag.type] = newFilters[tag.type].filter(i => i !== tag.label)
      if (newFilters[tag.type].length === 0) delete newFilters[tag.type]
    }
    setActiveFilters(newFilters)
    setFilterTags(filterTags.filter(t => t !== tag))
  }

  const tabs = [
    { id: 'cashflow', label: 'Cash Flow' },
    { id: 'spending', label: 'Spending' },
    { id: 'income', label: 'Income' },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-dark)' }}>
      {/* Top Navigation Bar */}
      <div className="px-6 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center space-x-8">
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Reports</h1>
          <div className="flex items-center space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-3 py-1.5 text-sm font-medium transition-colors relative"
                style={{
                  color: activeTab === tab.id ? '#f97316' : 'var(--text-secondary)',
                }}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: '#f97316' }} />
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <button
              onClick={() => setShowDateOptions(!showDateOptions)}
              className="flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg text-sm"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-card)' }}
            >
              <Calendar size={14} />
              <span>{dateLabel()}</span>
              <ChevronDown size={12} />
            </button>
            {showDateOptions && (
              <div className="absolute right-0 top-full mt-1 w-40 border rounded-lg shadow-lg z-20" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                {[{ id: 'all', label: 'All time' }, { id: 'month', label: 'This month' }, { id: '3months', label: 'Last 3 months' }, { id: '6months', label: 'Last 6 months' }, { id: 'year', label: 'This year' }].map((opt) => (
                  <button key={opt.id} onClick={() => { setDateRange(opt.id); setShowDateOptions(false) }} className="w-full text-left px-3 py-2 text-sm" style={{ color: dateRange === opt.id ? '#f97316' : 'var(--text-primary)', backgroundColor: dateRange === opt.id ? 'rgba(249, 115, 22, 0.1)' : 'transparent' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setShowFilterModal(true)} className="flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-card)' }}>
            <Filter size={14} />
            <span>Filters</span>
          </button>
          <button className="flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-card)' }}>
            <Download size={14} />
            <span>Reports</span>
          </button>
          <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm text-white" style={{ backgroundColor: '#ef4444' }}>
            <Save size={14} />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Filter Tags */}
      {filterTags.length > 0 && (
        <div className="px-6 py-2 flex items-center flex-wrap gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
          {filterTags.map((tag, i) => (
            <span key={i} className="flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
              <span>{tag.label}</span>
              <button onClick={() => removeFilterTag(tag)} className="hover:opacity-70"><X size={12} /></button>
            </span>
          ))}
          <button onClick={() => { setActiveFilters({}); setFilterTags([]) }} className="text-xs font-medium hover:opacity-70" style={{ color: '#6366f1' }}>Clear all</button>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading reports...</div>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-border bg-bg-card p-8 text-center text-text-secondary">
            <p className="text-base font-semibold text-text-primary">Unable to load reports</p>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        ) : (
          <>
            {activeTab === 'cashflow' && (
              <CashFlowTab data={cashFlowData} formatCurrency={formatCurrency} chartType={cashFlowChartType} setChartType={setCashFlowChartType} groupBy={cashFlowGroupBy} setGroupBy={setCashFlowGroupBy} showGroupBy={showCashFlowGroupBy} setShowGroupBy={setShowCashFlowGroupBy} />
            )}
            {activeTab === 'spending' && (
              <SpendingTab data={spendingData} formatCurrency={formatCurrency} view={spendingView} setView={setSpendingView} chartType={spendingChartType} setChartType={setSpendingChartType} groupBy={spendingGroupBy} setGroupBy={setSpendingGroupBy} showGroupBy={showSpendingGroupBy} setShowGroupBy={setShowSpendingGroupBy} showAllCategories={showAllCategories} setShowAllCategories={setShowAllCategories} />
            )}
            {activeTab === 'income' && (
              <IncomeTab data={incomeData} formatCurrency={formatCurrency} />
            )}
          </>
        )}
      </div>

      <ReportFilter isOpen={showFilterModal} onClose={() => setShowFilterModal(false)} onApply={handleFilterApply} activeFilters={activeFilters} />
    </div>
  )
}

function CashFlowTab({ data, formatCurrency, chartType, setChartType, groupBy, setGroupBy, showGroupBy, setShowGroupBy }) {
  if (!data || !data.summary) {
    return (
      <div className="rounded-3xl border border-border bg-bg-card p-8 text-center text-text-secondary">
        Report data is unavailable. Please refresh or try a different date range.
      </div>
    )
  }

  const { summary, incomeBySource = [], expensesByCategory = [], monthlyCashFlow = [] } = data
  const totalAll = (Number(summary.totalIncome) || 0) + (Number(summary.totalExpenses) || 0)
  const allIncome = incomeBySource.reduce((s, x) => s + (Number(x.amount) || 0), 0)
  const recentPeriods = monthlyCashFlow.slice(-6)
  const maxNet = Math.max(...recentPeriods.map((item) => Math.abs(Number(item.net_income) || 0)), 1)
  const topIncome = incomeBySource[0] || { name: 'N/A', amount: 0 }
  const topExpense = expensesByCategory[0] || { name: 'N/A', amount: 0 }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-bg-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">Reports / Cash Flow</p>
            <h2 className="mt-3 text-2xl font-semibold text-text-primary">Cash flow performance</h2>
            <p className="mt-2 text-sm text-text-secondary">Monitor revenue, expenses, and savings in a single interactive report.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-2xl border border-border bg-bg-dark px-4 py-2 text-sm text-text-secondary transition hover:border-primary hover:text-primary">
              <Calendar size={14} /> All time
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl border border-border bg-bg-dark px-4 py-2 text-sm text-text-secondary transition hover:border-primary hover:text-primary">
              <Filter size={14} /> Filters
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark">
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <SummaryCard label="Total income" value={formatCurrency(summary.totalIncome)} color="#10b981" />
          <SummaryCard label="Total expenses" value={formatCurrency(summary.totalExpenses)} color="#ef4444" />
          <SummaryCard label="Net income" value={formatCurrency(summary.netIncome)} color="var(--text-primary)" />
          <SummaryCard label="Savings rate" value={`${summary.savingsRate}%`} color="var(--text-primary)" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-6">
        <div className="rounded-3xl border border-border bg-bg-card overflow-hidden">
          <div className="px-6 py-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-border">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Cash Flow</p>
              <h3 className="mt-2 text-xl font-semibold text-text-primary">Revenue & expense flow</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {['sankey', 'bar', 'stacked'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setChartType(mode)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${chartType === mode ? 'bg-primary text-white' : 'border border-border bg-bg-dark text-text-secondary hover:border-primary hover:text-primary'}`}
                >
                  {mode === 'sankey' ? 'Sankey' : mode === 'bar' ? 'Bar' : 'Stacked'}
                </button>
              ))}
              <div className="relative">
                <button onClick={() => setShowGroupBy(!showGroupBy)} className="inline-flex items-center gap-2 rounded-2xl border border-border bg-bg-dark px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-primary hover:text-primary">
                  By {groupBy}
                  <ChevronDown size={14} />
                </button>
                {showGroupBy && (
                  <div className="absolute right-0 top-full mt-3 w-44 overflow-hidden rounded-3xl border border-border bg-bg-card shadow-xl">
                    {['category', 'account'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => { setGroupBy(opt); setShowGroupBy(false) }}
                        className={`w-full px-4 py-3 text-left text-sm ${groupBy === opt ? 'bg-primary text-white' : 'text-text-primary'}`}
                      >
                        By {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 bg-bg-dark">
            <div className="rounded-[32px] border border-white/10 bg-[#0f172a] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-text-secondary">Last 6 months</p>
                  <h4 className="mt-2 text-xl font-semibold text-white">Cash flow momentum</h4>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm">
                    <p className="text-text-secondary">Current period</p>
                    <p className="mt-2 text-lg font-semibold text-white">{recentPeriods.length > 0 ? recentPeriods[recentPeriods.length - 1].month_label || recentPeriods[recentPeriods.length - 1].month : 'N/A'}</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm">
                    <p className="text-text-secondary">Net flow</p>
                    <p className={`mt-2 text-lg font-semibold ${summary.netIncome >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(summary.netIncome)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-text-secondary">Income sources</p>
                  <div className="mt-3 space-y-3">
                    {incomeBySource.slice(0, 4).map((src, i) => (
                      <div key={src.name} className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">{src.name}</p>
                          <p className="text-xs text-text-secondary">{((src.amount / totalAll) * 100).toFixed(1)}%</p>
                        </div>
                        <p className="text-sm font-semibold text-text-primary">{formatCurrency(src.amount)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-text-secondary">Expense categories</p>
                  <div className="mt-3 space-y-3">
                    {expensesByCategory.slice(0, 4).map((cat, i) => (
                      <div key={cat.name} className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">{cat.name}</p>
                          <p className="text-xs text-text-secondary">{((cat.amount / totalAll) * 100).toFixed(1)}%</p>
                        </div>
                        <p className="text-sm font-semibold text-text-primary">{formatCurrency(cat.amount)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="grid grid-cols-6 gap-3">
                  {recentPeriods.map((item) => {
                    const value = Number(item.net_income) || 0
                    return (
                      <div key={item.month || item.month_label} className="flex flex-col items-center gap-2">
                        <div className="w-full h-40 rounded-3xl bg-white/10 relative overflow-hidden">
                          <div className="absolute bottom-0 left-0 right-0 rounded-b-3xl" style={{ height: `${Math.min(100, (Math.abs(value) / maxNet) * 100)}%`, backgroundColor: value >= 0 ? '#10b981' : '#ef4444' }} />
                        </div>
                        <p className="text-xs text-text-secondary">{item.month_label || item.month}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-border bg-bg-dark p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Snapshot</p>
                <h4 className="mt-2 text-lg font-semibold text-text-primary">Quick insights</h4>
              </div>
              <span className={`text-sm font-semibold ${summary.netIncome >= 0 ? 'text-success' : 'text-danger'}`}>{summary.netIncome >= 0 ? 'Positive' : 'Negative'}</span>
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl bg-bg-card p-4">
                <p className="text-xs text-text-secondary">Latest period</p>
                <p className="mt-2 text-lg font-semibold text-text-primary">{recentPeriods.length > 0 ? recentPeriods[recentPeriods.length - 1].month_label || recentPeriods[recentPeriods.length - 1].month : 'N/A'}</p>
              </div>
              <div className="rounded-3xl bg-bg-card p-4">
                <p className="text-xs text-text-secondary">Top income</p>
                <p className="mt-2 text-lg font-semibold text-text-primary">{topIncome.name}</p>
                <p className="text-sm text-text-secondary mt-1">{formatCurrency(topIncome.amount)}</p>
              </div>
              <div className="rounded-3xl bg-bg-card p-4">
                <p className="text-xs text-text-secondary">Top expense</p>
                <p className="mt-2 text-lg font-semibold text-text-primary">{topExpense.name}</p>
                <p className="text-sm text-text-secondary mt-1">{formatCurrency(topExpense.amount)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-bg-card p-6">
            <h4 className="text-lg font-semibold text-text-primary mb-4">Actions</h4>
            <button className="w-full rounded-2xl border border-border px-4 py-3 text-left text-sm font-semibold text-text-primary transition hover:bg-bg-dark">
              View detailed cash flow
            </button>
            <button className="w-full mt-3 rounded-2xl border border-border px-4 py-3 text-left text-sm font-semibold text-text-primary transition hover:bg-bg-dark">
              Compare period performance
            </button>
            <button className="w-full mt-3 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark">
              Create savings plan
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}

function SpendingTab({ data, formatCurrency, view, setView, chartType, setChartType, groupBy, setGroupBy, showGroupBy, setShowGroupBy, showAllCategories, setShowAllCategories }) {
  if (!data || !data.summary) {
    return (
      <div className="rounded-3xl border border-border bg-bg-card p-8 text-center text-text-secondary">
        <p className="text-base font-semibold text-text-primary">Spending data is unavailable</p>
        <p className="mt-2 text-sm">Try a different date range or refresh the report.</p>
      </div>
    )
  }
  const summary = data.summary || {}
  const spendingByCategory = data.spendingByCategory || []
  const monthlySpending = data.monthlySpending || []
  const recentTransactions = data.recentTransactions || []
  const allMonths = [...new Set(monthlySpending.map(m => m.month))].sort()
  const allCategories = Array.from(new Set(monthlySpending.map(m => m.category)))

  const monthlyTotals = allMonths.map(month => {
    const entries = monthlySpending.filter(m => m.month === month)
    const monthLabel = entries[0]?.month_label || month
    const total = entries.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
    const categories = {}
    entries.forEach(e => { categories[e.category] = parseFloat(e.amount || 0) })
    return { month: monthLabel, total, categories }
  })

  const avgMonthly = monthlyTotals.length > 0 ? monthlyTotals.reduce((sum, item) => sum + item.total, 0) / monthlyTotals.length : 0
  const maxMonthTotal = Math.max(...monthlyTotals.map(item => item.total), 1)

  const monthlyChanges = monthlyTotals.map((item, index) => {
    if (index === 0) return { ...item, change: 0 }
    const previous = monthlyTotals[index - 1].total || 0
    const change = previous === 0 ? 0 : ((item.total - previous) / previous) * 100
    return { ...item, change }
  })

  const maxAbsChange = Math.max(...monthlyChanges.map(item => Math.abs(item.change)), 10)
  const monthlyDataForChart = chartType === 'change' ? monthlyChanges : monthlyTotals
  const yAxisMax = chartType === 'change' ? maxAbsChange : maxMonthTotal
  const yAxisValues = [yAxisMax, yAxisMax * 0.75, yAxisMax * 0.5, yAxisMax * 0.25, 0]
  const displayedCategories = showAllCategories ? spendingByCategory : spendingByCategory.slice(0, 12)

  return (
    <div>
      {/* Chart Section */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>SPENDING BY CATEGORY</p>
            <p className="text-xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>All time</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <button onClick={() => setShowGroupBy(!showGroupBy)} className="flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                <span>By {groupBy}</span>
                <ChevronDown size={12} />
              </button>
              {showGroupBy && (
                <div className="absolute right-0 top-full mt-1 w-36 border rounded-lg shadow-lg z-20" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  {['category', 'account'].map((opt) => (
                    <button key={opt} onClick={() => { setGroupBy(opt); setShowGroupBy(false) }} className="w-full text-left px-3 py-2 text-sm capitalize" style={{ color: groupBy === opt ? '#f97316' : 'var(--text-primary)', backgroundColor: groupBy === opt ? 'rgba(249, 115, 22, 0.1)' : 'transparent' }}>
                      By {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center border rounded-lg overflow-hidden text-xs" style={{ borderColor: 'var(--border)' }}>
              <button onClick={() => setChartType('totals')} className="px-3 py-1.5 font-medium" style={{ backgroundColor: chartType === 'totals' ? 'var(--bg-dark)' : 'transparent', color: 'var(--text-primary)' }}>Totals</button>
              <button onClick={() => setChartType('change')} className="px-3 py-1.5 font-medium" style={{ backgroundColor: chartType === 'change' ? 'var(--bg-dark)' : 'transparent', color: 'var(--text-primary)' }}>Change</button>
            </div>
            <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              {[
                { id: 'donut', icon: PieChart },
                { id: 'bar', icon: BarChart3 },
                { id: 'stacked', icon: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="8" width="3" height="7" rx="1" fill="currentColor" opacity="0.3"/><rect x="1" y="4" width="3" height="4" rx="1" fill="currentColor" opacity="0.6"/><rect x="6" y="5" width="3" height="10" rx="1" fill="currentColor" opacity="0.3"/><rect x="6" y="2" width="3" height="3" rx="1" fill="currentColor" opacity="0.6"/><rect x="11" y="7" width="3" height="8" rx="1" fill="currentColor" opacity="0.3"/><rect x="11" y="3" width="3" height="4" rx="1" fill="currentColor" opacity="0.6"/></svg> },
              ].map((btn) => (
                <button key={btn.id} onClick={() => setView(btn.id)} className="px-2.5 py-1.5" style={{ backgroundColor: view === btn.id ? 'rgba(249, 115, 22, 0.1)' : 'transparent', color: view === btn.id ? '#f97316' : 'var(--text-secondary)' }}>
                  {btn.icon === PieChart || btn.icon === BarChart3 ? <btn.icon size={16} /> : <btn.icon />}
                </button>
              ))}
            </div>
            <button className="p-1.5 border rounded-lg" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              <Download size={16} />
            </button>
          </div>
        </div>

        {view === 'donut' ? (
          <div className="px-6 pb-6 flex items-center">
            <div className="flex-shrink-0" style={{ width: '380px', height: '380px' }}>
              <DonutChart data={spendingByCategory} total={summary.totalSpending} formatCurrency={formatCurrency} />
            </div>
            <div className="flex-1 pl-8">
              <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                {displayedCategories.map((cat, i) => {
                  const color = CATEGORY_COLORS[cat.name] || COLORS[i % COLORS.length]
                  const icon = CATEGORY_ICONS[cat.name]
                  return (
                    <div key={cat.name} className="flex items-start space-x-2">
                      <div className="w-3 h-3 rounded-sm flex-shrink-0 mt-0.5" style={{ backgroundColor: color }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {icon && <span className="mr-1">{icon}</span>}
                          {cat.name}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {formatCurrency(cat.amount)} ({cat.percentage}%)
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
              {spendingByCategory.length > 12 && (
                <button onClick={() => setShowAllCategories(!showAllCategories)} className="text-sm mt-4 hover:underline" style={{ color: '#f97316' }}>
                  {showAllCategories ? 'Show less' : 'Show all categories'} {showAllCategories ? '▲' : '▼'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="px-6 pb-6">
            <div className="relative" style={{ height: '340px' }}>
              <div className="absolute left-0 top-0 bottom-6 w-16 flex flex-col justify-between text-right pr-2">
                {yAxisValues.map((val, i) => (
                  <span key={i} className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {chartType === 'change' ? `${val >= 0 ? '+' : ''}${Math.round(val)}%` : formatCurrency(val)}
                  </span>
                ))}
              </div>
              <div className="absolute left-16 right-0 top-0 bottom-6">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="absolute left-0 right-0 border-t" style={{ top: `${(i / 4) * 100}%`, borderColor: 'var(--border)', opacity: 0.5 }} />
                ))}
              </div>
              <div className="absolute left-16 right-0 border-t-2 border-dashed" style={{ top: `${(1 - avgMonthly / maxMonthTotal) * 100}%`, borderColor: '#f97316', opacity: 0.5 }}>
                <div className="absolute right-0 -top-5 px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: '#f97316', color: 'white' }}>
                  Average {formatCurrency(avgMonthly)}
                </div>
              </div>
              <div className="absolute left-16 right-0 top-0 bottom-6 flex items-end">
                {monthlyDataForChart.map((data, i) => {
                  const barHeight = chartType === 'change'
                    ? maxAbsChange > 0 ? (Math.abs(data.change) / maxAbsChange) * 100 : 0
                    : maxMonthTotal > 0 ? (data.total / maxMonthTotal) * 100 : 0

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center px-0.5">
                      <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                        {chartType === 'change'
                          ? `${data.change >= 0 ? '+' : ''}${Math.round(data.change)}%`
                          : formatCurrency(data.total)}
                      </div>
                      <div className="w-full relative" style={{ height: '220px' }}>
                        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-end justify-end"
                             style={{ height: '100%' }}>
                          {chartType === 'change' ? (
                            <div style={{ width: '100%', height: `${barHeight}%`, backgroundColor: data.change >= 0 ? '#22c55e' : '#ef4444', opacity: 0.85 }} />
                          ) : (
                            <div className="absolute bottom-0 left-0 right-0 flex flex-col">
                              {[...allCategories].sort((a, b) => (data.categories[b] || 0) - (data.categories[a] || 0)).map((cat, ci) => {
                                const val = data.categories[cat] || 0
                                const barH = maxMonthTotal > 0 ? (val / maxMonthTotal) * 220 : 0
                                const color = CATEGORY_COLORS[cat] || COLORS[ci % COLORS.length]
                                if (barH < 0.5) return null
                                return <div key={cat} style={{ height: `${barH}px`, backgroundColor: color, opacity: 0.85 }} />
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{data.month}</div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              {allCategories.map((cat, i) => {
                const color = CATEGORY_COLORS[cat] || COLORS[i % COLORS.length]
                const icon = CATEGORY_ICONS[cat]
                return (
                  <div key={cat} className="flex items-center space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{icon && <span className="mr-0.5">{icon}</span>}{cat}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Filter Tags Row */}
      {/* Transactions + Summary */}
      <div className="mt-4 grid grid-cols-3 gap-6">
        <div className="col-span-2 rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Transactions</h3>
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-1 px-2.5 py-1 border rounded text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                <span>✓</span><span>Edit multiple</span>
              </button>
              <button className="flex items-center space-x-1 px-2.5 py-1 border rounded text-xs relative" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                <span>Sort</span><ChevronDown size={10} />
                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ backgroundColor: '#f97316' }} />
              </button>
              <button className="flex items-center space-x-1 px-2.5 py-1 border rounded text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                <Settings2 size={10} /><span>Columns</span>
              </button>
            </div>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {recentTransactions.slice(0, 10).map((tx) => {
              const icon = CATEGORY_ICONS[tx.category]
              return (
                <div key={tx.id} className="flex items-center px-4 py-3 cursor-pointer" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="flex-1 flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: CATEGORY_COLORS[tx.category] + '20' }}>
                      {icon || '•'}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{tx.merchant}</p>
                      <div className="flex items-center space-x-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span>{tx.category}</span>
                        <span>·</span>
                        <span>{tx.account_name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(Math.abs(tx.amount))}</span>
                    <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total transactions</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{summary.totalTransactions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Largest transaction</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(summary.largestTransaction)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Average transaction</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(summary.avgTransaction)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total spending</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(summary.totalSpending)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function IncomeTab({ data, formatCurrency }) {
  if (!data || !data.summary) {
    return (
      <div className="rounded-3xl border border-border bg-bg-card p-8 text-center text-text-secondary">
        <p className="text-base font-semibold text-text-primary">Income data is unavailable</p>
        <p className="mt-2 text-sm">Try a different date range or refresh the report.</p>
      </div>
    )
  }
  const { summary, incomeBySource, monthlyIncome } = data
  const allMonths = [...new Set(monthlyIncome.map(m => m.month))].sort()

  const monthlyDataForChart = allMonths.map(month => {
    const entries = monthlyIncome.filter(m => m.month === month)
    const monthLabel = entries[0]?.month_label || month
    const total = entries.reduce((s, e) => s + parseFloat(e.amount), 0)
    const categories = {}
    entries.forEach(e => { categories[e.category] = parseFloat(e.amount) })
    return { month: monthLabel, total, categories }
  })
  const maxMonthTotal = Math.max(...monthlyDataForChart.map(m => m.total), 1)
  const allCategories = [...new Set(monthlyIncome.map(m => m.category))]

  return (
    <div>
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>INCOME BY MONTH</p>
            <p className="text-xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>All time</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="p-1.5 border rounded-lg" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              <Download size={16} />
            </button>
          </div>
        </div>
        <div className="px-6 pb-6">
          <div className="relative" style={{ height: '340px' }}>
            <div className="absolute left-0 top-0 bottom-6 w-16 flex flex-col justify-between text-right pr-2">
              {[maxMonthTotal, maxMonthTotal * 0.75, maxMonthTotal * 0.5, maxMonthTotal * 0.25, 0].map((val, i) => (
                <span key={i} className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatCurrency(val)}</span>
              ))}
            </div>
            <div className="absolute left-16 right-0 top-0 bottom-6">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="absolute left-0 right-0 border-t" style={{ top: `${(i / 4) * 100}%`, borderColor: 'var(--border)', opacity: 0.5 }} />
              ))}
            </div>
            <div className="absolute left-16 right-0 top-0 bottom-6 flex items-end">
              {monthlyDataForChart.map((data, i) => {
                const height = maxMonthTotal > 0 ? (data.total / maxMonthTotal) * 100 : 0
                const sortedCats = allCategories.sort((a, b) => (data.categories[b] || 0) - (data.categories[a] || 0))
                return (
                  <div key={i} className="flex-1 flex flex-col items-center px-0.5">
                    <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{formatCurrency(data.total)}</div>
                    <div className="w-full relative" style={{ height: '220px' }}>
                      <div className="absolute bottom-0 left-0 right-0 flex flex-col">
                        {sortedCats.map((cat, ci) => {
                          const val = data.categories[cat] || 0
                          const barH = maxMonthTotal > 0 ? (val / maxMonthTotal) * 220 : 0
                          const color = CATEGORY_COLORS[cat] || COLORS[ci % COLORS.length]
                          if (barH < 0.5) return null
                          return <div key={cat} style={{ height: `${barH}px`, backgroundColor: color, opacity: 0.85 }} />
                        })}
                      </div>
                    </div>
                    <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{data.month}</div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
            {allCategories.map((cat, i) => {
              const color = CATEGORY_COLORS[cat] || COLORS[i % COLORS.length]
              return (
                <div key={cat} className="flex items-center space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{cat}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Income by Source</h3>
          <div className="space-y-3">
            {incomeBySource.map((src, i) => {
              const color = CATEGORY_COLORS[src.name] || COLORS[i % COLORS.length]
              return (
                <div key={src.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{src.name}</span>
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(src.amount)}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-dark)' }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${src.percentage}%`, backgroundColor: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Income Stats</h3>
          <div className="space-y-4">
            {[
              ['Total income', formatCurrency(summary.totalIncome)],
              ['Number of sources', incomeBySource.length],
              ['Average per source', formatCurrency(incomeBySource.length > 0 ? summary.totalIncome / incomeBySource.length : 0)],
              ['Largest source', incomeBySource.length > 0 ? incomeBySource[0].name : '-'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, color }) {
  return (
    <div className="rounded-xl p-5 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs font-semibold tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  )
}

function DonutChart({ data, total, formatCurrency }) {
  const size = 340
  const strokeWidth = 65
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  let cumulativePercent = 0

  const hasSlices = data && data.length > 0 && total > 0
  const donutData = hasSlices ? data : [{ name: 'No spending', percentage: 100 }]

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {donutData.map((cat, i) => {
          const color = CATEGORY_COLORS[cat.name] || COLORS[i % COLORS.length]
          const percent = cat.percentage / 100
          const dashArray = circumference * percent
          const dashOffset = circumference * (1 - cumulativePercent)
          cumulativePercent += percent
          return (
            <circle
              key={cat.name}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashArray} ${circumference - dashArray}`}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(total)}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total</p>
      </div>
    </div>
  )
}

export default Reports

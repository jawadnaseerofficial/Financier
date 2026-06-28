import { useState, useEffect, useRef } from 'react'
import { api } from '../utils/api'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  ChevronDown,
  Info,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#0ea5e9', '#14b8a6', '#ef4444', '#64748b', '#a855f7', '#f97316', '#06b6d4']

function CashFlow() {
  const [selectedPeriod, setSelectedPeriod] = useState('This year')
  const [showPeriod, setShowPeriod] = useState(false)
  const [loading, setLoading] = useState(true)
  const [cashFlowData, setCashFlowData] = useState(null)

  useEffect(() => { loadData() }, [selectedPeriod])

  async function loadData() {
    setLoading(true)
    try {
      const now = new Date()
      let start_date
      if (selectedPeriod === 'This month') start_date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`
      else if (selectedPeriod === 'Last month') {
        const d = new Date(now.getFullYear(), now.getMonth()-1, 1)
        start_date = d.toISOString().split('T')[0]
      }
      else if (selectedPeriod === 'This year') start_date = `${now.getFullYear()}-01-01`
      else if (selectedPeriod === 'Last year') start_date = `${now.getFullYear()-1}-01-01`
      else start_date = '2020-01-01'

      const end_date = now.toISOString().split('T')[0]
      const data = await api.getCashFlow({ start_date, end_date })
      setCashFlowData(data)
    } catch (err) {
      console.error('Failed to load cash flow:', err)
    } finally {
      setLoading(false)
    }
  }

  const monthlyData = cashFlowData?.monthlyCashFlow?.map(m => ({
    month: m.month_label?.split(' ')[0] || m.month,
    income: parseFloat(m.income) || 0,
    expenses: parseFloat(m.expenses) || 0,
  })) || []

  const categoryBreakdown = (cashFlowData?.expensesByCategory || []).map((cat, i) => ({
    name: cat.name,
    amount: parseFloat(cat.amount) || 0,
    percentage: cat.percentage || 0,
    color: COLORS[i % COLORS.length],
  }))

  const incomeSources = (cashFlowData?.incomeBySource || []).map((src, i) => ({
    name: src.name,
    amount: parseFloat(src.amount) || 0,
    percentage: src.percentage || 0,
    color: COLORS[i % COLORS.length],
  }))

  const summary = cashFlowData?.summary || {}
  const totalIncome = summary.totalIncome || 0
  const totalExpenses = summary.totalExpenses || 0
  const netCashFlow = summary.netIncome || (totalIncome - totalExpenses)
  const savingsRate = summary.savingsRate || 0

  const currentMonth = monthlyData[monthlyData.length - 1] || { income: 0, expenses: 0 }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Cash Flow</h1>
          <div className="relative">
            <button onClick={() => setShowPeriod(!showPeriod)} className="flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              <span>{selectedPeriod}</span><ChevronDown size={14} />
            </button>
            {showPeriod && (
              <div className="absolute left-0 top-full mt-1 w-36 border rounded-lg shadow-lg z-10" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                {['This month', 'Last month', 'This year', 'Last year', 'All time'].map((p) => (
                  <button key={p} onClick={() => { setSelectedPeriod(p); setShowPeriod(false) }} className="w-full text-left px-3 py-2 text-sm" style={{ color: selectedPeriod === p ? '#6366f1' : 'var(--text-primary)', backgroundColor: selectedPeriod === p ? 'rgba(99, 102, 241, 0.1)' : 'transparent' }}>{p}</button>
                ))}
              </div>
            )}
          </div>
        </div>
        <button className="flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg text-sm hover:opacity-80" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          <Download size={14} /><span>Export</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="border rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total Income</p>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><TrendingUp size={20} className="text-primary" /></div>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <div className="flex items-center space-x-1 mt-1">
            <ArrowUpRight size={14} className="text-success" />
            <span className="text-xs text-success">+8.2% vs last year</span>
          </div>
        </div>
        <div className="border rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total Expenses</p>
            <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center"><TrendingDown size={20} className="text-danger" /></div>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <div className="flex items-center space-x-1 mt-1">
            <ArrowUpRight size={14} className="text-danger" />
            <span className="text-xs text-danger">+3.4% vs last year</span>
          </div>
        </div>
        <div className="border rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Net Cash Flow</p>
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center"><DollarSign size={20} className="text-success" /></div>
          </div>
          <p className="text-2xl font-bold text-success">+${netCashFlow.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <div className="flex items-center space-x-1 mt-1">
            <ArrowUpRight size={14} className="text-success" />
            <span className="text-xs text-success">Savings rate: {savingsRate}%</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2/3 - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Monthly Income vs Expenses Bar Chart */}
          <BarChartCard monthlyData={monthlyData} />

          {/* Cash Flow Flow Diagram */}
          <div className="border rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Where Your Money Goes
            </h2>

            <div className="flex items-start space-x-4">
              {/* Income Sources (Left) */}
              <div className="flex-1 space-y-2">
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>INCOME</p>
                {incomeSources.map((source) => (
                  <div
                    key={source.name}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg"
                    style={{ backgroundColor: source.color + '15' }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: source.color }} />
                    <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{source.name}</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      ${source.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Flow arrows (Center) */}
              <div className="flex flex-col items-center justify-center pt-8">
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  ↓
                </div>
              </div>

              {/* Expense Categories (Right) */}
              <div className="flex-1 space-y-2">
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>EXPENSES</p>
                {categoryBreakdown.map((cat) => (
                  <div
                    key={cat.name}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg"
                    style={{ backgroundColor: cat.color + '15' }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{cat.name}</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      ${cat.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1/3 - Details */}
        <div className="space-y-6">
          {/* Income Breakdown */}
          <div className="border rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Income</h3>
              <span className="text-sm font-medium text-success">
                +${currentMonth.income.toLocaleString()}
              </span>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>This month</p>

            <div className="space-y-3">
              {incomeSources.map((source) => (
                <div key={source.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: source.color }} />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{source.name}</span>
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      ${source.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-dark)' }}>
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${source.percentage}%`, backgroundColor: source.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="border rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Expenses</h3>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                ${currentMonth.expenses.toLocaleString()}
              </span>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>This month</p>

            <div className="space-y-3">
              {categoryBreakdown.map((cat) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{cat.name}</span>
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      ${cat.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-dark)' }}>
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Stats */}
          <div className="border rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Monthly Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Avg monthly income</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  ${monthlyData.length ? Math.round(totalIncome / monthlyData.length).toLocaleString() : '0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Avg monthly expenses</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  ${monthlyData.length ? Math.round(totalExpenses / monthlyData.length).toLocaleString() : '0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Savings rate</span>
                <span className="text-sm font-medium text-success">{savingsRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total transactions</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {(cashFlowData?.summary?.totalTransactions || 0).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <button className="w-full text-center text-sm font-medium text-primary hover:text-primary-light transition-colors">Download CSV</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BarChartCard({ monthlyData }) {
  const [hoveredBar, setHoveredBar] = useState(null)
  const [tooltip, setTooltip] = useState(null)
  const [visible, setVisible] = useState(false)
  const chartRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const maxVal = Math.max(...monthlyData.map((m) => Math.max(m.income, m.expenses)))
  const avgIncome = monthlyData.reduce((s, m) => s + m.income, 0) / monthlyData.length

  const chartHeight = 200
  const barAreaHeight = chartHeight - 20

  const handleMouseMove = (e, month) => {
    const rect = chartRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    setHoveredBar(month.month)
    setTooltip({
      x: x,
      income: month.income,
      expenses: month.expenses,
      net: month.income - month.expenses,
      month: month.month,
    })
  }

  const handleMouseLeave = () => {
    setHoveredBar(null)
    setTooltip(null)
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val)
  }

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(frac => {
    const val = maxVal * frac
    return { y: 20 + barAreaHeight * (1 - frac), label: val >= 1000 ? `$${(val / 1000).toFixed(1)}k` : `$${val.toFixed(0)}` }
  })

  return (
    <div className="border rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Monthly Income vs Expenses</h2>
        <button className="p-1 rounded hover:opacity-80" style={{ color: 'var(--text-muted)' }}><Info size={16} /></button>
      </div>

      <div className="relative" ref={chartRef}>
        {/* Y-axis grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          {yTicks.map((tick, i) => (
            <div key={i} className="absolute w-full flex items-center" style={{ top: `${(tick.y / chartHeight) * 100}%` }}>
              <div className="w-full" style={{ borderTop: '1px dashed var(--border)', opacity: 0.5 }} />
            </div>
          ))}
        </div>

        {/* Average income line */}
        <div
          className="absolute left-12 right-4 pointer-events-none"
          style={{
            top: `${(1 - avgIncome / maxVal) * barAreaHeight + 20}px`,
            borderTop: '2px dashed #6366f1',
            opacity: 0.4,
          }}
        >
          <span className="absolute -top-5 right-0 text-[10px] font-medium" style={{ color: '#6366f1', opacity: 0.7 }}>
            Avg {formatCurrency(avgIncome)}
          </span>
        </div>

        {/* Chart area */}
        <div className="flex items-end" style={{ height: `${chartHeight}px` }}>
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between pr-3" style={{ height: `${chartHeight}px`, minWidth: '48px' }}>
            {yTicks.reverse().map((tick, i) => (
              <span key={i} className="text-[10px]" style={{ color: 'var(--text-muted)', textAlign: 'right' }}>{tick.label}</span>
            ))}
          </div>

          {/* Bars */}
          <div className="flex-1 flex items-end justify-between px-2" style={{ height: `${chartHeight}px` }}>
            {monthlyData.map((month, idx) => {
              const incomeH = (month.income / maxVal) * barAreaHeight
              const expenseH = (month.expenses / maxVal) * barAreaHeight
              const isHovered = hoveredBar === month.month
              const savings = month.income - month.expenses

              return (
                <div
                  key={month.month}
                  className="flex flex-col items-center cursor-pointer group"
                  style={{ flex: 1, height: '100%', justifyContent: 'flex-end' }}
                  onMouseMove={(e) => handleMouseMove(e, month)}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Bars container */}
                  <div className="flex items-end justify-center gap-1" style={{ height: `${barAreaHeight}px` }}>
                    {/* Income bar */}
                    <div
                      className="relative transition-all duration-500 ease-out"
                      style={{
                        width: isHovered ? '22px' : '18px',
                        height: visible ? `${incomeH}px` : '0px',
                        borderRadius: '4px 4px 0 0',
                        opacity: isHovered ? 1 : 0.85,
                        transform: isHovered ? 'scaleY(1.02)' : 'scaleY(1)',
                        transformOrigin: 'bottom',
                      }}
                    >
                      <div
                        className="absolute inset-0 rounded-[4px_4px_0_0]"
                        style={{
                          background: 'linear-gradient(180deg, #818cf8 0%, #6366f1 50%, #4f46e5 100%)',
                          boxShadow: isHovered ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none',
                        }}
                      />
                    </div>

                    {/* Expense bar */}
                    <div
                      className="relative transition-all duration-500 ease-out"
                      style={{
                        width: isHovered ? '22px' : '18px',
                        height: visible ? `${expenseH}px` : '0px',
                        borderRadius: '4px 4px 0 0',
                        opacity: isHovered ? 1 : 0.85,
                        transform: isHovered ? 'scaleY(1.02)' : 'scaleY(1)',
                        transformOrigin: 'bottom',
                      }}
                    >
                      <div
                        className="absolute inset-0 rounded-[4px_4px_0_0]"
                        style={{
                          background: 'linear-gradient(180deg, #fca5a5 0%, #ef4444 50%, #dc2626 100%)',
                          boxShadow: isHovered ? '0 4px 12px rgba(239, 68, 68, 0.4)' : 'none',
                        }}
                      />
                    </div>
                  </div>

                  {/* Savings indicator */}
                  <div className="flex items-center justify-center mt-1.5" style={{ height: '14px' }}>
                    <div
                      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: savings >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        opacity: isHovered ? 1 : 0,
                        transform: isHovered ? 'scale(1)' : 'scale(0.8)',
                      }}
                    >
                      {savings >= 0 ? <ArrowUpRight size={8} style={{ color: '#10b981' }} /> : <ArrowDownRight size={8} style={{ color: '#ef4444' }} />}
                      <span className="text-[8px] font-semibold" style={{ color: savings >= 0 ? '#10b981' : '#ef4444' }}>
                        {formatCurrency(Math.abs(savings))}
                      </span>
                    </div>
                  </div>

                  {/* Month label */}
                  <span
                    className="text-xs mt-1 transition-colors duration-200"
                    style={{ color: isHovered ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: isHovered ? 600 : 400 }}
                  >
                    {month.month}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute pointer-events-none z-20 px-3 py-2 rounded-lg shadow-xl border"
            style={{
              left: `${Math.min(Math.max(tooltip.x, 80), (chartRef.current?.offsetWidth || 600) - 160)}px`,
              top: '-10px',
              transform: 'translateY(-100%)',
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
              minWidth: '140px',
            }}
          >
            <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>{tooltip.month}</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#6366f1' }} />
                  <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Income</span>
                </div>
                <span className="text-[11px] font-semibold" style={{ color: '#6366f1' }}>{formatCurrency(tooltip.income)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                  <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Expenses</span>
                </div>
                <span className="text-[11px] font-semibold" style={{ color: '#ef4444' }}>{formatCurrency(tooltip.expenses)}</span>
              </div>
              <div className="border-t pt-1 mt-1" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>Net</span>
                  <span className="text-[11px] font-bold" style={{ color: tooltip.net >= 0 ? '#10b981' : '#ef4444' }}>
                    {tooltip.net >= 0 ? '+' : ''}{formatCurrency(tooltip.net)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(180deg, #818cf8, #4f46e5)' }} />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Income</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(180deg, #fca5a5, #dc2626)' }} />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Expenses</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 border-t-2 border-dashed" style={{ borderColor: '#6366f1', opacity: 0.6 }} />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Avg Income</span>
        </div>
      </div>
    </div>
  )
}

export default CashFlow

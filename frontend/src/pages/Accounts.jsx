import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { CheckCircle2, AlertCircle, Clock, ChevronRight, MoreHorizontal, RefreshCw, ChevronDown, Filter, Edit3, Plus } from 'lucide-react'
import FilterPopover from '../components/ui/FilterPopover'

function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [summary, setSummary] = useState(null)
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeRange, setTimeRange] = useState('1 month')
  const [showTimeRange, setShowTimeRange] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadChart()
  }, [timeRange])

  async function loadData() {
    try {
      setLoading(true)
      const [accountsData, summaryData] = await Promise.all([
        api.getAccounts(),
        api.getAccountSummary()
      ])
      setAccounts(accountsData)
      setSummary(summaryData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadChart() {
    try {
      const rangeMap = { '1 month': '1month', '3 months': '3months', '6 months': '6months', '1 year': '1year' }
      const data = await api.getNetWorthHistory(rangeMap[timeRange] || '1month')
      setChartData(data.map(d => ({
        date: new Date(d.dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: parseFloat(d.net_worth) || 0,
      })))
    } catch (err) {
      console.error('Failed to load chart:', err)
    }
  }

  const groupedAccounts = accounts.reduce((acc, account) => {
    if (!acc[account.category]) {
      acc[account.category] = {
        name: getCategoryName(account.category),
        accounts: []
      }
    }
    acc[account.category].accounts.push(account)
    return acc
  }, {})

  function getCategoryName(category) {
    return { cash: 'Cash', credit: 'Credit Cards', loans: 'Loans' }[category] || category
  }

  function getCategoryTotal(categoryAccounts) {
    return categoryAccounts.reduce((sum, account) => sum + parseFloat(account.balance), 0)
  }

  // Calculate asset breakdown for summary
  const assetBreakdown = accounts
    .filter(a => parseFloat(a.balance) > 0)
    .reduce((acc, account) => {
      const type = account.type === 'checking' || account.type === 'savings' || account.type === 'business'
        ? 'Cash'
        : account.type === 'investment'
        ? 'Investments'
        : 'Other'
      acc[type] = (acc[type] || 0) + parseFloat(account.balance)
      return acc
    }, {})

  const totalAssets = Object.values(assetBreakdown).reduce((sum, val) => sum + val, 0)

  const assetColors = {
    'Investments': '#6366f1',
    'Real Estate': '#8b5cf6',
    'Cash': '#10b981',
    'Vehicles': '#f59e0b',
    'Other': '#6b7280',
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div style={{ color: 'var(--text-secondary)' }}>Loading accounts...</div>
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

  return (
    <div className="p-6">
      {/* Page Header with Actions */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Accounts</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg text-sm transition-colors hover:opacity-80"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <Filter size={14} />
            <span>Filters</span>
          </button>
          <button
            className="flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg text-sm transition-colors hover:opacity-80"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <Edit3 size={14} />
            <span>Edit owners</span>
          </button>
          <button
            onClick={loadData}
            className="flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg text-sm transition-colors hover:opacity-80"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <RefreshCw size={14} />
            <span>Refresh all</span>
          </button>
          <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors">
            <Plus size={14} />
            <span>Add account</span>
          </button>
        </div>
      </div>

      {/* Net Worth Chart Section */}
      <div className="border rounded-xl p-6 mb-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>NET WORTH</p>
            <div className="flex items-center space-x-3 mt-1">
              <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                ${(summary?.totalBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h2>
              <span className="text-success text-sm font-medium">↑ $30,366.69 (4.1%)</span>
              <span style={{ color: 'var(--text-muted)' }} className="text-sm">1 month change</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Net worth performance</span>
            <div className="relative">
              <button
                onClick={() => setShowTimeRange(!showTimeRange)}
                className="flex items-center space-x-1 px-3 py-1.5 border rounded-lg text-sm"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                <span>{timeRange}</span>
                <ChevronDown size={14} />
              </button>
              {showTimeRange && (
                <div
                  className="absolute right-0 top-full mt-1 w-32 border rounded-lg shadow-lg z-10"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                  {['1 week', '1 month', '3 months', '6 months', '1 year'].map((range) => (
                    <button
                      key={range}
                      onClick={() => { setTimeRange(range); setShowTimeRange(false) }}
                      className="w-full text-left px-3 py-2 text-sm hover:opacity-80"
                      style={{ color: timeRange === range ? '#6366f1' : 'var(--text-primary)' }}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line Chart */}
        {chartData.length > 0 && (() => {
          const values = chartData.map(d => d.value)
          const minVal = Math.min(...values)
          const maxVal = Math.max(...values)
          const range = maxVal - minVal || 1
          const padMin = minVal - range * 0.1
          const padMax = maxVal + range * 0.1
          const padRange = padMax - padMin || 1
          const chartLeft = 50
          const chartRight = 780
          const chartWidth = chartRight - chartLeft
          const chartTop = 10
          const chartBottom = 180
          const chartHeight = chartBottom - chartTop

          const getX = (i) => chartLeft + (i / (chartData.length - 1)) * chartWidth
          const getY = (val) => chartBottom - ((val - padMin) / padRange) * chartHeight

          const linePath = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.value)}`).join(' ')
          const areaPath = `${linePath} L ${getX(chartData.length - 1)} ${chartBottom} L ${getX(0)} ${chartBottom} Z`

          const yTicks = [0, 0.25, 0.5, 0.75, 1].map(pct => ({
            y: chartBottom - pct * chartHeight,
            value: padMin + pct * padRange,
          }))

          const xTickCount = Math.min(chartData.length, 8)
          const xStep = Math.max(1, Math.floor(chartData.length / xTickCount))
          const xLabels = chartData.filter((_, i) => i % xStep === 0 || i === chartData.length - 1)

          return (
            <div className="h-48 flex items-end">
              <svg viewBox="0 0 800 200" className="w-full h-full" preserveAspectRatio="none">
                {yTicks.map((tick, i) => (
                  <g key={i}>
                    <line x1={chartLeft} y1={tick.y} x2={chartRight} y2={tick.y} stroke="var(--border)" strokeWidth="1" strokeDasharray="4" />
                    <text x={chartLeft - 5} y={tick.y + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">
                      {Math.abs(tick.value) >= 1000 ? `$${(tick.value / 1000).toFixed(1)}K` : `$${tick.value.toFixed(0)}`}
                    </text>
                  </g>
                ))}
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#gradient)" opacity="0.3" />
                <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2" />
                {xLabels.map((d, i) => (
                  <text key={i} x={getX(chartData.indexOf(d))} y="198" fill="var(--text-muted)" fontSize="9" textAnchor="middle">
                    {d.date}
                  </text>
                ))}
              </svg>
            </div>
          )
        })()}
      </div>

      {/* Main Content: Accounts + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Categories - Left 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(groupedAccounts).map(([category, { name, accounts: categoryAccounts }]) => (
            <div key={category} className="border rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              {/* Category Header */}
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center space-x-3">
                  <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{name}</h2>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    ↓ ${Math.abs(getCategoryTotal(categoryAccounts)).toLocaleString('en-US', { minimumFractionDigits: 2 })} (-1.7%) 1 month change
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    ${Math.abs(getCategoryTotal(categoryAccounts)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <button style={{ color: 'var(--text-secondary)' }} className="hover:opacity-80">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
              </div>

              {/* Accounts List */}
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {categoryAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 cursor-pointer transition-colors"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'var(--bg-dark)' }}
                      >
                        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {account.institution.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{account.name}</p>
                          {account.sync_status === 'synced' && <CheckCircle2 size={14} className="text-success" />}
                          {account.sync_status === 'error' && <AlertCircle size={14} className="text-danger" />}
                          {account.sync_status === 'pending' && <Clock size={14} className="text-warning" />}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{account.institution}</p>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>•</span>
                          <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                            {account.type.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Mini sparkline */}
                      <svg width="60" height="24" viewBox="0 0 60 24">
                        <path
                          d={`M 0 ${12 + Math.random() * 8} Q 15 ${4 + Math.random() * 8} 30 ${10 + Math.random() * 8} T 60 ${8 + Math.random() * 8}`}
                          fill="none"
                          stroke={parseFloat(account.balance) >= 0 ? '#10b981' : '#ef4444'}
                          strokeWidth="1.5"
                        />
                      </svg>

                      <div className="text-right">
                        <p className={`text-sm font-semibold ${
                          parseFloat(account.balance) >= 0 ? '' : 'text-danger'
                        }`} style={{ color: parseFloat(account.balance) >= 0 ? 'var(--text-primary)' : undefined }}>
                          ${Math.abs(parseFloat(account.balance)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>6 months ago</p>
                      </div>
                      <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Panel - Right 1/3 */}
        <div className="space-y-6">
          <div className="border rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Summary</h3>
              <div className="flex items-center space-x-1">
                <button
                  className="px-3 py-1 text-sm rounded-lg font-medium"
                  style={{ backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }}
                >
                  Totals
                </button>
                <button
                  className="px-3 py-1 text-sm rounded-lg"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Percent
                </button>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Assets</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                ${totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Asset breakdown bar */}
            <div className="flex h-3 rounded-full overflow-hidden mb-4">
              {Object.entries(assetBreakdown).map(([type, value], i) => {
                const colors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#6b7280']
                return (
                  <div
                    key={type}
                    style={{
                      width: `${(value / totalAssets) * 100}%`,
                      backgroundColor: colors[i % colors.length],
                    }}
                  />
                )
              })}
            </div>

            {/* Legend */}
            <div className="space-y-2">
              {Object.entries(assetBreakdown).map(([type, value], i) => {
                const colors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#6b7280']
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: colors[i % colors.length] }}
                      />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{type}</span>
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      ${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Export CSV */}
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <button className="text-sm font-medium text-primary hover:text-primary-light transition-colors">
                Export CSV
              </button>
            </div>
          </div>

          {/* Liabilities Summary */}
          {(() => {
            const liabilities = accounts.filter(a => parseFloat(a.balance) < 0)
            const loans = liabilities.filter(a => a.type.includes('loan') || a.type === 'mortgage').reduce((s, a) => s + Math.abs(parseFloat(a.balance)), 0)
            const creditCards = liabilities.filter(a => a.type === 'credit').reduce((s, a) => s + Math.abs(parseFloat(a.balance)), 0)
            const totalLiab = loans + creditCards

            return (
              <div className="border rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Liabilities</h3>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {liabilities.length} accounts
                  </span>
                </div>
                <p className="text-2xl font-bold text-danger mb-4">
                  ${(summary?.totalLiabilities || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>

                {/* Liabilities breakdown bar */}
                <div className="flex h-3 rounded-full overflow-hidden mb-4">
                  {loans > 0 && (
                    <div
                      style={{
                        width: `${(loans / totalLiab) * 100}%`,
                        backgroundColor: '#f59e0b',
                      }}
                    />
                  )}
                  {creditCards > 0 && (
                    <div
                      style={{
                        width: `${(creditCards / totalLiab) * 100}%`,
                        backgroundColor: '#ef4444',
                      }}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  {loans > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loans</span>
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        ${loans.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  {creditCards > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Credit Cards</span>
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        ${creditCards.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Export CSV */}
                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                  <button className="text-sm font-medium text-primary hover:text-primary-light transition-colors">
                    Export CSV
                  </button>
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      {/* Filter Popover */}
      <FilterPopover
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={(filters) => console.log('Applied filters:', filters)}
      />
    </div>
  )
}

export default Accounts

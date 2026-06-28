import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import {
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  TrendingUp,
  Layers,
  Sparkles,
  LineChart,
} from 'lucide-react'

function InvestmentChart({ view, portfolioSeries, benchmarkSeries, allocationData, returnData }) {
  const [tooltip, setTooltip] = useState(null)
  const width = 780
  const height = 260
  const padding = 42

  const allValues = view === 'performance'
    ? [...portfolioSeries, ...benchmarkSeries].map((item) => item.value)
    : view === 'returns'
      ? returnData.map((item) => item.changePercent)
      : allocationData.map((item) => item.allocation * 100)

  const minValue = Math.min(...allValues)
  const maxValue = Math.max(...allValues)
  const range = maxValue - minValue || 1

  const pointToXY = (index, value) => {
    const x = padding + (index / (portfolioSeries.length - 1)) * (width - padding * 2)
    const y = height - padding - ((value - minValue) / range) * (height - padding * 2)
    return [x, y]
  }

  const linePath = (series) => {
    return series
      .map((item, index) => {
        const [x, y] = pointToXY(index, item.value)
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')
  }

  return (
    <div className="rounded-3xl border border-border bg-bg-dark dark:bg-black p-5 relative">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm text-text-secondary">Portfolio intelligence</p>
          <p className="text-base font-semibold text-white">Interactive performance view</p>
        </div>
        <div className="inline-flex flex-wrap items-center gap-3 text-xs text-text-secondary">
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" /> Portfolio
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-300" /> Benchmark
          </span>
        </div>
      </div>

      {view === 'performance' && (
        <div className="relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[260px]">
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="benchmarkGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3].map((row) => {
              const y = padding + ((height - padding * 2) / 4) * row
              return (
                <g key={row}>
                  <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(148, 163, 184, 0.2)" />
                </g>
              )
            })}
            <path
              d={`${linePath(portfolioSeries)} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`}
              fill="url(#portfolioGradient)"
              opacity="0.75"
            />
            <path
              d={`${linePath(benchmarkSeries)} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`}
              fill="url(#benchmarkGradient)"
              opacity="0.9"
            />
            <path d={linePath(portfolioSeries)} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
            <path d={linePath(benchmarkSeries)} fill="none" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" strokeDasharray="8 6" />
            {portfolioSeries.map((item, index) => {
              const [x, y] = pointToXY(index, item.value)
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r={4}
                  fill={tooltip?.index === index ? '#f97316' : '#fff'}
                  stroke="#f97316"
                  strokeWidth="2"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setTooltip({ index, label: item.label, value: item.value, type: 'Portfolio' })}
                  onMouseLeave={() => setTooltip(null)}
                />
              )
            })}
            {benchmarkSeries.map((item, index) => {
              const [x, y] = pointToXY(index, item.value)
              return (
                <circle
                  key={`benchmark-${index}`}
                  cx={x}
                  cy={y}
                  r={3}
                  fill="#60a5fa"
                  opacity="0.9"
                />
              )
            })}
          </svg>
          {tooltip && (
            <div className="pointer-events-none absolute left-6 top-8 rounded-2xl border border-border bg-bg-card p-3 text-xs shadow-xl" style={{ minWidth: '180px' }}>
              <p className="font-semibold text-text-primary">{tooltip.label}</p>
              <p className="mt-1 text-text-secondary">{tooltip.type}</p>
              <p className="mt-2 text-sm font-semibold text-white">${tooltip.value.toLocaleString()}</p>
            </div>
          )}
        </div>
      )}

      {view === 'allocation' && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {allocationData.map((item, index) => (
            <button
              key={item.name}
              type="button"
              className="group rounded-3xl border border-border bg-bg-card p-4 text-left transition hover:border-primary"
              onMouseEnter={() => setTooltip({ name: item.name, value: item.value, allocation: item.allocation })}
              onMouseLeave={() => setTooltip(null)}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-primary">{item.name}</p>
                <span className="text-xs text-text-secondary">{(item.allocation * 100).toFixed(1)}%</span>
              </div>
              <p className="mt-3 text-xl font-semibold text-white">{item.value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</p>
            </button>
          ))}
          {tooltip && (
            <div className="rounded-3xl border border-border bg-bg-dark p-4 text-sm text-text-secondary xl:col-span-3">
              <p className="font-semibold text-white">{tooltip.name}</p>
              <p className="mt-2">Allocation: {(tooltip.allocation * 100).toFixed(1)}%</p>
              <p>Value: {tooltip.value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</p>
            </div>
          )}
        </div>
      )}

      {view === 'returns' && (
        <div className="relative overflow-hidden rounded-3xl border border-border bg-bg-card p-5">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {returnData.map((item) => (
              <div
                key={item.name}
                className="rounded-3xl border border-border bg-bg-dark p-4 transition hover:border-primary"
                onMouseEnter={() => setTooltip(item)}
                onMouseLeave={() => setTooltip(null)}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-text-primary">{item.name}</p>
                  <p className={`text-sm font-semibold ${item.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
                    {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                  </p>
                </div>
                <p className="mt-3 text-xs text-text-secondary">Daily change: {item.changeValue >= 0 ? '+' : ''}{item.changeValue.toFixed(2)}</p>
              </div>
            ))}
          </div>
          {tooltip && (
            <div className="pointer-events-none absolute right-5 top-5 rounded-2xl border border-border bg-bg-card p-3 text-sm shadow-xl">
              <p className="font-semibold text-text-primary">{tooltip.name}</p>
              <p className="mt-1 text-text-secondary">{tooltip.changePercent >= 0 ? 'Positive' : 'Negative'} day</p>
              <p className="mt-2 font-semibold text-white">{tooltip.changePercent >= 0 ? '+' : ''}{tooltip.changePercent.toFixed(2)}%</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Investments() {
  const [investments, setInvestments] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('holdings')
  const [investmentChartView, setInvestmentChartView] = useState('performance')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [investmentsData, summaryData] = await Promise.all([
        api.getInvestments(),
        api.getInvestmentsSummary(),
      ])
      setInvestments(investmentsData)
      setSummary(summaryData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value || 0)
  }

  const formatPercent = (value) => {
    const number = Number(value) || 0
    return `${number >= 0 ? '+' : ''}${number.toFixed(2)}%`
  }

  const totalPortfolio = summary?.totalValue || 0
  const holdings = investments.map((item) => {
    const value = Number(item.total_value) || 0
    return {
      ...item,
      allocation: totalPortfolio ? value / totalPortfolio : 0,
      dayChange: Number(item.day_change) || 0,
      dayChangePercent: Number(item.day_change_percent) || 0,
      price: Number(item.current_price) || 0,
      shares: Number(item.shares) || 0,
    }
  })

  const portfolioSeries = Array.from({ length: 10 }, (_, index) => {
    const progress = index / 9
    const projectedStart = Math.max(0, totalPortfolio - (summary?.dayChange || 0) * 6)
    const pointValue = projectedStart + (totalPortfolio - projectedStart) * progress
    return {
      label: `${9 - index}d`,
      value: Number(pointValue.toFixed(2)),
    }
  })

  const benchmarkSeries = Array.from({ length: 10 }, (_, index) => {
    const progress = index / 9
    return {
      label: `${9 - index}d`,
      value: Number((totalPortfolio * (0.94 + 0.01 * progress)).toFixed(2)),
    }
  })

  const sortedByValue = [...holdings].sort((a, b) => b.total_value - a.total_value)
  const topHoldings = sortedByValue.slice(0, 5)
  const gainers = [...holdings].filter((item) => item.dayChange >= 0).sort((a, b) => b.dayChangePercent - a.dayChangePercent)
  const losers = [...holdings].filter((item) => item.dayChange < 0).sort((a, b) => a.dayChangePercent - b.dayChangePercent)
  const avgReturn = holdings.length ? holdings.reduce((sum, item) => sum + item.dayChangePercent, 0) / holdings.length : 0
  const winnersCount = gainers.length
  const losersCount = losers.length
  const totalGain = holdings.reduce((sum, item) => sum + item.dayChange, 0)
  const allocationData = topHoldings.map((item) => ({
    name: item.symbol,
    value: item.total_value,
    allocation: item.allocation,
  }))
  const returnData = topHoldings.map((item) => ({
    name: item.symbol,
    changePercent: item.dayChangePercent,
    changeValue: item.dayChange,
  }))

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading investments...</div>
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
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Investments</h1>
          <p className="text-text-secondary mt-1">Professional portfolio insights for your holdings.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="rounded-full border border-border bg-bg-card p-1 flex items-center gap-1">
            {['holdings', 'gains', 'analysis'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${activeTab === tab ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-bg-dark'}`}
              >
                {tab === 'holdings' ? 'Holdings' : tab === 'gains' ? 'Gains & Losses' : 'Analysis'}
              </button>
            ))}
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors">
            <Sparkles size={16} />
            + Add Investment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.9fr_1fr] gap-6">
        <div className="space-y-6">
          {activeTab === 'holdings' && (
            <>
              <div className="rounded-3xl border border-border bg-bg-card p-6">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">Holdings Overview</p>
                    <h2 className="text-3xl font-semibold text-text-primary mt-2">{formatCurrency(totalPortfolio)}</h2>
                    <p className="mt-2 text-sm text-text-secondary">Your portfolio value across all accounts and asset classes.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-bg-dark dark:bg-black p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Today's Change</p>
                      <p className={`mt-3 text-lg font-semibold ${summary.dayChange >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(summary.dayChange)}</p>
                    </div>
                    <div className="rounded-2xl bg-bg-dark dark:bg-black p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Avg Return</p>
                      <p className={`mt-3 text-lg font-semibold ${avgReturn >= 0 ? 'text-success' : 'text-danger'}`}>{formatPercent(avgReturn)}</p>
                    </div>
                    <div className="rounded-2xl bg-bg-dark dark:bg-black p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Top Holding</p>
                      <p className="mt-3 text-lg font-semibold text-text-primary">{topHoldings[0]?.symbol || '—'}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  {[
                    { id: 'performance', label: 'Performance' },
                    { id: 'allocation', label: 'Allocation' },
                    { id: 'returns', label: 'Returns' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setInvestmentChartView(option.id)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${investmentChartView === option.id ? 'bg-primary text-white' : 'bg-bg-dark text-text-secondary hover:bg-bg-card'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <InvestmentChart
                  view={investmentChartView}
                  portfolioSeries={portfolioSeries}
                  benchmarkSeries={benchmarkSeries}
                  allocationData={allocationData}
                  returnData={returnData}
                />
              </div>

              <div className="rounded-3xl border border-border bg-bg-card overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">Holdings</h3>
                    <p className="text-sm text-text-secondary mt-1">Tracking the largest positions by value.</p>
                  </div>
                  <button className="text-sm text-primary font-medium">View all</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead>
                      <tr className="text-xs uppercase text-text-secondary">
                        <th className="px-5 py-4">Security</th>
                        <th className="px-5 py-4">Price</th>
                        <th className="px-5 py-4">Quantity</th>
                        <th className="px-5 py-4">Today's %</th>
                        <th className="px-5 py-4">Value</th>
                        <th className="px-5 py-4">Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topHoldings.map((item) => (
                        <tr key={item.id} className="border-t border-border hover:bg-bg-dark">
                          <td className="px-5 py-4">
                            <div className="font-medium text-text-primary">{item.symbol}</div>
                            <div className="text-xs text-text-secondary">{item.name}</div>
                          </td>
                          <td className="px-5 py-4">{formatCurrency(item.price)}</td>
                          <td className="px-5 py-4">{item.shares.toFixed(0)}</td>
                          <td className={`px-5 py-4 font-medium ${item.dayChangePercent >= 0 ? 'text-success' : 'text-danger'}`}>{formatPercent(item.dayChangePercent)}</td>
                          <td className="px-5 py-4">{formatCurrency(item.total_value)}</td>
                          <td className="px-5 py-4">{(item.allocation * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'gains' && (
            <>
              <div className="rounded-3xl border border-border bg-bg-card p-6">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Total Gain / Loss</p>
                    <p className={`mt-4 text-3xl font-semibold ${totalGain >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(totalGain)}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Average Daily Return</p>
                    <p className={`mt-4 text-3xl font-semibold ${avgReturn >= 0 ? 'text-success' : 'text-danger'}`}>{formatPercent(avgReturn)}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Winners / Losers</p>
                    <p className="mt-4 text-3xl font-semibold text-text-primary">{winnersCount} / {losersCount}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-bg-card overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">Gains & Losses Analysis</h3>
                    <p className="text-sm text-text-secondary mt-1">Compare top gainers and largest drawdowns.</p>
                  </div>
                  <div className="inline-flex items-center gap-2 text-sm text-text-secondary">
                    <span className="inline-flex items-center gap-2"><ArrowUpRight size={14} className="text-success" /> Gainers</span>
                    <span className="inline-flex items-center gap-2"><ArrowDownRight size={14} className="text-danger" /> Losers</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-2">
                  <div className="rounded-3xl bg-bg-dark dark:bg-black p-4">
                    <p className="text-sm text-text-secondary">Best Performing</p>
                    <p className="mt-3 text-xl font-semibold text-success">{gainers[0]?.symbol || '—'}</p>
                    <p className="mt-2 text-sm text-text-secondary">{formatCurrency(gainers[0]?.dayChange || 0)} / {formatPercent(gainers[0]?.dayChangePercent || 0)}</p>
                  </div>
                  <div className="rounded-3xl bg-bg-dark dark:bg-black p-4">
                    <p className="text-sm text-text-secondary">Largest Drawdown</p>
                    <p className="mt-3 text-xl font-semibold text-danger">{losers[0]?.symbol || '—'}</p>
                    <p className="mt-2 text-sm text-text-secondary">{formatCurrency(losers[0]?.dayChange || 0)} / {formatPercent(losers[0]?.dayChangePercent || 0)}</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead>
                      <tr className="text-xs uppercase text-text-secondary">
                        <th className="px-5 py-4">Holding</th>
                        <th className="px-5 py-4">Value</th>
                        <th className="px-5 py-4">Today</th>
                        <th className="px-5 py-4">Change %</th>
                        <th className="px-5 py-4">Allocation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...holdings].sort((a, b) => b.dayChangePercent - a.dayChangePercent).slice(0, 8).map((item) => (
                        <tr key={item.id} className="border-t border-border hover:bg-bg-dark">
                          <td className="px-5 py-4">
                            <div className="font-medium text-text-primary">{item.symbol}</div>
                            <div className="text-xs text-text-secondary">{item.name}</div>
                          </td>
                          <td className="px-5 py-4">{formatCurrency(item.total_value)}</td>
                          <td className={`px-5 py-4 font-semibold ${item.dayChange >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(item.dayChange)}</td>
                          <td className={`px-5 py-4 font-semibold ${item.dayChangePercent >= 0 ? 'text-success' : 'text-danger'}`}>{formatPercent(item.dayChangePercent)}</td>
                          <td className="px-5 py-4">{(item.allocation * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'analysis' && (
            <>
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="rounded-3xl border border-border bg-bg-card p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-sm text-text-secondary">Portfolio Allocation</p>
                      <h3 className="text-xl font-semibold text-text-primary mt-2">Diversification</h3>
                    </div>
                    <PieChart size={24} className="text-primary" />
                  </div>
                  <div className="space-y-4">
                    {topHoldings.slice(0, 4).map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-text-primary">{item.symbol}</p>
                          <p className="text-xs text-text-secondary">{(item.allocation * 100).toFixed(1)}% allocation</p>
                        </div>
                        <p className="text-sm font-semibold text-text-primary">{formatCurrency(item.total_value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-3xl border border-border bg-bg-card p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-sm text-text-secondary">Risk & Return</p>
                      <h3 className="text-xl font-semibold text-text-primary mt-2">Portfolio Health</h3>
                    </div>
                    <TrendingUp size={24} className="text-primary" />
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-bg-dark dark:bg-black p-4">
                      <p className="text-xs text-text-secondary">Average Position Return</p>
                      <p className={`mt-2 text-2xl font-semibold ${avgReturn >= 0 ? 'text-success' : 'text-danger'}`}>{formatPercent(avgReturn)}</p>
                    </div>
                    <div className="rounded-2xl bg-bg-dark dark:bg-black p-4">
                      <p className="text-xs text-text-secondary">Portfolio Concentration</p>
                      <p className="mt-2 text-2xl font-semibold text-text-primary">{(topHoldings[0]?.allocation * 100 || 0).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-border bg-bg-card overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">Analysis Snapshot</h3>
                    <p className="text-sm text-text-secondary mt-1">Actionable signals and portfolio guidance.</p>
                  </div>
                  <div className="inline-flex items-center gap-2 text-sm text-text-secondary">
                    <Layers size={16} /> Summary
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-3">
                  <div className="rounded-2xl bg-bg-dark dark:bg-black p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Liquidity</p>
                    <p className="mt-3 text-xl font-semibold text-text-primary">High</p>
                    <p className="text-sm text-text-secondary mt-1">Most holdings are liquid ETFs and stocks.</p>
                  </div>
                  <div className="rounded-2xl bg-bg-dark dark:bg-black p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Volatility</p>
                    <p className="mt-3 text-xl font-semibold text-text-primary">Moderate</p>
                    <p className="text-sm text-text-secondary mt-1">Balanced mix of equity and fixed income exposure.</p>
                  </div>
                  <div className="rounded-2xl bg-bg-dark dark:bg-black p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Opportunity</p>
                    <p className="mt-3 text-xl font-semibold text-success">Buy more</p>
                    <p className="text-sm text-text-secondary mt-1">Consider adding broad market exposure.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-border bg-bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-text-secondary">Portfolio Status</p>
                <h3 className="text-xl font-semibold text-text-primary mt-2">Snapshot</h3>
              </div>
              <LineChart size={24} className="text-primary" />
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl bg-bg-dark dark:bg-black p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-text-secondary">Holdings</div>
                <div className="mt-2 text-3xl font-semibold text-text-primary">{investments.length}</div>
              </div>
              <div className="rounded-2xl bg-bg-dark dark:bg-black p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-text-secondary">Weighted Avg Change</div>
                <div className={`mt-2 text-3xl font-semibold ${summary.dayChangePercent >= 0 ? 'text-success' : 'text-danger'}`}>{formatPercent(summary.dayChangePercent || 0)}</div>
              </div>
              <div className="rounded-2xl bg-bg-dark dark:bg-black p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-text-secondary">Tracking</div>
                <div className="mt-2 text-lg font-semibold text-text-primary">Live prices</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-text-secondary">Portfolio Allocation</p>
                <h4 className="text-lg font-semibold text-text-primary mt-2">Top Positions</h4>
              </div>
              <PieChart size={24} className="text-primary" />
            </div>
            <div className="space-y-3">
              {topHoldings.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{item.symbol}</p>
                    <p className="text-xs text-text-secondary">{(item.allocation * 100).toFixed(1)}%</p>
                  </div>
                  <p className="text-sm font-semibold text-text-primary">{formatCurrency(item.total_value)}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Investments

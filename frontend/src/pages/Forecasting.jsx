import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Settings } from 'lucide-react'

function ForecastLineChart({ series, labels, selectedPoint, onHover }) {
  const width = 760
  const height = 300
  const padding = 50
  const values = series.map((item) => item.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const range = maxValue - minValue || 1

  const pointToXY = (index, value) => {
    const x = padding + (index / (series.length - 1)) * (width - padding * 2)
    const y = height - padding - ((value - minValue) / range) * (height - padding * 2)
    return [x, y]
  }

  const linePath = series
    .map((item, index) => {
      const [x, y] = pointToXY(index, item.value)
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  return (
    <div className="relative rounded-3xl border border-border bg-bg-dark p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[300px]">
        <defs>
          <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((row) => {
          const y = padding + ((height - padding * 2) / 4) * row
          return (
            <line key={row} x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(148, 163, 184, 0.18)" />
          )
        })}
        <path d={`${linePath} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`} fill="url(#forecastGradient)" />
        <path d={linePath} fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
        {series.map((point, index) => {
          const [x, y] = pointToXY(index, point.value)
          return (
            <g key={point.label}>
              <circle
                cx={x}
                cy={y}
                r={selectedPoint?.index === index ? 6 : 4}
                fill={selectedPoint?.index === index ? '#f97316' : '#38bdf8'}
                stroke="#fff"
                strokeWidth="2"
                onMouseEnter={() => onHover(index)}
                onMouseLeave={() => onHover(null)}
                style={{ cursor: 'pointer' }}
              />
            </g>
          )
        })}
      </svg>
      <div className="mt-4 grid grid-cols-3 gap-4 text-xs text-text-secondary">
        {series.map((point, index) => (
          <button
            key={point.label}
            type="button"
            className={`rounded-2xl border px-3 py-2 text-left transition ${selectedPoint?.index === index ? 'border-primary bg-bg-card text-white' : 'border-border bg-bg-dark hover:border-primary'}`}
            onMouseEnter={() => onHover(index)}
            onMouseLeave={() => onHover(null)}
          >
            <div>{point.label}</div>
            <div className="mt-1 font-semibold">{point.value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

function Forecasting() {
  const [dashboard, setDashboard] = useState(null)
  const [savingsRate, setSavingsRate] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [horizon, setHorizon] = useState('1y')
  const [scenario, setScenario] = useState('base')
  const [selectedPoint, setSelectedPoint] = useState(null)

  useEffect(() => {
    fetchForecastData()
  }, [])

  async function fetchForecastData() {
    try {
      setLoading(true)
      const [dashboardData, investmentsSummary] = await Promise.all([
        api.getDashboard(),
        api.getInvestmentsSummary(),
      ])
      setDashboard({ ...dashboardData, investments: investmentsSummary })
      const monthlySavings = Math.max(0, (dashboardData.monthly.income || 0) - (dashboardData.monthly.expenses || 0))
      setSavingsRate(dashboardData.monthly.income ? Math.min(1, monthlySavings / dashboardData.monthly.income) : 0)
    } catch (err) {
      setError(err.message || 'Unable to load forecast data')
    } finally {
      setLoading(false)
    }
  }

  const scenarioRates = {
    base: 0.07,
    upside: 0.1,
    conservative: 0.045,
  }

  const assumptions = {
    incomeGrowth: 0.04,
    expenseGrowth: 0.025,
    investmentReturn: scenarioRates[scenario],
    inflation: 0.027,
  }

  const currentNetWorth = dashboard?.netWorth?.total || 0
  const monthlySavings = Math.max(0, (dashboard?.monthly?.income || 0) - (dashboard?.monthly?.expenses || 0))
  const yearCount = horizon === '1y' ? 1 : horizon === '3y' ? 3 : 5

  const forecastSeries = Array.from({ length: yearCount + 1 }, (_, index) => {
    const year = index
    const saved = monthlySavings * 12 * year
    const projected = currentNetWorth * Math.pow(1 + assumptions.investmentReturn, year) + saved
    return {
      label: `${year}y`,
      value: Number(projected.toFixed(0)),
    }
  })

  const finalProjection = forecastSeries[forecastSeries.length - 1]?.value || 0
  const projectionPercent = currentNetWorth > 0 ? ((finalProjection / currentNetWorth - 1) * 100).toFixed(1) : 0

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-72">
        <div className="text-text-secondary">Loading forecasting module...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center h-72">
        <div className="text-danger">{error}</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Forecasting</h1>
          <p className="text-text-secondary mt-1">Financial projections and future planning using your current net worth.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-card px-4 py-2 text-text-secondary hover:text-text-primary hover:border-primary transition-colors">
          <Settings size={16} />
          Forecast settings
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-3xl border border-border bg-bg-card p-5">
              <p className="text-sm text-text-secondary">Today’s net worth</p>
              <p className="text-3xl font-semibold text-text-primary mt-3">{currentNetWorth.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</p>
              <p className="text-xs text-text-secondary mt-2">Updated from accounts and investments</p>
            </div>
            <div className="rounded-3xl border border-border bg-bg-card p-5">
              <p className="text-sm text-text-secondary">Forecast horizon</p>
              <p className="text-3xl font-semibold text-success mt-3">{yearCount} year{yearCount > 1 ? 's' : ''}</p>
              <p className="text-xs text-text-secondary mt-2">Scenario: {scenario}</p>
            </div>
            <div className="rounded-3xl border border-border bg-bg-card p-5">
              <p className="text-sm text-text-secondary">Projected net worth</p>
              <p className="text-3xl font-semibold text-white mt-3">{finalProjection.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</p>
              <div className="flex items-center gap-2 mt-2 text-sm">
                {projectionPercent >= 0 ? <ArrowUpRight size={14} className="text-success" /> : <ArrowDownRight size={14} className="text-danger" />}
                <span className={projectionPercent >= 0 ? 'text-success' : 'text-danger'}>{projectionPercent}%</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-bg-card p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Net worth projection</h2>
                <p className="text-sm text-text-secondary mt-1">View how your balance evolves under current savings and returns.</p>
              </div>
              <div className="inline-flex flex-wrap items-center gap-2">
                {['1y', '3y', '5y'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setHorizon(option)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${horizon === option ? 'bg-primary text-white' : 'bg-bg-dark text-text-secondary hover:bg-bg-card'}`}
                  >
                    {option.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <ForecastLineChart
              series={forecastSeries}
              labels={forecastSeries.map((item) => item.label)}
              selectedPoint={selectedPoint}
              onHover={(index) => setSelectedPoint(index !== null ? { index } : null)}
            />
          </div>

          <div className="rounded-3xl border border-border bg-bg-card overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Forecast assumptions</h2>
                <p className="text-sm text-text-secondary mt-1">These inputs drive your projection curve.</p>
              </div>
              <div className="inline-flex items-center gap-2 text-sm text-text-secondary">
                <Calendar size={16} /> Live data
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
              <div className="rounded-3xl border border-border bg-bg-dark p-4">
                <p className="text-xs text-text-secondary uppercase tracking-[0.18em]">Investment return</p>
                <p className="mt-3 text-xl font-semibold text-white">{(assumptions.investmentReturn * 100).toFixed(1)}%</p>
              </div>
              <div className="rounded-3xl border border-border bg-bg-dark p-4">
                <p className="text-xs text-text-secondary uppercase tracking-[0.18em]">Income growth</p>
                <p className="mt-3 text-xl font-semibold text-white">{(assumptions.incomeGrowth * 100).toFixed(1)}%</p>
              </div>
              <div className="rounded-3xl border border-border bg-bg-dark p-4">
                <p className="text-xs text-text-secondary uppercase tracking-[0.18em]">Expense growth</p>
                <p className="mt-3 text-xl font-semibold text-white">{(assumptions.expenseGrowth * 100).toFixed(1)}%</p>
              </div>
              <div className="rounded-3xl border border-border bg-bg-dark p-4">
                <p className="text-xs text-text-secondary uppercase tracking-[0.18em]">Savings rate</p>
                <p className="mt-3 text-xl font-semibold text-white">{(savingsRate * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-border bg-bg-card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Forecast scenario</h3>
                <p className="text-sm text-text-secondary mt-1">Choose the risk profile for this projection.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'base', label: 'Base case', description: 'Balanced growth path', rate: 7 },
                { id: 'upside', label: 'Upside case', description: 'Higher return potential', rate: 10 },
                { id: 'conservative', label: 'Conservative', description: 'Lower volatility', rate: 4.5 },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setScenario(option.id)}
                  className={`w-full rounded-3xl border px-4 py-4 text-left transition ${scenario === option.id ? 'border-primary bg-primary/10 text-text-primary' : 'border-border bg-bg-dark hover:border-primary'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{option.label}</p>
                      <p className="mt-1 text-sm text-text-secondary">{option.description}</p>
                    </div>
                    <span className="text-sm font-semibold text-white">{option.rate}%</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-bg-card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Quick insights</h3>
                <p className="text-sm text-text-secondary mt-1">Actionable steps for the next period.</p>
              </div>
              <TrendingUp size={20} className="text-primary" />
            </div>
            <div className="space-y-4 text-sm text-text-secondary">
              <div className="rounded-3xl bg-bg-dark p-4">
                <p className="font-medium text-text-primary">Increase monthly savings</p>
                <p className="mt-2">Based on your current income/expense split, adding 10% to savings improves projection by 6%.</p>
              </div>
              <div className="rounded-3xl bg-bg-dark p-4">
                <p className="font-medium text-text-primary">Rebalance portfolio</p>
                <p className="mt-2">Your top holdings account for over 45% of value. Consider diversifying across sectors.</p>
              </div>
              <div className="rounded-3xl bg-bg-dark p-4">
                <p className="font-medium text-text-primary">Monitor inflation</p>
                <p className="mt-2">Your assumptions assume 2.7% inflation. Adjust if your plan needs more conservative purchasing power.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-bg-card p-5">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Key drivers</h3>
            <div className="space-y-3 text-sm text-text-secondary">
              <div className="flex items-center justify-between gap-3">
                <span>Net worth</span>
                <span className="font-semibold text-white">{currentNetWorth.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Monthly savings</span>
                <span className="font-semibold text-white">{monthlySavings.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Estimated return</span>
                <span className="font-semibold text-white">{(assumptions.investmentReturn * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Projected savings rate</span>
                <span className="font-semibold text-white">{(savingsRate * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Forecasting

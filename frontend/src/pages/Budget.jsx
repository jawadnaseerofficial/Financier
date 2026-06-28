import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Settings2,
  X,
  Info,
  Briefcase,
  DollarSign,
  TrendingUp,
  Heart,
  Gift,
  Car,
  Bus,
  Fuel,
  ShoppingCart,
  Utensils,
  Film,
  ShoppingBag,
  Home,
  Zap,
  Shield,
  Dumbbell,
  Wifi,
  Phone,
  Wrench,
} from 'lucide-react'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const ICON_MAP = {
  'Briefcase': Briefcase,
  'Wallet': DollarSign,
  'DollarSign': DollarSign,
  'TrendingUp': TrendingUp,
  'Heart': Heart,
  'Gift': Gift,
  'Car': Car,
  'Bus': Bus,
  'Fuel': Fuel,
  'ShoppingCart': ShoppingCart,
  'Utensils': Utensils,
  'Film': Film,
  'ShoppingBag': ShoppingBag,
  'Home': Home,
  'Zap': Zap,
  'Shield': Shield,
  'Dumbbell': Dumbbell,
  'Wifi': Wifi,
  'Phone': Phone,
  'Wrench': Wrench,
}

function getIconComponent(icon) {
  if (!icon || icon === '??' || icon === '?') return ShoppingCart
  return ICON_MAP[icon] || ShoppingCart
}

function Budget() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [activeTab, setActiveTab] = useState('budget')
  const [incomeOpen, setIncomeOpen] = useState(true)
  const [expensesOpen, setExpensesOpen] = useState(true)
  const [editingCategory, setEditingCategory] = useState(null)
  const [summaryTab, setSummaryTab] = useState('summary')
  const [forecastView, setForecastView] = useState('monthly')

  useEffect(() => {
    loadData()
  }, [currentMonth, currentYear])

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await api.getBudgets({ month: currentMonth + 1, year: currentYear })
      setData(result)
    } catch (err) {
      console.error('Failed to load budget:', err)
    } finally {
      setLoading(false)
    }
  }

  const navigateMonth = (dir) => {
    if (dir === -1) {
      if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
      else setCurrentMonth(m => m - 1)
    } else {
      if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
      else setCurrentMonth(m => m + 1)
    }
  }

  const navigateYear = (dir) => {
    setCurrentYear(y => y + dir)
  }

  const goToday = () => {
    setCurrentMonth(new Date().getMonth())
    setCurrentYear(new Date().getFullYear())
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val)
  }

  const formatCurrencyFull = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
  }

  if (loading || !data) {
    return <div className="p-6 flex items-center justify-center h-64"><div style={{ color: 'var(--text-muted)' }}>Loading budgets...</div></div>
  }

  const { groups, groupTotals, totalIncome, totalExpenses, leftToBudget } = data
  const incomeGroups = Object.entries(groups).filter(([name]) => groups[name].some(i => i.is_income))
  const expenseGroups = Object.entries(groups).filter(([name]) => groups[name].some(i => !i.is_income))

  const incomeBudgeted = totalIncome.budgeted
  const incomeActual = totalIncome.actual
  const incomeRemaining = totalIncome.remaining
  const expenseBudgeted = totalExpenses.budgeted
  const expenseActual = totalExpenses.actual
  const expenseRemaining = totalExpenses.remaining

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>
      {/* Top Navigation */}
      <div className="px-6 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {activeTab === 'forecast' ? (
              <>
                <button onClick={() => navigateYear(-1)} className="p-1 rounded hover:opacity-70"><ChevronLeft size={16} style={{ color: 'var(--text-secondary)' }} /></button>
                <button onClick={() => navigateYear(1)} className="p-1 rounded hover:opacity-70"><ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} /></button>
                <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{currentYear}</span>
              </>
            ) : (
              <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{MONTHS[currentMonth]} {currentYear}</span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <button onClick={() => setActiveTab('budget')} className="px-3 py-1.5 text-sm font-medium relative" style={{ color: activeTab === 'budget' ? '#f97316' : 'var(--text-secondary)' }}>
              Budget
              {activeTab === 'budget' && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: '#f97316' }} />}
            </button>
            <button onClick={() => setActiveTab('forecast')} className="px-3 py-1.5 text-sm font-medium relative" style={{ color: activeTab === 'forecast' ? '#f97316' : 'var(--text-secondary)' }}>
              Forecast
              {activeTab === 'forecast' && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: '#f97316' }} />}
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {activeTab === 'forecast' && (
            <>
              <button onClick={() => navigateMonth(-1)} className="p-1.5 border rounded-lg" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}><ChevronLeft size={16} /></button>
              <button onClick={() => navigateMonth(1)} className="p-1.5 border rounded-lg" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}><ChevronRight size={16} /></button>
            </>
          )}
          <button onClick={goToday} className="px-3 py-1.5 border rounded-lg text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Today</button>
          {activeTab === 'forecast' && (
            <div className="flex border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <button onClick={() => setForecastView('monthly')} className="px-3 py-1.5 text-sm" style={{ backgroundColor: forecastView === 'monthly' ? 'var(--bg-dark)' : 'transparent', color: 'var(--text-primary)' }}>Monthly</button>
              <button onClick={() => setForecastView('yearly')} className="px-3 py-1.5 text-sm" style={{ backgroundColor: forecastView === 'yearly' ? 'var(--bg-dark)' : 'transparent', color: 'var(--text-primary)' }}>Yearly</button>
            </div>
          )}
          <button className="flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            <Settings2 size={14} /><span>Settings</span>
          </button>
        </div>
      </div>

      {activeTab === 'budget' ? (
        <div className="p-6">
          <div className="flex gap-6">
            {/* Left - Budget Table */}
            <div className="flex-1 min-w-0">
              {/* Income Section */}
              <div className="rounded-xl overflow-hidden mb-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <button onClick={() => setIncomeOpen(!incomeOpen)} className="w-full px-4 py-3 flex items-center" style={{ borderBottom: incomeOpen ? '1px solid var(--border)' : 'none' }}>
                  <div className="flex items-center space-x-2 w-8">
                    {incomeOpen ? <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
                  </div>
                  <span className="text-xs font-semibold tracking-wider flex-1 text-left" style={{ color: 'var(--text-muted)' }}>Income</span>
                  <div className="flex items-center" style={{ width: '380px' }}>
                    <span className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)', width: '120px', textAlign: 'right' }}>Budget</span>
                    <span className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)', width: '120px', textAlign: 'right' }}>Actual</span>
                    <span className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)', width: '120px', textAlign: 'right' }}>Remaining</span>
                  </div>
                  <div style={{ width: '24px' }} />
                </button>

                {incomeOpen && (
                  <div>
                    {incomeGroups.map(([groupName, items]) => (
                      <div key={groupName}>
                        <div className="px-4 py-2.5 flex items-center" style={{ borderBottom: '1px solid var(--border)' }}>
                          <div className="flex items-center space-x-1 w-8">
                            <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
                          </div>
                          <span className="text-sm font-semibold flex-1 text-left" style={{ color: 'var(--text-primary)' }}>{groupName}</span>
                          <div className="flex items-center" style={{ width: '380px' }}>
                            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)', width: '120px', textAlign: 'right' }}>{formatCurrency(groupTotals[groupName].budgeted)}</span>
                            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)', width: '120px', textAlign: 'right' }}>{formatCurrency(groupTotals[groupName].actual)}</span>
                            <span className="text-sm font-semibold" style={{ color: groupTotals[groupName].remaining >= 0 ? '#10b981' : '#ef4444', width: '120px', textAlign: 'right' }}>{formatCurrency(groupTotals[groupName].remaining)}</span>
                          </div>
                          <div style={{ width: '24px' }} />
                        </div>
                        {items.map((item) => (
                          <BudgetRow key={item.id} item={item} formatCurrency={formatCurrency} onEdit={() => setEditingCategory(item)} />
                        ))}
                      </div>
                    ))}
                    <div className="px-4 py-3 flex items-center font-semibold" style={{ backgroundColor: 'var(--bg-dark)' }}>
                      <div className="w-8" />
                      <span className="text-sm flex-1 text-left" style={{ color: 'var(--text-primary)' }}>Total Income</span>
                      <div className="flex items-center" style={{ width: '380px' }}>
                        <span className="text-sm" style={{ color: 'var(--text-primary)', width: '120px', textAlign: 'right' }}>{formatCurrency(incomeBudgeted)}</span>
                        <span className="text-sm" style={{ color: 'var(--text-primary)', width: '120px', textAlign: 'right' }}>{formatCurrency(incomeActual)}</span>
                        <span className="text-sm" style={{ color: incomeRemaining >= 0 ? '#10b981' : '#ef4444', width: '120px', textAlign: 'right' }}>{formatCurrency(incomeRemaining)}</span>
                      </div>
                      <div style={{ width: '24px' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Expenses Section */}
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <button onClick={() => setExpensesOpen(!expensesOpen)} className="w-full px-4 py-3 flex items-center" style={{ borderBottom: expensesOpen ? '1px solid var(--border)' : 'none' }}>
                  <div className="flex items-center space-x-2 w-8">
                    {expensesOpen ? <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
                  </div>
                  <span className="text-xs font-semibold tracking-wider flex-1 text-left" style={{ color: 'var(--text-muted)' }}>Expenses</span>
                  <div className="flex items-center" style={{ width: '380px' }}>
                    <span className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)', width: '120px', textAlign: 'right' }}>Budget</span>
                    <span className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)', width: '120px', textAlign: 'right' }}>Actual</span>
                    <span className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)', width: '120px', textAlign: 'right' }}>Remaining</span>
                  </div>
                  <div style={{ width: '24px' }} />
                </button>

                {expensesOpen && (
                  <div>
                    {expenseGroups.map(([groupName, items]) => (
                      <div key={groupName}>
                        <div className="px-4 py-2.5 flex items-center" style={{ borderBottom: '1px solid var(--border)' }}>
                          <div className="flex items-center space-x-1 w-8">
                            <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
                          </div>
                          <span className="text-sm font-semibold flex-1 text-left" style={{ color: 'var(--text-primary)' }}>{groupName}</span>
                          <div className="flex items-center" style={{ width: '380px' }}>
                            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)', width: '120px', textAlign: 'right' }}>{formatCurrency(groupTotals[groupName].budgeted)}</span>
                            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)', width: '120px', textAlign: 'right' }}>{formatCurrency(groupTotals[groupName].actual)}</span>
                            <span className="text-sm font-semibold" style={{ color: groupTotals[groupName].remaining >= 0 ? '#10b981' : '#ef4444', width: '120px', textAlign: 'right' }}>{formatCurrency(groupTotals[groupName].remaining)}</span>
                          </div>
                          <div style={{ width: '24px' }} />
                        </div>
                        {items.map((item) => (
                          <BudgetRow key={item.id} item={item} formatCurrency={formatCurrency} onEdit={() => setEditingCategory(item)} />
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-72 flex-shrink-0">
              <div className="rounded-xl p-5 mb-4" style={{ backgroundColor: leftToBudget >= 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', border: `1px solid ${leftToBudget >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
                <p className="text-3xl font-bold" style={{ color: leftToBudget >= 0 ? '#10b981' : '#ef4444' }}>{formatCurrencyFull(Math.abs(leftToBudget))}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <p className="text-sm" style={{ color: leftToBudget >= 0 ? '#10b981' : '#ef4444' }}>Left to budget</p>
                  <Info size={14} style={{ color: leftToBudget >= 0 ? '#10b981' : '#ef4444', opacity: 0.6 }} />
                </div>
              </div>

              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
                  {['summary', 'income', 'expenses'].map((tab) => (
                    <button key={tab} onClick={() => setSummaryTab(tab)} className="flex-1 py-2.5 text-xs font-medium capitalize" style={{ color: summaryTab === tab ? 'var(--text-primary)' : 'var(--text-muted)', backgroundColor: summaryTab === tab ? 'var(--bg-dark)' : 'transparent' }}>
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="p-4 space-y-4">
                  {summaryTab === 'summary' && (
                    <>
                      <BudgetSummaryRow label="Income" budgeted={incomeBudgeted} actual={incomeActual} remaining={incomeRemaining} formatCurrency={formatCurrency} color="#10b981" />
                      <BudgetSummaryRow label="Expenses" budgeted={expenseBudgeted} actual={expenseActual} remaining={expenseRemaining} formatCurrency={formatCurrency} color="#ef4444" />
                    </>
                  )}
                  {summaryTab === 'income' && (
                    <div className="space-y-3">
                      {incomeGroups.map(([groupName, items]) => (
                        <div key={groupName}>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{groupName}</p>
                          {items.map(item => {
                            const IconComp = getIconComponent(item.icon)
                            return (
                              <div key={item.id} className="flex justify-between py-1 text-sm">
                                <span className="flex items-center space-x-1.5" style={{ color: 'var(--text-secondary)' }}><IconComp size={14} /><span>{item.category}</span></span>
                                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(item.actual)}</span>
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                  {summaryTab === 'expenses' && (
                    <div className="space-y-3">
                      {expenseGroups.map(([groupName, items]) => (
                        <div key={groupName}>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{groupName}</p>
                          {items.map(item => {
                            const IconComp = getIconComponent(item.icon)
                            return (
                              <div key={item.id} className="flex justify-between py-1 text-sm">
                                <span className="flex items-center space-x-1.5" style={{ color: 'var(--text-secondary)' }}><IconComp size={14} /><span>{item.category}</span></span>
                                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(item.actual)}</span>
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <ForecastView
          data={data}
          currentMonth={currentMonth}
          currentYear={currentYear}
          formatCurrency={formatCurrency}
          forecastView={forecastView}
        />
      )}

      {editingCategory && <EditCategoryModal category={editingCategory} onClose={() => setEditingCategory(null)} onSave={async (d) => { if (editingCategory.id) await api.updateBudget(editingCategory.id, d); setEditingCategory(null); loadData() }} />}
    </div>
  )
}

function ForecastView({ data, currentMonth, currentYear, formatCurrency, forecastView }) {
  const [forecastData, setForecastData] = useState({})
  const [loading, setLoading] = useState(true)

  const { groups, groupTotals, totalIncome, totalExpenses } = data
  const incomeGroups = Object.entries(groups).filter(([name]) => groups[name].some(i => i.is_income))
  const expenseGroups = Object.entries(groups).filter(([name]) => groups[name].some(i => !i.is_income))

  useEffect(() => {
    loadForecastData()
  }, [currentMonth, currentYear])

  const loadForecastData = async () => {
    setLoading(true)
    try {
      const months = []
      const now = new Date()
      const startMonth = now.getMonth()
      const startYear = now.getFullYear()

      for (let i = 0; i < 12; i++) {
        const m = (startMonth + i) % 12
        const y = startYear + Math.floor((startMonth + i) / 12)
        months.push({ month: m, year: y })
      }

      const results = {}
      await Promise.all(months.map(async ({ month, year }) => {
        try {
          const result = await api.getBudgets({ month: month + 1, year })
          results[`${year}-${month}`] = result
        } catch (err) {
          console.error(`Failed to load forecast for ${month + 1}/${year}:`, err)
        }
      }))
      setForecastData(results)
    } finally {
      setLoading(false)
    }
  }

  const now = new Date()
  const startMonth = now.getMonth()
  const startYear = now.getFullYear()

  const displayMonths = []
  const totalCols = forecastView === 'yearly' ? 12 : 7
  for (let i = 0; i < totalCols; i++) {
    const m = (startMonth + i) % 12
    const y = startYear + Math.floor((startMonth + i) / 12)
    displayMonths.push({ month: m, year: y, key: `${y}-${m}`, isCurrent: i === 0 })
  }

  const getMonthData = (key) => forecastData[key] || null

  const colWidth = '120px'

  if (loading) {
    return <div className="p-6 flex items-center justify-center h-64"><div style={{ color: 'var(--text-muted)' }}>Loading forecast...</div></div>
  }

  return (
    <div className="p-6">
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {/* Column Headers */}
        <div className="flex items-center px-4 py-2" style={{ borderBottom: '2px solid var(--border)' }}>
          <div style={{ width: '280px' }} />
          {displayMonths.map((m) => (
            <div key={m.key} style={{ width: colWidth, textAlign: 'right' }} className="pr-3">
              <span className="text-xs font-semibold" style={{ color: m.isCurrent ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {MONTH_SHORT[m.month]} {m.year}
              </span>
            </div>
          ))}
        </div>

        {/* Income Section */}
        <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center">
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} className="mr-1" />
            <span className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>Income</span>
          </div>
        </div>

        {incomeGroups.map(([groupName, items]) => (
          <div key={groupName}>
            {/* Group Header */}
            <div className="flex items-center px-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center space-x-1.5" style={{ width: '280px' }}>
                <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{groupName}</span>
                <Settings2 size={12} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
              </div>
              {displayMonths.map((m) => {
                const mData = getMonthData(m.key)
                const groupData = mData?.groups?.[groupName]
                const total = groupData ? groupData.reduce((s, i) => s + i.budgeted, 0) : 0
                return (
                  <div key={m.key} style={{ width: colWidth, textAlign: 'right' }} className="pr-3">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(total)}</span>
                  </div>
                )
              })}
            </div>

            {/* Category Rows */}
            {items.map((item) => (
              <ForecastRow key={item.id} item={item} displayMonths={displayMonths} getMonthData={getMonthData} formatCurrency={formatCurrency} colWidth={colWidth} />
            ))}

            {/* Show unbudgeted */}
            <div className="flex items-center px-4 py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: '280px' }} className="pl-6">
                <span className="text-xs cursor-pointer" style={{ color: 'var(--text-muted)' }}>Show {items.length} unbudgeted</span>
              </div>
            </div>
          </div>
        ))}

        {/* Total Income */}
        <div className="flex items-center px-4 py-3 font-semibold" style={{ borderBottom: '2px solid var(--border)', backgroundColor: 'var(--bg-dark)' }}>
          <div style={{ width: '280px' }}>
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Total Income</span>
          </div>
          {displayMonths.map((m) => {
            const mData = getMonthData(m.key)
            const total = mData?.totalIncome ? mData.totalIncome.budgeted : 0
            return (
              <div key={m.key} style={{ width: colWidth, textAlign: 'right' }} className="pr-3">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(total)}</span>
              </div>
            )
          })}
        </div>

        {/* Expenses Section */}
        <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center">
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} className="mr-1" />
            <span className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>Expenses</span>
          </div>
        </div>

        {expenseGroups.map(([groupName, items]) => (
          <div key={groupName}>
            {/* Group Header */}
            <div className="flex items-center px-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center space-x-1.5" style={{ width: '280px' }}>
                <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{groupName}</span>
                <Settings2 size={12} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
              </div>
              {displayMonths.map((m) => {
                const mData = getMonthData(m.key)
                const groupData = mData?.groups?.[groupName]
                const total = groupData ? groupData.reduce((s, i) => s + i.budgeted, 0) : 0
                return (
                  <div key={m.key} style={{ width: colWidth, textAlign: 'right' }} className="pr-3">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(total)}</span>
                  </div>
                )
              })}
            </div>

            {/* Category Rows */}
            {items.map((item) => (
              <ForecastRow key={item.id} item={item} displayMonths={displayMonths} getMonthData={getMonthData} formatCurrency={formatCurrency} colWidth={colWidth} />
            ))}

            {/* Show unbudgeted */}
            <div className="flex items-center px-4 py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: '280px' }} className="pl-6">
                <span className="text-xs cursor-pointer" style={{ color: 'var(--text-muted)' }}>Show {items.length} unbudgeted</span>
              </div>
            </div>
          </div>
        ))}

        {/* Total Expenses */}
        <div className="flex items-center px-4 py-3 font-semibold" style={{ borderBottom: '2px solid var(--border)', backgroundColor: 'var(--bg-dark)' }}>
          <div style={{ width: '280px' }}>
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Total Expenses</span>
          </div>
          {displayMonths.map((m) => {
            const mData = getMonthData(m.key)
            const total = mData?.totalExpenses ? mData.totalExpenses.budgeted : 0
            return (
              <div key={m.key} style={{ width: colWidth, textAlign: 'right' }} className="pr-3">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(total)}</span>
              </div>
            )
          })}
        </div>

        {/* Net Income */}
        <div className="flex items-center px-4 py-3" style={{ backgroundColor: 'var(--bg-dark)' }}>
          <div style={{ width: '280px' }}>
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Net Income</span>
          </div>
          {displayMonths.map((m) => {
            const mData = getMonthData(m.key)
            const inc = mData?.totalIncome ? mData.totalIncome.budgeted : 0
            const exp = mData?.totalExpenses ? mData.totalExpenses.budgeted : 0
            const net = inc - exp
            return (
              <div key={m.key} style={{ width: colWidth, textAlign: 'right' }} className="pr-3">
                <span className="text-sm font-bold" style={{ color: net >= 0 ? '#10b981' : '#ef4444' }}>{formatCurrency(net)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ForecastRow({ item, displayMonths, getMonthData, formatCurrency, colWidth }) {
  const [editingMonth, setEditingMonth] = useState(null)
  const [editValue, setEditValue] = useState('')
  const IconComp = getIconComponent(item.icon)

  const handleSave = async (monthKey) => {
    const val = parseFloat(editValue)
    if (!isNaN(val)) {
      const [y, m] = monthKey.split('-').map(Number)
      await api.updateBudget(item.id, { budgeted: val })
    }
    setEditingMonth(null)
  }

  return (
    <div className="flex items-center px-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center space-x-2" style={{ width: '280px' }}>
        <div className="w-4" />
        <IconComp size={14} style={{ color: 'var(--text-muted)' }} />
        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{item.category}</span>
      </div>
      {displayMonths.map((m) => {
        const mData = getMonthData(m.key)
        const categoryData = mData?.groups && Object.values(mData.groups).flat().find(g => g.id === item.id)
        const budgeted = categoryData ? categoryData.budgeted : item.budgeted
        const isEditing = editingMonth === m.key

        return (
          <div key={m.key} style={{ width: colWidth, textAlign: 'right' }} className="pr-3">
            {isEditing ? (
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleSave(m.key)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave(m.key)}
                className="w-20 px-2 py-1 text-sm text-right border rounded outline-none"
                style={{ borderColor: '#f97316', color: 'var(--text-primary)', backgroundColor: 'var(--bg-page)' }}
                autoFocus
              />
            ) : (
              <button
                onClick={() => { setEditingMonth(m.key); setEditValue(budgeted) }}
                className="text-sm px-2 py-0.5 rounded hover:opacity-80"
                style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-dark)' }}
              >
                {formatCurrency(budgeted)}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

function BudgetRow({ item, formatCurrency, onEdit }) {
  const [editingBudget, setEditingBudget] = useState(false)
  const [budgetValue, setBudgetValue] = useState(item.budgeted)

  const budgeted = item.budgeted
  const actual = item.actual
  const remaining = item.remaining
  const isOver = remaining < 0
  const IconComp = getIconComponent(item.icon)

  const handleSave = async () => {
    await api.updateBudget(item.id, { budgeted: parseFloat(budgetValue) })
    setEditingBudget(false)
  }

  return (
    <div className="px-4 py-2.5 flex items-center" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="w-8" />
      <div className="flex items-center space-x-2 flex-1 text-left">
        <IconComp size={14} style={{ color: 'var(--text-muted)' }} />
        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{item.category}</span>
      </div>
      <div className="flex items-center" style={{ width: '380px' }}>
        <div style={{ width: '120px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
          {editingBudget ? (
            <input type="number" value={budgetValue} onChange={(e) => setBudgetValue(e.target.value)} onBlur={handleSave} onKeyDown={(e) => e.key === 'Enter' && handleSave()} className="w-20 px-2 py-1 text-sm text-right border rounded outline-none" style={{ borderColor: '#f97316', color: 'var(--text-primary)', backgroundColor: 'var(--bg-page)' }} autoFocus />
          ) : (
            <button onClick={() => setEditingBudget(true)} className="text-sm font-medium px-2 py-0.5 rounded hover:opacity-80" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-dark)' }}>{formatCurrency(budgeted)}</button>
          )}
        </div>
        <span className="text-sm" style={{ color: 'var(--text-primary)', width: '120px', textAlign: 'right' }}>{formatCurrency(actual)}</span>
        <span className="text-sm font-medium" style={{ color: isOver ? '#ef4444' : '#10b981', width: '120px', textAlign: 'right' }}>{formatCurrency(remaining)}</span>
      </div>
      <div style={{ width: '24px' }} className="flex justify-center" onClick={(e) => e.stopPropagation()}>
        <button onClick={onEdit} className="p-0.5 rounded hover:opacity-70"><Settings2 size={12} style={{ color: 'var(--text-muted)' }} /></button>
      </div>
    </div>
  )
}

function BudgetSummaryRow({ label, budgeted, actual, remaining, formatCurrency, color }) {
  const percent = budgeted > 0 ? Math.min((actual / budgeted) * 100, 100) : 0
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatCurrency(budgeted)} budget</span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-dark)' }}>
        <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: color }} />
      </div>
      <div className="flex justify-between text-xs">
        <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(actual)} {label === 'Income' ? 'earned' : 'spent'}</span>
        <span style={{ color: remaining >= 0 ? '#10b981' : '#ef4444' }}>{formatCurrency(Math.abs(remaining))} remaining</span>
      </div>
    </div>
  )
}

function EditCategoryModal({ category, onClose, onSave }) {
  const [name, setName] = useState(category.category || '')
  const [group, setGroup] = useState(category.budget_group || '')
  const [rollover, setRollover] = useState(false)
  const [exclude, setExclude] = useState(false)
  const groups = ['Income', 'Gifts & Donations', 'Auto & Transport', 'Food & Dining', 'Entertainment', 'Shopping', 'Bills & Utilities', 'Health & Wellness', 'Other']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="rounded-xl shadow-2xl w-full max-w-md" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Edit Category</h2>
          <button onClick={onClose} className="p-1 rounded hover:opacity-70"><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Icon & Name</label>
            <div className="flex items-center space-x-2">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg text-sm outline-none" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-page)' }} />
            </div>
            <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>This system category automatically categorizes transactions related to {name}.</p>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Group</label>
            <select value={group} onChange={(e) => setGroup(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm outline-none" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-page)' }}>
              {groups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between py-3 px-4 rounded-lg" style={{ backgroundColor: 'var(--bg-dark)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Make this category a rollover fund</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Carry over remaining balances or set due dates to better plan for future expenses. <span className="underline cursor-pointer" style={{ color: '#f97316' }}>Learn more</span></p>
            </div>
            <button onClick={() => setRollover(!rollover)} className="w-10 h-6 rounded-full relative transition-colors flex-shrink-0" style={{ backgroundColor: rollover ? '#10b981' : 'var(--border)' }}>
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${rollover ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between py-3 px-4 rounded-lg" style={{ backgroundColor: 'var(--bg-dark)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Exclude this category from the budget</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>This category and any transactions linked to it will be hidden from your budget. <span className="underline cursor-pointer" style={{ color: '#f97316' }}>Learn more</span></p>
            </div>
            <button onClick={() => setExclude(!exclude)} className="w-10 h-6 rounded-full relative transition-colors flex-shrink-0" style={{ backgroundColor: exclude ? '#10b981' : 'var(--border)' }}>
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${exclude ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center space-x-2">
            <button className="px-4 py-1.5 border rounded-lg text-sm font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Disable</button>
            <Info size={14} style={{ color: 'var(--text-muted)' }} />
          </div>
          <button onClick={() => onSave({ category: name, budget_group: group })} className="px-5 py-1.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#f97316' }}>Save</button>
        </div>
      </div>
    </div>
  )
}

export default Budget

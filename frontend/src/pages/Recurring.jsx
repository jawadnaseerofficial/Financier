import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { CalendarClock, CalendarDays, ChevronLeft, ChevronRight, Filter, List, MoreHorizontal } from 'lucide-react'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function Recurring() {
  const [recurring, setRecurring] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('list')
  const [scopeTab, setScopeTab] = useState('monthly')
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [recurringData, summaryData] = await Promise.all([
        api.getRecurring(),
        api.getRecurringSummary()
      ])
      setRecurring(recurringData)
      setSummary(summaryData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading recurring...</div>
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

  const listItems = scopeTab === 'monthly'
    ? recurring.filter((item) => item.frequency === 'monthly')
    : recurring

  const totalIncome = recurring
    .filter((item) => parseFloat(item.amount) > 0)
    .reduce((sum, item) => sum + parseFloat(item.amount), 0)

  const totalExpenses = recurring
    .filter((item) => parseFloat(item.amount) < 0)
    .reduce((sum, item) => sum + Math.abs(parseFloat(item.amount)), 0)

  const calendarItems = recurring.reduce((map, item) => {
    const date = new Date(item.next_date)
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    if (!map[key]) map[key] = []
    map[key].push(item)
    return map
  }, {})

  const startOfMonth = new Date(currentYear, currentMonth, 1)
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayIndex = startOfMonth.getDay()
  const calendarCells = Array.from({ length: firstDayIndex + daysInMonth }, (_, idx) => {
    const dayNumber = idx - firstDayIndex + 1
    return dayNumber > 0
      ? {
        dayNumber,
        dateKey: `${currentYear}-${currentMonth}-${dayNumber}`,
        items: calendarItems[`${currentYear}-${currentMonth}-${dayNumber}`] || [],
      }
      : null
  })

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Recurring</h1>
          <p className="text-text-secondary mt-1">Manage your recurring transactions</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center rounded-full border border-border bg-bg-card dark:bg-black p-1">
            {['monthly', 'all'].map((tab) => (
              <button
                key={tab}
                onClick={() => setScopeTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${scopeTab === tab ? 'bg-primary text-white' : 'text-text-secondary hover:bg-bg-dark'}`}
              >
                {tab === 'monthly' ? 'Monthly' : 'All recurring'}
              </button>
            ))}
          </div>
          <div className="flex items-center rounded-full border border-border bg-bg-card dark:bg-black p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all ${viewMode === 'list' ? 'bg-white dark:bg-black text-text-primary shadow-sm' : 'text-text-secondary hover:bg-bg-dark'}`}
            >
              <List size={16} />
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-black text-text-primary shadow-sm' : 'text-text-secondary hover:bg-bg-dark'}`}
            >
              <CalendarDays size={16} />
              Calendar
            </button>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-bg-card dark:bg-black text-text-secondary hover:text-text-primary">
            <Filter size={16} />
            Filters
          </button>
          <button className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors">
            Manage recurring
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr] mb-8">
        <div className="bg-bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CalendarClock size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-text-secondary text-sm">Total Monthly Recurring</p>
              <p className="text-2xl font-bold text-text-primary">
                ${summary?.totalMonthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="rounded-2xl bg-bg-dark p-4">
              <p className="text-xs text-text-secondary">Income</p>
              <p className="mt-2 text-lg font-semibold text-success">${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="rounded-2xl bg-bg-dark p-4">
              <p className="text-xs text-text-secondary">Expenses</p>
              <p className="mt-2 text-lg font-semibold text-danger">${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="rounded-2xl bg-bg-dark p-4">
              <p className="text-xs text-text-secondary">Credit cards</p>
              <p className="mt-2 text-lg font-semibold text-text-primary">$0.00</p>
            </div>
          </div>
        </div>
        <div className="bg-bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-[0.2em]">Upcoming</p>
              <p className="text-xl font-semibold text-text-primary mt-2">{listItems.length} items</p>
            </div>
            <div className="text-sm text-text-secondary">
              {scopeTab === 'monthly' ? 'Monthly view' : 'All recurring view'}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-text-secondary">
            <span>{new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
            <span>{totalIncome >= 0 ? 'Active' : 'Review required'}</span>
          </div>
        </div>
      </div>

      {/* Recurring List or Calendar */}
      {viewMode === 'list' ? (
          <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
          <div className="divide-y divide-border">
            {listItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 hover:bg-bg-hover">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-bg-dark flex items-center justify-center">
                    <span className="text-sm font-medium text-text-secondary">
                      {item.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{item.name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-xs text-text-muted">{item.category}</p>
                      <span className="text-xs text-text-muted">•</span>
                      <p className="text-xs text-text-muted">{item.frequency}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${parseFloat(item.amount) < 0 ? 'text-danger' : 'text-success'}`}>
                      ${Math.abs(parseFloat(item.amount)).toFixed(2)}
                    </p>
                    <p className="text-xs text-text-muted">
                      Next: {new Date(item.next_date).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="text-text-secondary hover:text-text-primary">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-border bg-bg-card p-4">
            <div className="text-sm text-text-secondary">{MONTHS[currentMonth]} {currentYear}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => {
                if (currentMonth === 0) {
                  setCurrentMonth(11)
                  setCurrentYear((year) => year - 1)
                } else {
                  setCurrentMonth((month) => month - 1)
                }
              }} className="p-2 rounded-lg border border-border hover:bg-bg-dark">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => {
                if (currentMonth === 11) {
                  setCurrentMonth(0)
                  setCurrentYear((year) => year + 1)
                } else {
                  setCurrentMonth((month) => month + 1)
                }
              }} className="p-2 rounded-lg border border-border hover:bg-bg-dark">
                <ChevronRight size={16} />
              </button>
              <button onClick={() => {
                setCurrentMonth(new Date().getMonth())
                setCurrentYear(new Date().getFullYear())
              }} className="px-4 py-2 rounded-lg border border-border bg-bg-card text-sm hover:bg-bg-dark">
                Today
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-text-secondary">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="py-2 rounded-lg bg-bg-dark">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((cell, idx) => (
              cell ? (
                <div key={idx} className="min-h-[100px] rounded-xl border border-border bg-bg-card p-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-text-secondary mb-2">
                    <span>{cell.dayNumber}</span>
                    <span className="text-[10px] rounded-full bg-bg-dark px-2 py-0.5">{cell.items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {cell.items.slice(0, 2).map((item) => (
                      <div key={item.id} className="rounded-xl bg-bg-dark p-2 text-[11px] text-text-primary overflow-hidden">
                        <div className="truncate font-medium">{item.name}</div>
                        <div className="text-[10px] text-text-secondary">{item.category}</div>
                      </div>
                    ))}
                    {cell.items.length > 2 && (
                      <div className="text-[10px] text-text-muted">+{cell.items.length - 2} more</div>
                    )}
                  </div>
                </div>
              ) : (
                <div key={idx} className="min-h-[100px] rounded-xl border border-border bg-transparent" />
              )
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Recurring

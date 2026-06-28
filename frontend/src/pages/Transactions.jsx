import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import {
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  Calendar,
  Download,
  CheckSquare,
  ArrowUpDown,
  Columns,
  Plus,
} from 'lucide-react'
import TransactionDetail from '../components/transactions/TransactionDetail'

function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)

  useEffect(() => {
    loadTransactions()
  }, [])

  async function loadTransactions(search = '') {
    try {
      setLoading(true)
      const params = search ? { search } : {}
      const result = await api.getTransactions(params)
      setTransactions(result.data || result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Group transactions by date
  const groupedTransactions = transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    if (!acc[date]) {
      acc[date] = { transactions: [], total: 0 }
    }
    acc[date].transactions.push(transaction)
    acc[date].total += parseFloat(transaction.amount)
    return acc
  }, {})

  // Calculate summary stats
  const summary = {
    totalTransactions: transactions.length,
    largestTransaction: transactions.reduce((max, t) => {
      const amount = Math.abs(parseFloat(t.amount))
      return amount > max ? amount : max
    }, 0),
    largestExpense: transactions
      .filter((t) => parseFloat(t.amount) < 0)
      .reduce((max, t) => {
        const amount = Math.abs(parseFloat(t.amount))
        return amount > max ? amount : max
      }, 0),
    averageTransaction:
      transactions.length > 0
        ? transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0) / transactions.length
        : 0,
    totalIncome: transactions
      .filter((t) => parseFloat(t.amount) > 0)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0),
    totalSpending: transactions
      .filter((t) => parseFloat(t.amount) < 0)
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0),
    firstTransaction: transactions.length > 0 ? transactions[transactions.length - 1].date : null,
    lastTransaction: transactions.length > 0 ? transactions[0].date : null,
  }

  function getCategoryColor(category) {
    const colors = {
      'Groceries': '#10b981',
      'Entertainment': '#8b5cf6',
      'Transportation': '#f59e0b',
      'Shopping': '#ec4899',
      'Food & Drink': '#ef4444',
      'Utilities': '#6366f1',
      'Health & Fitness': '#14b8a6',
      'Income': '#10b981',
      'Transfer': '#6b7280',
      'Travel & Vacation': '#0ea5e9',
      'Gifts': '#f43f5e',
      'Auto Payment': '#f97316',
      'Paychecks': '#10b981',
      'Business Income': '#10b981',
    }
    return colors[category] || '#6b7280'
  }

  function getAccountIcon(accountName) {
    return accountName?.charAt(0) || 'A'
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div style={{ color: 'var(--text-secondary)' }}>Loading transactions...</div>
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
        <div className="flex items-center space-x-3">
          {/* All transactions dropdown */}
          <button
            className="flex items-center space-x-2 px-3 py-1.5 border rounded-lg text-sm"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            <span>All transactions</span>
            <ChevronDown size={14} />
          </button>

          {/* Edit multiple */}
          <button
            className="flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg text-sm hover:opacity-80"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <CheckSquare size={14} />
            <span>Edit multiple</span>
          </button>

          {/* Sort */}
          <button
            className="flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg text-sm hover:opacity-80"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <ArrowUpDown size={14} />
            <span>Sort</span>
            <ChevronDown size={12} />
          </button>

          {/* Columns */}
          <button
            className="flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg text-sm hover:opacity-80"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <Columns size={14} />
            <span>Columns</span>
            <ChevronDown size={12} />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            className="flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg text-sm hover:opacity-80"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <Search size={14} />
            <span>Search</span>
          </button>
          <button
            className="flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg text-sm hover:opacity-80"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <Calendar size={14} />
            <span>Date</span>
          </button>
          <button
            onClick={() => setShowFilters(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg text-sm hover:opacity-80"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <Filter size={14} />
            <span>Filters</span>
          </button>
          <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors">
            <Plus size={14} />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Main Content: Transactions + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transactions List - Left 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          {Object.entries(groupedTransactions).map(([date, { transactions: dayTransactions, total }]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center justify-between py-2 px-2">
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {date}
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  ${Math.abs(total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Transactions for this date */}
              <div
                className="border rounded-xl overflow-hidden"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {dayTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      {/* Left: Merchant */}
                      <div className="flex items-center space-x-3 w-48">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: 'var(--bg-dark)' }}
                        >
                          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                            {transaction.merchant.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {transaction.merchant}
                        </span>
                      </div>

                      {/* Middle: Category */}
                      <div className="flex items-center space-x-2 w-40">
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center"
                          style={{ backgroundColor: getCategoryColor(transaction.category) + '20' }}
                        >
                          <span className="text-[10px]" style={{ color: getCategoryColor(transaction.category) }}>
                            {transaction.category.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                          {transaction.category}
                        </span>
                      </div>

                      {/* Middle: Account */}
                      <div className="flex items-center space-x-2 w-44">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: '#6366f1' }}
                        >
                          <span className="text-[10px] text-white font-medium">
                            {getAccountIcon(transaction.account_name)}
                          </span>
                        </div>
                        <span className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                          {transaction.account_name}
                        </span>
                      </div>

                      {/* Right: Amount + Arrow */}
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-sm font-medium ${
                            parseFloat(transaction.amount) >= 0 ? 'text-success' : ''
                          }`}
                          style={parseFloat(transaction.amount) < 0 ? { color: 'var(--text-primary)' } : {}}
                        >
                          {parseFloat(transaction.amount) >= 0 ? '+' : ''}${Math.abs(parseFloat(transaction.amount)).toFixed(2)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedTransaction(transaction)
                          }}
                          className="p-1 rounded hover:opacity-80"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Panel - Right 1/3 */}
        <div>
          <div
            className="border rounded-xl p-5 sticky top-6"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Summary</h3>
              <button className="p-1 rounded hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total transactions</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {summary.totalTransactions.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Largest transaction</span>
                <span className="text-sm font-medium text-success">
                  +${summary.largestTransaction.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Largest expense</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  ${summary.largestExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Average transaction</span>
                <span className="text-sm font-medium text-success">
                  +${Math.abs(summary.averageTransaction).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total income</span>
                <span className="text-sm font-medium text-success">
                  +${summary.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total spending</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  ${summary.totalSpending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>First transaction</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {summary.firstTransaction
                    ? new Date(summary.firstTransaction).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '-'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Last transaction</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {summary.lastTransaction
                    ? new Date(summary.lastTransaction).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '-'}
                </span>
              </div>
            </div>

            {/* Download CSV */}
            <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <button className="w-full text-center text-sm font-medium text-primary hover:text-primary-light transition-colors">
                Download CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Detail Panel */}
      <TransactionDetail
        transaction={selectedTransaction}
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </div>
  )
}

export default Transactions

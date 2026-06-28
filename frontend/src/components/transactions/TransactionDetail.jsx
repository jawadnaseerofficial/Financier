import { useState } from 'react'
import {
  X,
  Check,
  Eye,
  MoreHorizontal,
  ChevronDown,
  Split,
  Paperclip,
  Trash2,
} from 'lucide-react'

const categories = [
  'Loan Repayment',
  'Groceries',
  'Entertainment',
  'Transportation',
  'Shopping',
  'Food & Drink',
  'Utilities',
  'Health & Fitness',
  'Income',
  'Transfer',
  'Travel & Vacation',
  'Gifts',
  'Auto Payment',
  'Paychecks',
  'Business Income',
]

const owners = [
  { id: 'demo', label: 'Demo (default)', color: '#10b981' },
  { id: 'household', label: 'Household Member', color: '#ef4444' },
]

const goals = [
  'Emergency Fund',
  'Vacation to Europe',
  'Pay Off Credit Card',
  'Down Payment',
]

function TransactionDetail({ transaction, isOpen, onClose }) {
  const [formData, setFormData] = useState({
    type: 'Debit',
    date: transaction?.date
      ? new Date(transaction.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '',
    category: transaction?.category || '',
    owner: 'demo',
    goal: '',
    notes: '',
    tags: '',
    assignTo: '',
  })

  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false)
  const [showGoalDropdown, setShowGoalDropdown] = useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)

  if (!isOpen || !transaction) return null

  const amount = parseFloat(transaction.amount)
  const isIncome = amount >= 0

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose}></div>

      {/* Panel */}
      <div
        className="relative w-[420px] h-full overflow-y-auto border-l shadow-2xl"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        {/* Top bar */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between p-4 border-b"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center space-x-2">
            <button
              className="flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg text-sm hover:opacity-80"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <Check size={14} />
              <span>Mark as reviewed</span>
            </button>
            <button
              className="p-2 rounded-lg hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Eye size={16} />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="p-2 rounded-lg hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              <MoreHorizontal size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-5">
          {/* Amount and Account */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--bg-dark)' }}
              >
                <span className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {transaction.merchant.charAt(0)}
                </span>
              </div>
              <div>
                <p
                  className={`text-2xl font-bold ${isIncome ? 'text-success' : ''}`}
                  style={!isIncome ? { color: 'var(--text-primary)' } : {}}
                >
                  {isIncome ? '+' : ''}${Math.abs(amount).toFixed(2)}
                </p>
                <div className="flex items-center space-x-1.5 mt-1">
                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-[8px] text-white font-medium">
                      {transaction.account_name?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {transaction.account_name}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Merchant Name */}
          <div
            className="flex items-center justify-between py-2 border-b cursor-pointer"
            style={{ borderColor: 'var(--border)' }}
          >
            <span className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
              {transaction.merchant}
            </span>
            <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
          </div>

          {/* View transaction link */}
          <button className="text-sm text-primary hover:text-primary-light">
            View 1 transaction
          </button>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Type
            </label>
            <div className="relative">
              <button
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                <span>{formData.type}</span>
                <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
              </button>
              {showTypeDropdown && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-20"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                  {['Debit', 'Credit', 'Transfer'].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setFormData({ ...formData, type })
                        setShowTypeDropdown(false)
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:opacity-80"
                      style={{
                        color: formData.type === type ? '#6366f1' : 'var(--text-primary)',
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Date
            </label>
            <input
              type="text"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-primary"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
                backgroundColor: 'transparent',
              }}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Original Date: December 3, 2025
            </p>
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Category
              </label>
              <button className="flex items-center space-x-1 text-xs text-primary hover:text-primary-light">
                <Split size={12} />
                <span>Split</span>
              </button>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                <div className="flex items-center space-x-2">
                  <span>🔥</span>
                  <span>{formData.category || 'Select category'}</span>
                </div>
                <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
              </button>
              {showCategoryDropdown && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setFormData({ ...formData, category: cat })
                        setShowCategoryDropdown(false)
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:opacity-80 flex items-center space-x-2"
                      style={{
                        color: formData.category === cat ? '#6366f1' : 'var(--text-primary)',
                      }}
                    >
                      <span>🔥</span>
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Owner */}
          <div>
            <div className="flex items-center space-x-1 mb-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Owner
              </label>
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                style={{ backgroundColor: 'var(--bg-dark)', color: 'var(--text-muted)' }}
              >
                ?
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowOwnerDropdown(!showOwnerDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: owners.find((o) => o.id === formData.owner)?.color }}
                  />
                  <span>{owners.find((o) => o.id === formData.owner)?.label}</span>
                </div>
                <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
              </button>
              {showOwnerDropdown && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-20"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                  {owners.map((owner) => (
                    <button
                      key={owner.id}
                      onClick={() => {
                        setFormData({ ...formData, owner: owner.id })
                        setShowOwnerDropdown(false)
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:opacity-80 flex items-center space-x-2"
                      style={{
                        color: formData.owner === owner.id ? '#6366f1' : 'var(--text-primary)',
                      }}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: owner.color }} />
                      <span>{owner.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Goal */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Goal
            </label>
            <div className="relative">
              <button
                onClick={() => setShowGoalDropdown(!showGoalDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                <span>{formData.goal || 'Select goal...'}</span>
                <ChevronDown size={14} />
              </button>
              {showGoalDropdown && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-20"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                  <button
                    onClick={() => {
                      setFormData({ ...formData, goal: '' })
                      setShowGoalDropdown(false)
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:opacity-80"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    None
                  </button>
                  {goals.map((goal) => (
                    <button
                      key={goal}
                      onClick={() => {
                        setFormData({ ...formData, goal })
                        setShowGoalDropdown(false)
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:opacity-80"
                      style={{
                        color: formData.goal === goal ? '#6366f1' : 'var(--text-primary)',
                      }}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add notes to this transaction..."
              rows={3}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
                backgroundColor: 'transparent',
              }}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Tags
            </label>
            <input
              type="text"
              placeholder="Search tags..."
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-primary"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
                backgroundColor: 'transparent',
              }}
            />
          </div>

          {/* Needs review by */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Needs review by
            </label>
            <div className="relative">
              <button
                className="w-full flex items-center justify-between px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                <span>Assign to...</span>
                <ChevronDown size={14} />
              </button>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Attachments
            </label>
            <button
              className="w-full flex items-center justify-center space-x-2 py-3 border border-dashed rounded-lg text-sm hover:opacity-80"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              <Paperclip size={14} />
              <span>Add an attachment</span>
            </button>
          </div>
        </div>

        {/* Bottom - Other Options */}
        <div
          className="sticky bottom-0 border-t p-4"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <p className="text-xs font-medium text-center mb-3" style={{ color: 'var(--text-muted)' }}>
            OTHER OPTIONS
          </p>
          <button className="w-full flex items-center justify-center space-x-2 py-2 border border-danger rounded-lg text-sm text-danger hover:bg-danger/10 transition-colors">
            <Trash2 size={14} />
            <span>Delete transaction</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default TransactionDetail

import { useState, useEffect, useRef } from 'react'
import { api } from '../../utils/api'
import { Search, ChevronRight, ChevronDown, X } from 'lucide-react'

const CATEGORY_TREE = {
  'Income': ['Paychecks', 'Partner 2 Paychecks', 'Business Income', 'Interest', 'Other Income', 'Cash Back Income'],
  'Gifts & Donations': ['Charity', 'Gifts'],
  'Housing': ['Rent', 'Mortgage', 'Home Improvement', 'Furniture & Housewares'],
  'Transportation': ['Gas', 'Auto Payment', 'Auto Maintenance', 'Parking & Tolls'],
  'Food & Dining': ['Groceries + Household Items', 'Restaurants', 'Coffee', 'Alcohol & Bars'],
  'Shopping': ['Clothing', 'Electronics & Software', 'Home Goods', 'General Shopping'],
  'Entertainment': ['Movies & DVDs', 'Music', 'Sports', 'Games'],
  'Health & Fitness': ['Gym', 'Doctor & Dentist', 'Pharmacy', 'Health Insurance'],
  'Utilities': ['Phone', 'Internet & Cable', 'Electric', 'Water', 'Gas & Oil'],
  'Personal Care': ['Hair', 'Spa & Massage'],
  'Education': ['Tuition', 'Books & Supplies'],
  'Travel & Vacation': ['Air Travel', 'Hotels', 'Rental Cars & Taxis'],
  'Taxes': ['Federal Tax', 'State Tax', 'Local Tax'],
  'Fees & Charges': ['Bank Fees', 'ATM Fees', 'Late Fees'],
  'Miscellaneous': ['Uncategorized'],
}

const FILTER_TYPES = [
  { id: 'categories', label: 'Categories' },
  { id: 'merchants', label: 'Merchants' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'tags', label: 'Tags' },
  { id: 'goals', label: 'Goals' },
  { id: 'owners', label: 'Owners' },
  { id: 'amount', label: 'Amount' },
  { id: 'other', label: 'Other' },
]

const OWNERS = ['Primary', 'Partner']

function ReportFilter({ isOpen, onClose, onApply, activeFilters }) {
  const [filterOptions, setFilterOptions] = useState(null)
  const [activeType, setActiveType] = useState('categories')
  const [selected, setSelected] = useState({})
  const [search, setSearch] = useState('')
  const [expandedGroups, setExpandedGroups] = useState({})
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')
  const modalRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      api.getReportFilters().then(setFilterOptions).catch(console.error)
      setSelected(activeFilters || {})
    }
  }, [isOpen, activeFilters])

  useEffect(() => {
    const handleClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose()
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, onClose])

  if (!isOpen) return null

  let totalSelected = Object.values(selected).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
  if (activeType === 'amount') {
    if (amountMin) totalSelected++
    if (amountMax) totalSelected++
  }

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }))
  }

  const toggleSelectAll = (items) => {
    const current = selected[activeType] || []
    const allSelected = items.every(item => current.includes(item))
    if (allSelected) {
      setSelected(prev => ({ ...prev, [activeType]: [] }))
    } else {
      setSelected(prev => ({ ...prev, [activeType]: [...items] }))
    }
  }

  const toggleItem = (item) => {
    const current = selected[activeType] || []
    if (current.includes(item)) {
      setSelected(prev => ({ ...prev, [activeType]: current.filter(i => i !== item) }))
    } else {
      setSelected(prev => ({ ...prev, [activeType]: [...current, item] }))
    }
  }

  const handleClear = () => {
    setSelected({})
    setAmountMin('')
    setAmountMax('')
    setExpandedGroups({})
    setSearch('')
  }

  const handleApply = () => {
    const filters = { ...selected }
    if (activeType === 'amount') {
      if (amountMin || amountMax) {
        filters.amount = { min: amountMin ? parseFloat(amountMin) : null, max: amountMax ? parseFloat(amountMax) : null }
      }
    }
    onApply(filters)
    onClose()
  }

  const renderContent = () => {
    if (activeType === 'categories') {
      return (
        <div className="space-y-0.5">
          <CheckboxItem
            label="Select all"
            checked={Object.values(CATEGORY_TREE).flat().every(item => (selected.categories || []).includes(item))}
            onChange={() => toggleSelectAll(Object.values(CATEGORY_TREE).flat())}
            indeterminate={Object.values(CATEGORY_TREE).flat().some(item => (selected.categories || []).includes(item)) && !Object.values(CATEGORY_TREE).flat().every(item => (selected.categories || []).includes(item))}
          />
          {Object.entries(CATEGORY_TREE).map(([group, children]) => {
            const filtered = children.filter(c => c.toLowerCase().includes(search.toLowerCase()))
            const groupVisible = group.toLowerCase().includes(search.toLowerCase()) || filtered.length > 0
            if (!groupVisible) return null

            const allChildrenSelected = filtered.every(item => (selected.categories || []).includes(item))
            const someChildrenSelected = filtered.some(item => (selected.categories || []).includes(item))
            const isExpanded = expandedGroups[group] !== false

            return (
              <div key={group}>
                <div className="flex items-center">
                  <button
                    onClick={() => toggleGroup(group)}
                    className="w-4 h-4 flex items-center justify-center"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>
                  <CheckboxItem
                    label={group}
                    checked={allChildrenSelected}
                    onChange={() => {
                      const current = selected.categories || []
                      if (allChildrenSelected) {
                        setSelected(prev => ({ ...prev, categories: current.filter(i => !filtered.includes(i)) }))
                      } else {
                        setSelected(prev => ({ ...prev, categories: [...new Set([...current, ...filtered])] }))
                      }
                    }}
                    indeterminate={someChildrenSelected && !allChildrenSelected}
                    bold
                  />
                </div>
                {isExpanded && (
                  <div className="ml-6 space-y-0.5">
                    {filtered.map(child => (
                      <CheckboxItem
                        key={child}
                        label={child}
                        checked={(selected.categories || []).includes(child)}
                        onChange={() => toggleItem('categories', child)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )
    }

    if (activeType === 'amount') {
      return (
        <div className="space-y-4 p-2">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Minimum</label>
            <input
              type="number"
              value={amountMin}
              onChange={(e) => setAmountMin(e.target.value)}
              placeholder="$0"
              className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Maximum</label>
            <input
              type="number"
              value={amountMax}
              onChange={(e) => setAmountMax(e.target.value)}
              placeholder="$No limit"
              className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
      )
    }

    if (activeType === 'owners') {
      const items = OWNERS
      return (
        <div className="space-y-0.5">
          <CheckboxItem
            label="Select all"
            checked={items.every(item => (selected.owners || []).includes(item))}
            onChange={() => toggleSelectAll(items)}
          />
          {items.map(item => (
            <CheckboxItem
              key={item}
              label={item}
              checked={(selected.owners || []).includes(item)}
              onChange={() => toggleItem('owners', item)}
            />
          ))}
        </div>
      )
    }

    if (activeType === 'accounts' && filterOptions?.accounts) {
      const items = filterOptions.accounts.map(a => ({ id: a.id, label: `${a.name} (${a.institution})` }))
      const filtered = items.filter(i => i.label.toLowerCase().includes(search.toLowerCase()))
      return (
        <div className="space-y-0.5">
          <CheckboxItem
            label="Select all"
            checked={items.every(item => (selected.accounts || []).includes(String(item.id)))}
            onChange={() => toggleSelectAll(items.map(i => String(i.id)))}
          />
          {items.map(item => (
            <CheckboxItem
              key={item.id}
              label={item.label}
              checked={(selected.accounts || []).includes(String(item.id))}
              onChange={() => toggleItem('accounts', String(item.id))}
            />
          ))}
        </div>
      )
    }

    if (activeType === 'merchants' && filterOptions?.merchants) {
      const items = filterOptions.merchants.filter(m => m.toLowerCase().includes(search.toLowerCase()))
      return (
        <div className="space-y-0.5">
          <CheckboxItem
            label="Select all"
            checked={filterOptions.merchants.every(m => (selected.merchants || []).includes(m))}
            onChange={() => toggleSelectAll(filterOptions.merchants)}
          />
          {items.map(item => (
            <CheckboxItem
              key={item}
              label={item}
              checked={(selected.merchants || []).includes(item)}
              onChange={() => toggleItem('merchants', item)}
            />
          ))}
        </div>
      )
    }

    if (activeType === 'tags' && filterOptions?.tags) {
      const items = filterOptions.tags.filter(t => t.toLowerCase().includes(search.toLowerCase()))
      return (
        <div className="space-y-0.5">
          <CheckboxItem
            label="Select all"
            checked={filterOptions.tags.every(t => (selected.tags || []).includes(t))}
            onChange={() => toggleSelectAll(filterOptions.tags)}
          />
          {items.map(item => (
            <CheckboxItem
              key={item}
              label={item}
              checked={(selected.tags || []).includes(item)}
              onChange={() => toggleItem('tags', item)}
            />
          ))}
        </div>
      )
    }

    if (activeType === 'goals' && filterOptions?.goals) {
      const items = filterOptions.goals.map(g => ({ id: g.id, label: g.name }))
      return (
        <div className="space-y-0.5">
          <CheckboxItem
            label="Select all"
            checked={items.every(item => (selected.goals || []).includes(String(item.id)))}
            onChange={() => toggleSelectAll(items.map(i => String(i.id)))}
          />
          {items.map(item => (
            <CheckboxItem
              key={item.id}
              label={item.label}
              checked={(selected.goals || []).includes(String(item.id))}
              onChange={() => toggleItem('goals', String(item.id))}
            />
          ))}
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center h-32 text-sm" style={{ color: 'var(--text-muted)' }}>
        No options available
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
      <div
        ref={modalRef}
        className="rounded-xl shadow-2xl flex overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', width: '680px', height: '500px', border: '1px solid var(--border)' }}
      >
        {/* Left Sidebar */}
        <div className="w-36 flex-shrink-0 border-r py-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-page)' }}>
          <p className="px-4 text-xs font-semibold tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>FILTERS</p>
          <div className="space-y-0.5">
            {FILTER_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setActiveType(type.id)}
                className="w-full text-left px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  color: activeType === type.id ? '#6366f1' : 'var(--text-secondary)',
                  backgroundColor: activeType === type.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                }}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center space-x-3">
              {activeType !== 'amount' && activeType !== 'other' && (
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-48 pl-8 pr-3 py-1.5 border rounded-lg text-sm outline-none"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}
                  />
                </div>
              )}
            </div>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {totalSelected} filter{totalSelected !== 1 ? 's' : ''} selected
            </span>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {renderContent()}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={handleClear}
              className="px-4 py-1.5 border rounded-lg text-sm font-medium"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              Clear
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-1.5 border rounded-lg text-sm font-medium"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-5 py-1.5 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: '#ef4444' }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CheckboxItem({ label, checked, onChange, bold, indeterminate }) {
  return (
    <label className="flex items-center space-x-2 py-1 px-1 cursor-pointer rounded hover:bg-bg-hover">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
          style={{ accentColor: '#6366f1' }}
        />
        {indeterminate && !checked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-0.5 rounded" style={{ backgroundColor: '#6366f1' }} />
          </div>
        )}
      </div>
      <span
        className="text-sm"
        style={{ color: 'var(--text-primary)', fontWeight: bold ? 600 : 400 }}
      >
        {label}
      </span>
    </label>
  )
}

export default ReportFilter

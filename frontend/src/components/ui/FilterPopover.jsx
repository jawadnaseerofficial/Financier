import { useState } from 'react'
import { Search, X } from 'lucide-react'

const filterTabs = [
  { id: 'filters', label: 'Filters' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'types', label: 'Types' },
  { id: 'owners', label: 'Owners' },
]

const ownerOptions = [
  { id: 'shared', label: 'Shared', color: '#6b7280' },
  { id: 'demo', label: 'Demo User', color: '#10b981' },
  { id: 'household', label: 'Household Member', color: '#ef4444' },
]

function FilterPopover({ isOpen, onClose, onApply }) {
  const [activeTab, setActiveTab] = useState('owners')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOwners, setSelectedOwners] = useState(['household'])

  function toggleOwner(id) {
    setSelectedOwners((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    )
  }

  function handleClear() {
    setSelectedOwners([])
  }

  function handleApply() {
    onApply({ owners: selectedOwners })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

      {/* Popover */}
      <div
        className="relative w-[600px] max-h-[500px] border rounded-xl shadow-2xl flex overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        {/* Left sidebar - Tabs */}
        <div className="w-32 border-r p-3" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)' }}>Filters</p>
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="w-full text-left px-3 py-2 text-sm rounded-lg mb-1 transition-colors"
              style={{
                backgroundColor: activeTab === tab.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                color: activeTab === tab.id ? '#6366f1' : 'var(--text-secondary)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Middle - Options */}
        <div className="flex-1 p-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2"
              size={14}
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary"
              style={{
                backgroundColor: 'var(--bg-dark)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Select all */}
          <label className="flex items-center space-x-2 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedOwners.length === ownerOptions.length}
              onChange={() => {
                if (selectedOwners.length === ownerOptions.length) {
                  setSelectedOwners([])
                } else {
                  setSelectedOwners(ownerOptions.map((o) => o.id))
                }
              }}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Select all</span>
          </label>

          {/* Owner options */}
          <div className="space-y-2">
            {ownerOptions
              .filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((option) => (
                <label
                  key={option.id}
                  className="flex items-center space-x-2 cursor-pointer py-1"
                >
                  <input
                    type="checkbox"
                    checked={selectedOwners.includes(option.id)}
                    onChange={() => toggleOwner(option.id)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {option.label}
                  </span>
                </label>
              ))}
          </div>
        </div>

        {/* Right sidebar - Selected filters */}
        <div className="w-48 border-l p-4" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {selectedOwners.length} filter selected
            </span>
            {selectedOwners.length > 0 && (
              <button
                onClick={handleClear}
                className="text-sm text-primary hover:text-primary-light"
              >
                Clear
              </button>
            )}
          </div>

          {selectedOwners.length > 0 && (
            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Owners</p>
              {selectedOwners.map((ownerId) => {
                const owner = ownerOptions.find((o) => o.id === ownerId)
                return (
                  <div
                    key={ownerId}
                    className="flex items-center justify-between py-1.5"
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: owner?.color }}
                      />
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {owner?.label}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleOwner(ownerId)}
                      className="p-0.5 rounded hover:opacity-80"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Bottom buttons */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-4 border-t"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
        >
          <button
            onClick={handleClear}
            className="px-4 py-2 border rounded-lg text-sm hover:opacity-80"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            Clear
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-sm hover:opacity-80"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FilterPopover

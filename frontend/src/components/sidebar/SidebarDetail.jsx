import { useNavigate } from 'react-router-dom'

const navigationModules = [
  { id: 'dashboard', label: 'Dashboard', path: '/' },
  { id: 'transactions', label: 'Transactions', path: '/transactions' },
  { id: 'budget', label: 'Budget', path: '/budget' },
  { id: 'recurring', label: 'Recurring', path: '/recurring' },
  { id: 'accounts', label: 'Accounts', path: '/accounts' },
  { id: 'investments', label: 'Investments', path: '/investments' },
  { id: 'goals', label: 'Goals', path: '/goals' },
  { id: 'cashflow', label: 'Cash Flow', path: '/cashflow' },
  { id: 'reports', label: 'Reports', path: '/reports' },
  { id: 'forecasting', label: 'Forecasting', path: '/forecasting' },
]

function SidebarDetail({ isOpen, activeSection }) {
  const navigate = useNavigate()

  if (!isOpen) return null

  return (
    <div
      className="w-60 h-full overflow-hidden flex flex-col border-r"
      style={{
        backgroundColor: 'var(--bg-sidebar)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex-1 overflow-y-auto py-2">
        {navigationModules.map((module) => {
          const isActive = activeSection === module.id

          return (
            <button
              key={module.id}
              onClick={() => navigate(module.path)}
              className="w-full h-11 flex items-center px-4 text-sm font-medium transition-colors"
              style={{
                color: isActive ? '#6366f1' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--text-primary)'
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--text-secondary)'
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              {module.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default SidebarDetail

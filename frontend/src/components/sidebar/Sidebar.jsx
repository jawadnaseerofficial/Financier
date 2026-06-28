import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  CalendarClock,
  Building2,
  LineChart,
  Target,
  BarChart3,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Settings,
  HelpCircle,
  Wallet,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const navigationItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { id: 'transactions', icon: ArrowLeftRight, label: 'Transactions', path: '/transactions' },
  { id: 'budget', icon: PiggyBank, label: 'Budget', path: '/budget' },
  { id: 'recurring', icon: CalendarClock, label: 'Recurring', path: '/recurring' },
  { id: 'accounts', icon: Building2, label: 'Accounts', path: '/accounts' },
  { id: 'investments', icon: LineChart, label: 'Investments', path: '/investments' },
  { id: 'goals', icon: Target, label: 'Goals', path: '/goals' },
  { id: 'cashflow', icon: Wallet, label: 'Cash Flow', path: '/cashflow' },
  { id: 'reports', icon: BarChart3, label: 'Reports', path: '/reports' },
  { id: 'forecasting', icon: TrendingUp, label: 'Forecasting', path: '/forecasting' },
]

function Sidebar({ activeSection, onSectionChange, isDetailOpen, onToggleDetail }) {
  const navigate = useNavigate()

  const handleItemClick = (item) => {
    onSectionChange(item.id)
    navigate(item.path)
  }

  return (
    <div
      className="flex flex-col w-16 h-full border-r"
      style={{
        backgroundColor: 'var(--bg-sidebar)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Navigation Items */}
      <nav className="flex-1 py-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="w-full flex items-center justify-center py-3 transition-colors"
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
              title={item.label}
            >
              <Icon size={20} />
            </button>
          )
        })}
      </nav>

      {/* Toggle Detail Panel */}
      <div className="py-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={onToggleDetail}
          className="w-full flex items-center justify-center py-3 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)'
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)'
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
          title={isDetailOpen ? 'Collapse panel' : 'Expand panel'}
        >
          {isDetailOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
    </div>
  )
}

export default Sidebar

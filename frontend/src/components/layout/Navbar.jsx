import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import NotificationDropdown from '../notifications/NotificationDropdown'
import AIAssistant from '../ai/AIAssistant'
import {
  Search,
  Settings,
  Sun,
  Moon,
  ChevronDown,
  Sparkles,
  User,
  LogOut,
  UserCircle,
} from 'lucide-react'

const pageTitles = {
  '/': 'Dashboard',
  '/transactions': 'Transactions',
  '/accounts': 'Accounts',
  '/budget': 'Budget',
  '/recurring': 'Recurring',
  '/investments': 'Investments',
  '/goals': 'Goals',
  '/cashflow': 'Cash Flow',
  '/reports': 'Reports',
  '/forecasting': 'Forecasting',
}

function Navbar({ currentPath }) {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const [showAI, setShowAI] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const title = pageTitles[currentPath] || 'Dashboard'

  return (
    <>
      <header
        className="h-14 flex items-center justify-between px-6 sticky top-0 z-30 border-b"
        style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-lg transition-colors hover:opacity-80" style={{ color: 'var(--text-secondary)' }} title="Search">
            <Search size={18} />
          </button>

          <NotificationDropdown />

          <button onClick={() => setShowAI(true)} className="p-2 rounded-lg transition-colors hover:opacity-80" style={{ color: 'var(--text-secondary)' }} title="AI Assistant">
            <Sparkles size={18} />
          </button>

          <button onClick={toggleTheme} className="p-2 rounded-lg transition-colors hover:opacity-80" style={{ color: 'var(--text-secondary)' }}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button className="p-2 rounded-lg transition-colors hover:opacity-80" style={{ color: 'var(--text-secondary)' }} title="Settings">
            <Settings size={18} />
          </button>

          <div className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--border)' }} />

          <div className="relative">
            <button onClick={() => setShowProfile(!showProfile)} className="flex items-center space-x-2 p-1.5 rounded-lg transition-colors hover:opacity-80">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white text-xs font-bold">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
              </div>
              <span className="text-sm font-medium hidden sm:block" style={{ color: 'var(--text-primary)' }}>{user?.name?.split(' ')[0]}</span>
              <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
            </button>

            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-xl z-50 overflow-hidden"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                </div>
                <div className="p-1">
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
                    <UserCircle size={16} /> Profile
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>
                    <Settings size={16} /> Settings
                  </button>
                  <button onClick={() => { logout(); setShowProfile(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:opacity-80 text-danger">
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <AIAssistant open={showAI} onClose={() => setShowAI(false)} />
    </>
  )
}

export default Navbar

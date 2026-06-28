import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ThemeProvider } from '../../context/ThemeContext'
import Sidebar from '../sidebar/Sidebar'
import SidebarDetail from '../sidebar/SidebarDetail'
import Navbar from './Navbar'

function Layout({ children }) {
  return (
    <ThemeProvider>
      <LayoutInner>{children}</LayoutInner>
    </ThemeProvider>
  )
}

function LayoutInner({ children }) {
  const location = useLocation()
  const [activeSection, setActiveSection] = useState(() => {
    const path = location.pathname
    if (path === '/') return 'dashboard'
    return path.replace('/', '')
  })
  const [sidebarDetailOpen, setSidebarDetailOpen] = useState(true)

  useEffect(() => {
    const path = location.pathname
    if (path === '/') {
      setActiveSection('dashboard')
    } else {
      setActiveSection(path.replace('/', ''))
    }
  }, [location.pathname])

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }}>
      {/* Navbar - full width at top */}
      <Navbar currentPath={location.pathname} />

      {/* Below navbar: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Icon Rail */}
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isDetailOpen={sidebarDetailOpen}
          onToggleDetail={() => setSidebarDetailOpen(!sidebarDetailOpen)}
        />

        {/* Detail Panel */}
        <SidebarDetail
          isOpen={sidebarDetailOpen}
          activeSection={activeSection}
          onClose={() => setSidebarDetailOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto" style={{ backgroundColor: 'var(--bg-dark)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/layout/Layout'
import AuthPage from './pages/AuthPage'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Budget from './pages/Budget'
import Accounts from './pages/Accounts'
import Recurring from './pages/Recurring'
import Goals from './pages/Goals'
import Investments from './pages/Investments'
import CashFlow from './pages/CashFlow'
import Reports from './pages/Reports'
import Forecasting from './pages/Forecasting'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-page)' }}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-2xl font-bold text-white">F</span>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    </div>
  )
  if (!user) return <AuthPage />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  const prefs = user?.onboarding_completed === false

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" /> : <AuthPage />} />
      <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/auth" />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/budget" element={<Budget />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/recurring" element={<Recurring />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/investments" element={<Investments />} />
              <Route path="/cashflow" element={<CashFlow />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/forecasting" element={<Forecasting />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  )
}

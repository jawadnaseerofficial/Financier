import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { CheckCircle2, ArrowRight, ArrowLeft, Wallet, Target, TrendingUp, Bell } from 'lucide-react'

const STEPS = [
  { title: 'Welcome to Financier', subtitle: 'Let\'s set up your financial dashboard in a few quick steps.' },
  { title: 'Choose your currency', subtitle: 'Select your preferred currency for displaying amounts.' },
  { title: 'Notification preferences', subtitle: 'Choose what alerts you\'d like to receive.' },
  { title: 'All set!', subtitle: 'You\'re ready to start tracking your finances.' },
]

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '\u20ac' },
  { code: 'GBP', name: 'British Pound', symbol: '\u00a3' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '\u00a5' },
  { code: 'INR', name: 'Indian Rupee', symbol: '\u20b9' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs' },
]

export default function Onboarding() {
  const { user, getToken, setUser } = useAuth()
  const [step, setStep] = useState(0)
  const [currency, setCurrency] = useState('USD')
  const [prefs, setPrefs] = useState({
    notification_budget_alerts: true,
    notification_bill_reminders: true,
    notification_weekly_recap: true,
    notification_email: true,
  })
  const [saving, setSaving] = useState(false)

  const savePreferences = async () => {
    setSaving(true)
    try {
      await fetch('/api/auth/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ ...prefs, currency, onboarding_completed: true }),
      })
    } catch (err) { console.error(err) }
    setSaving(false)
  }

  const next = async () => {
    if (step === STEPS.length - 1) {
      await savePreferences()
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  if (step === STEPS.length - 1) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-page)' }}>
        <div className="w-full max-w-lg text-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-success" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>You're all set!</h1>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>Welcome aboard, {user?.name}. Let's build your financial future.</p>
          <button onClick={() => window.location.reload()} className="px-8 py-3 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition inline-flex items-center gap-2">
            Go to Dashboard <ArrowRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-page)' }}>
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className="h-1.5 flex-1 rounded-full transition-colors" style={{ backgroundColor: i <= step ? 'var(--primary)' : 'var(--border)' }} />
          ))}
        </div>

        <div className="rounded-2xl border p-8" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{STEPS[step].title}</h1>
          <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>{STEPS[step].subtitle}</p>

          {step === 0 && (
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Wallet, label: 'Track accounts', desc: 'All your finances in one place' },
                { icon: Target, label: 'Set goals', desc: 'Save for what matters' },
                { icon: TrendingUp, label: 'Budget wisely', desc: 'Stay on top of spending' },
                { icon: Bell, label: 'Smart alerts', desc: 'Never miss a bill' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="p-4 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                  <Icon size={24} className="text-primary mb-2" />
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                </div>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {CURRENCIES.map(c => (
                <button key={c.code} onClick={() => setCurrency(c.code)}
                  className="p-3 rounded-xl border text-left transition-all"
                  style={{ borderColor: currency === c.code ? 'var(--primary)' : 'var(--border)', backgroundColor: currency === c.code ? 'rgba(99,102,241,0.1)' : 'transparent' }}>
                  <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{c.symbol}</span>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{c.name}</p>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {[
                { key: 'notification_budget_alerts', label: 'Budget alerts', desc: 'When you exceed a budget threshold' },
                { key: 'notification_bill_reminders', desc: 'Reminders before bills are due', label: 'Bill reminders' },
                { key: 'notification_weekly_recap', label: 'Weekly recap', desc: 'Summary of your weekly spending' },
                { key: 'notification_email', label: 'Email notifications', desc: 'Receive alerts via email' },
              ].map(({ key, label, desc }) => (
                <label key={key} className="flex items-center justify-between p-3 rounded-xl border cursor-pointer"
                  style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors relative ${prefs[key] ? 'bg-primary' : 'bg-gray-600'}`}
                    onClick={() => setPrefs(p => ({ ...p, [key]: !p[key] }))}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${prefs[key] ? 'translate-x-5' : 'translate-x-1'}`} />
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-8">
            <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
              className="flex items-center gap-1 text-sm disabled:opacity-30" style={{ color: 'var(--text-secondary)' }}>
              <ArrowLeft size={16} /> Back
            </button>
            <button onClick={next} disabled={saving}
              className="px-6 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition flex items-center gap-2 disabled:opacity-50">
              {step === STEPS.length - 2 ? (saving ? 'Saving...' : 'Finish') : 'Continue'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

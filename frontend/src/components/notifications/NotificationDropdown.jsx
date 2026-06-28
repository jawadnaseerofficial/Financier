import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Bell, Check, CheckCheck, X } from 'lucide-react'

export default function NotificationDropdown() {
  const { getToken } = useAuth()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const ref = useRef(null)

  const load = async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.data || [])
      setUnreadCount(data.unreadCount || 0)
    } catch {}
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markRead = async (id) => {
    await fetch(`/api/notifications/${id}/read`, {
      method: 'PUT', headers: { Authorization: `Bearer ${getToken()}` },
    })
    setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x))
    setUnreadCount(c => Math.max(0, c - 1))
  }

  const markAllRead = async () => {
    await fetch('/api/notifications/read-all', {
      method: 'PUT', headers: { Authorization: `Bearer ${getToken()}` },
    })
    setNotifications(n => n.map(x => ({ ...x, is_read: true })))
    setUnreadCount(0)
  }

  const dismiss = async (id) => {
    await fetch(`/api/notifications/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` },
    })
    setNotifications(n => n.filter(x => x.id !== id))
    if (!notifications.find(x => x.id === id)?.is_read) setUnreadCount(c => Math.max(0, c - 1))
  }

  const getIcon = (type) => {
    switch (type) {
      case 'budget_alert': return { emoji: '⚠️', bg: 'rgba(245,158,11,0.1)' }
      case 'bill_reminder': return { emoji: '🔔', bg: 'rgba(99,102,241,0.1)' }
      case 'weekly_recap': return { emoji: '📊', bg: 'rgba(16,185,129,0.1)' }
      default: return { emoji: '📌', bg: 'var(--bg-dark)' }
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:opacity-80 transition" style={{ color: 'var(--text-secondary)' }}>
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-danger text-white text-[10px] flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border shadow-xl z-50 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notifications</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs hover:underline" style={{ color: 'var(--primary)' }}>
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No notifications</div>
            ) : (
              notifications.slice(0, 20).map(n => {
                const icon = getIcon(n.type)
                return (
                  <div key={n.id} className="flex items-start gap-3 p-3 hover:opacity-80 transition border-b"
                    style={{ borderColor: 'var(--border)', opacity: n.is_read ? 0.6 : 1 }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm" style={{ backgroundColor: icon.bg }}>
                      {icon.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{n.message}</p>
                      <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                        {new Date(n.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {!n.is_read && (
                        <button onClick={() => markRead(n.id)} className="p-1 rounded hover:opacity-70" title="Mark read">
                          <Check size={14} className="text-success" />
                        </button>
                      )}
                      <button onClick={() => dismiss(n.id)} className="p-1 rounded hover:opacity-70" title="Dismiss">
                        <X size={14} style={{ color: 'var(--text-muted)' }} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

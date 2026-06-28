import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Sparkles, Send, X, Bot, User } from 'lucide-react'

export default function AIAssistant({ open, onClose }) {
  const { getToken } = useAuth()
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I can help you understand your finances. Ask me anything about your spending, income, goals, or budget.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const q = input.trim()
    setInput('')
    setMessages(m => [...m, { role: 'user', text: q }])
    setLoading(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ question: q }),
      })
      const data = await res.json()
      setMessages(m => [...m, { role: 'assistant', text: data.data?.answer || 'I could not understand that question.' }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: 'Sorry, something went wrong. Please try again.' }])
    }
    setLoading(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="w-full max-w-lg h-[600px] rounded-2xl border flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>AI Assistant</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Ask about your finances</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot size={14} className="text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] p-3 rounded-xl text-sm whitespace-pre-line ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'rounded-bl-sm'
              }`} style={msg.role === 'assistant' ? { backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' } : {}}>
                {msg.text}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                  <User size={14} className="text-white" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot size={14} className="text-primary" />
              </div>
              <div className="p-3 rounded-xl rounded-bl-sm" style={{ backgroundColor: 'var(--bg-dark)' }}>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex gap-2">
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about your spending, income, goals..."
              className="flex-1 px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              style={{ backgroundColor: 'var(--bg-dark)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
            <button onClick={send} disabled={!input.trim() || loading}
              className="px-4 py-2.5 rounded-lg bg-primary text-white disabled:opacity-50 hover:opacity-90 transition">
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

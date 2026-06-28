import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [household, setHousehold] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('financier-token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(res => {
          setUser(res.data.user)
          setHousehold(res.data.household)
        })
        .catch(() => { logout() })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')
    setUser(data.data.user)
    setHousehold(data.data.household)
    setToken(data.data.token)
    localStorage.setItem('financier-token', data.data.token)
    return data.data
  }

  const register = async (email, password, name) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Registration failed')
    setUser(data.data.user)
    setHousehold(data.data.household)
    setToken(data.data.token)
    localStorage.setItem('financier-token', data.data.token)
    return data.data
  }

  const logout = () => {
    setUser(null)
    setHousehold(null)
    setToken(null)
    localStorage.removeItem('financier-token')
  }

  const getToken = () => localStorage.getItem('financier-token')

  return (
    <AuthContext.Provider value={{ user, household, token, loading, login, register, logout, getToken, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

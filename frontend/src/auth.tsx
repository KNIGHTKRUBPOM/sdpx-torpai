/* oxlint-disable react/only-export-components -- provider and hook share one private context */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, tokenStore } from './api'
import type { User } from './types'

interface AuthValue {
  user: User | null; loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (input: { student_id: string; name: string; email: string; password: string }) => Promise<User>
  logout: () => void
}
const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(Boolean(tokenStore.get()))
  useEffect(() => {
    if (!tokenStore.get()) return
    api.me().then(setUser).catch(() => tokenStore.clear()).finally(() => setLoading(false))
  }, [])
  const value = useMemo<AuthValue>(() => ({
    user, loading,
    login: async (email, password) => { const result = await api.login(email, password); tokenStore.set(result.access_token); setUser(result.user); return result.user },
    register: async (input) => { const result = await api.register(input); tokenStore.set(result.access_token); setUser(result.user); return result.user },
    logout: () => { tokenStore.clear(); setUser(null) },
  }), [loading, user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

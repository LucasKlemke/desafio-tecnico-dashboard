import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const STORAGE_KEY = import.meta.env.VITE_STORAGE_KEY || 'auth_session'

type User = {
  id: string
  name: string
  email: string
}

type Session = {
  token: string
  user: User
}

type AuthContextValue = {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as Session) : null
  })

  const navigate = useNavigate()

  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [session])

  async function login(email: string, password: string) {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const data = (await res.json()) as { message?: string }
      throw new Error(data.message ?? 'Email ou senha inválidos')
    }

    const data = (await res.json()) as { accessToken: string; user: User }
    setSession({ token: data.accessToken, user: data.user })
    navigate('/dashboard/products')
  }

  async function register(name: string, email: string, password: string) {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })

    if (!res.ok) {
      const data = (await res.json()) as { message?: string }
      throw new Error(data.message ?? 'Erro ao criar conta')
    }

    const data = (await res.json()) as { accessToken: string; user: User }
    setSession({ token: data.accessToken, user: data.user })
    navigate('/dashboard/products')
  }

  function logout() {
    setSession(null)
    navigate('/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        token: session?.token ?? null,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}

import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // In a real app, you would check for an active session here
    // For now we will rely on login actions to populate user
    const initAuth = async () => {
      try {
        const sessionUser = await authService.getAuthenticatedUser()
        setUser(sessionUser)
      } catch (err) {
        console.error('Failed to restore session', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    initAuth()
  }, [])

  // Override set user to allow Login/Signup to hydrate the context
  const login = (userData) => setUser(userData)
  
  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

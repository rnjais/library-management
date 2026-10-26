import React, { createContext, useState, useEffect } from 'react'
import { STORAGE_KEYS } from '../utils/constants'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore authentication state from localStorage on startup
    try {
      const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN)
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER)

      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      }
    } catch (err) {
      console.error('Failed to parse stored user profile', err)
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = (jwtToken, userProfile) => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, jwtToken)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userProfile))
    setToken(jwtToken)
    setUser(userProfile)
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
    setToken(null)
    setUser(null)
  }

  const isAuthenticated = Boolean(token && user)
  const isAdmin = Boolean(user && (user.role === 'ADMIN' || user.role === 'ROLE_ADMIN'))
  const isMember = Boolean(user && (user.role === 'MEMBER' || user.role === 'ROLE_MEMBER'))

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    isMember,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

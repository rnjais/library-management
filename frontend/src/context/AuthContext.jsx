import React, { createContext, useState, useEffect } from 'react'
import { STORAGE_KEYS } from '../utils/constants'

export const AuthContext = createContext(null)

/**
 * Checks whether a JWT token is malformed or past its expiration timestamp.
 */
const isTokenExpired = (jwtToken) => {
  try {
    const parts = jwtToken.split('.')
    if (parts.length !== 3) return true
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64))
    if (!payload.exp) return false
    return payload.exp * 1000 <= Date.now()
  } catch {
    return true
  }
}

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
        if (isTokenExpired(storedToken)) {
          localStorage.removeItem(STORAGE_KEYS.TOKEN)
          localStorage.removeItem(STORAGE_KEYS.USER)
        } else {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
        }
      }
    } catch (err) {
      console.error('Failed to parse stored user profile', err)
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Sync logout if the Axios interceptor detects an expired/invalid session (HTTP 401)
    const handleUnauthorized = () => {
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
      setToken(null)
      setUser(null)
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
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

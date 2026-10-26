import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from './LoadingSpinner'
import { ROUTES } from '../../utils/constants'

/**
 * Higher-Order Component / Route Wrapper that enforces authentication and role-based access.
 *
 * @param {React.ReactNode} children - The protected element to render if checks pass
 * @param {string} [requiredRole] - Optional role requirement (e.g. 'ADMIN' or 'MEMBER')
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, loading, user, isAdmin } = useAuth()
  const location = useLocation()

  // 1. While initial session is being restored from localStorage, show spinner
  if (loading) {
    return <LoadingSpinner message="Checking session credentials..." />
  }

  // 2. Unauthenticated users are redirected to /login, remembering their intended location
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  // 3. If a specific role is required (e.g. ADMIN), verify user possesses that role
  if (requiredRole) {
    const hasRole =
      (requiredRole === 'ADMIN' && isAdmin) ||
      user?.role === requiredRole ||
      user?.role === `ROLE_${requiredRole}`

    if (!hasRole) {
      // User is logged in but does not have the required permissions
      return <Navigate to={ROUTES.HOME} replace />
    }
  }

  return children
}

export default ProtectedRoute

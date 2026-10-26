import React from 'react'
import { Routes, Route } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import AdminDashboardPage from '../pages/AdminDashboardPage'
import BookCatalogPage from '../pages/BookCatalogPage'
import MemberManagementPage from '../pages/MemberManagementPage'
import BorrowingsPage from '../pages/BorrowingsPage'
import FinesPage from '../pages/FinesPage'
import ReportsPage from '../pages/ReportsPage'
import NotFoundPage from '../pages/NotFoundPage'
import ProtectedRoute from '../components/common/ProtectedRoute'
import { ROUTES } from '../utils/constants'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Public Routes */}
        <Route index element={<HomePage />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.BOOKS} element={<BookCatalogPage />} />

        {/* Member Protected Routes */}
        <Route
          path={ROUTES.MY_BORROWINGS}
          element={
            <ProtectedRoute>
              <BorrowingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.MY_FINES}
          element={
            <ProtectedRoute>
              <FinesPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Protected Routes */}
        <Route
          path={ROUTES.ADMIN_DASHBOARD}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_BOOKS}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <BookCatalogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_MEMBERS}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <MemberManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_BORROWINGS}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <BorrowingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_FINES}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <FinesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN_REPORTS}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes

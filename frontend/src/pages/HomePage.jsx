import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Stack,
  Paper,
  CircularProgress,
} from '@mui/material'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import PeopleIcon from '@mui/icons-material/People'
import HistoryEduIcon from '@mui/icons-material/HistoryEdu'
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'
import SecurityIcon from '@mui/icons-material/Security'
import AssessmentIcon from '@mui/icons-material/Assessment'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../utils/constants'
import api from '../services/api'

/**
 * Modern Public Home & Overview Portal
 */
const HomePage = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user, isAdmin } = useAuth()
  const [backendStatus, setBackendStatus] = useState({
    checking: true,
    online: false,
    message: 'Checking system status...',
  })

  useEffect(() => {
    const checkBackend = async () => {
      try {
        await api.get('/books?page=0&size=1')
        setBackendStatus({
          checking: false,
          online: true,
          message: 'All library services are operational.',
        })
      } catch (err) {
        setBackendStatus({
          checking: false,
          online: false,
          message: 'Library server is currently unreachable. Please try again later.',
        })
      }
    }

    checkBackend()
  }, [])

  const features = [
    {
      title: 'Book Catalog Management',
      description:
        'Explore book titles, check available copies, search by keywords, and filter by categories with pagination and sorting.',
      icon: <MenuBookIcon sx={{ fontSize: 28, color: '#2563eb' }} />,
      actionText: 'Browse Catalog',
      actionPath: ROUTES.BOOKS,
      badge: 'Public & Admin',
      bgColor: '#eff6ff',
    },
    {
      title: 'Member Administration',
      description:
        'Register new library patrons, manage contact info, track membership status, and monitor loan limits.',
      icon: <PeopleIcon sx={{ fontSize: 28, color: '#0284c7' }} />,
      actionText: isAdmin ? 'Manage Members' : 'Member Portal',
      actionPath: isAdmin ? ROUTES.ADMIN_MEMBERS : ROUTES.BOOKS,
      badge: 'Admin Only',
      bgColor: '#e0f2fe',
    },
    {
      title: 'Borrowing & Returns',
      description:
        'Transactional book check-out and return flows with automated real-time inventory decrement and increment.',
      icon: <HistoryEduIcon sx={{ fontSize: 28, color: '#d97706' }} />,
      actionText: 'View Loans',
      actionPath: isAuthenticated ? ROUTES.MY_BORROWINGS : ROUTES.LOGIN,
      badge: 'Circulation',
      bgColor: '#fef3c7',
    },
    {
      title: 'Automated Fine Assessment',
      description:
        'Overdue loans automatically accrue fines at ₹5.00/day. Track unpaid balances and process instant digital payments.',
      icon: <MonetizationOnIcon sx={{ fontSize: 28, color: '#dc2626' }} />,
      actionText: 'View Fines',
      actionPath: isAuthenticated ? ROUTES.MY_FINES : ROUTES.LOGIN,
      badge: '₹5.00 / day',
      bgColor: '#fee2e2',
    },
    {
      title: 'Role-Based Access Control',
      description:
        'Secure authentication and role-based permissions protecting member accounts and administrative operations.',
      icon: <SecurityIcon sx={{ fontSize: 28, color: '#16a34a' }} />,
      actionText: isAuthenticated ? 'Dashboard' : 'Sign In',
      actionPath: isAuthenticated ? (isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.BOOKS) : ROUTES.LOGIN,
      badge: 'Security',
      bgColor: '#dcfce7',
    },
    {
      title: 'Reports & Analytics',
      description:
        'Comprehensive dashboards featuring book inventory stats, patronage numbers, active loan volume, and fine revenues.',
      icon: <AssessmentIcon sx={{ fontSize: 28, color: '#7c3aed' }} />,
      actionText: 'View Reports',
      actionPath: isAdmin ? ROUTES.ADMIN_REPORTS : ROUTES.BOOKS,
      badge: 'Analytics',
      bgColor: '#f3e8ff',
    },
  ]

  return (
    <Box>
      {/* Hero Welcome Banner (Inspired by Image 1 & 2) */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3.5, md: 5.5 },
          mb: 4.5,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #090d16 0%, #172554 45%, #2563eb 100%)',
          color: '#ffffff',
          boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.25)',
        }}
      >
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={8}>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2.5,
                  bgcolor: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LocalLibraryIcon sx={{ fontSize: 22, color: '#ffffff' }} />
              </Box>
              <Chip
                label="Enterprise Library System"
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.16)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                }}
              />
            </Stack>

            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Library Management System
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 620, mb: 3.5, lineHeight: 1.6, fontSize: '1rem' }}>
              {isAuthenticated
                ? `Welcome back, ${user?.name || user?.email}! You are currently authenticated as ${user?.role}. Explore the catalog, manage your active loans, or oversee library circulation.`
                : 'Welcome to the modern Library Management portal. Browse book collections, check out titles, track loan deadlines, and monitor real-time library analytics.'}
            </Typography>

            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button
                variant="contained"
                size="large"
                sx={{
                  bgcolor: '#ffffff',
                  color: '#172554',
                  fontWeight: 700,
                  borderRadius: 2.5,
                  px: 3,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                  '&:hover': { bgcolor: '#f1f5f9' },
                }}
                onClick={() => navigate(ROUTES.BOOKS)}
              >
                Browse Catalog
              </Button>
              {!isAuthenticated ? (
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    color: '#ffffff',
                    borderColor: 'rgba(255,255,255,0.4)',
                    fontWeight: 700,
                    borderRadius: 2.5,
                    px: 3,
                    '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.08)' },
                  }}
                  onClick={() => navigate(ROUTES.LOGIN)}
                >
                  Sign In
                </Button>
              ) : (
                isAdmin && (
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{
                      color: '#ffffff',
                      borderColor: 'rgba(255,255,255,0.4)',
                      fontWeight: 700,
                      borderRadius: 2.5,
                      px: 3,
                      '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.08)' },
                    }}
                    onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}
                  >
                    Admin Dashboard
                  </Button>
                )
              )}
            </Stack>
          </Grid>

          {/* System Health Status Card */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                bgcolor: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.22)',
                borderRadius: 3.5,
                color: '#ffffff',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="caption" sx={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                  System Health
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1.5} my={1.5}>
                  {backendStatus.checking ? (
                    <CircularProgress size={20} sx={{ color: '#ffffff' }} />
                  ) : backendStatus.online ? (
                    <CheckCircleOutlineIcon sx={{ color: '#4ade80', fontSize: 26 }} />
                  ) : (
                    <ErrorOutlineIcon sx={{ color: '#f87171', fontSize: 26 }} />
                  )}
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {backendStatus.online ? 'Online & Healthy' : backendStatus.checking ? 'Checking Status...' : 'Offline'}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ opacity: 0.85, fontSize: '0.8125rem' }}>
                  {backendStatus.message}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Feature Modules Grid */}
      <Box mb={3}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 800, color: '#0f172a' }}>
          System Capabilities
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Explore the core modules for managing books, members, borrowings, fines, and reports.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3.5,
                border: '1px solid #e2e8f0',
                transition: 'transform 180ms ease, box-shadow 180ms ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px -4px rgba(15, 23, 42, 0.08)',
                  borderColor: '#cbd5e1',
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      borderRadius: 2.5,
                      bgcolor: feature.bgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Chip
                    label={feature.badge}
                    size="small"
                    sx={{ fontWeight: 700, fontSize: '0.6875rem', borderRadius: 2 }}
                  />
                </Stack>

                <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 700, color: '#0f172a' }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                  {feature.description}
                </Typography>
              </CardContent>

              <CardActions sx={{ p: 3, pt: 0 }}>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon fontSize="small" />}
                  onClick={() => navigate(feature.actionPath)}
                  sx={{ fontWeight: 700, color: '#2563eb' }}
                >
                  {feature.actionText}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default HomePage

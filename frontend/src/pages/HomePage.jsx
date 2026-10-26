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
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../utils/constants'
import api from '../services/api'

const HomePage = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user, isAdmin } = useAuth()
  const [backendStatus, setBackendStatus] = useState({
    checking: true,
    online: false,
    message: 'Testing connection to Spring Boot backend...',
  })

  useEffect(() => {
    // Probe backend OpenAPI specification to verify live connectivity
    const checkBackend = async () => {
      try {
        const response = await api.get('/books?page=0&size=1')
        setBackendStatus({
          checking: false,
          online: true,
          message: 'Connected to Spring Boot 4.1.2 Backend (Port 8080)',
        })
      } catch (err) {
        setBackendStatus({
          checking: false,
          online: false,
          message:
            'Backend unreachable. Ensure Spring Boot is running on port 8080 (.\\mvnw.cmd spring-boot:run)',
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
      icon: <MenuBookIcon sx={{ fontSize: 36, color: 'primary.main' }} />,
      actionText: 'Browse Catalog',
      actionPath: ROUTES.BOOKS,
      badge: 'Public & Admin',
    },
    {
      title: 'Member Administration',
      description:
        'Register new library patrons, manage contact info, track membership status, and monitor loan limits.',
      icon: <PeopleIcon sx={{ fontSize: 36, color: 'primary.main' }} />,
      actionText: isAdmin ? 'Manage Members' : 'Member Portal',
      actionPath: isAdmin ? ROUTES.ADMIN_MEMBERS : ROUTES.BOOKS,
      badge: 'Admin Only',
    },
    {
      title: 'Borrowing & Returns',
      description:
        'Transactional book check-out and return flows with automated real-time inventory decrement and increment.',
      icon: <HistoryEduIcon sx={{ fontSize: 36, color: 'primary.main' }} />,
      actionText: 'View Loans',
      actionPath: isAuthenticated ? ROUTES.MY_BORROWINGS : ROUTES.LOGIN,
      badge: 'Member & Admin',
    },
    {
      title: 'Automated Fine Assessment',
      description:
        'Overdue loans automatically accrue fines at ₹5.00/day. Track unpaid balances and process instant digital payments.',
      icon: <MonetizationOnIcon sx={{ fontSize: 36, color: 'primary.main' }} />,
      actionText: 'View Fines',
      actionPath: isAuthenticated ? ROUTES.MY_FINES : ROUTES.LOGIN,
      badge: '₹5.00 / day',
    },
    {
      title: 'Stateless JWT Security',
      description:
        'Role-Based Access Control (RBAC) powered by Spring Security 6 with HMAC-SHA256 tokens and BCrypt encryption.',
      icon: <SecurityIcon sx={{ fontSize: 36, color: 'primary.main' }} />,
      actionText: isAuthenticated ? 'Profile' : 'Log In',
      actionPath: isAuthenticated ? ROUTES.HOME : ROUTES.LOGIN,
      badge: 'RBAC Security',
    },
    {
      title: 'Reports & Analytics',
      description:
        'Comprehensive dashboards featuring book inventory stats, patronage numbers, active loan volume, and fine revenues.',
      icon: <AssessmentIcon sx={{ fontSize: 36, color: 'primary.main' }} />,
      actionText: 'View Reports',
      actionPath: isAdmin ? ROUTES.ADMIN_REPORTS : ROUTES.BOOKS,
      badge: 'Admin Reports',
    },
  ]

  return (
    <Box>
      {/* Hero Welcome Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          mb: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #0d9488 100%)',
          color: '#ffffff',
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Chip
              label="Spring Boot 4 + React 18 Architecture"
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: '#ffffff',
                fontWeight: 600,
                mb: 2,
              }}
            />
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 800 }}>
              Library Management System
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 640, mb: 3 }}>
              {isAuthenticated
                ? `Welcome back, ${user?.name || user?.email}! You are currently authenticated with role ${user?.role}. Explore the catalog, check your active book borrowings, or manage library operations.`
                : 'Welcome to the modern Library Management portal. Browse book collections, manage member records, check out books, track overdue loan penalties, and monitor real-time library analytics.'}
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button
                variant="contained"
                size="large"
                sx={{
                  bgcolor: '#ffffff',
                  color: 'primary.main',
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#f1f5f9' },
                }}
                onClick={() => navigate(ROUTES.BOOKS)}
              >
                Browse Catalog
              </Button>
              {!isAuthenticated && (
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    color: '#ffffff',
                    borderColor: 'rgba(255,255,255,0.6)',
                    fontWeight: 700,
                    '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                  onClick={() => navigate(ROUTES.LOGIN)}
                >
                  Sign In
                </Button>
              )}
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            {/* Live Backend Connectivity Card */}
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Backend System Health
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1.5} my={1}>
                  {backendStatus.checking ? (
                    <CircularProgress size={20} sx={{ color: '#ffffff' }} />
                  ) : backendStatus.online ? (
                    <CheckCircleOutlineIcon sx={{ color: '#4ade80', fontSize: 24 }} />
                  ) : (
                    <ErrorOutlineIcon sx={{ color: '#f87171', fontSize: 24 }} />
                  )}
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {backendStatus.online ? 'Online & Healthy' : backendStatus.checking ? 'Checking...' : 'Offline'}
                  </Typography>
                </Stack>
                <Typography variant="caption" sx={{ opacity: 0.85, display: 'block' }}>
                  {backendStatus.message}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Feature Grid */}
      <Box mb={2}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
          System Capabilities
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Explore the modular features connecting this React frontend to the Spring Boot REST API.
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
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  {feature.icon}
                  <Chip label={feature.badge} size="small" variant="outlined" />
                </Stack>
                <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate(feature.actionPath)}
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

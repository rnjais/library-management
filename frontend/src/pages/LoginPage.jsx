import React, { useState } from 'react'
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Checkbox,
  FormControlLabel,
  Grid,
  Link as MuiLink,
} from '@mui/material'
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import authService from '../services/authService'
import { ROUTES } from '../utils/constants'

/**
 * Modern Split-Screen Authentication Layout (Inspired by Reference Image 2 "Winning")
 */
const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    password: '',
  })
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [successNotice, setSuccessNotice] = useState(location.state?.successMessage || null)
  const [loading, setLoading] = useState(false)

  const fromPath = location.state?.from?.pathname

  const validateForm = () => {
    const errors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!formData.email.trim()) {
      errors.email = 'Email address is required'
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
    if (apiError) {
      setApiError(null)
    }
  }

  const handleFillDemo = (email, password) => {
    setFormData({ email, password })
    setFieldErrors({})
    setApiError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError(null)

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const payload = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      }

      const authData = await authService.login(payload)
      login(authData.token, authData.user)

      if (fromPath) {
        navigate(fromPath, { replace: true })
      } else if (authData.user.role === 'ADMIN' || authData.user.role === 'ROLE_ADMIN') {
        navigate(ROUTES.ADMIN_DASHBOARD, { replace: true })
      } else {
        navigate(ROUTES.BOOKS, { replace: true })
      }
    } catch (err) {
      if (err.validationErrors && Object.keys(err.validationErrors).length > 0) {
        setFieldErrors(err.validationErrors)
      } else {
        setApiError(err.message || 'Login failed. Please check your credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 }, display: 'flex', alignItems: 'center', minHeight: '82vh' }}>
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          borderRadius: 4,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          bgcolor: '#ffffff',
          boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08)',
        }}
      >
        <Grid container alignItems="stretch">
          {/* Left Column: Login Form */}
          <Grid item xs={12} md={6} sx={{ p: { xs: 3, sm: 6, lg: 7 } }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
              <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2.5,
                    bgcolor: '#2563eb',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <LocalLibraryIcon sx={{ fontSize: 20 }} />
                </Box>
                <Typography variant="h6" fontWeight={800} color="#0f172a">
                  LibraryMS
                </Typography>
              </Stack>

              <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', mb: 1 }}>
                Welcome back
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter your details to access your library account.
              </Typography>
            </Box>

            {/* Success Alert */}
            {successNotice && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2.5 }} onClose={() => setSuccessNotice(null)}>
                {successNotice}
              </Alert>
            )}

            {/* Error Alert */}
            {apiError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }}>
                {apiError}
              </Alert>
            )}

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                    Email
                  </Typography>
                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    error={Boolean(fieldErrors.email)}
                    helperText={fieldErrors.email}
                    disabled={loading}
                    autoComplete="email"
                    autoFocus
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlinedIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                    Password
                  </Typography>
                  <TextField
                    fullWidth
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    error={Boolean(fieldErrors.password)}
                    helperText={fieldErrors.password}
                    disabled={loading}
                    autoComplete="current-password"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                            sx={{ color: '#64748b' }}
                          >
                            {showPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Remember Me */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#2563eb' } }}
                      />
                    }
                    label={<Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>Remember me</Typography>}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ cursor: 'pointer' }}>
                    Forgot password?
                  </Typography>
                </Stack>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  endIcon={!loading && <ArrowForwardIcon fontSize="small" />}
                  sx={{
                    py: 1.35,
                    bgcolor: '#2563eb',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    borderRadius: 3,
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                    '&:hover': { bgcolor: '#1d4ed8' },
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign in'}
                </Button>
              </Stack>
            </Box>

            {/* Quick Demo Credentials Fill Buttons */}
            <Box sx={{ mt: 3, p: 2, borderRadius: 2.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 1 }}>
                Quick Fill Demo Logins
              </Typography>
              <Stack direction="row" spacing={1.5}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleFillDemo('admin@library.com', 'password123')}
                  sx={{ fontSize: '0.75rem', py: 0.5, borderRadius: 2 }}
                >
                  Fill Admin
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleFillDemo('vihaan.patel2@example.in', 'password123')}
                  sx={{ fontSize: '0.75rem', py: 0.5, borderRadius: 2 }}
                >
                  Fill Member
                </Button>
              </Stack>
            </Box>

            <Box sx={{ mt: 3.5, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <MuiLink
                  component={Link}
                  to={ROUTES.REGISTER}
                  sx={{
                    fontWeight: 700,
                    color: '#2563eb',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Register
                </MuiLink>
              </Typography>
            </Box>
          </Grid>

          {/* Right Column: Hero Showcase Card (Image 2 "Winning" Style) */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              justifyContent: 'space-between',
              p: 6,
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)',
              color: '#ffffff',
            }}
          >
            {/* Top Brand Badge */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={4}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 2,
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <LocalLibraryIcon sx={{ fontSize: 18, color: '#ffffff' }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={800} color="#ffffff">
                  LibraryMS
                </Typography>
              </Stack>

              <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.02em', mb: 2 }}>
                Effortless Library Circulation for Smarter Campuses
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.85)', maxWidth: 440, lineHeight: 1.6 }}>
                Real-time book cataloging, instant patron borrowing, automated fine tracking, and analytics. All in one powerful dashboard.
              </Typography>
            </Box>

            {/* Floating Mini Dashboard Preview Card (Image 2 style) */}
            <Box
              sx={{
                my: 4,
                p: 3,
                borderRadius: 3.5,
                bgcolor: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                System Snapshot
              </Typography>
              <Grid container spacing={2} mt={0.5}>
                <Grid item xs={4}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.1)' }}>
                    <Stack direction="row" alignItems="center" spacing={0.75} mb={0.5}>
                      <MenuBookIcon sx={{ fontSize: 16, color: '#60a5fa' }} />
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        Titles
                      </Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight={800}>
                      232
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.1)' }}>
                    <Stack direction="row" alignItems="center" spacing={0.75} mb={0.5}>
                      <PeopleAltIcon sx={{ fontSize: 16, color: '#4ade80' }} />
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        Members
                      </Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight={800}>
                      54+
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.1)' }}>
                    <Stack direction="row" alignItems="center" spacing={0.75} mb={0.5}>
                      <AssignmentTurnedInIcon sx={{ fontSize: 16, color: '#fbbf24' }} />
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        Loans
                      </Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight={800}>
                      35 Active
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.65)' }}>
              &copy; {new Date().getFullYear()} Library Management System. Secure JWT &amp; Spring Boot Architecture.
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  )
}

export default LoginPage

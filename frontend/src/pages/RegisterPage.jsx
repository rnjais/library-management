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
  Grid,
  Link as MuiLink,
} from '@mui/material'
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary'
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import authService from '../services/authService'
import { ROUTES } from '../utils/constants'

/**
 * Modern Split-Screen Registration Layout (Matching Reference Image 2)
 */
const RegisterPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  const validateForm = () => {
    const errors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!formData.name.trim()) {
      errors.name = 'Full name is required'
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters'
    }

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

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError(null)
    setSuccessMessage(null)

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const registrationPayload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      }

      await authService.register(registrationPayload)
      setSuccessMessage('Registration successful! Signing you in...')

      try {
        const authData = await authService.login({
          email: registrationPayload.email,
          password: registrationPayload.password,
        })
        login(authData.token, authData.user)
        navigate(ROUTES.BOOKS, { replace: true })
      } catch (autoLoginErr) {
        navigate(ROUTES.LOGIN, {
          replace: true,
          state: {
            successMessage: 'Account registered successfully! Please sign in.',
            email: registrationPayload.email,
          },
        })
      }
    } catch (err) {
      if (err.validationErrors && Object.keys(err.validationErrors).length > 0) {
        setFieldErrors(err.validationErrors)
      } else {
        setApiError(err.message || 'Registration failed. Please try again.')
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
          {/* Left Column: Registration Form */}
          <Grid item xs={12} md={6} sx={{ p: { xs: 3, sm: 6, lg: 7 } }}>
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
                Create Account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Register as a member to start borrowing books from the catalog.
              </Typography>
            </Box>

            {successMessage && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2.5 }}>
                {successMessage}
              </Alert>
            )}

            {apiError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }}>
                {apiError}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={2.25}>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                    Full Name
                  </Typography>
                  <TextField
                    fullWidth
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    error={Boolean(fieldErrors.name)}
                    helperText={fieldErrors.name}
                    disabled={loading}
                    autoComplete="name"
                    autoFocus
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutlineIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                    Email Address
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
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    error={Boolean(fieldErrors.password)}
                    helperText={fieldErrors.password}
                    disabled={loading}
                    autoComplete="new-password"
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

                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                    Confirm Password
                  </Typography>
                  <TextField
                    fullWidth
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={Boolean(fieldErrors.confirmPassword)}
                    helperText={fieldErrors.confirmPassword}
                    disabled={loading}
                    autoComplete="new-password"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle confirm password visibility"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            size="small"
                            sx={{ color: '#64748b' }}
                          >
                            {showConfirmPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  endIcon={!loading && <ArrowForwardIcon fontSize="small" />}
                  sx={{
                    mt: 1,
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
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
                </Button>
              </Stack>
            </Box>

            <Box sx={{ mt: 3.5, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <MuiLink
                  component={Link}
                  to={ROUTES.LOGIN}
                  sx={{
                    fontWeight: 700,
                    color: '#2563eb',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Sign in
                </MuiLink>
              </Typography>
            </Box>
          </Grid>

          {/* Right Column: Hero Showcase Card */}
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
                Join our Campus Library Patron Network
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.85)', maxWidth: 440, lineHeight: 1.6 }}>
                Borrow from 200+ curated titles, view loan due dates, track fee settlements, and receive automated return notifications.
              </Typography>

              <Stack spacing={2} mt={4}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <CheckCircleOutlineIcon sx={{ color: '#4ade80', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                    Instant patron profile creation &amp; catalog access
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <CheckCircleOutlineIcon sx={{ color: '#4ade80', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                    Up to 5 simultaneous active book checkouts
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <CheckCircleOutlineIcon sx={{ color: '#4ade80', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                    Automated due date email reminder notices
                  </Typography>
                </Stack>
              </Stack>
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

export default RegisterPage

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
  Link as MuiLink,
} from '@mui/material'
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import LoginIcon from '@mui/icons-material/Login'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import authService from '../services/authService'
import { ROUTES } from '../utils/constants'

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  // Form State - prefill email if coming from registration
  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [successNotice, setSuccessNotice] = useState(location.state?.successMessage || null)
  const [loading, setLoading] = useState(false)

  // Determine where to redirect after successful login
  const fromPath = location.state?.from?.pathname

  // Client-side validation function
  const validateForm = () => {
    const errors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!formData.email.trim()) {
      errors.email = 'Email address is required'
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address (e.g. user@example.com)'
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

    // Clear field-specific error as user types
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

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Payload matching backend LoginRequestDto: { email, password }
      const payload = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      }

      // Backend returns AuthResponseDto: { token, tokenType, user }
      const authData = await authService.login(payload)

      // Store in AuthContext (persists to localStorage)
      login(authData.token, authData.user)

      // Redirect to origin target if one existed, or based on user role
      if (fromPath) {
        navigate(fromPath, { replace: true })
      } else if (authData.user.role === 'ADMIN' || authData.user.role === 'ROLE_ADMIN') {
        navigate(ROUTES.ADMIN_DASHBOARD, { replace: true })
      } else {
        navigate(ROUTES.BOOKS, { replace: true })
      }
    } catch (err) {
      // Extract backend ErrorResponse or network error
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
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Header Branding */}
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            bgcolor: 'primary.light',
            color: 'primary.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1.5,
          }}
        >
          <LocalLibraryIcon fontSize="medium" />
        </Box>

        <Typography variant="h5" component="h1" fontWeight={700} gutterBottom>
          Sign In
        </Typography>

        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
          Access your library account, borrowed books, and renewals.
        </Typography>

        {/* Success Banner */}
        {successNotice && (
          <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
            {successNotice}
          </Alert>
        )}

        {/* Global Error Banner */}
        {apiError && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {apiError}
          </Alert>
        )}

        {/* Login Form */}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
          <Stack spacing={2.5}>
            {/* Email Field */}
            <TextField
              required
              fullWidth
              id="email"
              name="email"
              label="Email Address"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              error={Boolean(fieldErrors.email)}
              helperText={fieldErrors.email}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />

            {/* Password Field */}
            <TextField
              required
              fullWidth
              id="password"
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              error={Boolean(fieldErrors.password)}
              helperText={fieldErrors.password}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      size="small"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
              sx={{ py: 1.2, fontWeight: 600 }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </Stack>
        </Box>

        <Divider sx={{ width: '100%', my: 3 }} />

        {/* Registration Link */}
        <Typography variant="body2" color="text.secondary">
          Don't have an account?{' '}
          <MuiLink
            component={Link}
            to={ROUTES.REGISTER}
            underline="hover"
            fontWeight={600}
            color="primary"
          >
            Register here
          </MuiLink>
        </Typography>
      </Paper>
    </Container>
  )
}

export default LoginPage

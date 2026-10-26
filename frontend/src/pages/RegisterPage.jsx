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
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import authService from '../services/authService'
import { ROUTES } from '../utils/constants'

const RegisterPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  // Form State
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

  // Client-side validation function
  const validateForm = () => {
    const errors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!formData.name.trim()) {
      errors.name = 'Full name is required'
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters'
    } else if (formData.name.trim().length > 150) {
      errors.name = 'Name cannot exceed 150 characters'
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required'
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address (e.g. user@example.com)'
    } else if (formData.email.trim().length > 150) {
      errors.email = 'Email cannot exceed 150 characters'
    }

    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    } else if (formData.password.length > 50) {
      errors.password = 'Password cannot exceed 50 characters'
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
    setSuccessMessage(null)

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // 1. Submit registration payload matching backend RegisterRequestDto: { name, email, password }
      const registrationPayload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      }

      await authService.register(registrationPayload)
      setSuccessMessage('Registration successful! Signing you in...')

      // 2. Automatically log user in upon successful account creation
      try {
        const authData = await authService.login({
          email: registrationPayload.email,
          password: registrationPayload.password,
        })
        login(authData.token, authData.user)
        navigate(ROUTES.BOOKS, { replace: true })
      } catch (autoLoginErr) {
        // Fallback: Navigate to /login with prefilled email and success message
        navigate(ROUTES.LOGIN, {
          replace: true,
          state: {
            successMessage: 'Account registered successfully! Please sign in.',
            email: registrationPayload.email,
          },
        })
      }
    } catch (err) {
      // Capture 409 Conflict (Duplicate email) or 400 validation errors
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
        {/* Header Icon */}
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            bgcolor: 'secondary.light',
            color: 'secondary.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1.5,
          }}
        >
          <PersonAddIcon fontSize="medium" />
        </Box>

        <Typography variant="h5" component="h1" fontWeight={700} gutterBottom>
          Create Account
        </Typography>

        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
          Join the Library to borrow books, track loans, and manage renewals.
        </Typography>

        {/* Global Error Banner */}
        {apiError && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {apiError}
          </Alert>
        )}

        {/* Success Banner */}
        {successMessage && (
          <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {/* Registration Form */}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
          <Stack spacing={2.5}>
            {/* Full Name */}
            <TextField
              required
              fullWidth
              id="name"
              name="name"
              label="Full Name"
              autoComplete="name"
              autoFocus
              value={formData.name}
              onChange={handleChange}
              error={Boolean(fieldErrors.name)}
              helperText={fieldErrors.name}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />

            {/* Email Address */}
            <TextField
              required
              fullWidth
              id="email"
              name="email"
              label="Email Address"
              autoComplete="email"
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

            {/* Password */}
            <TextField
              required
              fullWidth
              id="password"
              name="password"
              label="Password (min. 6 characters)"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
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

            {/* Confirm Password */}
            <TextField
              required
              fullWidth
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={Boolean(fieldErrors.confirmPassword)}
              helperText={fieldErrors.confirmPassword}
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
                      aria-label="toggle confirm password visibility"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      edge="end"
                      size="small"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
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
              color="primary"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PersonAddIcon />}
              sx={{ py: 1.2, fontWeight: 600 }}
            >
              {loading ? 'Creating Account...' : 'Register'}
            </Button>
          </Stack>
        </Box>

        <Divider sx={{ width: '100%', my: 3 }} />

        {/* Link back to Sign In */}
        <Typography variant="body2" color="text.secondary">
          Already have an account?{' '}
          <MuiLink
            component={Link}
            to={ROUTES.LOGIN}
            underline="hover"
            fontWeight={600}
            color="primary"
          >
            Sign in here
          </MuiLink>
        </Typography>
      </Paper>
    </Container>
  )
}

export default RegisterPage

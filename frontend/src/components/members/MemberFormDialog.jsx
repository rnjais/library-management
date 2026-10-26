import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
  Box,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import memberService from '../../services/memberService'

const MemberFormDialog = ({ open, onClose, memberToEdit, onMemberSaved }) => {
  const isEditing = Boolean(memberToEdit)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    active: true,
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (memberToEdit) {
      setFormData({
        firstName: memberToEdit.firstName || '',
        lastName: memberToEdit.lastName || '',
        email: memberToEdit.email || '',
        phoneNumber: memberToEdit.phoneNumber || '',
        address: memberToEdit.address || '',
        active: memberToEdit.active ?? true,
      })
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        address: '',
        active: true,
      })
    }
    setFieldErrors({})
    setApiError(null)
  }, [memberToEdit, open])

  const validate = () => {
    const errors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phoneRegex = /^[+0-9\-\s()]{7,20}$/

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required'
    } else if (formData.firstName.length > 100) {
      errors.firstName = 'First name cannot exceed 100 characters'
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required'
    } else if (formData.lastName.length > 100) {
      errors.lastName = 'Last name cannot exceed 100 characters'
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required'
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email address'
    } else if (formData.email.length > 150) {
      errors.email = 'Email cannot exceed 150 characters'
    }

    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required'
    } else if (!phoneRegex.test(formData.phoneNumber.trim())) {
      errors.phoneNumber = 'Phone must be a valid format between 7 and 20 digits'
    }

    if (formData.address && formData.address.length > 255) {
      errors.address = 'Address cannot exceed 255 characters'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
    if (apiError) {
      setApiError(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setApiError(null)

    const payload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      phoneNumber: formData.phoneNumber.trim(),
      address: formData.address.trim() || null,
      active: formData.active,
    }

    try {
      if (isEditing) {
        await memberService.updateMember(memberToEdit.id, payload)
      } else {
        await memberService.registerMember(payload)
      }
      onMemberSaved(isEditing ? 'Member profile updated successfully' : 'New member registered successfully')
      onClose()
    } catch (err) {
      if (err.validationErrors && Object.keys(err.validationErrors).length > 0) {
        setFieldErrors(err.validationErrors)
      } else {
        setApiError(err.message || 'Operation failed. Please check form inputs.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight={700}>
        {isEditing ? `Edit Member: ${memberToEdit?.fullName}` : 'Register New Member'}
      </DialogTitle>

      <DialogContent dividers>
        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}

        <Box component="form" id="member-form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            {/* First Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="firstName"
                name="firstName"
                label="First Name"
                value={formData.firstName}
                onChange={handleChange}
                error={Boolean(fieldErrors.firstName)}
                helperText={fieldErrors.firstName}
                disabled={loading}
              />
            </Grid>

            {/* Last Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="lastName"
                name="lastName"
                label="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                error={Boolean(fieldErrors.lastName)}
                helperText={fieldErrors.lastName}
                disabled={loading}
              />
            </Grid>

            {/* Email Address */}
            <Grid item xs={12}>
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
              />
            </Grid>

            {/* Phone Number */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="phoneNumber"
                name="phoneNumber"
                label="Phone Number (e.g. +91 9876543210)"
                value={formData.phoneNumber}
                onChange={handleChange}
                error={Boolean(fieldErrors.phoneNumber)}
                helperText={fieldErrors.phoneNumber}
                disabled={loading}
              />
            </Grid>

            {/* Address */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                id="address"
                name="address"
                label="Residential Address (Optional)"
                value={formData.address}
                onChange={handleChange}
                error={Boolean(fieldErrors.address)}
                helperText={fieldErrors.address}
                disabled={loading}
              />
            </Grid>

            {/* Active Membership Toggle */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active}
                    onChange={handleChange}
                    name="active"
                    color="primary"
                    disabled={loading}
                  />
                }
                label={formData.active ? 'Membership Status: Active' : 'Membership Status: Inactive'}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button
          type="submit"
          form="member-form"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
        >
          {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Register Member'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default MemberFormDialog

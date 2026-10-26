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
  MenuItem,
  Typography,
  Box,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import borrowingService from '../../services/borrowingService'
import bookService from '../../services/bookService'
import memberService from '../../services/memberService'
import { useAuth } from '../../hooks/useAuth'

const BorrowBookDialog = ({ open, onClose, preselectedBook, onBorrowSuccess }) => {
  const { user, isAdmin } = useAuth()

  const [booksList, setBooksList] = useState([])
  const [membersList, setMembersList] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  const [formData, setFormData] = useState({
    bookId: '',
    memberId: '',
    borrowDays: 14,
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Fetch available books & active members when dialog opens
  useEffect(() => {
    if (!open) return

    const loadOptions = async () => {
      setLoadingOptions(true)
      try {
        // Fetch books with available copies
        const booksData = await bookService.getBooks({ size: 100, sortBy: 'title' })
        setBooksList(booksData.content || [])

        // If admin, fetch active members list
        if (isAdmin) {
          const membersData = await memberService.getActiveMembers({ size: 100, sortBy: 'firstName' })
          setMembersList(membersData.content || [])
        }
      } catch (err) {
        console.error('Failed to load dialog options', err)
      } finally {
        setLoadingOptions(false)
      }
    }

    loadOptions()

    setFormData({
      bookId: preselectedBook?.id || '',
      memberId: !isAdmin && user?.id ? user.id : '',
      borrowDays: 14,
    })
    setFieldErrors({})
    setApiError(null)
  }, [open, preselectedBook, isAdmin, user])

  const validate = () => {
    const errors = {}

    if (!formData.bookId) {
      errors.bookId = 'Please select a book to borrow'
    }

    if (!formData.memberId) {
      errors.memberId = 'Member ID is required'
    }

    const days = parseInt(formData.borrowDays, 10)
    if (isNaN(days) || days < 1 || days > 90) {
      errors.borrowDays = 'Borrow period must be between 1 and 90 days'
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
    if (!validate()) return

    setSubmitting(true)
    setApiError(null)

    const payload = {
      bookId: Number(formData.bookId),
      memberId: Number(formData.memberId),
      borrowDays: Number(formData.borrowDays),
    }

    try {
      const response = await borrowingService.borrowBook(payload)
      onBorrowSuccess(
        `Loan issued successfully: "${response.book?.title || 'Book'}" checked out to ${response.member?.fullName || 'Member'}.`
      )
      onClose()
    } catch (err) {
      if (err.validationErrors && Object.keys(err.validationErrors).length > 0) {
        setFieldErrors(err.validationErrors)
      } else {
        setApiError(err.message || 'Failed to borrow book. Verify inventory and member status.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight={700}>
        Check Out / Issue Book Loan
      </DialogTitle>

      <DialogContent dividers>
        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}

        {loadingOptions && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Loading catalog books and member roster...
          </Typography>
        )}

        <Box component="form" id="borrow-form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <Grid container spacing={2.5}>
            {/* Book Selector */}
            <Grid item xs={12}>
              <TextField
                select
                required
                fullWidth
                id="bookId"
                name="bookId"
                label="Select Book"
                value={formData.bookId}
                onChange={handleChange}
                error={Boolean(fieldErrors.bookId)}
                helperText={fieldErrors.bookId}
                disabled={submitting || Boolean(preselectedBook)}
              >
                {booksList.map((b) => (
                  <MenuItem key={b.id} value={b.id} disabled={b.availableCopies <= 0}>
                    {b.title} by {b.author} ({b.availableCopies} available)
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Member Selector (Admin) or Member ID display */}
            <Grid item xs={12}>
              {isAdmin ? (
                <TextField
                  select
                  required
                  fullWidth
                  id="memberId"
                  name="memberId"
                  label="Select Active Member"
                  value={formData.memberId}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.memberId)}
                  helperText={fieldErrors.memberId || 'Only active members can borrow books'}
                  disabled={submitting}
                >
                  {membersList.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.fullName} (#{m.id}) - {m.email}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField
                  required
                  fullWidth
                  id="memberId"
                  name="memberId"
                  label="Member ID"
                  value={formData.memberId}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.memberId)}
                  helperText={fieldErrors.memberId}
                  disabled={submitting || Boolean(user?.id)}
                />
              )}
            </Grid>

            {/* Borrow Days */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                type="number"
                id="borrowDays"
                name="borrowDays"
                label="Loan Period (in days)"
                value={formData.borrowDays}
                onChange={handleChange}
                error={Boolean(fieldErrors.borrowDays)}
                helperText={fieldErrors.borrowDays || 'Standard duration is 14 days (1 to 90 days allowed)'}
                disabled={submitting}
                inputProps={{ min: 1, max: 90 }}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={submitting} color="inherit">
          Cancel
        </Button>
        <Button
          type="submit"
          form="borrow-form"
          variant="contained"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
        >
          {submitting ? 'Processing Loan...' : 'Confirm Checkout'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BorrowBookDialog

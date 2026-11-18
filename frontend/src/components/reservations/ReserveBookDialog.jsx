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
  Typography,
  Box,
  Autocomplete,
  Stack,
  Card,
  CardContent,
} from '@mui/material'
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined'
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded'
import reservationService from '../../services/reservationService'
import bookService from '../../services/bookService'
import memberService from '../../services/memberService'
import { useAuth } from '../../hooks/useAuth'

/**
 * Modern Reservation / Waitlist Dialog with real-time patron selection and queue transparency.
 */
const ReserveBookDialog = ({ open, onClose, preselectedBook, onReservationSuccess }) => {
  const { user, isAdmin } = useAuth()

  const [booksList, setBooksList] = useState([])
  const [membersList, setMembersList] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  const [formData, setFormData] = useState({
    bookId: '',
    memberId: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return

    const loadOptions = async () => {
      setLoadingOptions(true)
      try {
        const booksData = await bookService.getBooks({ size: 1000, sortBy: 'title' })
        const fetchedBooks = booksData.content || []
        if (preselectedBook && !fetchedBooks.some((b) => b.id === preselectedBook.id)) {
          setBooksList([preselectedBook, ...fetchedBooks])
        } else {
          setBooksList(fetchedBooks)
        }

        if (isAdmin) {
          const membersData = await memberService.getActiveMembers({ size: 1000, sortBy: 'firstName' })
          setMembersList(membersData.content || [])
        }
      } catch (err) {
        console.error('Failed to load reservation dialog options', err)
      } finally {
        setLoadingOptions(false)
      }
    }

    loadOptions()

    setFormData({
      bookId: preselectedBook?.id || '',
      memberId: !isAdmin ? (user?.memberId || user?.id || '') : '',
    })
    setFieldErrors({})
    setApiError(null)
  }, [open, preselectedBook, isAdmin, user])

  const validate = () => {
    const errors = {}
    if (!formData.bookId) {
      errors.bookId = 'Please select a book to reserve'
    }
    if (isAdmin && !formData.memberId) {
      errors.memberId = 'Member selection is required for administrators'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setApiError(null)

    try {
      const payload = {
        bookId: Number(formData.bookId),
        ...(isAdmin && formData.memberId ? { memberId: Number(formData.memberId) } : {}),
      }

      const res = await reservationService.createReservation(payload)
      if (onReservationSuccess) {
        onReservationSuccess(res.data)
      }
      onClose()
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to place reservation. Please try again.'
      setApiError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedBook = booksList.find((b) => b.id === formData.bookId) || preselectedBook

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          color: 'text.primary',
          pb: 1,
          pt: 3,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: 'warning.lighter',
            color: 'warning.main',
          }}
        >
          <HourglassTopRoundedIcon fontSize="small" />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Join Waitlist / Reserve Book
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Get queued for checkout as soon as the next copy is returned
          </Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ px: 3, py: 2 }}>
          {apiError && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setApiError(null)}>
              {apiError}
            </Alert>
          )}

          <Grid container spacing={2.5}>
            {/* Book Selection / AutoComplete */}
            <Grid item xs={12}>
              <Autocomplete
                id="reserve-book-select"
                options={booksList}
                loading={loadingOptions}
                getOptionLabel={(option) => `${option.title} (${option.author})`}
                value={selectedBook || null}
                onChange={(_, newValue) => {
                  setFormData((prev) => ({ ...prev, bookId: newValue ? newValue.id : '' }))
                  if (fieldErrors.bookId) {
                    setFieldErrors((prev) => ({ ...prev, bookId: null }))
                  }
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Book"
                    required
                    error={Boolean(fieldErrors.bookId)}
                    helperText={fieldErrors.bookId}
                    placeholder="Search by title or author..."
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <React.Fragment>
                          {loadingOptions ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </React.Fragment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            {/* Selected Book Info Card */}
            {selectedBook && (
              <Grid item xs={12}>
                <Card
                  variant="outlined"
                  sx={{
                    bgcolor: 'grey.50',
                    borderRadius: 2,
                    borderColor: 'divider',
                  }}
                >
                  <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                        {selectedBook.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Author: <strong>{selectedBook.author}</strong> • ISBN: {selectedBook.isbn}
                      </Typography>
                      <Typography variant="caption" color="warning.main" fontWeight={600}>
                        Inventory: {selectedBook.availableCopies || 0} / {selectedBook.totalCopies || 0} copies available
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Member Selection (Only for Admin) */}
            {isAdmin && (
              <Grid item xs={12}>
                <Autocomplete
                  id="reserve-member-select"
                  options={membersList}
                  loading={loadingOptions}
                  getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
                  value={membersList.find((m) => m.id === formData.memberId) || null}
                  onChange={(_, newValue) => {
                    setFormData((prev) => ({ ...prev, memberId: newValue ? newValue.id : '' }))
                    if (fieldErrors.memberId) {
                      setFieldErrors((prev) => ({ ...prev, memberId: null }))
                    }
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Library Member"
                      required
                      error={Boolean(fieldErrors.memberId)}
                      helperText={fieldErrors.memberId || 'Assign reservation to a patron'}
                      placeholder="Search member by name or email..."
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <React.Fragment>
                            {loadingOptions ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </React.Fragment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
            )}

            {/* Policy Explainer */}
            <Grid item xs={12}>
              <Alert severity="info" sx={{ borderRadius: 2, fontSize: '0.8125rem' }}>
                Reservations are organized in a strict <strong>First-In, First-Out (FIFO) queue</strong>. When a copy is returned, it is automatically marked <strong>Ready for Pickup</strong> and held for 48 hours for the first waitlisted patron.
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
          <Button onClick={onClose} color="inherit" disabled={submitting} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={submitting || !formData.bookId}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <BookmarkAddOutlinedIcon />}
            sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}
          >
            {submitting ? 'Placing Reservation...' : 'Confirm Reservation'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default ReserveBookDialog

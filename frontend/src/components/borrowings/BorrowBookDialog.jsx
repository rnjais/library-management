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
} from '@mui/material'
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined'
import borrowingService from '../../services/borrowingService'
import bookService from '../../services/bookService'
import memberService from '../../services/memberService'
import { useAuth } from '../../hooks/useAuth'

/**
 * Searchable Borrow Book Dialog with Autocomplete (Instant lookup across all catalog titles)
 */
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
        console.error('Failed to load dialog options', err)
      } finally {
        setLoadingOptions(false)
      }
    }

    loadOptions()

    setFormData({
      bookId: preselectedBook?.id || '',
      memberId: !isAdmin ? (user?.memberId || user?.id || '') : '',
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
      errors.memberId = 'Member is required'
    }

    const days = parseInt(formData.borrowDays, 10)
    if (isNaN(days) || days < 1 || days > 90) {
      errors.borrowDays = 'Borrow period must be between 1 and 90 days'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
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
        `Book checked out successfully: "${response.book?.title || 'Book'}" issued to ${response.member?.fullName || 'Member'}.`
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

  const selectedBook = booksList.find((b) => Number(b.id) === Number(formData.bookId)) || null
  const selectedMember = membersList.find((m) => Number(m.id) === Number(formData.memberId)) || null

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3.5 } }}>
      <DialogTitle sx={{ px: 3, pt: 3, pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BookmarkAddOutlinedIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              {isAdmin ? 'Check Out / Issue Book' : 'Borrow a Book'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isAdmin ? 'Select catalog book and active patron member' : 'Check out a copy for your account'}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        {apiError && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
            {apiError}
          </Alert>
        )}

        <Box component="form" id="borrow-form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <Stack spacing={2.5}>
            {/* Searchable Book Autocomplete */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.75, display: 'block' }}>
                Book Title (Searchable)
              </Typography>
              <Autocomplete
                id="book-select"
                options={booksList}
                loading={loadingOptions}
                getOptionLabel={(option) => `${option.title} — ${option.author} (${option.availableCopies} available)`}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                value={selectedBook}
                onChange={(event, newValue) => {
                  setFormData((prev) => ({ ...prev, bookId: newValue ? newValue.id : '' }))
                  if (fieldErrors.bookId) setFieldErrors((prev) => ({ ...prev, bookId: '' }))
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Type to search by title or author..."
                    error={Boolean(fieldErrors.bookId)}
                    helperText={fieldErrors.bookId}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingOptions ? <CircularProgress color="inherit" size={18} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Box>

            {/* Admin Member Selector with Autocomplete */}
            {isAdmin ? (
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.75, display: 'block' }}>
                  Patron Member (Searchable)
                </Typography>
                <Autocomplete
                  id="member-select"
                  options={membersList}
                  loading={loadingOptions}
                  getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  value={selectedMember}
                  onChange={(event, newValue) => {
                    setFormData((prev) => ({ ...prev, memberId: newValue ? newValue.id : '' }))
                    if (fieldErrors.memberId) setFieldErrors((prev) => ({ ...prev, memberId: '' }))
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Type member name or email..."
                      error={Boolean(fieldErrors.memberId)}
                      helperText={fieldErrors.memberId}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingOptions ? <CircularProgress color="inherit" size={18} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Box>
            ) : (
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Borrowing as logged-in patron:
                </Typography>
                <Typography variant="body2" fontWeight={700} color="#0f172a">
                  {user?.name || user?.email}
                </Typography>
              </Box>
            )}

            {/* Borrow Days Duration */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.75, display: 'block' }}>
                Loan Duration (Days)
              </Typography>
              <TextField
                fullWidth
                id="borrowDays"
                name="borrowDays"
                type="number"
                value={formData.borrowDays}
                onChange={(e) => setFormData((prev) => ({ ...prev, borrowDays: e.target.value }))}
                error={Boolean(fieldErrors.borrowDays)}
                helperText={fieldErrors.borrowDays || 'Default: 14 days (Max: 90 days)'}
                inputProps={{ min: 1, max: 90 }}
              />
            </Box>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ fontWeight: 600, color: '#64748b' }}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="borrow-form"
          variant="contained"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{
            fontWeight: 700,
            borderRadius: 2.5,
            bgcolor: '#2563eb',
            px: 3,
            '&:hover': { bgcolor: '#1d4ed8' },
          }}
        >
          {submitting ? 'Issuing Loan...' : 'Confirm Loan'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BorrowBookDialog

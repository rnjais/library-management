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
  Stack,
  MenuItem,
  Box,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import bookService from '../../services/bookService'

const CATEGORIES = [
  'Computer Science',
  'Software Engineering',
  'Data Science & AI',
  'Mathematics',
  'Physics',
  'Philosophy',
  'Literature & Fiction',
  'History',
  'Business & Economics',
  'General Science',
  'Other',
]

const BookFormDialog = ({ open, onClose, bookToEdit, onBookSaved }) => {
  const isEditing = Boolean(bookToEdit)

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Computer Science',
    totalCopies: 5,
    availableCopies: 5,
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (bookToEdit) {
      setFormData({
        title: bookToEdit.title || '',
        author: bookToEdit.author || '',
        isbn: bookToEdit.isbn || '',
        category: bookToEdit.category || 'Computer Science',
        totalCopies: bookToEdit.totalCopies ?? 1,
        availableCopies: bookToEdit.availableCopies ?? 1,
      })
    } else {
      setFormData({
        title: '',
        author: '',
        isbn: '',
        category: 'Computer Science',
        totalCopies: 5,
        availableCopies: 5,
      })
    }
    setFieldErrors({})
    setApiError(null)
  }, [bookToEdit, open])

  const validate = () => {
    const errors = {}

    if (!formData.title.trim()) {
      errors.title = 'Title is required'
    } else if (formData.title.length > 255) {
      errors.title = 'Title cannot exceed 255 characters'
    }

    if (!formData.author.trim()) {
      errors.author = 'Author is required'
    } else if (formData.author.length > 255) {
      errors.author = 'Author cannot exceed 255 characters'
    }

    if (!formData.isbn.trim()) {
      errors.isbn = 'ISBN is required'
    } else if (formData.isbn.trim().length < 10 || formData.isbn.trim().length > 20) {
      errors.isbn = 'ISBN must be between 10 and 20 characters'
    }

    if (!formData.category.trim()) {
      errors.category = 'Category is required'
    }

    const total = parseInt(formData.totalCopies, 10)
    if (isNaN(total) || total < 0) {
      errors.totalCopies = 'Total copies must be zero or positive'
    }

    const available = parseInt(formData.availableCopies, 10)
    if (isNaN(available) || available < 0) {
      errors.availableCopies = 'Available copies must be zero or positive'
    } else if (available > total) {
      errors.availableCopies = 'Available copies cannot exceed total copies'
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

    setLoading(true)
    setApiError(null)

    const payload = {
      title: formData.title.trim(),
      author: formData.author.trim(),
      isbn: formData.isbn.trim(),
      category: formData.category.trim(),
      totalCopies: parseInt(formData.totalCopies, 10),
      availableCopies: parseInt(formData.availableCopies, 10),
    }

    try {
      if (isEditing) {
        await bookService.updateBook(bookToEdit.id, payload)
      } else {
        await bookService.addBook(payload)
      }
      onBookSaved(isEditing ? 'Book updated successfully' : 'Book added to catalog')
      onClose()
    } catch (err) {
      if (err.validationErrors && Object.keys(err.validationErrors).length > 0) {
        setFieldErrors(err.validationErrors)
      } else {
        setApiError(err.message || 'Operation failed. Please check form values.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight={700}>
        {isEditing ? `Edit Book: ${bookToEdit?.title}` : 'Add New Book to Catalog'}
      </DialogTitle>

      <DialogContent dividers>
        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}

        <Box component="form" id="book-form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            {/* Title */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="title"
                name="title"
                label="Book Title"
                value={formData.title}
                onChange={handleChange}
                error={Boolean(fieldErrors.title)}
                helperText={fieldErrors.title}
                disabled={loading}
              />
            </Grid>

            {/* Author */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="author"
                name="author"
                label="Author"
                value={formData.author}
                onChange={handleChange}
                error={Boolean(fieldErrors.author)}
                helperText={fieldErrors.author}
                disabled={loading}
              />
            </Grid>

            {/* ISBN */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="isbn"
                name="isbn"
                label="ISBN (10-20 chars)"
                value={formData.isbn}
                onChange={handleChange}
                error={Boolean(fieldErrors.isbn)}
                helperText={fieldErrors.isbn}
                disabled={loading}
              />
            </Grid>

            {/* Category */}
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                id="category"
                name="category"
                label="Category"
                value={formData.category}
                onChange={handleChange}
                error={Boolean(fieldErrors.category)}
                helperText={fieldErrors.category}
                disabled={loading}
              >
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Total Copies */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="number"
                id="totalCopies"
                name="totalCopies"
                label="Total Copies"
                value={formData.totalCopies}
                onChange={handleChange}
                error={Boolean(fieldErrors.totalCopies)}
                helperText={fieldErrors.totalCopies}
                disabled={loading}
                inputProps={{ min: 0 }}
              />
            </Grid>

            {/* Available Copies */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="number"
                id="availableCopies"
                name="availableCopies"
                label="Available Copies"
                value={formData.availableCopies}
                onChange={handleChange}
                error={Boolean(fieldErrors.availableCopies)}
                helperText={fieldErrors.availableCopies}
                disabled={loading}
                inputProps={{ min: 0 }}
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
          form="book-form"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
        >
          {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Book'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BookFormDialog

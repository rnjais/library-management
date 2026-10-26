import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Chip,
  Divider,
  Box,
  Grid,
} from '@mui/material'
import MenuBookIcon from '@mui/icons-material/MenuBook'

const BookDetailDialog = ({ open, onClose, book }) => {
  if (!book) return null

  const isAvailable = book.availableCopies > 0

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <MenuBookIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Book Specifications
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {book.title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          By <strong>{book.author}</strong>
        </Typography>

        <Stack direction="row" spacing={1} my={2}>
          <Chip label={book.category} color="primary" size="small" />
          <Chip
            label={isAvailable ? `${book.availableCopies} Copies Available` : 'Out of Stock'}
            color={isAvailable ? 'success' : 'error'}
            size="small"
            variant={isAvailable ? 'outlined' : 'filled'}
          />
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              ISBN Identifier
            </Typography>
            <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
              {book.isbn}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Catalog Database ID
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              #{book.id}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Total Inventory Copies
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {book.totalCopies} copies
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Currently Borrowed Out
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {book.totalCopies - book.availableCopies} copies
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BookDetailDialog

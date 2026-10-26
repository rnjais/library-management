import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'

const DeleteConfirmDialog = ({ open, onClose, book, onConfirm, loading }) => {
  if (!book) return null

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight={700}>Confirm Book Deletion</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to permanently delete{' '}
          <strong>"{book.title}"</strong> (ISBN: {book.isbn}) from the library catalog?
        </DialogContentText>
        <DialogContentText sx={{ mt: 1, fontSize: '0.85rem', color: 'error.main' }}>
          Note: Deletion will be rejected by the server if copies are currently borrowed out.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <DeleteIcon />}
        >
          {loading ? 'Deleting...' : 'Delete Book'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeleteConfirmDialog

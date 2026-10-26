import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
  Stack,
  Typography,
  Chip,
  Box,
} from '@mui/material'
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { formatDate } from '../../utils/formatters'

const ReturnBookDialog = ({ open, onClose, borrowing, onConfirm, loading }) => {
  if (!borrowing) return null

  const isOverdue = borrowing.overdue || borrowing.status === 'OVERDUE'

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight={700}>Return Borrowed Book</DialogTitle>
      <DialogContent>
        <DialogContentText gutterBottom>
          Confirm return of <strong>"{borrowing.book?.title}"</strong> borrowed by{' '}
          <strong>{borrowing.member?.fullName}</strong>.
        </DialogContentText>

        <Box sx={{ my: 2, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                Loan Issued:
              </Typography>
              <Typography variant="caption" fontWeight={600}>
                {formatDate(borrowing.borrowDate)}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">
                Scheduled Due Date:
              </Typography>
              <Typography variant="caption" fontWeight={600}>
                {formatDate(borrowing.dueDate)}
              </Typography>
            </Stack>
          </Stack>
        </Box>

        {isOverdue && (
          <Box sx={{ mt: 1, p: 1.5, bgcolor: 'error.lighter', border: '1px solid', borderColor: 'error.light', borderRadius: 1.5 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <WarningAmberIcon color="error" fontSize="small" />
              <Typography variant="caption" color="error.dark" fontWeight={600}>
                Notice: This book is past its due date. Late return fines will be automatically computed and recorded by the server.
              </Typography>
            </Stack>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="primary"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <AssignmentReturnIcon />}
        >
          {loading ? 'Processing Return...' : 'Confirm Return'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReturnBookDialog

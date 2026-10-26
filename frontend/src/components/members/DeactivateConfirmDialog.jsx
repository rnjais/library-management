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
import BlockIcon from '@mui/icons-material/Block'

const DeactivateConfirmDialog = ({ open, onClose, member, onConfirm, loading }) => {
  if (!member) return null

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight={700}>Deactivate Member Account</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to deactivate the membership for{' '}
          <strong>"{member.fullName}"</strong> (ID: #{member.id})?
        </DialogContentText>
        <DialogContentText sx={{ mt: 1, fontSize: '0.85rem', color: 'warning.dark' }}>
          Deactivated members will be prevented from borrowing any new books until reactivated.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="warning"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <BlockIcon />}
        >
          {loading ? 'Deactivating...' : 'Deactivate Member'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeactivateConfirmDialog

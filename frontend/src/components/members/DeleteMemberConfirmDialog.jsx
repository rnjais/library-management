import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
  Box,
  Typography,
  Alert,
  Stack,
} from '@mui/material'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

/**
 * Confirmation dialog for permanently deleting a library member patron.
 * Provides clear context and warns about irreversible deletion and business constraints.
 */
const DeleteMemberConfirmDialog = ({ open, onClose, member, onConfirm, loading }) => {
  if (!member) return null

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
        <DeleteForeverIcon color="error" />
        <Typography variant="h6" component="span" fontWeight={700}>
          Delete Member
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <DialogContentText component="div">
          Are you sure you want to permanently delete patron{' '}
          <Typography component="span" fontWeight={700} color="text.primary">
            "{member.fullName}"
          </Typography>{' '}
          (ID: #{member.id})?
        </DialogContentText>

        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              <strong>Email:</strong> {member.email}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              <strong>Phone:</strong> {member.phoneNumber}
            </Typography>
          </Stack>
        </Box>

        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mt: 2, '& .MuiAlert-message': { fontSize: '0.82rem' } }}>
          This will permanently delete the member and their user login account. Patrons with unreturned borrowed books or unsettled fines cannot be deleted.
        </Alert>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit" sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <DeleteForeverIcon />}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          {loading ? 'Deleting...' : 'Delete Member'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeleteMemberConfirmDialog

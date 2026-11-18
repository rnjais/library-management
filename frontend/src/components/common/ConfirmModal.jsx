import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Box,
  Stack,
} from '@mui/material'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'

/**
 * Reusable Confirmation Modal
 */
const ConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'primary',
  loading = false,
  icon,
}) => {
  return (
    <Dialog open={open} onClose={loading ? null : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: confirmColor === 'error' ? 'error.lighter' : 'primary.lighter',
              color: confirmColor === 'error' ? 'error.main' : 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon || <WarningAmberRoundedIcon />}
          </Box>
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ py: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5 }}>
        <Button onClick={onClose} disabled={loading} color="inherit" sx={{ fontWeight: 600 }}>
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={confirmColor}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ fontWeight: 600 }}
        >
          {loading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmModal

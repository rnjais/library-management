import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material'
import PaymentIcon from '@mui/icons-material/Payment'
import fineService from '../../services/fineService'
import { formatCurrency, formatDate } from '../../utils/formatters'

const PAYMENT_METHODS = [
  { value: 'UPI', label: 'UPI / QR Code' },
  { value: 'CASH', label: 'Cash at Counter' },
  { value: 'DEBIT_CARD', label: 'Debit Card' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'NET_BANKING', label: 'Internet Banking' },
]

const PayFineDialog = ({ open, onClose, fine, onPaymentSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [transactionReference, setTransactionReference] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setPaymentMethod('UPI')
      setTransactionReference('')
      setNotes('')
      setError(null)
      setLoading(false)
    }
  }, [open, fine])

  if (!fine) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const payload = {
        paymentMethod: paymentMethod.trim(),
        transactionReference: transactionReference.trim() || null,
        notes: notes.trim() || null,
      }

      const updated = await fineService.payFine(fine.id, payload)
      if (onPaymentSuccess) {
        onPaymentSuccess(updated)
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Payment processing failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PaymentIcon color="primary" />
          Pay Library Fine
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <DialogContentText gutterBottom>
            Confirm and settle the late fee penalty for borrowing record #{fine.borrowingId || fine.id}.
          </DialogContentText>

          {/* Fine Summary Card */}
          <Box
            sx={{
              p: 2,
              my: 2,
              bgcolor: 'background.default',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Fine ID:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  #{fine.id}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Book:
                </Typography>
                <Typography variant="body2" fontWeight={600} textAlign="right">
                  {fine.book?.title || 'Unknown Title'}
                </Typography>
              </Stack>

              {fine.member && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Member:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {fine.member.fullName} ({fine.member.email})
                  </Typography>
                </Stack>
              )}

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Overdue Duration:
                </Typography>
                <Typography variant="body2" fontWeight={600} color="error.main">
                  {fine.overdueDays} day{fine.overdueDays === 1 ? '' : 's'} late
                </Typography>
              </Stack>

              <Divider sx={{ my: 1 }} />

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight={700}>
                  Total Amount Due:
                </Typography>
                <Typography variant="h5" fontWeight={800} color="error.dark">
                  {formatCurrency(fine.amount)}
                </Typography>
              </Stack>
            </Stack>
          </Box>

          {/* Payment Method Details */}
          <Stack spacing={2} sx={{ mt: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="payment-method-label">Payment Method *</InputLabel>
              <Select
                labelId="payment-method-label"
                id="payment-method"
                value={paymentMethod}
                label="Payment Method *"
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={loading}
              >
                {PAYMENT_METHODS.map((method) => (
                  <MenuItem key={method.value} value={method.value}>
                    {method.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Transaction Reference / Receipt ID (Optional)"
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
              placeholder="e.g. UPI/123456789 or REC-9921"
              size="small"
              fullWidth
              disabled={loading}
              inputProps={{ maxLength: 100 }}
              helperText="Reference number for digital or card transaction verification"
            />

            <TextField
              label="Payment Notes (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cleared at circulation counter"
              size="small"
              fullWidth
              multiline
              rows={2}
              disabled={loading}
              inputProps={{ maxLength: 255 }}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={loading} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="success"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <PaymentIcon />}
            sx={{ fontWeight: 600, textTransform: 'none', px: 3 }}
          >
            {loading ? 'Processing Payment...' : `Pay ${formatCurrency(fine.amount)}`}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default PayFineDialog

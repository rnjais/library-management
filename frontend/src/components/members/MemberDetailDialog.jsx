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
  Grid,
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import { formatDate } from '../../utils/formatters'

const MemberDetailDialog = ({ open, onClose, member }) => {
  if (!member) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <PersonIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Patron Profile Details
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {member.fullName}
        </Typography>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Member ID: <strong>#{member.id}</strong>
        </Typography>

        <Stack direction="row" spacing={1} my={1.5}>
          <Chip
            label={member.active ? 'Active Member' : 'Deactivated'}
            color={member.active ? 'success' : 'default'}
            size="small"
            sx={{ fontWeight: 600 }}
          />
          <Chip
            label={`Enrolled ${formatDate(member.membershipDate)}`}
            variant="outlined"
            size="small"
          />
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Email Address
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {member.email}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Phone Number
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {member.phoneNumber}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary" display="block">
              Address
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {member.address || 'No address provided'}
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

export default MemberDetailDialog

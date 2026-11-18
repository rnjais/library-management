import React from 'react'
import { Box, Typography, Button, Paper, Stack } from '@mui/material'
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'

/**
 * Reusable Empty State display
 */
const EmptyState = ({
  icon = <InboxOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled' }} />,
  title = 'No records found',
  description = 'There are no items to display matching your current criteria.',
  actionText,
  onAction,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        py: 6,
        px: 3,
        textAlign: 'center',
        borderRadius: 3,
        border: '1px dashed #cbd5e1',
        bgcolor: '#f8fafc',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
        {icon}
      </Box>
      <Typography variant="h6" fontWeight={700} color="text.primary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto', mb: actionText ? 2.5 : 0 }}>
        {description}
      </Typography>
      {actionText && onAction && (
        <Stack direction="row" justifyContent="center">
          <Button variant="contained" color="primary" onClick={onAction} sx={{ fontWeight: 600 }}>
            {actionText}
          </Button>
        </Stack>
      )}
    </Paper>
  )
}

export default EmptyState

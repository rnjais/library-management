import React from 'react'
import { Alert, AlertTitle, Box, Collapse, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

const AlertMessage = ({
  severity = 'info',
  title = '',
  message = '',
  onClose = null,
  sx = {},
}) => {
  if (!message) return null

  return (
    <Box my={2} sx={sx}>
      <Collapse in={Boolean(message)}>
        <Alert
          severity={severity}
          action={
            onClose ? (
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={onClose}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            ) : null
          }
        >
          {title && <AlertTitle>{title}</AlertTitle>}
          {message}
        </Alert>
      </Collapse>
    </Box>
  )
}

export default AlertMessage

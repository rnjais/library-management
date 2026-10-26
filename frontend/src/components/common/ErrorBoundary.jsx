import React from 'react'
import { Box, Typography, Button, Paper, Container } from '@mui/material'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import RefreshIcon from '@mui/icons-material/Refresh'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI exception in component tree:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
              <ErrorOutlineIcon color="error" sx={{ fontSize: 64 }} />
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              An unexpected error occurred while rendering this view.
            </Typography>
            {this.state.error && (
              <Box
                sx={{
                  p: 1.5,
                  mb: 3,
                  bgcolor: 'background.default',
                  borderRadius: 1.5,
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  color: 'error.main',
                  textAlign: 'left',
                  overflowX: 'auto',
                }}
              >
                {this.state.error.toString()}
              </Box>
            )}
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={this.handleReload}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Reload Application
            </Button>
          </Paper>
        </Container>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

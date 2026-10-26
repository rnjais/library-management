import React from 'react'
import { Box, Typography, Button, Container, Paper } from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../utils/constants'

const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <Container maxWidth="sm">
      <Paper
        elevation={0}
        sx={{
          py: 8,
          px: 4,
          mt: 4,
          textAlign: 'center',
          border: '1px solid #e2e8f0',
          borderRadius: 3,
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800 }}>
          404
        </Typography>
        <Typography variant="h6" color="text.primary" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          The page you requested could not be found. Please check the URL or return to the main dashboard.
        </Typography>
        <Button
          variant="contained"
          startIcon={<HomeIcon />}
          onClick={() => navigate(ROUTES.HOME)}
        >
          Back to Home
        </Button>
      </Paper>
    </Container>
  )
}

export default NotFoundPage

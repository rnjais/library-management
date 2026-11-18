import React from 'react'
import { Box, Typography, Container, Stack } from '@mui/material'

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="center"
          alignItems="center"
          spacing={1}
        >
          <Typography variant="body2" color="text.secondary">
            &copy; {new Date().getFullYear()} Library Management System. All rights reserved.
          </Typography>
        </Stack>
      </Container>
    </Box>
  )
}

export default Footer

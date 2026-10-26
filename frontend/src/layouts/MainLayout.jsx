import React, { useState } from 'react'
import { Box, Toolbar, Container } from '@mui/material'
import { Outlet } from 'react-router-dom'
import Navbar from '../components/navigation/Navbar'
import Sidebar, { SIDEBAR_WIDTH } from '../components/navigation/Sidebar'
import Footer from '../components/navigation/Footer'

const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleToggleSidebar = () => {
    setMobileOpen((prev) => !prev)
  }

  const handleMobileClose = () => {
    setMobileOpen(false)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <Navbar onToggleSidebar={handleToggleSidebar} />

      {/* Main Container with Sidebar + Content */}
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        {/* Navigation Sidebar */}
        <Sidebar mobileOpen={mobileOpen} onMobileClose={handleMobileClose} />

        {/* Content Area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3, md: 4 },
            width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Container maxWidth="xl" sx={{ flexGrow: 1, py: 2 }}>
            <Outlet />
          </Container>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ ml: { md: `${SIDEBAR_WIDTH}px` } }}>
        <Footer />
      </Box>
    </Box>
  )
}

export default MainLayout

import React, { useState } from 'react'
import { Box, Container, useMediaQuery, useTheme } from '@mui/material'
import { Outlet } from 'react-router-dom'
import Navbar from '../components/navigation/Navbar'
import Sidebar, { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from '../components/navigation/Sidebar'
import Footer from '../components/navigation/Footer'

const MainLayout = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((prev) => !prev)
    } else {
      setSidebarCollapsed((prev) => !prev)
    }
  }

  const handleMobileClose = () => {
    setMobileOpen(false)
  }

  const handleToggleCollapse = () => {
    setSidebarCollapsed((prev) => !prev)
  }

  const currentSidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Collapsible Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={handleMobileClose}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Right Column: Top Navbar + Page Content + Footer */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: { md: `calc(100% - ${currentSidebarWidth}px)` },
          transition: 'width 200ms ease',
        }}
      >
        <Navbar onToggleSidebar={handleToggleSidebar} />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3, md: 4 },
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Container maxWidth="xl" sx={{ flexGrow: 1, px: { xs: 0, sm: 1 } }}>
            <Outlet />
          </Container>
        </Box>

        <Footer />
      </Box>
    </Box>
  )
}

export default MainLayout

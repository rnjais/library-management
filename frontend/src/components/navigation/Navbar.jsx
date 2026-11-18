import React, { useState } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Box,
  Chip,
  Avatar,
  Stack,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  TextField,
  InputAdornment,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import SearchIcon from '@mui/icons-material/Search'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined'
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import BookmarksOutlinedIcon from '@mui/icons-material/BookmarksOutlined'
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../utils/constants'

const ROUTE_TITLES = {
  [ROUTES.HOME]: { title: 'Dashboard Overview', subtitle: 'Public Catalog & Operations' },
  [ROUTES.LOGIN]: { title: 'Sign In', subtitle: 'Access your account' },
  [ROUTES.REGISTER]: { title: 'Create Account', subtitle: 'Join library membership' },
  [ROUTES.BOOKS]: { title: 'Book Catalog', subtitle: 'Browse and search library collection' },
  [ROUTES.MY_BORROWINGS]: { title: 'My Borrowings', subtitle: 'Active loans and return schedule' },
  [ROUTES.MY_FINES]: { title: 'My Fines', subtitle: 'Unpaid fee balances and history' },
  [ROUTES.ADMIN_DASHBOARD]: { title: 'Dashboard', subtitle: 'Live Library Operations & KPIs' },
  [ROUTES.ADMIN_BOOKS]: { title: 'Manage Books', subtitle: 'Catalog titles, inventory, and copies' },
  [ROUTES.ADMIN_MEMBERS]: { title: 'Manage Members', subtitle: 'Patron accounts, activations, and profiles' },
  [ROUTES.ADMIN_BORROWINGS]: { title: 'Circulation & Loans', subtitle: 'Active checkouts, returns, and overdue tracking' },
  [ROUTES.ADMIN_FINES]: { title: 'Fines & Payments', subtitle: 'Assessments, fee records, and settlements' },
  [ROUTES.ADMIN_REPORTS]: { title: 'Reports & Analytics', subtitle: 'Inventory statistics, trends, and export' },
}

const Navbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, isAdmin, logout } = useAuth()

  const [anchorEl, setAnchorEl] = useState(null)
  const isMenuOpen = Boolean(anchorEl)

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
  }

  const handleNavigate = (path) => {
    handleCloseMenu()
    navigate(path)
  }

  const handleLogout = () => {
    handleCloseMenu()
    logout()
    navigate(ROUTES.LOGIN)
  }

  const currentRouteInfo = ROUTE_TITLES[location.pathname] || {
    title: 'Library Management',
    subtitle: 'Management System',
  }

  return (
    <AppBar
      position="sticky"
      sx={{
        bgcolor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          px: { xs: 2, sm: 3.5 },
          minHeight: { xs: 64, sm: 72 },
        }}
      >
        {/* Left: Sidebar Toggle + Title & Subtitle */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <Tooltip title="Toggle Navigation">
            <IconButton
              edge="start"
              onClick={onToggleSidebar}
              aria-label="Toggle navigation"
              sx={{
                color: '#475569',
                borderRadius: 2.5,
                bgcolor: '#f8fafc',
                border: '1px solid #e2e8f0',
                p: 1,
                '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' },
              }}
            >
              <MenuIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Box>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 800,
                color: '#0f172a',
                fontSize: { xs: '1rem', sm: '1.25rem' },
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
              }}
            >
              {currentRouteInfo.title}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: { xs: 'none', sm: 'block' }, fontSize: '0.75rem', fontWeight: 500 }}
            >
              {currentRouteInfo.subtitle}
            </Typography>
          </Box>
        </Stack>

        {/* Right: Quick Search Input (Image 3) + Profile Avatar */}
        <Stack direction="row" alignItems="center" spacing={2}>
          {/* Quick Search Entry */}
          <Box
            onClick={() => navigate(ROUTES.BOOKS)}
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              bgcolor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 3,
              px: 2,
              py: 0.75,
              width: 260,
              cursor: 'pointer',
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
              '&:hover': {
                borderColor: '#cbd5e1',
                bgcolor: '#ffffff',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              },
            }}
          >
            <SearchIcon sx={{ color: '#94a3b8', fontSize: 18, mr: 1 }} />
            <Typography variant="body2" color="#94a3b8" sx={{ fontSize: '0.8125rem' }}>
              Search catalog titles...
            </Typography>
          </Box>

          {isAuthenticated ? (
            <>
              {/* Role Chip */}
              <Chip
                label={isAdmin ? 'ADMIN' : 'MEMBER'}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.6875rem',
                  height: 24,
                  bgcolor: isAdmin ? '#eff6ff' : '#f0fdf4',
                  color: isAdmin ? '#1e40af' : '#15803d',
                  border: '1px solid',
                  borderColor: isAdmin ? '#bfdbfe' : '#bbf7d0',
                  display: { xs: 'none', sm: 'inline-flex' },
                }}
              />

              {/* Profile Menu Trigger */}
              <Tooltip title="Account menu">
                <Button
                  color="inherit"
                  onClick={handleOpenMenu}
                  endIcon={<KeyboardArrowDownIcon sx={{ color: '#64748b', fontSize: 18 }} />}
                  sx={{
                    textTransform: 'none',
                    p: 0.5,
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: isAdmin ? '#172554' : '#2563eb',
                      fontSize: 14,
                      fontWeight: 700,
                      mr: { xs: 0, sm: 1 },
                    }}
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                  <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'left', pr: 0.5 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: '#0f172a',
                        fontSize: '0.8125rem',
                        lineHeight: 1.2,
                        maxWidth: 130,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user?.name || user?.email}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.6875rem' }}>
                      {isAdmin ? 'Administrator' : 'Library Member'}
                    </Typography>
                  </Box>
                </Button>
              </Tooltip>

              {/* Dropdown Profile Menu */}
              <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={isMenuOpen}
                onClose={handleCloseMenu}
                onClick={handleCloseMenu}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  elevation: 4,
                  sx: {
                    minWidth: 230,
                    mt: 1.5,
                    borderRadius: 3,
                    p: 0.5,
                    border: '1px solid #e2e8f0',
                  },
                }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} noWrap>
                    {user?.name || 'Library User'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" noWrap>
                    {user?.email}
                  </Typography>
                </Box>

                <Divider sx={{ my: 0.5 }} />

                {isAdmin ? (
                  <MenuItem onClick={() => handleNavigate(ROUTES.ADMIN_DASHBOARD)} sx={{ borderRadius: 1.5 }}>
                    <ListItemIcon>
                      <DashboardOutlinedIcon fontSize="small" sx={{ color: '#2563eb' }} />
                    </ListItemIcon>
                    <ListItemText primary="Admin Dashboard" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />
                  </MenuItem>
                ) : (
                  <>
                    <MenuItem onClick={() => handleNavigate(ROUTES.MY_BORROWINGS)} sx={{ borderRadius: 1.5 }}>
                      <ListItemIcon>
                        <BookmarksOutlinedIcon fontSize="small" sx={{ color: '#2563eb' }} />
                      </ListItemIcon>
                      <ListItemText primary="My Borrowings" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />
                    </MenuItem>
                    <MenuItem onClick={() => handleNavigate(ROUTES.MY_FINES)} sx={{ borderRadius: 1.5 }}>
                      <ListItemIcon>
                        <MonetizationOnOutlinedIcon fontSize="small" sx={{ color: '#2563eb' }} />
                      </ListItemIcon>
                      <ListItemText primary="My Fines" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />
                    </MenuItem>
                  </>
                )}

                <Divider sx={{ my: 0.5 }} />

                <MenuItem onClick={handleLogout} sx={{ color: 'error.main', borderRadius: 1.5 }}>
                  <ListItemIcon>
                    <LogoutOutlinedIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }} />
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<LoginOutlinedIcon />}
                onClick={() => navigate(ROUTES.LOGIN)}
                sx={{ borderRadius: 2.5, fontWeight: 600 }}
              >
                Sign In
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<PersonAddOutlinedIcon />}
                onClick={() => navigate(ROUTES.REGISTER)}
                sx={{
                  borderRadius: 2.5,
                  fontWeight: 600,
                  bgcolor: '#2563eb',
                  '&:hover': { bgcolor: '#1d4ed8' },
                  display: { xs: 'none', sm: 'inline-flex' },
                }}
              >
                Register
              </Button>
            </Stack>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar

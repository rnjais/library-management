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
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary'
import LogoutIcon from '@mui/icons-material/Logout'
import LoginIcon from '@mui/icons-material/Login'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import DashboardIcon from '@mui/icons-material/Dashboard'
import BookmarksIcon from '@mui/icons-material/Bookmarks'
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../utils/constants'

const Navbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate()
  const { user, isAuthenticated, isAdmin, logout } = useAuth()

  // Profile Menu Anchor State
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

  return (
    <AppBar position="sticky">
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
        {/* Left: Mobile Drawer Toggle & Logo */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={onToggleSidebar}
            aria-label="open drawer"
            sx={{ mr: { xs: 0.5, sm: 1 } }}
          >
            <MenuIcon />
          </IconButton>

          <Box
            display="flex"
            alignItems="center"
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate(isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.HOME)}
          >
            <LocalLibraryIcon sx={{ color: 'primary.main', fontSize: { xs: 26, sm: 30 }, mr: 1 }} />
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                display: { xs: 'none', sm: 'block' },
                letterSpacing: '-0.5px',
              }}
            >
              LibraryMS
            </Typography>
          </Box>
        </Stack>

        {/* Right: Auth Profile Dropdown / Login Actions */}
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {isAuthenticated ? (
            <>
              {/* Role Indicator Chip */}
              <Chip
                label={isAdmin ? 'ADMIN' : 'MEMBER'}
                size="small"
                color={isAdmin ? 'primary' : 'secondary'}
                variant="outlined"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  display: { xs: 'none', sm: 'inline-flex' },
                }}
              />

              {/* Profile Menu Trigger */}
              <Tooltip title="Account & Preferences">
                <Button
                  color="inherit"
                  onClick={handleOpenMenu}
                  endIcon={<KeyboardArrowDownIcon sx={{ display: { xs: 'none', sm: 'block' } }} />}
                  sx={{
                    textTransform: 'none',
                    px: { xs: 0.5, sm: 1.5 },
                    py: 0.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: isAdmin ? 'primary.main' : 'secondary.main',
                      fontSize: 14,
                      fontWeight: 600,
                      mr: { xs: 0, sm: 1 },
                    }}
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                  <Typography
                    variant="body2"
                    sx={{
                      display: { xs: 'none', md: 'block' },
                      fontWeight: 600,
                      color: 'text.primary',
                      maxWidth: 160,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user?.name || user?.email}
                  </Typography>
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
                    borderRadius: 2,
                    p: 0.5,
                  },
                }}
              >
                {/* Menu Header with User Info */}
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} noWrap>
                    {user?.name || 'Library User'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" noWrap>
                    {user?.email}
                  </Typography>
                  <Chip
                    label={user?.role || (isAdmin ? 'ADMIN' : 'MEMBER')}
                    size="small"
                    color={isAdmin ? 'primary' : 'secondary'}
                    sx={{ mt: 1, height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                  />
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* Role Specific Navigation Items */}
                {isAdmin ? (
                  <MenuItem onClick={() => handleNavigate(ROUTES.ADMIN_DASHBOARD)}>
                    <ListItemIcon>
                      <DashboardIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Admin Dashboard" />
                  </MenuItem>
                ) : (
                  <>
                    <MenuItem onClick={() => handleNavigate(ROUTES.MY_BORROWINGS)}>
                      <ListItemIcon>
                        <BookmarksIcon fontSize="small" color="secondary" />
                      </ListItemIcon>
                      <ListItemText primary="My Borrowings" />
                    </MenuItem>
                    <MenuItem onClick={() => handleNavigate(ROUTES.MY_FINES)}>
                      <ListItemIcon>
                        <MonetizationOnIcon fontSize="small" color="secondary" />
                      </ListItemIcon>
                      <ListItemText primary="My Fines" />
                    </MenuItem>
                  </>
                )}

                <Divider sx={{ my: 1 }} />

                {/* Logout Action */}
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText primary="Log Out" />
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                size="small"
                startIcon={<LoginIcon />}
                onClick={() => navigate(ROUTES.LOGIN)}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Sign In
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<PersonAddIcon />}
                onClick={() => navigate(ROUTES.REGISTER)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  display: { xs: 'none', sm: 'inline-flex' },
                }}
              >
                Register
              </Button>
            </>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar

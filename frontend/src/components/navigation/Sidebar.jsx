import React from 'react'
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Tooltip,
  IconButton,
  Stack,
  Avatar,
  Chip,
  Button,
} from '@mui/material'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import BookmarksOutlinedIcon from '@mui/icons-material/BookmarksOutlined'
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined'
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import LogoutIcon from '@mui/icons-material/Logout'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../utils/constants'

export const SIDEBAR_WIDTH = 260
export const SIDEBAR_COLLAPSED_WIDTH = 76

/**
 * Modern Sleek Dark Sidebar (Inspired by Reference Image 1 "Business BD")
 * Dark Slate Canvas (#090d16 / #0f172a) with Vibrant Royal Blue Active Pills (#2563EB)
 */
const Sidebar = ({
  mobileOpen,
  onMobileClose,
  collapsed = false,
  onToggleCollapse,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, isAdmin, logout } = useAuth()

  const handleNav = (path) => {
    navigate(path)
    if (onMobileClose) {
      onMobileClose()
    }
  }

  const handleLogout = () => {
    if (onMobileClose) {
      onMobileClose()
    }
    logout()
    navigate(ROUTES.LOGIN)
  }

  const isSelected = (path) => {
    if (path === ROUTES.ADMIN_DASHBOARD || path === ROUTES.HOME) {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  // Navigation Items
  const adminMenuItems = [
    { label: 'Dashboard', path: ROUTES.ADMIN_DASHBOARD, icon: <DashboardOutlinedIcon /> },
    { label: 'Books', path: ROUTES.ADMIN_BOOKS, icon: <MenuBookOutlinedIcon /> },
    { label: 'Members', path: ROUTES.ADMIN_MEMBERS, icon: <PeopleAltOutlinedIcon /> },
    { label: 'Borrowings', path: ROUTES.ADMIN_BORROWINGS, icon: <AssignmentOutlinedIcon /> },
    { label: 'Fines', path: ROUTES.ADMIN_FINES, icon: <ReceiptLongOutlinedIcon /> },
    { label: 'Reports', path: ROUTES.ADMIN_REPORTS, icon: <AssessmentOutlinedIcon /> },
  ]

  const memberMenuItems = [
    { label: 'Book Catalog', path: ROUTES.BOOKS, icon: <MenuBookOutlinedIcon /> },
    { label: 'My Borrowings', path: ROUTES.MY_BORROWINGS, icon: <BookmarksOutlinedIcon /> },
    { label: 'My Fines', path: ROUTES.MY_FINES, icon: <MonetizationOnOutlinedIcon /> },
  ]

  const guestMenuItems = [
    { label: 'Home', path: ROUTES.HOME, icon: <HomeOutlinedIcon /> },
    { label: 'Book Catalog', path: ROUTES.BOOKS, icon: <MenuBookOutlinedIcon /> },
  ]

  const activeMenuItems = isAdmin
    ? adminMenuItems
    : isAuthenticated
    ? memberMenuItems
    : guestMenuItems

  const renderNavItem = (item) => {
    const active = isSelected(item.path)
    const buttonContent = (
      <ListItem disablePadding key={item.path} sx={{ mb: 1, px: 1.5 }}>
        <ListItemButton
          onClick={() => handleNav(item.path)}
          selected={active}
          sx={{
            minHeight: 46,
            borderRadius: 2.5,
            px: collapsed ? 1.5 : 2,
            justifyContent: collapsed ? 'center' : 'initial',
            color: active ? '#ffffff' : '#94a3b8',
            bgcolor: active ? '#2563eb !important' : 'transparent',
            boxShadow: active ? '0 4px 14px rgba(37, 99, 235, 0.4)' : 'none',
            transition: 'all 180ms ease',
            '&:hover': {
              bgcolor: active ? '#1d4ed8 !important' : 'rgba(255, 255, 255, 0.06)',
              color: '#ffffff',
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: collapsed ? 0 : 2,
              justifyContent: 'center',
              color: active ? '#ffffff' : '#94a3b8',
              '& .MuiSvgIcon-root': { fontSize: 20 },
            }}
          >
            {item.icon}
          </ListItemIcon>
          {!collapsed && (
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: active ? 700 : 500,
                letterSpacing: '0.01em',
              }}
            />
          )}
        </ListItemButton>
      </ListItem>
    )

    if (collapsed) {
      return (
        <Tooltip title={item.label} placement="right" key={item.path} arrow>
          {buttonContent}
        </Tooltip>
      )
    }

    return buttonContent
  }

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#090d16',
        color: '#ffffff',
      }}
    >
      {/* Brand Header */}
      <Box
        sx={{
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          px: collapsed ? 1.5 : 2.5,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{ cursor: 'pointer', overflow: 'hidden' }}
          onClick={() => handleNav(isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.HOME)}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              bgcolor: '#2563eb',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.45)',
            }}
          >
            <LocalLibraryIcon sx={{ fontSize: 22 }} />
          </Box>
          {!collapsed && (
            <Box sx={{ whiteSpace: 'nowrap' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                LibraryMS
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                {isAdmin ? 'Admin Console' : 'Member Portal'}
              </Typography>
            </Box>
          )}
        </Stack>

        {!collapsed && onToggleCollapse && (
          <IconButton
            size="small"
            onClick={onToggleCollapse}
            sx={{
              display: { xs: 'none', md: 'inline-flex' },
              color: '#64748b',
              '&:hover': { color: '#ffffff', bgcolor: 'rgba(255, 255, 255, 0.08)' },
            }}
            aria-label="Collapse sidebar"
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Navigation List */}
      <Box sx={{ flexGrow: 1, py: 2, overflowY: 'auto' }}>
        {!collapsed && (
          <Box sx={{ px: 2.5, pt: 0.5, pb: 1 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: '#64748b',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontSize: '0.6875rem',
              }}
            >
              Menu
            </Typography>
          </Box>
        )}
        <List disablePadding>{activeMenuItems.map(renderNavItem)}</List>
      </Box>

      {/* Expand Toggle in Collapsed Mode */}
      {collapsed && onToggleCollapse && (
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center', py: 1 }}>
          <Tooltip title="Expand sidebar" placement="right" arrow>
            <IconButton
              size="small"
              onClick={onToggleCollapse}
              sx={{ color: '#94a3b8', '&:hover': { color: '#ffffff', bgcolor: 'rgba(255,255,255,0.08)' } }}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Bottom Profile / Logout (Image 1 Style) */}
      {isAuthenticated && (
        <Box sx={{ p: collapsed ? 1.5 : 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {!collapsed ? (
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2, px: 0.5 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: isAdmin ? '#2563eb' : '#0284c7',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#ffffff' }} noWrap>
                  {user?.name || user?.email}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }} noWrap>
                  {user?.email}
                </Typography>
              </Box>
            </Stack>
          ) : null}

          {/* Red Logout Pill Button (Image 1 "Business BD") */}
          {collapsed ? (
            <Tooltip title="Logout" placement="right" arrow>
              <IconButton
                onClick={handleLogout}
                sx={{
                  width: '100%',
                  height: 42,
                  borderRadius: 2.5,
                  bgcolor: '#dc2626',
                  color: '#ffffff',
                  '&:hover': { bgcolor: '#b91c1c' },
                }}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Button
              fullWidth
              variant="contained"
              startIcon={<LogoutIcon fontSize="small" />}
              onClick={handleLogout}
              sx={{
                py: 1,
                bgcolor: '#dc2626',
                color: '#ffffff',
                fontWeight: 700,
                borderRadius: 2.5,
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.35)',
                '&:hover': { bgcolor: '#b91c1c' },
              }}
            >
              Logout
            </Button>
          )}
        </Box>
      )}
    </Box>
  )

  const currentWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH

  return (
    <Box
      component="nav"
      sx={{
        width: { md: currentWidth },
        flexShrink: { md: 0 },
        transition: 'width 200ms ease',
      }}
    >
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: SIDEBAR_WIDTH,
            border: 'none',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: currentWidth,
            border: 'none',
            transition: 'width 200ms ease',
            overflowX: 'hidden',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  )
}

export default Sidebar

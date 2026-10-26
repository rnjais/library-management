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
} from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import DashboardIcon from '@mui/icons-material/Dashboard'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import BookmarksIcon from '@mui/icons-material/Bookmarks'
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'
import PeopleIcon from '@mui/icons-material/People'
import HistoryEduIcon from '@mui/icons-material/HistoryEdu'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import AssessmentIcon from '@mui/icons-material/Assessment'
import ApiIcon from '@mui/icons-material/Api'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../utils/constants'

export const SIDEBAR_WIDTH = 260

const Sidebar = ({ mobileOpen, onMobileClose }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isAdmin } = useAuth()

  const handleNav = (path) => {
    navigate(path)
    if (onMobileClose) {
      onMobileClose()
    }
  }

  const isSelected = (path) => location.pathname === path

  const drawerContent = (
    <Box sx={{ overflow: 'auto', py: 2 }}>
      {/* Brand Section in Drawer */}
      <Box px={3} pb={2}>
        <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1.2}>
          {isAdmin ? 'Admin Console' : 'Library Portal'}
        </Typography>
      </Box>

      {/* Main / Member Navigation */}
      <List disablePadding>
        {/* Admin Dashboard Entry */}
        {isAdmin && (
          <ListItem disablePadding>
            <ListItemButton
              selected={isSelected(ROUTES.ADMIN_DASHBOARD)}
              onClick={() => handleNav(ROUTES.ADMIN_DASHBOARD)}
              sx={{
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                  '&:hover': { bgcolor: 'primary.main' },
                },
              }}
            >
              <ListItemIcon>
                <DashboardIcon color={isSelected(ROUTES.ADMIN_DASHBOARD) ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Admin Dashboard" primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          </ListItem>
        )}

        {/* Public Home (For non-admin or public viewing) */}
        <ListItem disablePadding>
          <ListItemButton
            selected={isSelected(ROUTES.HOME)}
            onClick={() => handleNav(ROUTES.HOME)}
          >
            <ListItemIcon>
              <HomeIcon color={isSelected(ROUTES.HOME) ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>
        </ListItem>

        {/* Browse Books */}
        <ListItem disablePadding>
          <ListItemButton
            selected={isSelected(ROUTES.BOOKS)}
            onClick={() => handleNav(ROUTES.BOOKS)}
          >
            <ListItemIcon>
              <MenuBookIcon color={isSelected(ROUTES.BOOKS) ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Browse Books" />
          </ListItemButton>
        </ListItem>

        {/* Member-specific Navigation */}
        {isAuthenticated && !isAdmin && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                selected={isSelected(ROUTES.MY_BORROWINGS)}
                onClick={() => handleNav(ROUTES.MY_BORROWINGS)}
              >
                <ListItemIcon>
                  <BookmarksIcon
                    color={isSelected(ROUTES.MY_BORROWINGS) ? 'secondary' : 'inherit'}
                  />
                </ListItemIcon>
                <ListItemText primary="My Borrowings" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton
                selected={isSelected(ROUTES.MY_FINES)}
                onClick={() => handleNav(ROUTES.MY_FINES)}
              >
                <ListItemIcon>
                  <MonetizationOnIcon
                    color={isSelected(ROUTES.MY_FINES) ? 'secondary' : 'inherit'}
                  />
                </ListItemIcon>
                <ListItemText primary="My Fines" />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>

      {/* Admin Management Section */}
      {isAdmin && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box px={3} py={0.5}>
            <Typography variant="overline" color="primary.main" fontWeight={700} letterSpacing={1.2}>
              Management
            </Typography>
          </Box>
          <List disablePadding>
            <ListItem disablePadding>
              <ListItemButton
                selected={isSelected(ROUTES.ADMIN_BOOKS)}
                onClick={() => handleNav(ROUTES.ADMIN_BOOKS)}
              >
                <ListItemIcon>
                  <LibraryBooksIcon
                    color={isSelected(ROUTES.ADMIN_BOOKS) ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
                <ListItemText primary="Manage Books" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton
                selected={isSelected(ROUTES.ADMIN_MEMBERS)}
                onClick={() => handleNav(ROUTES.ADMIN_MEMBERS)}
              >
                <ListItemIcon>
                  <PeopleIcon
                    color={isSelected(ROUTES.ADMIN_MEMBERS) ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
                <ListItemText primary="Manage Members" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton
                selected={isSelected(ROUTES.ADMIN_BORROWINGS)}
                onClick={() => handleNav(ROUTES.ADMIN_BORROWINGS)}
              >
                <ListItemIcon>
                  <HistoryEduIcon
                    color={isSelected(ROUTES.ADMIN_BORROWINGS) ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
                <ListItemText primary="All Borrowings" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton
                selected={isSelected(ROUTES.ADMIN_FINES)}
                onClick={() => handleNav(ROUTES.ADMIN_FINES)}
              >
                <ListItemIcon>
                  <ReceiptLongIcon
                    color={isSelected(ROUTES.ADMIN_FINES) ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
                <ListItemText primary="Fines Overview" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton
                selected={isSelected(ROUTES.ADMIN_REPORTS)}
                onClick={() => handleNav(ROUTES.ADMIN_REPORTS)}
              >
                <ListItemIcon>
                  <AssessmentIcon
                    color={isSelected(ROUTES.ADMIN_REPORTS) ? 'primary' : 'inherit'}
                  />
                </ListItemIcon>
                <ListItemText primary="Reports & Analytics" />
              </ListItemButton>
            </ListItem>
          </List>
        </>
      )}

      {/* Developer & Documentation Links */}
      <Divider sx={{ my: 2 }} />
      <Box px={3} py={0.5}>
        <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1.2}>
          API Documentation
        </Typography>
      </Box>
      <List disablePadding>
        <ListItem disablePadding>
          <ListItemButton
            component="a"
            href="http://localhost:8080/swagger-ui/index.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ListItemIcon>
              <ApiIcon />
            </ListItemIcon>
            <ListItemText primary="Swagger API Docs" />
            <OpenInNewIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  )

  return (
    <Box component="nav" sx={{ width: { md: SIDEBAR_WIDTH }, flexShrink: { md: 0 } }}>
      {/* Mobile Drawer (Temporary) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: SIDEBAR_WIDTH },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Permanent Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: SIDEBAR_WIDTH,
            borderRight: '1px solid #e2e8f0',
            top: '64px',
            height: 'calc(100% - 64px)',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  )
}

export default Sidebar

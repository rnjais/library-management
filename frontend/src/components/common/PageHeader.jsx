import React from 'react'
import { Box, Typography, Stack, Breadcrumbs, Link as MuiLink } from '@mui/material'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../utils/constants'

/**
 * Reusable Page Header with breadcrumbs and action triggers
 */
const PageHeader = ({ title, subtitle, breadcrumbs = [], actions = null }) => {
  return (
    <Box sx={{ mb: 3 }}>
      {/* Optional Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" sx={{ color: 'text.disabled', fontSize: 16 }} />}
          aria-label="breadcrumb"
          sx={{ mb: 1 }}
        >
          <MuiLink
            component={Link}
            to={ROUTES.HOME}
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: 'text.secondary',
              fontSize: '0.8125rem',
              fontWeight: 500,
              '&:hover': { color: 'primary.main' },
            }}
          >
            <HomeOutlinedIcon sx={{ mr: 0.5, fontSize: 16 }} />
            Home
          </MuiLink>
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1
            if (isLast || !crumb.path) {
              return (
                <Typography
                  key={idx}
                  sx={{
                    color: isLast ? 'text.primary' : 'text.secondary',
                    fontSize: '0.8125rem',
                    fontWeight: isLast ? 600 : 500,
                  }}
                >
                  {crumb.label}
                </Typography>
              )
            }
            return (
              <MuiLink
                key={idx}
                component={Link}
                to={crumb.path}
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  '&:hover': { color: 'primary.main' },
                }}
              >
                {crumb.label}
              </MuiLink>
            )
          })}
        </Breadcrumbs>
      )}

      {/* Main Title Row & Actions */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '1.875rem' },
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {actions && (
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            {actions}
          </Stack>
        )}
      </Stack>
    </Box>
  )
}

export default PageHeader

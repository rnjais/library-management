import React from 'react'
import { Card, CardContent, Typography, Box, Stack, Skeleton } from '@mui/material'

/**
 * Enhanced Reusable Metric Card (Inspired by Reference Images 1 & 4)
 * Supports 'hero' vibrant royal blue card & mini SVG sparkline trends.
 */
const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  variant = 'default', // 'default' or 'hero'
  color = 'primary.main',
  bgColor = '#eff6ff',
  sparklineColor, // e.g. '#2563eb', '#16a34a', '#f59e0b'
  onClick,
  loading = false,
}) => {
  const isHero = variant === 'hero'

  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        borderRadius: 3.5,
        border: isHero ? 'none' : '1px solid #e2e8f0',
        bgcolor: isHero ? '#2563eb' : '#ffffff',
        background: isHero ? 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)' : '#ffffff',
        color: isHero ? '#ffffff' : '#0f172a',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: isHero
          ? '0 10px 25px -5px rgba(37, 99, 235, 0.4)'
          : '0 1px 3px rgba(15, 23, 42, 0.04)',
        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
        '&:hover': onClick
          ? {
              transform: 'translateY(-3px)',
              boxShadow: isHero
                ? '0 16px 30px -5px rgba(37, 99, 235, 0.5)'
                : '0 10px 24px -4px rgba(15, 23, 42, 0.08)',
              borderColor: isHero ? 'none' : '#cbd5e1',
            }
          : {},
      }}
    >
      <CardContent sx={{ p: 2.75, pb: sparklineColor ? 1.5 : 2.75, '&:last-child': { pb: sparklineColor ? 1.5 : 2.75 } }}>
        {loading ? (
          <>
            <Stack direction="row" justifyContent="space-between" mb={1.5}>
              <Skeleton width="40%" height={18} sx={{ bgcolor: isHero ? 'rgba(255,255,255,0.2)' : undefined }} />
              <Skeleton variant="circular" width={38} height={38} sx={{ bgcolor: isHero ? 'rgba(255,255,255,0.2)' : undefined }} />
            </Stack>
            <Skeleton width="60%" height={38} sx={{ my: 0.5, bgcolor: isHero ? 'rgba(255,255,255,0.2)' : undefined }} />
            <Skeleton width="80%" height={16} sx={{ bgcolor: isHero ? 'rgba(255,255,255,0.2)' : undefined }} />
          </>
        ) : (
          <>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
              <Typography
                variant="caption"
                sx={{
                  color: isHero ? 'rgba(255, 255, 255, 0.85)' : 'text.secondary',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontSize: '0.72rem',
                }}
              >
                {title}
              </Typography>
              {icon && (
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2.5,
                    bgcolor: isHero ? 'rgba(255, 255, 255, 0.18)' : bgColor,
                    color: isHero ? '#ffffff' : color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </Box>
              )}
            </Stack>

            <Typography
              variant="h4"
              component="div"
              sx={{
                fontWeight: 800,
                color: isHero ? '#ffffff' : 'text.primary',
                letterSpacing: '-0.025em',
                mb: 0.5,
              }}
            >
              {value}
            </Typography>

            <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}>
              {subtitle && (
                <Typography
                  variant="body2"
                  sx={{
                    color: isHero ? 'rgba(255, 255, 255, 0.8)' : 'text.secondary',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                  }}
                >
                  {subtitle}
                </Typography>
              )}
              {badge}
            </Stack>

            {/* Optional SVG Mini Sparkline Curve (Image 4 Style) */}
            {sparklineColor && (
              <Box sx={{ mt: 1.5, height: 28, overflow: 'hidden' }}>
                <svg width="100%" height="28" viewBox="0 0 100 28" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={sparklineColor} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={sparklineColor} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 22 Q 15 12, 30 18 T 60 10 T 85 16 T 100 6 L 100 28 L 0 28 Z"
                    fill={`url(#grad-${title.replace(/\s+/g, '')})`}
                  />
                  <path
                    d="M 0 22 Q 15 12, 30 18 T 60 10 T 85 16 T 100 6"
                    fill="none"
                    stroke={sparklineColor}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default StatCard

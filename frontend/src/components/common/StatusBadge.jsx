import React from 'react'
import { Chip, Box } from '@mui/material'

const STATUS_MAP = {
  // Borrowing statuses
  BORROWED: {
    label: 'Borrowed',
    color: '#b45309',
    bgColor: '#fef3c7',
    dotColor: '#f59e0b',
  },
  RETURNED: {
    label: 'Returned',
    color: '#15803d',
    bgColor: '#dcfce7',
    dotColor: '#16a34a',
  },
  OVERDUE: {
    label: 'Overdue',
    color: '#b91c1c',
    bgColor: '#fee2e2',
    dotColor: '#dc2626',
  },
  // Member statuses
  ACTIVE: {
    label: 'Active',
    color: '#15803d',
    bgColor: '#dcfce7',
    dotColor: '#16a34a',
  },
  INACTIVE: {
    label: 'Inactive',
    color: '#475569',
    bgColor: '#f1f5f9',
    dotColor: '#94a3b8',
  },
  // Fine payment statuses
  PAID: {
    label: 'Paid',
    color: '#15803d',
    bgColor: '#dcfce7',
    dotColor: '#16a34a',
  },
  UNPAID: {
    label: 'Unpaid',
    color: '#b91c1c',
    bgColor: '#fee2e2',
    dotColor: '#dc2626',
  },
  // Reservation waitlist statuses
  PENDING: {
    label: 'Waitlisted',
    color: '#b45309',
    bgColor: '#fef3c7',
    dotColor: '#f59e0b',
  },
  READY_FOR_PICKUP: {
    label: 'Ready for Pickup',
    color: '#6d28d9',
    bgColor: '#ede9fe',
    dotColor: '#8b5cf6',
  },
  FULFILLED: {
    label: 'Fulfilled',
    color: '#15803d',
    bgColor: '#dcfce7',
    dotColor: '#16a34a',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: '#475569',
    bgColor: '#f1f5f9',
    dotColor: '#94a3b8',
  },
  EXPIRED: {
    label: 'Expired',
    color: '#b91c1c',
    bgColor: '#fee2e2',
    dotColor: '#dc2626',
  },
}

/**
 * Reusable Status Badge with soft tint backgrounds and colored dot indicators
 */
const StatusBadge = ({ status, customLabel, size = 'small' }) => {
  const normalized = (status || '').toString().toUpperCase()
  const config = STATUS_MAP[normalized] || {
    label: customLabel || status || 'Unknown',
    color: '#475569',
    bgColor: '#f1f5f9',
    dotColor: '#94a3b8',
  }

  return (
    <Chip
      size={size}
      icon={
        <Box
          component="span"
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            bgcolor: config.dotColor,
            ml: 1,
            mr: -0.5,
          }}
        />
      }
      label={customLabel || config.label}
      sx={{
        bgcolor: config.bgColor,
        color: config.color,
        fontWeight: 600,
        fontSize: '0.75rem',
        borderRadius: 2,
        height: size === 'small' ? 24 : 28,
        border: '1px solid transparent',
        '& .MuiChip-label': {
          px: 1,
        },
      }}
    />
  )
}

export default StatusBadge

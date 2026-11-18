import { createTheme } from '@mui/material/styles'

/**
 * Enterprise SaaS Design Tokens & MUI Theme
 * Palette: Deep Navy (#172554) + Royal Blue (#2563EB) + Light Slate (#F8FAFC)
 */
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#172554',
      light: '#1e40af',
      dark: '#0f172a',
      lighter: '#eff6ff',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2563eb',
      light: '#3b82f6',
      dark: '#1d4ed8',
      lighter: '#dbeafe',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
      disabled: '#94a3b8',
    },
    divider: '#e2e8f0',
    success: {
      main: '#16a34a',
      light: '#22c55e',
      dark: '#15803d',
      lighter: '#dcfce7',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
      lighter: '#fef3c7',
      contrastText: '#ffffff',
    },
    error: {
      main: '#dc2626',
      light: '#ef4444',
      dark: '#b91c1c',
      lighter: '#fee2e2',
      contrastText: '#ffffff',
    },
    info: {
      main: '#0284c7',
      light: '#38bdf8',
      dark: '#0369a1',
      lighter: '#e0f2fe',
      contrastText: '#ffffff',
    },
  },
  typography: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif",
    h1: {
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      fontWeight: 800,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      fontWeight: 600,
      letterSpacing: '-0.015em',
    },
    h6: {
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    subtitle1: {
      fontWeight: 500,
      color: '#475569',
    },
    subtitle2: {
      fontWeight: 600,
      color: '#334155',
    },
    body1: {
      fontSize: '0.9375rem',
      lineHeight: 1.55,
    },
    body2: {
      fontSize: '0.84375rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
    overline: {
      fontWeight: 700,
      letterSpacing: '0.08em',
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f8fafc',
          color: '#0f172a',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 16px',
          fontWeight: 600,
          transition: 'background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease',
        },
        sizeSmall: {
          padding: '6px 12px',
          fontSize: '0.8125rem',
        },
        containedPrimary: {
          backgroundColor: '#172554',
          '&:hover': {
            backgroundColor: '#1e3a8a',
            boxShadow: '0 4px 12px rgba(23, 37, 84, 0.18)',
          },
        },
        containedSecondary: {
          backgroundColor: '#2563eb',
          '&:hover': {
            backgroundColor: '#1d4ed8',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.22)',
          },
        },
        outlined: {
          borderColor: '#cbd5e1',
          '&:hover': {
            borderColor: '#94a3b8',
            backgroundColor: '#f8fafc',
          },
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 12,
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#0f172a',
          borderBottom: '1px solid #e2e8f0',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e2e8f0',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #f1f5f9',
          padding: '13px 16px',
          fontSize: '0.875rem',
        },
        head: {
          backgroundColor: '#f8fafc',
          color: '#475569',
          fontWeight: 600,
          fontSize: '0.75rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          borderBottom: '1px solid #e2e8f0',
          whiteSpace: 'nowrap',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child td': {
            borderBottom: 0,
          },
          '&.MuiTableRow-hover:hover': {
            backgroundColor: '#f8fafc',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: '#ffffff',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#cbd5e1',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#94a3b8',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#2563eb',
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.75rem',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 40px -12px rgba(15, 23, 42, 0.16)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          minHeight: 44,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiTooltip: {
      defaultProps: {
        arrow: true,
      },
    },
  },
})

export default theme

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Stack,
  Chip,
  Divider,
  Alert,
  Skeleton,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material'
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks'
import PeopleIcon from '@mui/icons-material/People'
import HistoryEduIcon from '@mui/icons-material/HistoryEdu'
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'
import RefreshIcon from '@mui/icons-material/Refresh'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import AssessmentIcon from '@mui/icons-material/Assessment'
import { useNavigate } from 'react-router-dom'
import dashboardService from '../services/dashboardService'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../utils/constants'
import { formatCurrency, formatDateTime } from '../utils/formatters'

const AdminDashboardPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const data = await dashboardService.getDashboardSummary()
      setMetrics(data)
      setLastUpdated(new Date().toISOString())
    } catch (err) {
      setError(err.message || 'Failed to load dashboard statistics from backend.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Calculate ratio percentages
  const availabilityRate =
    metrics?.totalBookCopies > 0
      ? Math.round((metrics.availableBookCopies / metrics.totalBookCopies) * 100)
      : 0

  const activeMemberRate =
    metrics?.totalMembers > 0
      ? Math.round((metrics.activeMembers / metrics.totalMembers) * 100)
      : 0

  return (
    <Box>
      {/* Dashboard Top Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
            <Typography variant="h4" component="h1" fontWeight={700}>
              System Dashboard
            </Typography>
            <Chip label="Live Analytics" size="small" color="primary" sx={{ fontWeight: 600 }} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Welcome back, <strong>{user?.name || 'Administrator'}</strong>. Here is the operational summary of your library.
          </Typography>
        </Box>

        <Stack direction="row" alignItems="center" spacing={1}>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', md: 'inline' } }}>
              Updated {formatDateTime(lastUpdated)}
            </Typography>
          )}
          <Tooltip title="Refresh Dashboard KPIs">
            <span>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon className={refreshing ? 'rotating-icon' : ''} />}
                onClick={() => fetchDashboardData(true)}
                disabled={loading || refreshing}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Error Alert with Retry */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => fetchDashboardData(true)}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Primary KPI Metric Cards */}
      <Grid container spacing={3} mb={3}>
        {/* 1. Total Books Card */}
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            elevation={2}
            onClick={() => navigate(ROUTES.ADMIN_BOOKS)}
            sx={{
              height: '100%',
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
            }}
          >
            <CardContent>
              {loading ? (
                <>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="rectangular" height={40} sx={{ my: 1 }} />
                  <Skeleton variant="text" width="80%" />
                </>
              ) : (
                <>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="overline" color="text.secondary" fontWeight={700}>
                      Book Titles
                    </Typography>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <LibraryBooksIcon fontSize="small" />
                    </Box>
                  </Stack>

                  <Typography variant="h3" fontWeight={700} color="primary.main" gutterBottom>
                    {metrics?.totalBooks ?? 0}
                  </Typography>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      Total Copies: <strong>{metrics?.totalBookCopies ?? 0}</strong>
                    </Typography>
                    <Chip
                      size="small"
                      label={`${metrics?.availableBookCopies ?? 0} Available`}
                      color="success"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                    />
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 2. Registered Members Card */}
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            elevation={2}
            onClick={() => navigate(ROUTES.ADMIN_MEMBERS)}
            sx={{
              height: '100%',
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
            }}
          >
            <CardContent>
              {loading ? (
                <>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="rectangular" height={40} sx={{ my: 1 }} />
                  <Skeleton variant="text" width="80%" />
                </>
              ) : (
                <>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="overline" color="text.secondary" fontWeight={700}>
                      Patron Members
                    </Typography>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        bgcolor: 'info.light',
                        color: 'info.contrastText',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <PeopleIcon fontSize="small" />
                    </Box>
                  </Stack>

                  <Typography variant="h3" fontWeight={700} color="info.main" gutterBottom>
                    {metrics?.totalMembers ?? 0}
                  </Typography>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      size="small"
                      label={`${metrics?.activeMembers ?? 0} Active`}
                      color="info"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                    />
                    <Chip
                      size="small"
                      label={`${metrics?.inactiveMembers ?? 0} Inactive`}
                      color="default"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 3. Active Loans / Borrowings Card */}
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            elevation={2}
            onClick={() => navigate(ROUTES.ADMIN_BORROWINGS)}
            sx={{
              height: '100%',
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
            }}
          >
            <CardContent>
              {loading ? (
                <>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="rectangular" height={40} sx={{ my: 1 }} />
                  <Skeleton variant="text" width="80%" />
                </>
              ) : (
                <>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="overline" color="text.secondary" fontWeight={700}>
                      Active Loans
                    </Typography>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        bgcolor: 'warning.light',
                        color: 'warning.contrastText',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <HistoryEduIcon fontSize="small" />
                    </Box>
                  </Stack>

                  <Typography variant="h3" fontWeight={700} color="warning.dark" gutterBottom>
                    {metrics?.currentlyBorrowedBooks ?? 0}
                  </Typography>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      In circulation
                    </Typography>
                    {metrics?.overdueBorrowings > 0 ? (
                      <Chip
                        size="small"
                        icon={<WarningAmberIcon style={{ fontSize: 14 }} />}
                        label={`${metrics.overdueBorrowings} Overdue`}
                        color="error"
                        sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                      />
                    ) : (
                      <Chip
                        size="small"
                        icon={<CheckCircleIcon style={{ fontSize: 14 }} />}
                        label="0 Overdue"
                        color="success"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 4. Fine Assessments Card */}
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            elevation={2}
            onClick={() => navigate(ROUTES.ADMIN_FINES)}
            sx={{
              height: '100%',
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
            }}
          >
            <CardContent>
              {loading ? (
                <>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="rectangular" height={40} sx={{ my: 1 }} />
                  <Skeleton variant="text" width="80%" />
                </>
              ) : (
                <>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="overline" color="text.secondary" fontWeight={700}>
                      Unpaid Fines
                    </Typography>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        bgcolor: 'error.light',
                        color: 'error.contrastText',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MonetizationOnIcon fontSize="small" />
                    </Box>
                  </Stack>

                  <Typography variant="h3" fontWeight={700} color="error.main" gutterBottom>
                    {formatCurrency(metrics?.totalUnpaidFines ?? 0)}
                  </Typography>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      {metrics?.unpaidFineCount ?? 0} unsettled fines
                    </Typography>
                    <Typography variant="caption" color="success.main" fontWeight={600}>
                      Paid: {formatCurrency(metrics?.totalPaidFines ?? 0)}
                    </Typography>
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Operational Progress Overview & Quick Administrative Actions */}
      <Grid container spacing={3}>
        {/* Operational Ratios Card */}
        <Grid item xs={12} md={7}>
          <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Operational Status Overview
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Real-time inventory availability and member activity ratios.
              </Typography>

              {loading ? (
                <Stack spacing={3}>
                  <Skeleton variant="rectangular" height={50} />
                  <Skeleton variant="rectangular" height={50} />
                </Stack>
              ) : (
                <Stack spacing={3}>
                  {/* Book Availability Ratio */}
                  <Box>
                    <Stack direction="row" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" fontWeight={600}>
                        Book Copies Availability Rate
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color="primary.main">
                        {availabilityRate}% Available ({metrics?.availableBookCopies ?? 0} of {metrics?.totalBookCopies ?? 0})
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={availabilityRate}
                      color={availabilityRate > 30 ? 'primary' : 'warning'}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  {/* Active Membership Ratio */}
                  <Box>
                    <Stack direction="row" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" fontWeight={600}>
                        Active Member Ratio
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color="info.main">
                        {activeMemberRate}% Active ({metrics?.activeMembers ?? 0} of {metrics?.totalMembers ?? 0})
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={activeMemberRate}
                      color="info"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Divider />

                  <Stack direction="row" spacing={3} justifyContent="space-around" pt={1}>
                    <Box textAlign="center">
                      <Typography variant="caption" color="text.secondary" display="block">
                        Borrowed Copies
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color="text.primary">
                        {metrics?.borrowedBookCopies ?? 0}
                      </Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography variant="caption" color="text.secondary" display="block">
                        Settled Fine Records
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color="success.main">
                        {metrics?.paidFineCount ?? 0}
                      </Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography variant="caption" color="text.secondary" display="block">
                        Overdue Incurred
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color="error.main">
                        {metrics?.overdueBorrowings ?? 0}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Administrative Shortcuts */}
        <Grid item xs={12} md={5}>
          <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Quick Actions
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Common administrative workflows and direct shortcuts.
              </Typography>

              <Stack spacing={1.5}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<LibraryBooksIcon color="primary" />}
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate(ROUTES.ADMIN_BOOKS)}
                  sx={{ justifyContent: 'space-between', py: 1.2, fontWeight: 600, textTransform: 'none' }}
                >
                  Manage Books & Inventory
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PeopleIcon color="info" />}
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate(ROUTES.ADMIN_MEMBERS)}
                  sx={{ justifyContent: 'space-between', py: 1.2, fontWeight: 600, textTransform: 'none' }}
                >
                  Manage Patron Members
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<HistoryEduIcon color="warning" />}
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate(ROUTES.ADMIN_BORROWINGS)}
                  sx={{ justifyContent: 'space-between', py: 1.2, fontWeight: 600, textTransform: 'none' }}
                >
                  All Active Borrowings
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<MonetizationOnIcon color="error" />}
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate(ROUTES.ADMIN_FINES)}
                  sx={{ justifyContent: 'space-between', py: 1.2, fontWeight: 600, textTransform: 'none' }}
                >
                  Overdue & Fine Assessments
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AssessmentIcon color="secondary" />}
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate(ROUTES.ADMIN_REPORTS)}
                  sx={{ justifyContent: 'space-between', py: 1.2, fontWeight: 600, textTransform: 'none' }}
                >
                  Analytics & Circulation Reports
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default AdminDashboardPage

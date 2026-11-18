import React, { useState, useEffect, useCallback } from 'react'
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Tooltip,
} from '@mui/material'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import RefreshIcon from '@mui/icons-material/Refresh'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { useNavigate } from 'react-router-dom'
import dashboardService from '../services/dashboardService'
import reportService from '../services/reportService'
import borrowingService from '../services/borrowingService'
import bookService from '../services/bookService'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../utils/constants'
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters'
import PageHeader from '../components/common/PageHeader'
import StatCard from '../components/common/StatCard'
import StatusBadge from '../components/common/StatusBadge'

// Category palette for donut chart
const DONUT_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#7c3aed', '#0284c7', '#64748b']

const AdminDashboardPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [metrics, setMetrics] = useState(null)
  const [categoryBreakdown, setCategoryBreakdown] = useState([])
  const [recentBorrowings, setRecentBorrowings] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const summaryPromise = dashboardService.getDashboardSummary()
      const bookReportPromise = reportService.getBookReport().catch(() => null)
      const borrowingsPromise = borrowingService.getAllBorrowings({ page: 0, size: 5, sortBy: 'id', direction: 'DESC' }).catch(() => null)

      const [summaryData, bookReportData, borrowingsData] = await Promise.all([
        summaryPromise,
        bookReportPromise,
        borrowingsPromise,
      ])

      setMetrics(summaryData)
      if (bookReportData?.categoryBreakdown) {
        setCategoryBreakdown(bookReportData.categoryBreakdown.slice(0, 5))
      }
      if (borrowingsData?.content) {
        setRecentBorrowings(borrowingsData.content)
      }
      setLastUpdated(new Date().toISOString())
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data from backend.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const availabilityRate =
    metrics?.totalBookCopies > 0
      ? Math.round((metrics.availableBookCopies / metrics.totalBookCopies) * 100)
      : 0

  const activeMemberRate =
    metrics?.totalMembers > 0
      ? Math.round((metrics.activeMembers / metrics.totalMembers) * 100)
      : 0

  const headerActions = (
    <Stack direction="row" alignItems="center" spacing={1.5}>
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
            sx={{ fontWeight: 600, borderRadius: 2.5 }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </span>
      </Tooltip>
    </Stack>
  )

  // Calculations for Donut Chart (Image 4 "Top Channels" style)
  const totalCategoryBooks = categoryBreakdown.reduce((acc, c) => acc + c.bookCount, 0) || 1

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle={`Live overview & circulation analytics for ${user?.name || 'Administrator'}.`}
        actions={headerActions}
      />

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

      {/* KPI Cards Row (Inspired by Reference Images 1 & 4) */}
      <Grid container spacing={2.5} mb={3.5}>
        {/* 1. Hero KPI Card: Active Loans (Image 1 "Business BD" Hero style) */}
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            variant="hero"
            title="Active Circulation"
            value={`${metrics?.currentlyBorrowedBooks ?? 0} Loans`}
            subtitle="Books currently checked out"
            icon={<AssignmentOutlinedIcon />}
            badge={
              (metrics?.overdueBorrowings ?? 0) > 0 ? (
                <Chip
                  label={`${metrics.overdueBorrowings} Overdue`}
                  size="small"
                  sx={{ height: 22, fontSize: '0.6875rem', fontWeight: 800, bgcolor: 'rgba(255,255,255,0.22)', color: '#ffffff' }}
                />
              ) : (
                <Chip
                  label="All on schedule"
                  size="small"
                  sx={{ height: 22, fontSize: '0.6875rem', fontWeight: 700, bgcolor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}
                />
              )
            }
            onClick={() => navigate(ROUTES.ADMIN_BORROWINGS)}
            loading={loading}
          />
        </Grid>

        {/* 2. Total Catalog Titles with Mini Sparkline (Image 4 style) */}
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Catalog Titles"
            value={metrics?.totalBooks ?? 0}
            subtitle={`${metrics?.availableBookCopies ?? 0} copies in stock`}
            icon={<MenuBookOutlinedIcon />}
            color="#2563eb"
            bgColor="#eff6ff"
            sparklineColor="#2563eb"
            badge={
              <Chip
                label={`${availabilityRate}% Avail`}
                size="small"
                sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 700, bgcolor: '#dcfce7', color: '#15803d' }}
              />
            }
            onClick={() => navigate(ROUTES.ADMIN_BOOKS)}
            loading={loading}
          />
        </Grid>

        {/* 3. Patron Members with Green Sparkline */}
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Patron Members"
            value={metrics?.totalMembers ?? 0}
            subtitle={`${metrics?.activeMembers ?? 0} active accounts`}
            icon={<PeopleAltOutlinedIcon />}
            color="#16a34a"
            bgColor="#dcfce7"
            sparklineColor="#16a34a"
            badge={
              <Chip
                label={`${activeMemberRate}% Active`}
                size="small"
                sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 700, bgcolor: '#eff6ff', color: '#1d4ed8' }}
              />
            }
            onClick={() => navigate(ROUTES.ADMIN_MEMBERS)}
            loading={loading}
          />
        </Grid>

        {/* 4. Unpaid Fines with Amber/Red Sparkline */}
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Unsettled Fines"
            value={formatCurrency(metrics?.totalUnpaidFines ?? 0)}
            subtitle={`${metrics?.unpaidFineCount ?? 0} pending fines`}
            icon={<ReceiptLongOutlinedIcon />}
            color="#dc2626"
            bgColor="#fee2e2"
            sparklineColor="#dc2626"
            badge={
              <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 700 }}>
                Paid: {formatCurrency(metrics?.totalPaidFines ?? 0)}
              </Typography>
            }
            onClick={() => navigate(ROUTES.ADMIN_FINES)}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Charts Section: Area Trend Curve + Donut Chart (Images 1 & 4) */}
      <Grid container spacing={3} mb={3.5}>
        {/* Circulation Weekly Growth / Loan Trend Curve (Image 1 "Call By Hour" & Image 4 "Weekly Growth") */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%', borderRadius: 3.5, border: '1px solid #e2e8f0', p: { xs: 2.5, sm: 3.5 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Box>
                <Typography variant="h6" fontWeight={800} color="#0f172a">
                  Circulation Activity &amp; Growth
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Weekly book borrowing volume and return velocity
                </Typography>
              </Box>
              <Chip
                label="7-Day Cycle"
                size="small"
                sx={{ fontWeight: 700, bgcolor: '#f1f5f9', color: '#475569', borderRadius: 2 }}
              />
            </Stack>

            {/* SVG Area Chart (No external chart dependency required) */}
            <Box sx={{ mt: 3, height: 230, position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                {/* Horizontal reference lines */}
                <line x1="0" y1="40" x2="500" y2="40" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="90" x2="500" y2="90" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="140" x2="500" y2="140" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />

                {/* Filled Area Curve */}
                <path
                  d="M 0 160 C 70 140, 110 60, 170 80 C 230 100, 270 120, 330 65 C 390 20, 440 70, 500 40 L 500 200 L 0 200 Z"
                  fill="url(#areaGradient)"
                />

                {/* Smooth Curve Stroke (Image 1 style) */}
                <path
                  d="M 0 160 C 70 140, 110 60, 170 80 C 230 100, 270 120, 330 65 C 390 20, 440 70, 500 40"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Data Points (Image 4 style circular markers) */}
                {[
                  { cx: 80, cy: 110, val: 'Mon' },
                  { cx: 170, cy: 80, val: 'Tue' },
                  { cx: 250, cy: 105, val: 'Wed' },
                  { cx: 330, cy: 65, val: 'Thu' },
                  { cx: 410, cy: 45, val: 'Fri' },
                  { cx: 480, cy: 42, val: 'Sat' },
                ].map((pt, i) => (
                  <g key={i}>
                    <circle cx={pt.cx} cy={pt.cy} r={5} fill="#ffffff" stroke="#2563eb" strokeWidth={3} />
                  </g>
                ))}
              </svg>
            </Box>

            {/* X-Axis Day Labels */}
            <Stack direction="row" justifyContent="space-between" px={1} mt={1}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <Typography key={day} variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                  {day}
                </Typography>
              ))}
            </Stack>
          </Card>
        </Grid>

        {/* Collection by Category Donut Chart (Image 4 "Top Channels" style) */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%', borderRadius: 3.5, border: '1px solid #e2e8f0', p: { xs: 2.5, sm: 3.5 } }}>
            <Typography variant="h6" fontWeight={800} color="#0f172a" gutterBottom>
              Top Categories
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Genre distribution across catalog
            </Typography>

            {/* SVG Donut Graphic */}
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <Box sx={{ position: 'relative', width: 160, height: 160 }}>
                <svg width="160" height="160" viewBox="0 0 42 42">
                  <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
                  {categoryBreakdown.map((cat, idx) => {
                    const percent = Math.round((cat.bookCount / totalCategoryBooks) * 100) || 15
                    const dashArray = `${percent} ${100 - percent}`
                    const dashOffset = 100 - idx * 25
                    return (
                      <circle
                        key={idx}
                        cx="21"
                        cy="21"
                        r="15.91549430918954"
                        fill="transparent"
                        stroke={DONUT_COLORS[idx % DONUT_COLORS.length]}
                        strokeWidth="6"
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                      />
                    )
                  })}
                </svg>
                {/* Center Total Count (Image 4 style) */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h5" fontWeight={800} color="#0f172a">
                    {metrics?.totalBooks ?? 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Total Titles
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Category Color Legend (Image 4 style) */}
            <Stack spacing={1.25} mt={2}>
              {categoryBreakdown.map((cat, idx) => {
                const percent = Math.round((cat.bookCount / totalCategoryBooks) * 100)
                return (
                  <Stack key={idx} direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" alignItems="center" spacing={1.2}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: DONUT_COLORS[idx % DONUT_COLORS.length],
                        }}
                      />
                      <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600, fontSize: '0.8125rem' }}>
                        {cat.category || 'General'}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                      {cat.bookCount} ({percent}%)
                    </Typography>
                  </Stack>
                )
              })}
            </Stack>

            <Divider sx={{ my: 2.5 }} />

            <Button
              fullWidth
              size="small"
              onClick={() => navigate(ROUTES.ADMIN_REPORTS)}
              sx={{ fontWeight: 700, color: '#2563eb' }}
            >
              View Full Report
            </Button>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Section: Recent Circulation Activity Table (Images 1 & 4) */}
      <Card sx={{ borderRadius: 3.5, border: '1px solid #e2e8f0', p: { xs: 2.5, sm: 3.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
          <Box>
            <Typography variant="h6" fontWeight={800} color="#0f172a">
              Recent Activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Latest patron borrowing transactions and checkouts
            </Typography>
          </Box>
          <Button
            size="small"
            endIcon={<ArrowForwardIcon fontSize="small" />}
            onClick={() => navigate(ROUTES.ADMIN_BORROWINGS)}
            sx={{ fontWeight: 700, color: '#2563eb' }}
          >
            View All Activity
          </Button>
        </Stack>

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Loan ID</TableCell>
                <TableCell>Book Title</TableCell>
                <TableCell>Patron Member</TableCell>
                <TableCell>Borrow Date</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton width={40} /></TableCell>
                    <TableCell><Skeleton width={180} /></TableCell>
                    <TableCell><Skeleton width={120} /></TableCell>
                    <TableCell><Skeleton width={90} /></TableCell>
                    <TableCell><Skeleton width={90} /></TableCell>
                    <TableCell align="center"><Skeleton width={70} /></TableCell>
                  </TableRow>
                ))
              ) : recentBorrowings.length > 0 ? (
                recentBorrowings.map((b) => (
                  <TableRow key={b.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>#{b.id}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{b.bookTitle || `Book #${b.bookId}`}</TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar sx={{ width: 26, height: 26, bgcolor: '#eff6ff', color: '#2563eb', fontSize: '0.75rem', fontWeight: 700 }}>
                          {(b.memberName || 'M').charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#334155' }}>
                          {b.memberName || `Member #${b.memberId}`}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell color="text.secondary">{formatDate(b.borrowDate)}</TableCell>
                    <TableCell color="text.secondary">{formatDate(b.dueDate)}</TableCell>
                    <TableCell align="center">
                      <StatusBadge status={b.status} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No recent borrowing transactions.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  )
}

export default AdminDashboardPage

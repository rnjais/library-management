import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Button,
  Chip,
  Stack,
  Alert,
  Skeleton,
  LinearProgress,
  Tooltip,
  IconButton,
  Pagination,
} from '@mui/material'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import PeopleIcon from '@mui/icons-material/People'
import HistoryEduIcon from '@mui/icons-material/HistoryEdu'
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import RefreshIcon from '@mui/icons-material/Refresh'
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined'
import ClearIcon from '@mui/icons-material/Clear'
import reportService from '../services/reportService'
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters'
import PageHeader from '../components/common/PageHeader'
import StatCard from '../components/common/StatCard'
import StatusBadge from '../components/common/StatusBadge'
import EmptyState from '../components/common/EmptyState'

/**
 * Modern Administrative Reports & Analytics Suite (Image 1, 3, 4 Style)
 */
const ReportsPage = () => {
  // Active Tab Index: 0: Books, 1: Members, 2: Borrowings, 3: Overdue, 4: Fines
  const [activeTab, setActiveTab] = useState(0)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Report States
  const [bookReport, setBookReport] = useState(null)
  const [memberReport, setMemberReport] = useState(null)
  const [borrowingReport, setBorrowingReport] = useState(null)
  const [overdueReport, setOverdueReport] = useState(null)
  const [fineReport, setFineReport] = useState(null)

  // Member Filter State
  const [memberActiveFilter, setMemberActiveFilter] = useState('')
  const [memberStartDate, setMemberStartDate] = useState('')
  const [memberEndDate, setMemberEndDate] = useState('')
  const [memberPage, setMemberPage] = useState(0)
  const [memberPageSize] = useState(10)

  // Borrowing Filter State
  const [borrowingStatusFilter, setBorrowingStatusFilter] = useState('ALL')
  const [borrowingStartDate, setBorrowingStartDate] = useState('')
  const [borrowingEndDate, setBorrowingEndDate] = useState('')
  const [borrowingPage, setBorrowingPage] = useState(0)
  const [borrowingPageSize] = useState(10)

  // Overdue Filter State
  const [overduePage, setOverduePage] = useState(0)
  const [overduePageSize] = useState(10)

  // Fine Filter State
  const [fineStatusFilter, setFineStatusFilter] = useState('ALL')
  const [fineStartDate, setFineStartDate] = useState('')
  const [fineEndDate, setFineEndDate] = useState('')
  const [finePage, setFinePage] = useState(0)
  const [finePageSize] = useState(10)

  // Data Fetchers
  const loadBookReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await reportService.getBookReport()
      setBookReport(data)
    } catch (err) {
      setError(err.message || 'Failed to load book inventory report.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMemberReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let activeParam = null
      if (memberActiveFilter === 'ACTIVE') activeParam = true
      if (memberActiveFilter === 'INACTIVE') activeParam = false

      const data = await reportService.getMemberReport({
        active: activeParam,
        startDate: memberStartDate || null,
        endDate: memberEndDate || null,
        page: memberPage,
        size: memberPageSize,
        sortBy: 'id',
        direction: 'DESC',
      })
      setMemberReport(data)
    } catch (err) {
      setError(err.message || 'Failed to load member patronage report.')
    } finally {
      setLoading(false)
    }
  }, [memberActiveFilter, memberStartDate, memberEndDate, memberPage, memberPageSize])

  const loadBorrowingReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await reportService.getBorrowingReport({
        status: borrowingStatusFilter,
        startDate: borrowingStartDate || null,
        endDate: borrowingEndDate || null,
        page: borrowingPage,
        size: borrowingPageSize,
        sortBy: 'id',
        direction: 'DESC',
      })
      setBorrowingReport(data)
    } catch (err) {
      setError(err.message || 'Failed to load borrowing circulation report.')
    } finally {
      setLoading(false)
    }
  }, [borrowingStatusFilter, borrowingStartDate, borrowingEndDate, borrowingPage, borrowingPageSize])

  const loadOverdueReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await reportService.getOverdueReport({
        page: overduePage,
        size: overduePageSize,
        sortBy: 'dueDate',
        direction: 'ASC',
      })
      setOverdueReport(data)
    } catch (err) {
      setError(err.message || 'Failed to load overdue report.')
    } finally {
      setLoading(false)
    }
  }, [overduePage, overduePageSize])

  const loadFineReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await reportService.getFineReport({
        status: fineStatusFilter,
        startDate: fineStartDate || null,
        endDate: fineEndDate || null,
        page: finePage,
        size: finePageSize,
        sortBy: 'calculatedAt',
        direction: 'DESC',
      })
      setFineReport(data)
    } catch (err) {
      setError(err.message || 'Failed to load fine revenue report.')
    } finally {
      setLoading(false)
    }
  }, [fineStatusFilter, fineStartDate, fineEndDate, finePage, finePageSize])

  useEffect(() => {
    if (activeTab === 0) loadBookReport()
    else if (activeTab === 1) loadMemberReport()
    else if (activeTab === 2) loadBorrowingReport()
    else if (activeTab === 3) loadOverdueReport()
    else if (activeTab === 4) loadFineReport()
  }, [activeTab, loadBookReport, loadMemberReport, loadBorrowingReport, loadOverdueReport, loadFineReport])

  // Safe Blob CSV Downloader with RFC 4180 Escaping & Formula Injection Protection
  const downloadCsv = (filename, rows) => {
    if (!rows || !rows.length) return
    const keys = Object.keys(rows[0])
    const csvRows = [
      keys.join(','),
      ...rows.map((row) =>
        keys
          .map((k) => {
            let val = row[k] === null || row[k] === undefined ? '' : String(row[k])
            if (/^[=\+\-@]/.test(val)) val = "'" + val
            return `"${val.replace(/"/g, '""')}"`
          })
          .join(',')
      ),
    ]

    const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const triggerRefresh = () => {
    if (activeTab === 0) loadBookReport()
    else if (activeTab === 1) loadMemberReport()
    else if (activeTab === 2) loadBorrowingReport()
    else if (activeTab === 3) loadOverdueReport()
    else if (activeTab === 4) loadFineReport()
  }

  const headerActions = (
    <Button
      variant="outlined"
      size="small"
      startIcon={<RefreshIcon />}
      onClick={triggerRefresh}
      sx={{ fontWeight: 600, borderRadius: 2.5 }}
    >
      Refresh
    </Button>
  )

  return (
    <Box>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Operational audits across book catalog, patron members, circulation, overdue loans, and fine revenues"
        breadcrumbs={[{ label: 'Reports', path: null }]}
        actions={headerActions}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Styled Tabs (Image 1 & 4 Style) */}
      <Card sx={{ mb: 3.5, borderRadius: 3, border: '1px solid #e2e8f0', p: 1 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              borderRadius: 2.5,
              minHeight: 44,
              px: 2.5,
              fontWeight: 700,
              fontSize: '0.875rem',
            },
            '& .Mui-selected': {
              bgcolor: '#eff6ff',
              color: '#2563eb !important',
            },
          }}
        >
          <Tab icon={<MenuBookIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Book Inventory" />
          <Tab icon={<PeopleIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Member Patronage" />
          <Tab icon={<HistoryEduIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Circulation" />
          <Tab icon={<WarningAmberRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Overdue Audit" />
          <Tab icon={<MonetizationOnIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Fine Revenues" />
        </Tabs>
      </Card>

      {/* =========================================================================
          TAB 0: BOOK INVENTORY
         ========================================================================= */}
      {activeTab === 0 && (
        <Box>
          <Grid container spacing={2.5} mb={3.5}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Catalog Titles"
                value={bookReport?.totalBooks ?? 0}
                subtitle="Unique book titles"
                icon={<MenuBookIcon />}
                color="#2563eb"
                bgColor="#eff6ff"
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Physical Copies"
                value={bookReport?.totalCopies ?? 0}
                subtitle="All copies in collection"
                icon={<MenuBookIcon />}
                color="#172554"
                bgColor="#f1f5f9"
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Available Copies"
                value={bookReport?.availableCopies ?? 0}
                subtitle="Ready on shelf"
                icon={<MenuBookIcon />}
                color="#16a34a"
                bgColor="#dcfce7"
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Currently Borrowed"
                value={bookReport?.borrowedCopies ?? 0}
                subtitle="Checked out to patrons"
                icon={<HistoryEduIcon />}
                color="#d97706"
                bgColor="#fef3c7"
                loading={loading}
              />
            </Grid>
          </Grid>

          {/* Category Table Card */}
          <Card sx={{ borderRadius: 4, border: '1px solid #e2e8f0', p: { xs: 2, sm: 3.5 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
              <Box>
                <Typography variant="h6" fontWeight={800} color="#0f172a">
                  Genre &amp; Category Breakdown
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Inventory allocation across genres
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadOutlinedIcon />}
                disabled={!bookReport?.categoryBreakdown?.length}
                onClick={() =>
                  downloadCsv(
                    'book_categories_report',
                    bookReport?.categoryBreakdown?.map((c) => ({
                      Category: c.category,
                      Titles: c.bookCount,
                      TotalCopies: c.totalCopies,
                      Available: c.availableCopies,
                      Borrowed: c.borrowedCopies,
                    }))
                  )
                }
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                Export CSV
              </Button>
            </Stack>

            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Category / Genre</TableCell>
                    <TableCell align="center">Titles</TableCell>
                    <TableCell align="center">Total Copies</TableCell>
                    <TableCell align="center">Available</TableCell>
                    <TableCell align="center">Borrowed</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>Availability Ratio</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    [1, 2, 3].map((i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton width={140} /></TableCell>
                        <TableCell align="center"><Skeleton width={40} /></TableCell>
                        <TableCell align="center"><Skeleton width={40} /></TableCell>
                        <TableCell align="center"><Skeleton width={40} /></TableCell>
                        <TableCell align="center"><Skeleton width={40} /></TableCell>
                        <TableCell><Skeleton width={180} /></TableCell>
                      </TableRow>
                    ))
                  ) : bookReport?.categoryBreakdown?.length > 0 ? (
                    bookReport.categoryBreakdown.map((c, idx) => {
                      const availRate = c.totalCopies > 0 ? Math.round((c.availableCopies / c.totalCopies) * 100) : 0
                      return (
                        <TableRow key={idx} hover sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{c.category || 'General'}</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>{c.bookCount}</TableCell>
                          <TableCell align="center">{c.totalCopies}</TableCell>
                          <TableCell align="center" sx={{ color: '#16a34a', fontWeight: 700 }}>{c.availableCopies}</TableCell>
                          <TableCell align="center" sx={{ color: '#d97706', fontWeight: 700 }}>{c.borrowedCopies}</TableCell>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                              <Box sx={{ width: '100%' }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={availRate}
                                  sx={{
                                    height: 7,
                                    borderRadius: 4,
                                    bgcolor: '#f1f5f9',
                                    '& .MuiLinearProgress-bar': { bgcolor: '#2563eb', borderRadius: 4 },
                                  }}
                                />
                              </Box>
                              <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ minWidth: 35 }}>
                                {availRate}%
                              </Typography>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ p: 4 }}>
                        <EmptyState title="No categories found" description="Inventory has no registered category records." />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {/* =========================================================================
          TAB 1: MEMBER PATRONAGE
         ========================================================================= */}
      {activeTab === 1 && (
        <Box>
          <Grid container spacing={2.5} mb={3.5}>
            <Grid item xs={12} sm={4}>
              <StatCard
                title="Total Enrolled Members"
                value={memberReport?.totalMembers ?? 0}
                subtitle="All time registrations"
                icon={<PeopleIcon />}
                color="#0284c7"
                bgColor="#e0f2fe"
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                title="Active Accounts"
                value={memberReport?.activeMembers ?? 0}
                subtitle="Authorized to borrow"
                icon={<PeopleIcon />}
                color="#16a34a"
                bgColor="#dcfce7"
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                title="Inactive Accounts"
                value={memberReport?.inactiveMembers ?? 0}
                subtitle="Deactivated / Suspended"
                icon={<PeopleIcon />}
                color="#64748b"
                bgColor="#f1f5f9"
                loading={loading}
              />
            </Grid>
          </Grid>

          {/* Members Filter & Table Card */}
          <Card sx={{ borderRadius: 4, border: '1px solid #e2e8f0', p: { xs: 2, sm: 3.5 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} mb={3}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <TextField
                  select
                  size="small"
                  label="Status"
                  value={memberActiveFilter}
                  onChange={(e) => setMemberActiveFilter(e.target.value)}
                  sx={{ minWidth: 140 }}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="ACTIVE">Active Only</MenuItem>
                  <MenuItem value="INACTIVE">Inactive Only</MenuItem>
                </TextField>

                <TextField
                  size="small"
                  type="date"
                  label="Start Date"
                  value={memberStartDate}
                  onChange={(e) => setMemberStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  size="small"
                  type="date"
                  label="End Date"
                  value={memberEndDate}
                  onChange={(e) => setMemberEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>

              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadOutlinedIcon />}
                disabled={!memberReport?.members?.content?.length}
                onClick={() =>
                  downloadCsv(
                    'members_report',
                    memberReport?.members?.content?.map((m) => ({
                      ID: m.id,
                      Name: m.fullName,
                      Email: m.email,
                      Phone: m.phoneNumber,
                      Enrolled: m.membershipDate,
                      Active: m.active,
                    }))
                  )
                }
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                Export CSV
              </Button>
            </Stack>

            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Full Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Enrollment Date</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    [1, 2, 3].map((i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton width={40} /></TableCell>
                        <TableCell><Skeleton width={140} /></TableCell>
                        <TableCell><Skeleton width={180} /></TableCell>
                        <TableCell><Skeleton width={110} /></TableCell>
                        <TableCell><Skeleton width={90} /></TableCell>
                        <TableCell align="center"><Skeleton width={70} /></TableCell>
                      </TableRow>
                    ))
                  ) : memberReport?.members?.content?.length > 0 ? (
                    memberReport.members.content.map((m) => (
                      <TableRow key={m.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell><Chip label={`#${m.id}`} size="small" sx={{ fontWeight: 700 }} /></TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{m.fullName}</TableCell>
                        <TableCell color="text.secondary">{m.email}</TableCell>
                        <TableCell color="text.secondary">{m.phoneNumber || '—'}</TableCell>
                        <TableCell color="text.secondary">{formatDate(m.membershipDate)}</TableCell>
                        <TableCell align="center">
                          <StatusBadge status={m.active ? 'ACTIVE' : 'INACTIVE'} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ p: 4 }}>
                        <EmptyState title="No members match filters" />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {memberReport?.members?.totalPages > 1 && (
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  count={memberReport.members.totalPages}
                  page={memberPage + 1}
                  onChange={(e, p) => setMemberPage(p - 1)}
                  color="primary"
                  shape="rounded"
                  sx={{ '& .Mui-selected': { bgcolor: '#2563eb !important', color: '#ffffff' } }}
                />
              </Box>
            )}
          </Card>
        </Box>
      )}

      {/* =========================================================================
          TAB 2: BORROWING CIRCULATION
         ========================================================================= */}
      {activeTab === 2 && (
        <Box>
          <Grid container spacing={2.5} mb={3.5}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Loans"
                value={borrowingReport?.totalBorrowings ?? 0}
                subtitle="All time checkouts"
                icon={<HistoryEduIcon />}
                color="#2563eb"
                bgColor="#eff6ff"
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Currently Borrowed"
                value={borrowingReport?.currentlyBorrowed ?? 0}
                subtitle="Active loans"
                icon={<HistoryEduIcon />}
                color="#0284c7"
                bgColor="#e0f2fe"
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Returned Loans"
                value={borrowingReport?.returnedBorrowings ?? 0}
                subtitle="Successfully returned"
                icon={<HistoryEduIcon />}
                color="#16a34a"
                bgColor="#dcfce7"
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Overdue Delinquencies"
                value={borrowingReport?.overdueBorrowings ?? 0}
                subtitle="Past due schedule"
                icon={<WarningAmberRoundedIcon />}
                color="#dc2626"
                bgColor="#fee2e2"
                loading={loading}
              />
            </Grid>
          </Grid>

          <Card sx={{ borderRadius: 4, border: '1px solid #e2e8f0', p: { xs: 2, sm: 3.5 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} mb={3}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <TextField
                  select
                  size="small"
                  label="Loan Status"
                  value={borrowingStatusFilter}
                  onChange={(e) => setBorrowingStatusFilter(e.target.value)}
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="ALL">All Loans</MenuItem>
                  <MenuItem value="BORROWED">Currently Borrowed</MenuItem>
                  <MenuItem value="RETURNED">Returned</MenuItem>
                  <MenuItem value="OVERDUE">Overdue</MenuItem>
                </TextField>

                <TextField
                  size="small"
                  type="date"
                  label="From Date"
                  value={borrowingStartDate}
                  onChange={(e) => setBorrowingStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  size="small"
                  type="date"
                  label="To Date"
                  value={borrowingEndDate}
                  onChange={(e) => setBorrowingEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>

              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadOutlinedIcon />}
                disabled={!borrowingReport?.borrowings?.content?.length}
                onClick={() =>
                  downloadCsv(
                    'borrowing_circulation_report',
                    borrowingReport?.borrowings?.content?.map((b) => ({
                      ID: b.id,
                      Book: b.bookTitle,
                      Member: b.memberName,
                      BorrowDate: b.borrowDate,
                      DueDate: b.dueDate,
                      ReturnDate: b.returnDate || '',
                      Status: b.status,
                    }))
                  )
                }
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                Export CSV
              </Button>
            </Stack>

            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Loan ID</TableCell>
                    <TableCell>Book Title</TableCell>
                    <TableCell>Patron Member</TableCell>
                    <TableCell>Borrow Date</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Return Date</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    [1, 2, 3].map((i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton width={40} /></TableCell>
                        <TableCell><Skeleton width={180} /></TableCell>
                        <TableCell><Skeleton width={130} /></TableCell>
                        <TableCell><Skeleton width={80} /></TableCell>
                        <TableCell><Skeleton width={80} /></TableCell>
                        <TableCell><Skeleton width={80} /></TableCell>
                        <TableCell align="center"><Skeleton width={70} /></TableCell>
                      </TableRow>
                    ))
                  ) : borrowingReport?.borrowings?.content?.length > 0 ? (
                    borrowingReport.borrowings.content.map((b) => (
                      <TableRow key={b.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell><Chip label={`#${b.id}`} size="small" sx={{ fontWeight: 700 }} /></TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{b.bookTitle}</TableCell>
                        <TableCell sx={{ fontWeight: 500, color: '#334155' }}>{b.memberName}</TableCell>
                        <TableCell color="text.secondary">{formatDate(b.borrowDate)}</TableCell>
                        <TableCell color="text.secondary">{formatDate(b.dueDate)}</TableCell>
                        <TableCell color="text.secondary">{b.returnDate ? formatDate(b.returnDate) : '—'}</TableCell>
                        <TableCell align="center">
                          <StatusBadge status={b.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ p: 4 }}>
                        <EmptyState title="No loans match criteria" />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {borrowingReport?.borrowings?.totalPages > 1 && (
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  count={borrowingReport.borrowings.totalPages}
                  page={borrowingPage + 1}
                  onChange={(e, p) => setBorrowingPage(p - 1)}
                  color="primary"
                  shape="rounded"
                  sx={{ '& .Mui-selected': { bgcolor: '#2563eb !important', color: '#ffffff' } }}
                />
              </Box>
            )}
          </Card>
        </Box>
      )}

      {/* =========================================================================
          TAB 3: OVERDUE AUDIT
         ========================================================================= */}
      {activeTab === 3 && (
        <Box>
          <Card sx={{ mb: 3.5, borderRadius: 3.5, border: '1px solid #fee2e2', p: 3, bgcolor: '#ffffff' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 3,
                    bgcolor: '#fee2e2',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <WarningAmberRoundedIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={800} color="#0f172a">
                    Overdue Delinquencies
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    All book loans that have exceeded their scheduled due date without being returned.
                  </Typography>
                </Box>
              </Stack>

              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<DownloadOutlinedIcon />}
                disabled={!overdueReport?.content?.length}
                onClick={() =>
                  downloadCsv(
                    'overdue_delinquencies_report',
                    overdueReport?.content?.map((b) => ({
                      ID: b.id,
                      Book: b.bookTitle,
                      Borrower: b.memberName,
                      BorrowDate: b.borrowDate,
                      DueDate: b.dueDate,
                    }))
                  )
                }
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                Export CSV
              </Button>
            </Stack>
          </Card>

          <Card sx={{ borderRadius: 4, border: '1px solid #e2e8f0', p: { xs: 2, sm: 3.5 } }}>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Loan ID</TableCell>
                    <TableCell>Overdue Book</TableCell>
                    <TableCell>Borrower Member</TableCell>
                    <TableCell>Issued Date</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    [1, 2, 3].map((i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton width={40} /></TableCell>
                        <TableCell><Skeleton width={180} /></TableCell>
                        <TableCell><Skeleton width={130} /></TableCell>
                        <TableCell><Skeleton width={90} /></TableCell>
                        <TableCell><Skeleton width={90} /></TableCell>
                        <TableCell align="center"><Skeleton width={70} /></TableCell>
                      </TableRow>
                    ))
                  ) : overdueReport?.content?.length > 0 ? (
                    overdueReport.content.map((b) => (
                      <TableRow key={b.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell><Chip label={`#${b.id}`} size="small" sx={{ fontWeight: 700 }} /></TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{b.bookTitle}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#334155' }}>{b.memberName}</TableCell>
                        <TableCell color="text.secondary">{formatDate(b.borrowDate)}</TableCell>
                        <TableCell sx={{ color: '#dc2626', fontWeight: 700 }}>{formatDate(b.dueDate)}</TableCell>
                        <TableCell align="center">
                          <StatusBadge status="OVERDUE" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ p: 4 }}>
                        <EmptyState title="Zero overdue loans" description="All book borrowings are completely on schedule." />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {overdueReport?.totalPages > 1 && (
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  count={overdueReport.totalPages}
                  page={overduePage + 1}
                  onChange={(e, p) => setOverduePage(p - 1)}
                  color="primary"
                  shape="rounded"
                  sx={{ '& .Mui-selected': { bgcolor: '#2563eb !important', color: '#ffffff' } }}
                />
              </Box>
            )}
          </Card>
        </Box>
      )}

      {/* =========================================================================
          TAB 4: FINE REVENUES
         ========================================================================= */}
      {activeTab === 4 && (
        <Box>
          <Grid container spacing={2.5} mb={3.5}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Fine Incurred"
                value={formatCurrency(fineReport?.totalFineAmount ?? 0)}
                subtitle={`${fineReport?.totalFineCount ?? 0} total assessments`}
                icon={<MonetizationOnIcon />}
                color="#2563eb"
                bgColor="#eff6ff"
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Settled Revenue"
                value={formatCurrency(fineReport?.paidFineAmount ?? 0)}
                subtitle={`${fineReport?.paidFineCount ?? 0} collected payments`}
                icon={<MonetizationOnIcon />}
                color="#16a34a"
                bgColor="#dcfce7"
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Pending Receivables"
                value={formatCurrency(fineReport?.unpaidFineAmount ?? 0)}
                subtitle={`${fineReport?.unpaidFineCount ?? 0} unsettled fines`}
                icon={<MonetizationOnIcon />}
                color="#dc2626"
                bgColor="#fee2e2"
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Collection Efficiency"
                value={
                  fineReport?.totalFineAmount > 0
                    ? `${Math.round(((fineReport.paidFineAmount || 0) / fineReport.totalFineAmount) * 100)}%`
                    : '100%'
                }
                subtitle="Settlement percentage"
                icon={<MonetizationOnIcon />}
                color="#7c3aed"
                bgColor="#f3e8ff"
                loading={loading}
              />
            </Grid>
          </Grid>

          <Card sx={{ borderRadius: 4, border: '1px solid #e2e8f0', p: { xs: 2, sm: 3.5 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} mb={3}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <TextField
                  select
                  size="small"
                  label="Settlement Status"
                  value={fineStatusFilter}
                  onChange={(e) => setFineStatusFilter(e.target.value)}
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="ALL">All Fines</MenuItem>
                  <MenuItem value="PAID">Settled (Paid)</MenuItem>
                  <MenuItem value="UNPAID">Pending (Unpaid)</MenuItem>
                </TextField>

                <TextField
                  size="small"
                  type="date"
                  label="From Date"
                  value={fineStartDate}
                  onChange={(e) => setFineStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  size="small"
                  type="date"
                  label="To Date"
                  value={fineEndDate}
                  onChange={(e) => setFineEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>

              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadOutlinedIcon />}
                disabled={!fineReport?.fines?.content?.length}
                onClick={() =>
                  downloadCsv(
                    'fine_revenues_report',
                    fineReport?.fines?.content?.map((f) => ({
                      ID: f.id,
                      Amount: f.fineAmount,
                      Status: f.status,
                      Book: f.bookTitle,
                      Member: f.memberName,
                      CalculatedAt: f.calculatedAt,
                      PaidAt: f.paidAt || '',
                    }))
                  )
                }
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                Export CSV
              </Button>
            </Stack>

            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fine ID</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Related Book</TableCell>
                    <TableCell>Patron Member</TableCell>
                    <TableCell>Assessed Date</TableCell>
                    <TableCell>Settled Date</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    [1, 2, 3].map((i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton width={40} /></TableCell>
                        <TableCell><Skeleton width={70} /></TableCell>
                        <TableCell><Skeleton width={180} /></TableCell>
                        <TableCell><Skeleton width={130} /></TableCell>
                        <TableCell><Skeleton width={90} /></TableCell>
                        <TableCell><Skeleton width={90} /></TableCell>
                        <TableCell align="center"><Skeleton width={70} /></TableCell>
                      </TableRow>
                    ))
                  ) : fineReport?.fines?.content?.length > 0 ? (
                    fineReport.fines.content.map((f) => (
                      <TableRow key={f.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell><Chip label={`#${f.id}`} size="small" sx={{ fontWeight: 700 }} /></TableCell>
                        <TableCell sx={{ fontWeight: 800, color: f.status === 'UNPAID' ? '#dc2626' : '#16a34a' }}>
                          {formatCurrency(f.fineAmount)}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>{f.bookTitle}</TableCell>
                        <TableCell sx={{ fontWeight: 500, color: '#334155' }}>{f.memberName}</TableCell>
                        <TableCell color="text.secondary">{formatDate(f.calculatedAt)}</TableCell>
                        <TableCell color="text.secondary">{f.paidAt ? formatDate(f.paidAt) : '—'}</TableCell>
                        <TableCell align="center">
                          <StatusBadge status={f.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ p: 4 }}>
                        <EmptyState title="No fine assessments match filters" />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {fineReport?.fines?.totalPages > 1 && (
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  count={fineReport.fines.totalPages}
                  page={finePage + 1}
                  onChange={(e, p) => setFinePage(p - 1)}
                  color="primary"
                  shape="rounded"
                  sx={{ '& .Mui-selected': { bgcolor: '#2563eb !important', color: '#ffffff' } }}
                />
              </Box>
            )}
          </Card>
        </Box>
      )}
    </Box>
  )
}

export default ReportsPage

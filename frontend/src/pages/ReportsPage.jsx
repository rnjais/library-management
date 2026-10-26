import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
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
  TablePagination,
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
} from '@mui/material'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import PeopleIcon from '@mui/icons-material/People'
import HistoryEduIcon from '@mui/icons-material/HistoryEdu'
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import DownloadIcon from '@mui/icons-material/Download'
import RefreshIcon from '@mui/icons-material/Refresh'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import ClearIcon from '@mui/icons-material/Clear'
import reportService from '../services/reportService'
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters'

const ReportsPage = () => {
  // Active Tab Index: 0: Books, 1: Members, 2: Borrowings, 3: Overdue, 4: Fines
  const [activeTab, setActiveTab] = useState(0)

  // Loading & Feedback State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Domain Data States
  const [bookReport, setBookReport] = useState(null)
  const [memberReport, setMemberReport] = useState(null)
  const [borrowingReport, setBorrowingReport] = useState(null)
  const [overdueReport, setOverdueReport] = useState(null)
  const [fineReport, setFineReport] = useState(null)

  // Filters State for Members
  const [memberActiveFilter, setMemberActiveFilter] = useState('')
  const [memberStartDate, setMemberStartDate] = useState('')
  const [memberEndDate, setMemberEndDate] = useState('')
  const [memberPage, setMemberPage] = useState(0)
  const [memberPageSize, setMemberPageSize] = useState(10)

  // Filters State for Borrowings
  const [borrowingStatusFilter, setBorrowingStatusFilter] = useState('ALL')
  const [borrowingStartDate, setBorrowingStartDate] = useState('')
  const [borrowingEndDate, setBorrowingEndDate] = useState('')
  const [borrowingPage, setBorrowingPage] = useState(0)
  const [borrowingPageSize, setBorrowingPageSize] = useState(10)

  // Overdue Pagination
  const [overduePage, setOverduePage] = useState(0)
  const [overduePageSize, setOverduePageSize] = useState(10)

  // Filters State for Fines
  const [fineStatusFilter, setFineStatusFilter] = useState('ALL')
  const [fineStartDate, setFineStartDate] = useState('')
  const [fineEndDate, setFineEndDate] = useState('')
  const [finePage, setFinePage] = useState(0)
  const [finePageSize, setFinePageSize] = useState(10)

  // Load Book Inventory Report (Tab 0)
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

  // Load Member Patronage Report (Tab 1)
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

  // Load Borrowing Circulation Report (Tab 2)
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

  // Load Overdue Report (Tab 3)
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
      setError(err.message || 'Failed to load overdue loans report.')
    } finally {
      setLoading(false)
    }
  }, [overduePage, overduePageSize])

  // Load Fine Financial Report (Tab 4)
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

  // Dispatch data loader based on active tab
  useEffect(() => {
    if (activeTab === 0) loadBookReport()
    else if (activeTab === 1) loadMemberReport()
    else if (activeTab === 2) loadBorrowingReport()
    else if (activeTab === 3) loadOverdueReport()
    else if (activeTab === 4) loadFineReport()
  }, [activeTab, loadBookReport, loadMemberReport, loadBorrowingReport, loadOverdueReport, loadFineReport])

  const handleTabChange = (event, newIndex) => {
    setActiveTab(newIndex)
  }

  // Generic CSV Downloader
  const downloadCsv = (filename, rows) => {
    if (!rows || !rows.length) return
    const keys = Object.keys(rows[0])
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        keys.join(','),
        ...rows.map((row) =>
          keys
            .map((k) => {
              const val = row[k] === null || row[k] === undefined ? '' : String(row[k])
              return `"${val.replace(/"/g, '""')}"`
            })
            .join(',')
        ),
      ].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${filename}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Box>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            Reports & Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            In-depth operational audits across book inventory, patron membership, circulation volume, overdue loans, and fine revenues.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={() => {
            if (activeTab === 0) loadBookReport()
            else if (activeTab === 1) loadMemberReport()
            else if (activeTab === 2) loadBorrowingReport()
            else if (activeTab === 3) loadOverdueReport()
            else if (activeTab === 4) loadFineReport()
          }}
          sx={{ fontWeight: 600, textTransform: 'none' }}
        >
          Refresh Data
        </Button>
      </Stack>

      {/* Navigation Tabs */}
      <Paper elevation={1} sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2 }}
        >
          <Tab
            label="Book Inventory"
            icon={<MenuBookIcon fontSize="small" />}
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab
            label="Member Patronage"
            icon={<PeopleIcon fontSize="small" />}
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab
            label="Borrowing Circulation"
            icon={<HistoryEduIcon fontSize="small" />}
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab
            label="Overdue Delinquencies"
            icon={<WarningAmberIcon fontSize="small" />}
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab
            label="Fine Revenues"
            icon={<MonetizationOnIcon fontSize="small" />}
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
        </Tabs>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* =========================================================================
          TAB 0: BOOK INVENTORY ANALYTICS
         ========================================================================= */}
      {activeTab === 0 && (
        <Box>
          {/* KPI Cards */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary" fontWeight={700}>
                    Catalog Titles
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="primary.main">
                    {loading ? <Skeleton width={60} /> : bookReport?.totalBooks ?? 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Unique catalog records
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary" fontWeight={700}>
                    Total Physical Copies
                  </Typography>
                  <Typography variant="h4" fontWeight={800}>
                    {loading ? <Skeleton width={60} /> : bookReport?.totalCopies ?? 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total inventory stock
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary" fontWeight={700}>
                    Available for Loan
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="success.main">
                    {loading ? <Skeleton width={60} /> : bookReport?.availableCopies ?? 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    On shelf ready to checkout
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary" fontWeight={700}>
                    Currently Borrowed
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="warning.main">
                    {loading ? <Skeleton width={60} /> : bookReport?.borrowedCopies ?? 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Active checked out copies
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Category Breakdown Table */}
          <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={700}>
                Genre & Category Distribution
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<DownloadIcon />}
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
                sx={{ textTransform: 'none' }}
              >
                Export CSV
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'background.default' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Category / Genre</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>
                      Titles
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>
                      Total Copies
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>
                      Available
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>
                      Borrowed
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 220 }}>Availability Ratio</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Skeleton width="60%" />
                        </TableCell>
                        <TableCell align="center">
                          <Skeleton width={30} sx={{ mx: 'auto' }} />
                        </TableCell>
                        <TableCell align="center">
                          <Skeleton width={30} sx={{ mx: 'auto' }} />
                        </TableCell>
                        <TableCell align="center">
                          <Skeleton width={30} sx={{ mx: 'auto' }} />
                        </TableCell>
                        <TableCell align="center">
                          <Skeleton width={30} sx={{ mx: 'auto' }} />
                        </TableCell>
                        <TableCell>
                          <Skeleton width="100%" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : bookReport?.categoryBreakdown?.length ? (
                    bookReport.categoryBreakdown.map((item, idx) => {
                      const ratio = item.totalCopies > 0 ? Math.round((item.availableCopies / item.totalCopies) * 100) : 0
                      return (
                        <TableRow key={idx} hover>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {item.category}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={item.bookCount} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={600}>
                              {item.totalCopies}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" color="success.main" fontWeight={600}>
                              {item.availableCopies}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" color="warning.main" fontWeight={600}>
                              {item.borrowedCopies}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box sx={{ width: '100%', mr: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={ratio}
                                  color={ratio > 30 ? 'primary' : 'error'}
                                  sx={{ height: 8, borderRadius: 4 }}
                                />
                              </Box>
                              <Typography variant="caption" fontWeight={600}>
                                {ratio}%
                              </Typography>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No category distribution data found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}

      {/* =========================================================================
          TAB 1: MEMBER PATRONAGE REPORT
         ========================================================================= */}
      {activeTab === 1 && (
        <Box>
          {/* KPI Cards */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary" fontWeight={700}>
                    Total Members
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="primary.main">
                    {loading ? <Skeleton width={60} /> : memberReport?.totalMembers ?? 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Registered patrons
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary" fontWeight={700}>
                    Active Patrons
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="success.main">
                    {loading ? <Skeleton width={60} /> : memberReport?.activeMembers ?? 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    In good standing
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary" fontWeight={700}>
                    Inactive Patrons
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="error.main">
                    {loading ? <Skeleton width={60} /> : memberReport?.inactiveMembers ?? 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Suspended or deactivated
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Filters Bar */}
          <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
              <TextField
                select
                size="small"
                label="Account Status"
                value={memberActiveFilter}
                onChange={(e) => {
                  setMemberActiveFilter(e.target.value)
                  setMemberPage(0)
                }}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="ACTIVE">Active Only</MenuItem>
                <MenuItem value="INACTIVE">Inactive Only</MenuItem>
              </TextField>

              <TextField
                label="Joined From"
                type="date"
                size="small"
                value={memberStartDate}
                onChange={(e) => {
                  setMemberStartDate(e.target.value)
                  setMemberPage(0)
                }}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 160 }}
              />

              <TextField
                label="Joined Until"
                type="date"
                size="small"
                value={memberEndDate}
                onChange={(e) => {
                  setMemberEndDate(e.target.value)
                  setMemberPage(0)
                }}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 160 }}
              />

              {(memberActiveFilter || memberStartDate || memberEndDate) && (
                <Button
                  size="small"
                  variant="text"
                  startIcon={<ClearIcon />}
                  onClick={() => {
                    setMemberActiveFilter('')
                    setMemberStartDate('')
                    setMemberEndDate('')
                    setMemberPage(0)
                  }}
                >
                  Clear Filters
                </Button>
              )}

              <Box sx={{ flexGrow: 1 }} />

              <Button
                size="small"
                variant="outlined"
                startIcon={<DownloadIcon />}
                disabled={!memberReport?.members?.content?.length}
                onClick={() =>
                  downloadCsv(
                    'member_patronage_report',
                    memberReport?.members?.content?.map((m) => ({
                      ID: m.id,
                      Name: m.fullName,
                      Email: m.email,
                      Phone: m.phoneNumber,
                      Joined: m.membershipDate,
                      Status: m.active ? 'ACTIVE' : 'INACTIVE',
                    }))
                  )
                }
                sx={{ textTransform: 'none' }}
              >
                Export CSV
              </Button>
            </Stack>
          </Paper>

          {/* Members Table */}
          <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table>
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Full Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email Address</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Membership Date</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: memberPageSize }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Skeleton width={20} />
                      </TableCell>
                      <TableCell>
                        <Skeleton width={120} />
                      </TableCell>
                      <TableCell>
                        <Skeleton width={160} />
                      </TableCell>
                      <TableCell>
                        <Skeleton width={90} />
                      </TableCell>
                      <TableCell>
                        <Skeleton width={80} />
                      </TableCell>
                      <TableCell align="center">
                        <Skeleton width={60} sx={{ mx: 'auto' }} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : memberReport?.members?.content?.length ? (
                  memberReport.members.content.map((member) => (
                    <TableRow key={member.id} hover>
                      <TableCell>#{member.id}</TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {member.fullName}
                        </Typography>
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.phoneNumber || '-'}</TableCell>
                      <TableCell>{formatDate(member.membershipDate)}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={member.active ? 'ACTIVE' : 'INACTIVE'}
                          size="small"
                          color={member.active ? 'success' : 'default'}
                          variant={member.active ? 'outlined' : 'filled'}
                          sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                      <Typography variant="body2" color="text.secondary">
                        No member records match the specified filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={memberReport?.members?.totalElements || 0}
              rowsPerPage={memberPageSize}
              page={memberPage}
              onPageChange={(e, newPage) => setMemberPage(newPage)}
              onRowsPerPageChange={(e) => {
                setMemberPageSize(parseInt(e.target.value, 10))
                setMemberPage(0)
              }}
            />
          </TableContainer>
        </Box>
      )}

      {/* =========================================================================
          TAB 2: BORROWING CIRCULATION REPORT
         ========================================================================= */}
      {activeTab === 2 && (
        <Box>
          {/* KPI Cards */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary" fontWeight={700}>
                    Total Checkouts
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="primary.main">
                    {loading ? <Skeleton width={60} /> : borrowingReport?.totalBorrowings ?? 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total loan transactions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary" fontWeight={700}>
                    Currently Borrowed
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="info.main">
                    {loading ? <Skeleton width={60} /> : borrowingReport?.currentlyBorrowed ?? 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    In circulation
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary" fontWeight={700}>
                    Completed Returns
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="success.main">
                    {loading ? <Skeleton width={60} /> : borrowingReport?.returnedBorrowings ?? 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Books back on shelf
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary" fontWeight={700}>
                    Overdue Loans
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="error.main">
                    {loading ? <Skeleton width={60} /> : borrowingReport?.overdueBorrowings ?? 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Late return status
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Filters Bar */}
          <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
              <TextField
                select
                size="small"
                label="Circulation Status"
                value={borrowingStatusFilter}
                onChange={(e) => {
                  setBorrowingStatusFilter(e.target.value)
                  setBorrowingPage(0)
                }}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="BORROWED">Currently Borrowed</MenuItem>
                <MenuItem value="RETURNED">Returned</MenuItem>
                <MenuItem value="OVERDUE">Overdue</MenuItem>
              </TextField>

              <TextField
                label="Loan Date From"
                type="date"
                size="small"
                value={borrowingStartDate}
                onChange={(e) => {
                  setBorrowingStartDate(e.target.value)
                  setBorrowingPage(0)
                }}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 160 }}
              />

              <TextField
                label="Loan Date To"
                type="date"
                size="small"
                value={borrowingEndDate}
                onChange={(e) => {
                  setBorrowingEndDate(e.target.value)
                  setBorrowingPage(0)
                }}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 160 }}
              />

              {(borrowingStatusFilter !== 'ALL' || borrowingStartDate || borrowingEndDate) && (
                <Button
                  size="small"
                  variant="text"
                  startIcon={<ClearIcon />}
                  onClick={() => {
                    setBorrowingStatusFilter('ALL')
                    setBorrowingStartDate('')
                    setBorrowingEndDate('')
                    setBorrowingPage(0)
                  }}
                >
                  Clear Filters
                </Button>
              )}

              <Box sx={{ flexGrow: 1 }} />

              <Button
                size="small"
                variant="outlined"
                startIcon={<DownloadIcon />}
                disabled={!borrowingReport?.borrowings?.content?.length}
                onClick={() =>
                  downloadCsv(
                    'borrowing_circulation_report',
                    borrowingReport?.borrowings?.content?.map((b) => ({
                      ID: b.id,
                      Book: b.book?.title,
                      Member: b.member?.fullName,
                      BorrowDate: b.borrowDate,
                      DueDate: b.dueDate,
                      ReturnDate: b.returnDate || 'NOT RETURNED',
                      Status: b.status,
                    }))
                  )
                }
                sx={{ textTransform: 'none' }}
              >
                Export CSV
              </Button>
            </Stack>
          </Paper>

          {/* Borrowings Table */}
          <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table>
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Loan ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Book Title & Author</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Borrower Member</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Borrow Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Return Date</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: borrowingPageSize }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Skeleton width={30} />
                      </TableCell>
                      <TableCell>
                        <Skeleton width="60%" />
                      </TableCell>
                      <TableCell>
                        <Skeleton width="50%" />
                      </TableCell>
                      <TableCell>
                        <Skeleton width={70} />
                      </TableCell>
                      <TableCell>
                        <Skeleton width={70} />
                      </TableCell>
                      <TableCell>
                        <Skeleton width={70} />
                      </TableCell>
                      <TableCell align="center">
                        <Skeleton width={60} sx={{ mx: 'auto' }} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : borrowingReport?.borrowings?.content?.length ? (
                  borrowingReport.borrowings.content.map((rec) => {
                    const isReturned = rec.status === 'RETURNED' || Boolean(rec.returnDate)
                    const isOverdue = rec.status === 'OVERDUE' || rec.overdue
                    return (
                      <TableRow key={rec.id} hover>
                        <TableCell>#{rec.id}</TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={600} color="primary.main">
                            {rec.book?.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            by {rec.book?.author}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {rec.member?.fullName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {rec.member?.email}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatDate(rec.borrowDate)}</TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight={isOverdue && !isReturned ? 700 : 400}
                            color={isOverdue && !isReturned ? 'error.main' : 'text.primary'}
                          >
                            {formatDate(rec.dueDate)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {rec.returnDate ? (
                            <Typography variant="body2" color="success.main" fontWeight={500}>
                              {formatDate(rec.returnDate)}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Active loan
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={rec.status}
                            size="small"
                            color={isReturned ? 'success' : isOverdue ? 'error' : 'info'}
                            variant={isReturned ? 'outlined' : 'filled'}
                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                      <Typography variant="body2" color="text.secondary">
                        No circulation records found matching current criteria.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={borrowingReport?.borrowings?.totalElements || 0}
              rowsPerPage={borrowingPageSize}
              page={borrowingPage}
              onPageChange={(e, newPage) => setBorrowingPage(newPage)}
              onRowsPerPageChange={(e) => {
                setBorrowingPageSize(parseInt(e.target.value, 10))
                setBorrowingPage(0)
              }}
            />
          </TableContainer>
        </Box>
      )}

      {/* =========================================================================
          TAB 3: OVERDUE DELINQUENCIES AUDIT
         ========================================================================= */}
      {activeTab === 3 && (
        <Box>
          {/* Summary Card */}
          <Card elevation={2} sx={{ mb: 3, borderRadius: 2, bgcolor: 'error.lighter', border: '1px solid', borderColor: 'error.light' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <WarningAmberIcon color="error" sx={{ fontSize: 36 }} />
                <Box>
                  <Typography variant="h6" fontWeight={700} color="error.dark">
                    Overdue Circulation Audit
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Showing all book loans that have exceeded their scheduled due date without being returned.
                  </Typography>
                </Box>
                <Box sx={{ flexGrow: 1 }} />
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<DownloadIcon />}
                  disabled={!overdueReport?.content?.length}
                  onClick={() =>
                    downloadCsv(
                      'overdue_delinquencies_report',
                      overdueReport?.content?.map((b) => ({
                        ID: b.id,
                        Book: b.book?.title,
                        Borrower: b.member?.fullName,
                        BorrowDate: b.borrowDate,
                        DueDate: b.dueDate,
                      }))
                    )
                  }
                  sx={{ textTransform: 'none' }}
                >
                  Export CSV
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Overdue Table */}
          <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table>
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Loan ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Overdue Book</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Borrower / Patron</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Issued Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Scheduled Due Date</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: overduePageSize }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Skeleton width={30} />
                      </TableCell>
                      <TableCell>
                        <Skeleton width="60%" />
                      </TableCell>
                      <TableCell>
                        <Skeleton width="50%" />
                      </TableCell>
                      <TableCell>
                        <Skeleton width={70} />
                      </TableCell>
                      <TableCell>
                        <Skeleton width={70} />
                      </TableCell>
                      <TableCell align="center">
                        <Skeleton width={60} sx={{ mx: 'auto' }} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : overdueReport?.content?.length ? (
                  overdueReport.content.map((rec) => (
                    <TableRow key={rec.id} hover>
                      <TableCell>#{rec.id}</TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={600} color="error.main">
                          {rec.book?.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          by {rec.book?.author} (ISBN: {rec.book?.isbn})
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {rec.member?.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {rec.member?.email}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(rec.borrowDate)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="error.dark">
                          {formatDate(rec.dueDate)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<WarningAmberIcon style={{ fontSize: 14 }} />}
                          label="OVERDUE"
                          size="small"
                          color="error"
                          sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
                      <Typography variant="subtitle1" fontWeight={700}>
                        Zero Overdue Borrowings!
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        All issued book checkouts are currently within their scheduled return loan periods.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={overdueReport?.totalElements || 0}
              rowsPerPage={overduePageSize}
              page={overduePage}
              onPageChange={(e, newPage) => setOverduePage(newPage)}
              onRowsPerPageChange={(e) => {
                setOverduePageSize(parseInt(e.target.value, 10))
                setOverduePage(0)
              }}
            />
          </TableContainer>
        </Box>
      )}

      {/* =========================================================================
          TAB 4: FINE FINANCIAL & REVENUE ANALYTICS
         ========================================================================= */}
      {activeTab === 4 && (
        <Box>
          {/* KPI Cards */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary" fontWeight={700}>
                    Total Assessed
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="primary.main">
                    {loading ? <Skeleton width={80} /> : formatCurrency(fineReport?.totalFineAmount ?? 0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {fineReport?.totalFineCount ?? 0} total penalty charges
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary" fontWeight={700}>
                    Collected Revenue
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="success.main">
                    {loading ? <Skeleton width={80} /> : formatCurrency(fineReport?.paidFineAmount ?? 0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {fineReport?.paidFineCount ?? 0} settled receipts
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary" fontWeight={700}>
                    Pending Receivables
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="error.main">
                    {loading ? <Skeleton width={80} /> : formatCurrency(fineReport?.unpaidFineAmount ?? 0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {fineReport?.unpaidFineCount ?? 0} unpaid balances
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary" fontWeight={700}>
                    Collection Rate
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="info.main">
                    {loading ? (
                      <Skeleton width={50} />
                    ) : fineReport?.totalFineAmount > 0 ? (
                      `${Math.round((fineReport.paidFineAmount / fineReport.totalFineAmount) * 100)}%`
                    ) : (
                      '100%'
                    )}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Recovery efficiency
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Filters Bar */}
          <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
              <TextField
                select
                size="small"
                label="Payment Status"
                value={fineStatusFilter}
                onChange={(e) => {
                  setFineStatusFilter(e.target.value)
                  setFinePage(0)
                }}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="PAID">Paid Only</MenuItem>
                <MenuItem value="UNPAID">Unpaid Only</MenuItem>
              </TextField>

              <TextField
                label="Calculated From"
                type="date"
                size="small"
                value={fineStartDate}
                onChange={(e) => {
                  setFineStartDate(e.target.value)
                  setFinePage(0)
                }}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 160 }}
              />

              <TextField
                label="Calculated To"
                type="date"
                size="small"
                value={fineEndDate}
                onChange={(e) => {
                  setFineEndDate(e.target.value)
                  setFinePage(0)
                }}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 160 }}
              />

              {(fineStatusFilter !== 'ALL' || fineStartDate || fineEndDate) && (
                <Button
                  size="small"
                  variant="text"
                  startIcon={<ClearIcon />}
                  onClick={() => {
                    setFineStatusFilter('ALL')
                    setFineStartDate('')
                    setFineEndDate('')
                    setFinePage(0)
                  }}
                >
                  Clear Filters
                </Button>
              )}

              <Box sx={{ flexGrow: 1 }} />

              <Button
                size="small"
                variant="outlined"
                startIcon={<DownloadIcon />}
                disabled={!fineReport?.fines?.content?.length}
                onClick={() =>
                  downloadCsv(
                    'fine_financial_report',
                    fineReport?.fines?.content?.map((f) => ({
                      FineID: f.id,
                      BorrowingID: f.borrowingId,
                      Member: f.member?.fullName,
                      Book: f.book?.title,
                      Amount: f.amount,
                      OverdueDays: f.overdueDays,
                      Status: f.status,
                      CalculatedAt: f.calculatedAt,
                      PaidAt: f.paidAt || '',
                    }))
                  )
                }
                sx={{ textTransform: 'none' }}
              >
                Export CSV
              </Button>
            </Stack>
          </Paper>

          {/* Fines Table */}
          <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table>
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Fine ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Borrower Member</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Book Title</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Overdue Days
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Amount
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Assessed Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Paid Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: finePageSize }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Skeleton width={30} />
                      </TableCell>
                      <TableCell>
                        <Skeleton width="50%" />
                      </TableCell>
                      <TableCell>
                        <Skeleton width="60%" />
                      </TableCell>
                      <TableCell align="center">
                        <Skeleton width={30} sx={{ mx: 'auto' }} />
                      </TableCell>
                      <TableCell align="right">
                        <Skeleton width={50} sx={{ ml: 'auto' }} />
                      </TableCell>
                      <TableCell align="center">
                        <Skeleton width={60} sx={{ mx: 'auto' }} />
                      </TableCell>
                      <TableCell>
                        <Skeleton width={80} />
                      </TableCell>
                      <TableCell>
                        <Skeleton width={80} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : fineReport?.fines?.content?.length ? (
                  fineReport.fines.content.map((fine) => {
                    const isPaid = fine.status === 'PAID'
                    return (
                      <TableRow key={fine.id} hover>
                        <TableCell>#{fine.id}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {fine.member?.fullName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {fine.member?.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={600} color="primary.main">
                            {fine.book?.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            by {fine.book?.author}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" color="error.main" fontWeight={600}>
                            {fine.overdueDays} days
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700} color={isPaid ? 'text.primary' : 'error.main'}>
                            {formatCurrency(fine.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={fine.status}
                            size="small"
                            color={isPaid ? 'success' : 'error'}
                            variant={isPaid ? 'outlined' : 'filled'}
                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        <TableCell>{formatDate(fine.calculatedAt)}</TableCell>
                        <TableCell>
                          {fine.paidAt ? (
                            <Typography variant="body2" color="success.main" fontWeight={500}>
                              {formatDateTime(fine.paidAt)}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Unpaid
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                      <Typography variant="body2" color="text.secondary">
                        No fine assessment records match the specified filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={fineReport?.fines?.totalElements || 0}
              rowsPerPage={finePageSize}
              page={finePage}
              onPageChange={(e, newPage) => setFinePage(newPage)}
              onRowsPerPageChange={(e) => {
                setFinePageSize(parseInt(e.target.value, 10))
                setFinePage(0)
              }}
            />
          </TableContainer>
        </Box>
      )}
    </Box>
  )
}

export default ReportsPage

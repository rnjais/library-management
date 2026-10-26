import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Chip,
  Stack,
  Alert,
  Skeleton,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
} from '@mui/material'
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'
import PaymentIcon from '@mui/icons-material/Payment'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import fineService from '../services/fineService'
import { useAuth } from '../hooks/useAuth'
import PayFineDialog from '../components/fines/PayFineDialog'
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters'

const FinesPage = () => {
  const { user, isAdmin } = useAuth()

  // State
  const [fines, setFines] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [feedbackMessage, setFeedbackMessage] = useState(null)

  // Member Summary KPI
  const [memberSummary, setMemberSummary] = useState({
    totalUnpaidAmount: 0,
    unpaidFinesCount: 0,
  })

  // Admin Filter Tabs: 0 = All Fines, 1 = Unpaid Fines Only
  const [tabIndex, setTabIndex] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Payment Dialog
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [selectedFine, setSelectedFine] = useState(null)

  // Load Member Unpaid Summary
  const loadMemberSummary = useCallback(async () => {
    const memberId = user?.id || 1
    try {
      const summary = await fineService.getMemberUnpaidTotal(memberId)
      setMemberSummary({
        totalUnpaidAmount: summary?.totalUnpaidAmount || 0,
        unpaidFinesCount: summary?.unpaidFinesCount || 0,
      })
    } catch (err) {
      // If error or member has no fines yet
      setMemberSummary({ totalUnpaidAmount: 0, unpaidFinesCount: 0 })
    }
  }, [user])

  // Load Fines list
  const loadFines = useCallback(async () => {
    setLoading(true)
    setApiError(null)

    try {
      let pagedData

      if (isAdmin) {
        if (tabIndex === 1) {
          // Unpaid fines only
          pagedData = await fineService.getUnpaidFines({
            page,
            size: pageSize,
            sortBy: 'id',
            direction: 'DESC',
          })
        } else {
          // All fines
          pagedData = await fineService.getAllFines({
            page,
            size: pageSize,
            sortBy: 'id',
            direction: 'DESC',
          })
        }
      } else {
        // Current Member Fines
        const memberId = user?.id || 1
        pagedData = await fineService.getMemberFines(memberId, {
          page,
          size: pageSize,
          sortBy: 'id',
          direction: 'DESC',
        })
      }

      setFines(pagedData.content || [])
      setTotalElements(pagedData.totalElements || 0)
    } catch (err) {
      setApiError(err.message || 'Failed to retrieve fine records.')
      setFines([])
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }, [isAdmin, user, tabIndex, page, pageSize])

  useEffect(() => {
    loadFines()
    if (!isAdmin) {
      loadMemberSummary()
    }
  }, [loadFines, loadMemberSummary, isAdmin])

  const handleTabChange = (event, newIndex) => {
    setTabIndex(newIndex)
    setPage(0)
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setPageSize(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleOpenPay = (fine) => {
    setSelectedFine(fine)
    setPayDialogOpen(true)
  }

  const handlePaymentSuccess = (updatedFine) => {
    setFeedbackMessage(
      `Payment of ${formatCurrency(updatedFine.amount)} for Fine #${updatedFine.id} settled successfully.`
    )
    loadFines()
    if (!isAdmin) {
      loadMemberSummary()
    }
  }

  return (
    <Box>
      {/* Page Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            {isAdmin ? 'Fine Assessments & Receivables' : 'My Library Fines & Penalties'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isAdmin
              ? 'Track overdue penalties, audit settlement receipts, and clear pending dues.'
              : 'View your late return assessment records, outstanding balances, and make online payments.'}
          </Typography>
        </Box>
      </Stack>

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {!isAdmin ? (
          <>
            <Grid item xs={12} sm={6} md={4}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: memberSummary.totalUnpaidAmount > 0 ? 'error.lighter' : 'success.lighter',
                        color: memberSummary.totalUnpaidAmount > 0 ? 'error.main' : 'success.main',
                        display: 'flex',
                      }}
                    >
                      <MonetizationOnIcon fontSize="large" />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                        Outstanding Balance
                      </Typography>
                      <Typography
                        variant="h5"
                        fontWeight={800}
                        color={memberSummary.totalUnpaidAmount > 0 ? 'error.dark' : 'text.primary'}
                      >
                        {formatCurrency(memberSummary.totalUnpaidAmount)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: memberSummary.unpaidFinesCount > 0 ? 'warning.lighter' : 'info.lighter',
                        color: memberSummary.unpaidFinesCount > 0 ? 'warning.main' : 'info.main',
                        display: 'flex',
                      }}
                    >
                      <ReceiptLongIcon fontSize="large" />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                        Unpaid Penalties
                      </Typography>
                      <Typography variant="h5" fontWeight={800}>
                        {memberSummary.unpaidFinesCount}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={12} md={4}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: memberSummary.totalUnpaidAmount === 0 ? 'success.lighter' : 'error.lighter',
                        color: memberSummary.totalUnpaidAmount === 0 ? 'success.main' : 'error.main',
                        display: 'flex',
                      }}
                    >
                      {memberSummary.totalUnpaidAmount === 0 ? (
                        <CheckCircleOutlineIcon fontSize="large" />
                      ) : (
                        <WarningAmberIcon fontSize="large" />
                      )}
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                        Account Status
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        color={memberSummary.totalUnpaidAmount === 0 ? 'success.main' : 'error.main'}
                      >
                        {memberSummary.totalUnpaidAmount === 0 ? 'In Good Standing' : 'Settlement Required'}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </>
        ) : (
          <>
            <Grid item xs={12} sm={6} md={4}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.lighter', color: 'primary.main', display: 'flex' }}>
                      <ReceiptLongIcon fontSize="large" />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                        Total Recorded Fines
                      </Typography>
                      <Typography variant="h5" fontWeight={800}>
                        {totalElements}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'error.lighter', color: 'error.main', display: 'flex' }}>
                      <MonetizationOnIcon fontSize="large" />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                        System Policy Rate
                      </Typography>
                      <Typography variant="h5" fontWeight={800}>
                        ₹5.00 / day
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={12} md={4}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'success.lighter', color: 'success.main', display: 'flex' }}>
                      <CheckCircleOutlineIcon fontSize="large" />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                        Settlement Method
                      </Typography>
                      <Typography variant="subtitle1" fontWeight={700}>
                        Instant / Real-time
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>

      {/* Alerts */}
      {feedbackMessage && (
        <Alert severity="success" onClose={() => setFeedbackMessage(null)} sx={{ mb: 2 }}>
          {feedbackMessage}
        </Alert>
      )}

      {apiError && (
        <Alert severity="error" onClose={() => setApiError(null)} sx={{ mb: 2 }}>
          {apiError}
        </Alert>
      )}

      {/* Admin Tabs Filter */}
      {isAdmin && (
        <Paper elevation={1} sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            sx={{ px: 2 }}
          >
            <Tab label="All Fine Records" sx={{ textTransform: 'none', fontWeight: 600 }} />
            <Tab
              label="Unpaid Fines Only"
              icon={<WarningAmberIcon fontSize="small" />}
              iconPosition="end"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
          </Tabs>
        </Paper>
      )}

      {/* Fines Table */}
      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Table aria-label="library fines management table">
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Fine ID</TableCell>
              {isAdmin && <TableCell sx={{ fontWeight: 700 }}>Member</TableCell>}
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
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              // Skeleton loading rows
              Array.from({ length: pageSize }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Skeleton variant="text" width={40} />
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                    </TableCell>
                  )}
                  <TableCell>
                    <Skeleton variant="text" width="70%" />
                    <Skeleton variant="text" width="45%" />
                  </TableCell>
                  <TableCell align="center">
                    <Skeleton variant="text" width={50} sx={{ mx: 'auto' }} />
                  </TableCell>
                  <TableCell align="right">
                    <Skeleton variant="text" width={60} sx={{ ml: 'auto' }} />
                  </TableCell>
                  <TableCell align="center">
                    <Skeleton variant="rectangular" width={70} height={24} sx={{ mx: 'auto', borderRadius: 4 }} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width={80} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width={80} />
                  </TableCell>
                  <TableCell align="right">
                    <Skeleton variant="rectangular" width={80} height={32} sx={{ ml: 'auto' }} />
                  </TableCell>
                </TableRow>
              ))
            ) : fines.length > 0 ? (
              fines.map((fine) => {
                const isPaid = fine.status === 'PAID'

                return (
                  <TableRow key={fine.id} hover>
                    {/* ID */}
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="text.secondary">
                        #{fine.id}
                      </Typography>
                    </TableCell>

                    {/* Member (Admin View) */}
                    {isAdmin && (
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {fine.member?.fullName || 'Member'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fine.member?.email}
                        </Typography>
                      </TableCell>
                    )}

                    {/* Book Details */}
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={600} color="primary.main">
                        {fine.book?.title || 'Unknown Title'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        by {fine.book?.author || 'Unknown Author'} (ISBN: {fine.book?.isbn})
                      </Typography>
                    </TableCell>

                    {/* Overdue Days */}
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={600} color="error.main">
                        {fine.overdueDays} day{fine.overdueDays === 1 ? '' : 's'}
                      </Typography>
                    </TableCell>

                    {/* Amount */}
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={800} color={isPaid ? 'text.primary' : 'error.dark'}>
                        {formatCurrency(fine.amount)}
                      </Typography>
                    </TableCell>

                    {/* Status Chip */}
                    <TableCell align="center">
                      {isPaid ? (
                        <Chip
                          icon={<CheckCircleOutlineIcon style={{ fontSize: 14 }} />}
                          label="PAID"
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                        />
                      ) : (
                        <Chip
                          icon={<WarningAmberIcon style={{ fontSize: 14 }} />}
                          label="UNPAID"
                          size="small"
                          color="error"
                          sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                        />
                      )}
                    </TableCell>

                    {/* Assessed Date */}
                    <TableCell>
                      <Typography variant="body2">{formatDate(fine.calculatedAt)}</Typography>
                    </TableCell>

                    {/* Paid Date */}
                    <TableCell>
                      <Typography variant="body2" color={isPaid ? 'success.main' : 'text.secondary'}>
                        {fine.paidAt ? formatDateTime(fine.paidAt) : '-'}
                      </Typography>
                    </TableCell>

                    {/* Action */}
                    <TableCell align="right">
                      {!isPaid ? (
                        <Button
                          variant="contained"
                          size="small"
                          color="success"
                          startIcon={<PaymentIcon />}
                          onClick={() => handleOpenPay(fine)}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Pay Fine
                        </Button>
                      ) : (
                        <Typography variant="caption" color="success.main" fontWeight={600}>
                          Settled
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              // Empty State
              <TableRow>
                <TableCell colSpan={isAdmin ? 9 : 8} align="center" sx={{ py: 6 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    No fine records found.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tabIndex === 1
                      ? 'Great! There are no unpaid library fines at this time.'
                      : 'No fines or overdue penalties have been recorded.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalElements}
          rowsPerPage={pageSize}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Pay Fine Modal */}
      <PayFineDialog
        open={payDialogOpen}
        onClose={() => setPayDialogOpen(false)}
        fine={selectedFine}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </Box>
  )
}

export default FinesPage

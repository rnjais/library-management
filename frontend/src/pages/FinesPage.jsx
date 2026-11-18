import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Stack,
  Alert,
  Skeleton,
  Tabs,
  Tab,
  Grid,
  Pagination,
} from '@mui/material'
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined'
import PaymentOutlinedIcon from '@mui/icons-material/PaymentOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import fineService from '../services/fineService'
import { useAuth } from '../hooks/useAuth'
import PayFineDialog from '../components/fines/PayFineDialog'
import PageHeader from '../components/common/PageHeader'
import StatusBadge from '../components/common/StatusBadge'
import EmptyState from '../components/common/EmptyState'
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters'

/**
 * Modern Fine Management & Settlements UI (Image 3 "spik" Table Style)
 */
const FinesPage = () => {
  const { user, isAdmin } = useAuth()

  const [fines, setFines] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [feedbackMessage, setFeedbackMessage] = useState(null)

  // Member Summary KPI
  const [memberSummary, setMemberSummary] = useState({
    totalUnpaidAmount: 0,
    unpaidFinesCount: 0,
  })

  // 0: All fines, 1: Unpaid fines only (Admin)
  const [tabIndex, setTabIndex] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Payment Dialog
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [selectedFine, setSelectedFine] = useState(null)

  const loadMemberSummary = useCallback(async () => {
    const memberId = user?.memberId || user?.id
    if (!memberId) return
    try {
      const summary = await fineService.getMemberUnpaidTotal(memberId)
      setMemberSummary({
        totalUnpaidAmount: summary?.totalUnpaidAmount || 0,
        unpaidFinesCount: summary?.unpaidFinesCount || 0,
      })
    } catch (err) {
      setMemberSummary({ totalUnpaidAmount: 0, unpaidFinesCount: 0 })
    }
  }, [user])

  const loadFines = useCallback(async () => {
    setLoading(true)
    setApiError(null)

    try {
      let pagedData

      if (isAdmin) {
        if (tabIndex === 1) {
          pagedData = await fineService.getUnpaidFines({
            page,
            size: pageSize,
            sortBy: 'id',
            direction: 'DESC',
          })
        } else {
          pagedData = await fineService.getAllFines({
            page,
            size: pageSize,
            sortBy: 'id',
            direction: 'DESC',
          })
        }
      } else {
        const memberId = user?.memberId || user?.id
        if (!memberId) {
          setFines([])
          setTotalElements(0)
          setTotalPages(1)
          return
        }
        pagedData = await fineService.getMemberFines(memberId, {
          page,
          size: pageSize,
          sortBy: 'id',
          direction: 'DESC',
        })
      }

      setFines(pagedData.content || [])
      setTotalElements(pagedData.totalElements || 0)
      setTotalPages(pagedData.totalPages || 1)
    } catch (err) {
      setApiError(err.message || 'Failed to retrieve fine records.')
      setFines([])
      setTotalElements(0)
      setTotalPages(1)
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

  const handleOpenPay = (fine) => {
    setSelectedFine(fine)
    setPayDialogOpen(true)
  }

  return (
    <Box>
      <PageHeader
        title={isAdmin ? 'Fine Assessments & Revenues' : 'My Fines & Fees'}
        subtitle={
          isAdmin
            ? 'Monitor accrued late return fines and record official fee payment receipts'
            : 'Review your accrued overdue penalties and fee settlement history'
        }
        breadcrumbs={[{ label: 'Fines', path: null }]}
      />

      {feedbackMessage && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2.5 }} onClose={() => setFeedbackMessage(null)}>
          {feedbackMessage}
        </Alert>
      )}

      {apiError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }} onClose={() => setApiError(null)}>
          {apiError}
        </Alert>
      )}

      {/* Member Balance Card */}
      {!isAdmin && (
        <Card sx={{ mb: 3.5, borderRadius: 3.5, border: '1px solid #e2e8f0', p: 3, bgcolor: '#ffffff' }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 3,
                    bgcolor: memberSummary.totalUnpaidAmount > 0 ? '#fee2e2' : '#dcfce7',
                    color: memberSummary.totalUnpaidAmount > 0 ? '#dc2626' : '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MonetizationOnOutlinedIcon sx={{ fontSize: 26 }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    Outstanding Balance
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color={memberSummary.totalUnpaidAmount > 0 ? '#dc2626' : '#16a34a'}>
                    {formatCurrency(memberSummary.totalUnpaidAmount)}
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box textAlign={{ xs: 'left', sm: 'right' }}>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                  {memberSummary.unpaidFinesCount > 0
                    ? `${memberSummary.unpaidFinesCount} unpaid fine record(s). Please clear fines at the library circulation desk.`
                    : 'Your account is in good standing with zero overdue penalties.'}
                </Typography>
                {memberSummary.totalUnpaidAmount > 0 ? (
                  <Chip
                    label="Payment Required at Desk"
                    size="small"
                    sx={{ fontWeight: 700, bgcolor: '#fee2e2', color: '#b91c1c', borderRadius: 2 }}
                  />
                ) : (
                  <Chip
                    label="Good Standing"
                    size="small"
                    sx={{ fontWeight: 700, bgcolor: '#dcfce7', color: '#15803d', borderRadius: 2 }}
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* Main Table Card (Image 3 Style) */}
      <Card sx={{ borderRadius: 4, border: '1px solid #e2e8f0', p: { xs: 2, sm: 3.5 } }}>
        {/* Toolbar Header */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
          mb={3}
        >
          {isAdmin ? (
            <Tabs
              value={tabIndex}
              onChange={handleTabChange}
              sx={{
                '& .MuiTab-root': {
                  borderRadius: 2.5,
                  minHeight: 40,
                  px: 2,
                  py: 0.5,
                  fontWeight: 700,
                  fontSize: '0.875rem',
                },
                '& .Mui-selected': {
                  bgcolor: '#eff6ff',
                  color: '#2563eb !important',
                },
              }}
            >
              <Tab label={`All Fines (${tabIndex === 0 ? totalElements : '•'})`} />
              <Tab
                icon={<WarningAmberRoundedIcon sx={{ fontSize: 16 }} />}
                iconPosition="start"
                label="Unpaid Only"
              />
            </Tabs>
          ) : (
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="h6" fontWeight={800} color="#0f172a">
                Fine Records
              </Typography>
              <Chip
                label={`${totalElements} entries`}
                size="small"
                sx={{ fontWeight: 700, bgcolor: '#eff6ff', color: '#2563eb', borderRadius: 2 }}
              />
            </Stack>
          )}

          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
            Standard rate: ₹5.00 / overdue day
          </Typography>
        </Stack>

        {/* Data Table (Image 3 Style) */}
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fine ID</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Related Loan Book</TableCell>
                {isAdmin && <TableCell>Patron Member</TableCell>}
                <TableCell>Assessed Date</TableCell>
                <TableCell>Settled Date</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton width={40} /></TableCell>
                    <TableCell><Skeleton width={70} /></TableCell>
                    <TableCell><Skeleton width={180} height={32} /></TableCell>
                    {isAdmin && <TableCell><Skeleton width={120} /></TableCell>}
                    <TableCell><Skeleton width={90} /></TableCell>
                    <TableCell><Skeleton width={90} /></TableCell>
                    <TableCell align="center"><Skeleton width={70} /></TableCell>
                    <TableCell align="right"><Skeleton width={90} /></TableCell>
                  </TableRow>
                ))
              ) : fines.length > 0 ? (
                fines.map((fine) => {
                  const isUnpaid = fine.status === 'UNPAID'
                  return (
                    <TableRow key={fine.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      {/* ID Chip */}
                      <TableCell>
                        <Chip
                          label={`#${fine.id}`}
                          size="small"
                          sx={{ fontWeight: 700, bgcolor: '#f1f5f9', color: '#475569', borderRadius: 1.5 }}
                        />
                      </TableCell>

                      {/* Amount */}
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 800,
                            color: isUnpaid ? '#dc2626' : '#16a34a',
                            fontSize: '0.9375rem',
                          }}
                        >
                          {formatCurrency(fine.fineAmount)}
                        </Typography>
                      </TableCell>

                      {/* Related Loan Book */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                          {fine.bookTitle || `Borrowing #${fine.borrowingId}`}
                        </Typography>
                      </TableCell>

                      {/* Patron (If Admin) */}
                      {isAdmin && (
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#334155' }}>
                            {fine.memberName || `Member #${fine.memberId}`}
                          </Typography>
                        </TableCell>
                      )}

                      <TableCell sx={{ color: '#64748b', fontSize: '0.8125rem' }}>
                        {formatDate(fine.calculatedAt)}
                      </TableCell>
                      <TableCell sx={{ color: '#64748b', fontSize: '0.8125rem' }}>
                        {fine.paidAt ? formatDate(fine.paidAt) : '—'}
                      </TableCell>

                      {/* StatusBadge */}
                      <TableCell align="center">
                        <StatusBadge status={fine.status} />
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right">
                        {isUnpaid ? (
                          isAdmin ? (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<PaymentOutlinedIcon fontSize="small" />}
                              onClick={() => handleOpenPay(fine)}
                              sx={{
                                borderRadius: 2,
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                bgcolor: '#16a34a',
                                '&:hover': { bgcolor: '#15803d' },
                              }}
                            >
                              Record Payment
                            </Button>
                          ) : (
                            <Chip
                              label="Pay at Desk"
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.6875rem',
                                bgcolor: '#fee2e2',
                                color: '#b91c1c',
                                borderRadius: 1.5,
                              }}
                            />
                          )
                        ) : (
                          <Chip
                            icon={<CheckCircleOutlineIcon sx={{ fontSize: '14px !important', color: '#16a34a' }} />}
                            label={fine.paymentMethod ? `${fine.paymentMethod}` : 'Settled'}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.6875rem',
                              bgcolor: '#dcfce7',
                              color: '#15803d',
                              borderRadius: 1.5,
                            }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 7} sx={{ p: 4 }}>
                    <EmptyState
                      title="No fine records"
                      description={
                        tabIndex === 1
                          ? 'Zero unpaid fines pending collection. All patron balances are clear.'
                          : 'No fine records exist matching this account.'
                      }
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Numbered Pill Pagination (Image 3 Style) */}
        {totalPages > 1 && (
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={totalPages}
              page={page + 1}
              onChange={(e, p) => setPage(p - 1)}
              color="primary"
              shape="rounded"
              sx={{
                '& .MuiPaginationItem-root': { borderRadius: 2, fontWeight: 600 },
                '& .Mui-selected': { bgcolor: '#2563eb !important', color: '#ffffff' },
              }}
            />
          </Box>
        )}
      </Card>

      {/* Pay Fine Dialog */}
      {payDialogOpen && (
        <PayFineDialog
          open={payDialogOpen}
          onClose={() => setPayDialogOpen(false)}
          fine={selectedFine}
          onPaymentSuccess={() => {
            setFeedbackMessage('Payment recorded and fine settled successfully.')
            setPayDialogOpen(false)
            loadFines()
          }}
        />
      )}
    </Box>
  )
}

export default FinesPage

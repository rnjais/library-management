import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Card,
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
  Tooltip,
  Skeleton,
  Tabs,
  Tab,
  Avatar,
  Pagination,
  IconButton,
} from '@mui/material'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import AssignmentReturnOutlinedIcon from '@mui/icons-material/AssignmentReturnOutlined'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined'
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import borrowingService from '../services/borrowingService'
import reservationService from '../services/reservationService'
import { useAuth } from '../hooks/useAuth'
import BorrowBookDialog from '../components/borrowings/BorrowBookDialog'
import ReturnBookDialog from '../components/borrowings/ReturnBookDialog'
import ReserveBookDialog from '../components/reservations/ReserveBookDialog'
import PageHeader from '../components/common/PageHeader'
import StatusBadge from '../components/common/StatusBadge'
import EmptyState from '../components/common/EmptyState'
import ConfirmModal from '../components/common/ConfirmModal'
import { formatDate } from '../utils/formatters'

/**
 * Modern Borrowings, Circulation & Waitlist UI (Image 3 "spik" Table Style)
 */
const BorrowingsPage = () => {
  const { user, isAdmin } = useAuth()

  const [records, setRecords] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [feedbackMessage, setFeedbackMessage] = useState(null)

  // Admin tabs: 0 = All Loans, 1 = Overdue Only, 2 = Waitlist / Reservations
  // Member tabs: 0 = My Loans, 1 = My Waitlist / Reservations
  const [tabIndex, setTabIndex] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Dialogs
  const [borrowOpen, setBorrowOpen] = useState(false)
  const [preselectedBookForBorrow, setPreselectedBookForBorrow] = useState(null)
  const [returnOpen, setReturnOpen] = useState(false)
  const [selectedBorrowing, setSelectedBorrowing] = useState(null)
  const [returnLoading, setReturnLoading] = useState(false)

  // Reservation Dialogs & Confirm
  const [reserveOpen, setReserveOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [reservationToCancel, setReservationToCancel] = useState(null)
  const [cancelLoading, setCancelLoading] = useState(false)

  const isReservationTab = (isAdmin && tabIndex === 2) || (!isAdmin && tabIndex === 1)

  const loadData = useCallback(async () => {
    setLoading(true)
    setApiError(null)

    try {
      let pagedData

      if (isReservationTab) {
        // Fetch Reservations / Waitlist
        if (isAdmin) {
          pagedData = await reservationService.getAllReservations({
            page,
            size: pageSize,
            sortBy: 'reservationDate',
            direction: 'DESC',
          })
        } else {
          pagedData = await reservationService.getMyReservations({
            page,
            size: pageSize,
            sortBy: 'reservationDate',
            direction: 'DESC',
          })
        }
      } else {
        // Fetch Borrowings
        if (isAdmin) {
          if (tabIndex === 1) {
            pagedData = await borrowingService.getOverdueBorrowings({
              page,
              size: pageSize,
              sortBy: 'dueDate',
              direction: 'ASC',
            })
          } else {
            pagedData = await borrowingService.getAllBorrowings({
              page,
              size: pageSize,
              sortBy: 'id',
              direction: 'DESC',
            })
          }
        } else {
          const memberId = user?.memberId || user?.id
          if (!memberId) {
            setRecords([])
            setTotalElements(0)
            setTotalPages(1)
            return
          }
          pagedData = await borrowingService.getBorrowingsByMember(memberId, {
            page,
            size: pageSize,
            sortBy: 'id',
            direction: 'DESC',
          })
        }
      }

      setRecords(pagedData.content || [])
      setTotalElements(pagedData.totalElements || 0)
      setTotalPages(pagedData.totalPages || 1)
    } catch (err) {
      setApiError(err.message || 'Failed to fetch circulation records.')
      setRecords([])
      setTotalElements(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [isAdmin, user, tabIndex, isReservationTab, page, pageSize])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleTabChange = (event, newIndex) => {
    setTabIndex(newIndex)
    setPage(0)
  }

  const handleOpenReturn = (borrowing) => {
    setSelectedBorrowing(borrowing)
    setReturnOpen(true)
  }

  const handleConfirmReturn = async () => {
    if (!selectedBorrowing) return
    setReturnLoading(true)

    try {
      const updated = await borrowingService.returnBook(selectedBorrowing.id)
      setReturnOpen(false)
      setSelectedBorrowing(null)
      setFeedbackMessage(
        `Book "${updated.book?.title || 'Book'}" returned successfully.`
      )
      loadData()
    } catch (err) {
      setApiError(err.message || 'Failed to return book.')
    } finally {
      setReturnLoading(false)
    }
  }

  const handleOpenCancelReservation = (reservation) => {
    setReservationToCancel(reservation)
    setCancelModalOpen(true)
  }

  const handleConfirmCancelReservation = async () => {
    if (!reservationToCancel) return
    setCancelLoading(true)

    try {
      await reservationService.cancelReservation(reservationToCancel.id)
      setCancelModalOpen(false)
      setReservationToCancel(null)
      setFeedbackMessage(`Reservation #${reservationToCancel.id} has been cancelled successfully.`)
      loadData()
    } catch (err) {
      setApiError(err.message || 'Failed to cancel reservation.')
    } finally {
      setCancelLoading(false)
    }
  }

  const handleCheckoutReservedBook = (reservation) => {
    setPreselectedBookForBorrow({
      id: reservation.bookId,
      title: reservation.bookTitle,
      author: reservation.bookAuthor,
    })
    setBorrowOpen(true)
  }

  return (
    <Box>
      <PageHeader
        title={isAdmin ? 'Circulation & Loans' : 'My Borrowings & Waitlist'}
        subtitle={
          isAdmin
            ? 'Track active checkouts, overdue schedules, book waitlist queues, and process returns'
            : 'View your checked out books, waitlist queue status, and loan return deadlines'
        }
        breadcrumbs={[{ label: 'Circulation', path: null }]}
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

      {/* Main Card (Image 3 Style) */}
      <Card sx={{ borderRadius: 4, border: '1px solid #e2e8f0', p: { xs: 2, sm: 3.5 } }}>
        {/* Toolbar Header */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
          mb={3}
        >
          {/* Tabs */}
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
            {isAdmin ? (
              [
                <Tab key="all" label="All Loans" />,
                <Tab
                  key="overdue"
                  icon={<WarningAmberRoundedIcon sx={{ fontSize: 16 }} />}
                  iconPosition="start"
                  label="Overdue Only"
                />,
                <Tab
                  key="reservations"
                  icon={<HourglassTopRoundedIcon sx={{ fontSize: 16 }} />}
                  iconPosition="start"
                  label="Waitlist & Reservations"
                />,
              ]
            ) : (
              [
                <Tab key="my-loans" label="My Loans" />,
                <Tab
                  key="my-reservations"
                  icon={<HourglassTopRoundedIcon sx={{ fontSize: 16 }} />}
                  iconPosition="start"
                  label="Waitlist & Reservations"
                />,
              ]
            )}
          </Tabs>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1.5}>
            {isReservationTab ? (
              <Button
                variant="contained"
                startIcon={<HourglassTopRoundedIcon />}
                onClick={() => setReserveOpen(true)}
                sx={{
                  bgcolor: '#b45309',
                  color: '#ffffff',
                  fontWeight: 700,
                  borderRadius: 2.5,
                  px: 2.5,
                  py: 0.85,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(180, 83, 9, 0.35)',
                  '&:hover': { bgcolor: '#92400e' },
                }}
              >
                Join Waitlist
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<BookmarkAddOutlinedIcon />}
                onClick={() => {
                  setPreselectedBookForBorrow(null)
                  setBorrowOpen(true)
                }}
                sx={{
                  bgcolor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 700,
                  borderRadius: 2.5,
                  px: 2.5,
                  py: 0.85,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                  '&:hover': { bgcolor: '#1d4ed8' },
                }}
              >
                {isAdmin ? 'Check Out Book' : 'Borrow a Book'}
              </Button>
            )}
          </Stack>
        </Stack>

        {/* Data Table */}
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              {isReservationTab ? (
                <TableRow>
                  <TableCell>Reservation ID</TableCell>
                  <TableCell>Book Title</TableCell>
                  {isAdmin && <TableCell>Patron Member</TableCell>}
                  <TableCell>Reservation Date</TableCell>
                  <TableCell align="center">Queue Position / Pickup</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell>Loan ID</TableCell>
                  <TableCell>Book Title</TableCell>
                  {isAdmin && <TableCell>Patron Member</TableCell>}
                  <TableCell>Borrow Date</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Return Date</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              )}
            </TableHead>
            <TableBody>
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton width={40} /></TableCell>
                    <TableCell><Skeleton width={180} height={32} /></TableCell>
                    {isAdmin && <TableCell><Skeleton width={130} /></TableCell>}
                    <TableCell><Skeleton width={80} /></TableCell>
                    <TableCell><Skeleton width={80} /></TableCell>
                    <TableCell align="center"><Skeleton width={70} /></TableCell>
                    <TableCell align="right"><Skeleton width={90} /></TableCell>
                  </TableRow>
                ))
              ) : isReservationTab ? (
                /* Reservations Table Rows */
                records.length > 0 ? (
                  records.map((r) => (
                    <TableRow key={r.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      {/* Reservation ID */}
                      <TableCell>
                        <Chip
                          label={`#${r.id}`}
                          size="small"
                          sx={{ fontWeight: 700, bgcolor: '#f1f5f9', color: '#475569', borderRadius: 1.5 }}
                        />
                      </TableCell>

                      {/* Book Title with Avatar */}
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: 2,
                              bgcolor: r.status === 'READY_FOR_PICKUP' ? '#ede9fe' : '#fef3c7',
                              color: r.status === 'READY_FOR_PICKUP' ? '#6d28d9' : '#b45309',
                            }}
                          >
                            <HourglassTopRoundedIcon sx={{ fontSize: 18 }} />
                          </Avatar>
                          <Box sx={{ maxWidth: 240 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.25 }}>
                              {r.bookTitle || `Book #${r.bookId}`}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {r.bookAuthor || 'Waitlisted Title'}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* Member (If Admin) */}
                      {isAdmin && (
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                            {r.memberName || `Member #${r.memberId}`}
                          </Typography>
                        </TableCell>
                      )}

                      <TableCell sx={{ color: '#64748b', fontSize: '0.8125rem' }}>
                        {formatDate(r.reservationDate)}
                      </TableCell>

                      {/* Queue Position / Pickup Deadline */}
                      <TableCell align="center">
                        {r.status === 'READY_FOR_PICKUP' ? (
                          <Chip
                            icon={<CheckCircleOutlineIcon sx={{ fontSize: '14px !important' }} />}
                            label={r.pickupDeadline ? `Pickup by: ${formatDate(r.pickupDeadline)}` : 'Ready for Pickup'}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              bgcolor: '#ede9fe',
                              color: '#6d28d9',
                              borderRadius: 2,
                              fontSize: '0.72rem',
                            }}
                          />
                        ) : r.status === 'PENDING' ? (
                          <Chip
                            icon={<HourglassTopRoundedIcon sx={{ fontSize: '14px !important' }} />}
                            label={`Queue Position: #${r.queuePosition || 1}`}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              bgcolor: '#fef3c7',
                              color: '#b45309',
                              borderRadius: 2,
                              fontSize: '0.72rem',
                            }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            {r.status === 'FULFILLED' ? 'Completed' : 'Inactive'}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell align="center">
                        <StatusBadge status={r.status} />
                      </TableCell>

                      {/* Action */}
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                          {r.status === 'READY_FOR_PICKUP' && (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<BookmarkAddOutlinedIcon fontSize="small" />}
                              onClick={() => handleCheckoutReservedBook(r)}
                              sx={{
                                borderRadius: 2,
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                bgcolor: '#6d28d9',
                                '&:hover': { bgcolor: '#5b21b6' },
                              }}
                            >
                              Check Out
                            </Button>
                          )}

                          {(r.status === 'PENDING' || r.status === 'READY_FOR_PICKUP') && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<CancelOutlinedIcon fontSize="small" />}
                              onClick={() => handleOpenCancelReservation(r)}
                              sx={{
                                borderRadius: 2,
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            >
                              Cancel
                            </Button>
                          )}

                          {r.status !== 'PENDING' && r.status !== 'READY_FOR_PICKUP' && (
                            <Typography variant="caption" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} sx={{ p: 4 }}>
                      <EmptyState
                        title="No waitlist reservations found"
                        description="There are currently zero active or pending book waitlist requests."
                        actionText="Join Book Waitlist"
                        onAction={() => setReserveOpen(true)}
                      />
                    </TableCell>
                  </TableRow>
                )
              ) : (
                /* Borrowings Table Rows */
                records.length > 0 ? (
                  records.map((b) => (
                    <TableRow key={b.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      {/* Loan ID Chip */}
                      <TableCell>
                        <Chip
                          label={`#${b.id}`}
                          size="small"
                          sx={{ fontWeight: 700, bgcolor: '#f1f5f9', color: '#475569', borderRadius: 1.5 }}
                        />
                      </TableCell>

                      {/* Book Title with Avatar */}
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: 2,
                              bgcolor: '#eff6ff',
                              color: '#2563eb',
                            }}
                          >
                            <MenuBookIcon sx={{ fontSize: 18 }} />
                          </Avatar>
                          <Box sx={{ maxWidth: 240 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.25 }}>
                              {b.bookTitle || `Book #${b.bookId}`}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {b.bookAuthor || 'Catalog Title'}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* Member (If Admin) */}
                      {isAdmin && (
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                            {b.memberName || `Member #${b.memberId}`}
                          </Typography>
                        </TableCell>
                      )}

                      <TableCell sx={{ color: '#64748b', fontSize: '0.8125rem' }}>{formatDate(b.borrowDate)}</TableCell>
                      <TableCell sx={{ color: '#64748b', fontSize: '0.8125rem' }}>{formatDate(b.dueDate)}</TableCell>
                      <TableCell sx={{ color: '#64748b', fontSize: '0.8125rem' }}>
                        {b.returnDate ? formatDate(b.returnDate) : '—'}
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell align="center">
                        <StatusBadge status={b.status} />
                      </TableCell>

                      {/* Return Action */}
                      <TableCell align="right">
                        {!b.returnDate ? (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<AssignmentReturnOutlinedIcon fontSize="small" />}
                            onClick={() => handleOpenReturn(b)}
                            sx={{
                              borderRadius: 2,
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              color: '#2563eb',
                              borderColor: '#bfdbfe',
                              '&:hover': { bgcolor: '#eff6ff', borderColor: '#2563eb' },
                            }}
                          >
                            Return
                          </Button>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Completed
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 8 : 7} sx={{ p: 4 }}>
                      <EmptyState
                        title="No loan records found"
                        description={
                          tabIndex === 1
                            ? 'Great news! There are currently zero overdue book borrowings.'
                            : 'No active or historical book checkouts recorded.'
                        }
                        actionText={isAdmin ? 'Issue New Loan' : 'Borrow a Book'}
                        onAction={() => setBorrowOpen(true)}
                      />
                    </TableCell>
                  </TableRow>
                )
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

      {/* Dialogs */}
      {borrowOpen && (
        <BorrowBookDialog
          open={borrowOpen}
          onClose={() => setBorrowOpen(false)}
          preselectedBook={preselectedBookForBorrow}
          onBorrowSuccess={(msg) => {
            setFeedbackMessage(msg)
            setBorrowOpen(false)
            loadData()
          }}
        />
      )}

      {returnOpen && (
        <ReturnBookDialog
          open={returnOpen}
          onClose={() => setReturnOpen(false)}
          onConfirmReturn={handleConfirmReturn}
          borrowing={selectedBorrowing}
          loading={returnLoading}
        />
      )}

      {reserveOpen && (
        <ReserveBookDialog
          open={reserveOpen}
          onClose={() => setReserveOpen(false)}
          onReservationSuccess={(res) => {
            setFeedbackMessage(
              `Reservation #${res.id} placed successfully for "${res.bookTitle}". Position #${res.queuePosition || 1} in line.`
            )
            loadData()
          }}
        />
      )}

      {/* Cancel Reservation Confirmation Modal */}
      <ConfirmModal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleConfirmCancelReservation}
        title="Cancel Waitlist Reservation"
        description={`Are you sure you want to cancel the reservation for "${reservationToCancel?.bookTitle}"? This will forfeit your position in the waitlist queue.`}
        confirmText="Cancel Reservation"
        confirmColor="error"
        loading={cancelLoading}
        icon={<CancelOutlinedIcon />}
      />
    </Box>
  )
}

export default BorrowingsPage

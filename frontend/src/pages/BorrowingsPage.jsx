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
  Tooltip,
  Skeleton,
  Tabs,
  Tab,
} from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import borrowingService from '../services/borrowingService'
import { useAuth } from '../hooks/useAuth'
import BorrowBookDialog from '../components/borrowings/BorrowBookDialog'
import ReturnBookDialog from '../components/borrowings/ReturnBookDialog'
import { formatDate } from '../utils/formatters'

const BorrowingsPage = () => {
  const { user, isAdmin } = useAuth()

  // State
  const [borrowings, setBorrowings] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [feedbackMessage, setFeedbackMessage] = useState(null)

  // Filters & Tabs
  const [tabIndex, setTabIndex] = useState(0) // 0: All, 1: Overdue (Admin), 2: Active (Member)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Modals
  const [borrowOpen, setBorrowOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)
  const [selectedBorrowing, setSelectedBorrowing] = useState(null)
  const [returnLoading, setReturnLoading] = useState(false)

  // Load Borrowings from Backend
  const loadBorrowings = useCallback(async () => {
    setLoading(true)
    setApiError(null)

    try {
      let pagedData

      if (isAdmin) {
        if (tabIndex === 1) {
          // Overdue loans filter
          pagedData = await borrowingService.getOverdueBorrowings({
            page,
            size: pageSize,
            sortBy: 'dueDate',
            direction: 'ASC',
          })
        } else {
          // All loans
          pagedData = await borrowingService.getAllBorrowings({
            page,
            size: pageSize,
            sortBy: 'id',
            direction: 'DESC',
          })
        }
      } else {
        // Member specific loans
        const memberId = user?.id || 1
        pagedData = await borrowingService.getBorrowingsByMember(memberId, {
          page,
          size: pageSize,
          sortBy: 'id',
          direction: 'DESC',
        })
      }

      setBorrowings(pagedData.content || [])
      setTotalElements(pagedData.totalElements || 0)
    } catch (err) {
      setApiError(err.message || 'Failed to fetch borrowing records.')
      setBorrowings([])
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }, [isAdmin, user, tabIndex, page, pageSize])

  useEffect(() => {
    loadBorrowings()
  }, [loadBorrowings])

  const handleTabChange = (event, newIndex) => {
    setTabIndex(newIndex)
    setPage(0)
  }

  // Pagination Handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setPageSize(parseInt(event.target.value, 10))
    setPage(0)
  }

  // Return Handlers
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
        `Book "${updated.book?.title}" returned successfully.${
          updated.overdue ? ' Late return fine has been assessed.' : ''
        }`
      )
      loadBorrowings()
    } catch (err) {
      setApiError(err.message || 'Failed to return book.')
      setReturnOpen(false)
    } finally {
      setReturnLoading(false)
    }
  }

  const handleBorrowSuccess = (message) => {
    setFeedbackMessage(message)
    loadBorrowings()
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
            {isAdmin ? 'Circulation & Borrowings' : 'My Borrowed Books'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isAdmin
              ? 'Track library book loans, overdue items, returns, and issue new checkouts.'
              : 'Review your active book loans, scheduled return due dates, and return history.'}
          </Typography>
        </Box>

        {isAdmin && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => setBorrowOpen(true)}
            sx={{ fontWeight: 600, textTransform: 'none' }}
          >
            Check Out Book
          </Button>
        )}
      </Stack>

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

      {/* Filter Tabs for Admin */}
      {isAdmin && (
        <Paper elevation={1} sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            sx={{ px: 2 }}
          >
            <Tab label="All Circulation Records" sx={{ textTransform: 'none', fontWeight: 600 }} />
            <Tab
              label="Overdue Loans Only"
              icon={<WarningAmberIcon fontSize="small" />}
              iconPosition="end"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
          </Tabs>
        </Paper>
      )}

      {/* Borrowings Table */}
      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Table aria-label="borrowings circulation table">
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Book Title & Author</TableCell>
              {isAdmin && <TableCell sx={{ fontWeight: 700 }}>Borrower / Member</TableCell>}
              <TableCell sx={{ fontWeight: 700 }}>Borrow Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Due Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Return Date</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                Status
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              // Loading Skeleton Rows
              Array.from({ length: pageSize }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Skeleton variant="text" width="70%" />
                    <Skeleton variant="text" width="40%" />
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                    </TableCell>
                  )}
                  <TableCell>
                    <Skeleton variant="text" width={80} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width={80} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width={80} />
                  </TableCell>
                  <TableCell align="center">
                    <Skeleton variant="rectangular" width={75} height={24} sx={{ mx: 'auto', borderRadius: 4 }} />
                  </TableCell>
                  <TableCell align="right">
                    <Skeleton variant="rectangular" width={90} height={32} sx={{ ml: 'auto' }} />
                  </TableCell>
                </TableRow>
              ))
            ) : borrowings.length > 0 ? (
              borrowings.map((record) => {
                const isReturned = Boolean(record.returnDate) || record.status === 'RETURNED'
                const isOverdue = record.overdue || record.status === 'OVERDUE'

                return (
                  <TableRow key={record.id} hover>
                    {/* Book */}
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={600} color="primary.main">
                        {record.book?.title || 'Unknown Title'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        by {record.book?.author || 'Unknown Author'} (ISBN: {record.book?.isbn})
                      </Typography>
                    </TableCell>

                    {/* Member (Admin View) */}
                    {isAdmin && (
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {record.member?.fullName || 'Member'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {record.member?.email}
                        </Typography>
                      </TableCell>
                    )}

                    {/* Borrow Date */}
                    <TableCell>
                      <Typography variant="body2">{formatDate(record.borrowDate)}</Typography>
                    </TableCell>

                    {/* Due Date */}
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={isOverdue ? 700 : 400}
                        color={isOverdue && !isReturned ? 'error.main' : 'text.primary'}
                      >
                        {formatDate(record.dueDate)}
                      </Typography>
                    </TableCell>

                    {/* Return Date */}
                    <TableCell>
                      {record.returnDate ? (
                        <Typography variant="body2" color="success.main" fontWeight={500}>
                          {formatDate(record.returnDate)}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Not returned
                        </Typography>
                      )}
                    </TableCell>

                    {/* Status Chip */}
                    <TableCell align="center">
                      {isReturned ? (
                        <Chip
                          icon={<CheckCircleOutlineIcon style={{ fontSize: 14 }} />}
                          label="RETURNED"
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                        />
                      ) : isOverdue ? (
                        <Chip
                          icon={<WarningAmberIcon style={{ fontSize: 14 }} />}
                          label="OVERDUE"
                          size="small"
                          color="error"
                          sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                        />
                      ) : (
                        <Chip
                          label="BORROWED"
                          size="small"
                          color="info"
                          variant="outlined"
                          sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                        />
                      )}
                    </TableCell>

                    {/* Action */}
                    <TableCell align="right">
                      {!isReturned ? (
                        <Button
                          variant="outlined"
                          size="small"
                          color="primary"
                          startIcon={<AssignmentReturnIcon />}
                          onClick={() => handleOpenReturn(record)}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Return Book
                        </Button>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Completed
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              // Empty State
              <TableRow>
                <TableCell colSpan={isAdmin ? 7 : 6} align="center" sx={{ py: 6 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    No loan records found.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tabIndex === 1
                      ? 'No overdue loans at this time. All circulation records are within their due dates.'
                      : 'There are no active or past borrowing records recorded.'}
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

      {/* Dialogs */}
      <BorrowBookDialog
        open={borrowOpen}
        onClose={() => setBorrowOpen(false)}
        onBorrowSuccess={handleBorrowSuccess}
      />

      <ReturnBookDialog
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        borrowing={selectedBorrowing}
        onConfirm={handleConfirmReturn}
        loading={returnLoading}
      />
    </Box>
  )
}

export default BorrowingsPage

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
} from '@mui/material'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import AssignmentReturnOutlinedIcon from '@mui/icons-material/AssignmentReturnOutlined'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import borrowingService from '../services/borrowingService'
import { useAuth } from '../hooks/useAuth'
import BorrowBookDialog from '../components/borrowings/BorrowBookDialog'
import ReturnBookDialog from '../components/borrowings/ReturnBookDialog'
import PageHeader from '../components/common/PageHeader'
import StatusBadge from '../components/common/StatusBadge'
import EmptyState from '../components/common/EmptyState'
import { formatDate } from '../utils/formatters'

/**
 * Modern Borrowings & Circulation UI (Image 3 "spik" Table Style)
 */
const BorrowingsPage = () => {
  const { user, isAdmin } = useAuth()

  const [borrowings, setBorrowings] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [feedbackMessage, setFeedbackMessage] = useState(null)

  // 0: All loans, 1: Overdue loans (Admin)
  const [tabIndex, setTabIndex] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Dialogs
  const [borrowOpen, setBorrowOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)
  const [selectedBorrowing, setSelectedBorrowing] = useState(null)
  const [returnLoading, setReturnLoading] = useState(false)

  const loadBorrowings = useCallback(async () => {
    setLoading(true)
    setApiError(null)

    try {
      let pagedData

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
          setBorrowings([])
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

      setBorrowings(pagedData.content || [])
      setTotalElements(pagedData.totalElements || 0)
      setTotalPages(pagedData.totalPages || 1)
    } catch (err) {
      setApiError(err.message || 'Failed to fetch borrowing records.')
      setBorrowings([])
      setTotalElements(0)
      setTotalPages(1)
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
      loadBorrowings()
    } catch (err) {
      setApiError(err.message || 'Failed to return book.')
    } finally {
      setReturnLoading(false)
    }
  }

  return (
    <Box>
      <PageHeader
        title={isAdmin ? 'Circulation & Loans' : 'My Borrowings'}
        subtitle={
          isAdmin
            ? 'Track active checkouts, overdue schedules, and process returns'
            : 'View your checked out books and loan return deadlines'
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
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
          mb={3}
        >
          {/* Tabs or Title */}
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
              <Tab label={`All Loans (${tabIndex === 0 ? totalElements : '•'})`} />
              <Tab
                icon={<WarningAmberRoundedIcon sx={{ fontSize: 16 }} />}
                iconPosition="start"
                label="Overdue Only"
              />
            </Tabs>
          ) : (
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="h6" fontWeight={800} color="#0f172a">
                My Active &amp; Past Loans
              </Typography>
              <Chip
                label={`${totalElements} records`}
                size="small"
                sx={{ fontWeight: 700, bgcolor: '#eff6ff', color: '#2563eb', borderRadius: 2 }}
              />
            </Stack>
          )}

          {/* Action Button (Image 3 style "+ Add" button) */}
          <Button
            variant="contained"
            startIcon={<BookmarkAddOutlinedIcon />}
            onClick={() => setBorrowOpen(true)}
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
        </Stack>

        {/* Data Table (Image 3 Style) */}
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
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
                    <TableCell><Skeleton width={80} /></TableCell>
                    <TableCell align="center"><Skeleton width={70} /></TableCell>
                    <TableCell align="right"><Skeleton width={90} /></TableCell>
                  </TableRow>
                ))
              ) : borrowings.length > 0 ? (
                borrowings.map((b) => (
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
          onBorrowSuccess={(msg) => {
            setFeedbackMessage(msg)
            setBorrowOpen(false)
            loadBorrowings()
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
    </Box>
  )
}

export default BorrowingsPage

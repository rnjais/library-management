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
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Chip,
  Stack,
  MenuItem,
  Alert,
  Tooltip,
  Skeleton,
  Avatar,
  Pagination,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined'
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import FilterListIcon from '@mui/icons-material/FilterList'
import bookService from '../services/bookService'
import { useAuth } from '../hooks/useAuth'
import BookFormDialog from '../components/books/BookFormDialog'
import BookDetailDialog from '../components/books/BookDetailDialog'
import DeleteConfirmDialog from '../components/books/DeleteConfirmDialog'
import BorrowBookDialog from '../components/borrowings/BorrowBookDialog'
import ReserveBookDialog from '../components/reservations/ReserveBookDialog'
import PageHeader from '../components/common/PageHeader'
import EmptyState from '../components/common/EmptyState'

const CATEGORY_OPTIONS = [
  'ALL',
  'Computer Science',
  'Software Engineering',
  'Data Science & AI',
  'Mathematics',
  'Physics',
  'Philosophy',
  'Literature & Fiction',
  'History',
  'Business & Economics',
  'General Science',
  'Other',
]

// Distinct pastel color palette for book cover thumbnails by category (Image 3 style)
const GENRE_COLORS = {
  'Computer Science': { bg: '#eff6ff', color: '#2563eb' },
  'Software Engineering': { bg: '#eff6ff', color: '#1d4ed8' },
  'Data Science & AI': { bg: '#f5f3ff', color: '#7c3aed' },
  Mathematics: { bg: '#faf5ff', color: '#9333ea' },
  Physics: { bg: '#f0fdfa', color: '#0d9488' },
  Philosophy: { bg: '#fffbeb', color: '#b45309' },
  'Literature & Fiction': { bg: '#fdf2f8', color: '#db2777' },
  History: { bg: '#fff7ed', color: '#c2410c' },
  'Business & Economics': { bg: '#f0fdf4', color: '#15803d' },
}

const SORT_OPTIONS = [
  { value: 'id', label: 'ID' },
  { value: 'title', label: 'Title' },
  { value: 'author', label: 'Author' },
  { value: 'category', label: 'Category' },
  { value: 'availableCopies', label: 'Availability' },
]

/**
 * Modern Book Catalog Management UI (Directly Inspired by Reference Image 3 "spik")
 */
const BookCatalogPage = () => {
  const { isAuthenticated, isAdmin } = useAuth()

  // Data State
  const [books, setBooks] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [feedbackMessage, setFeedbackMessage] = useState(null)

  // Filter & Pagination State
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [sortBy, setSortBy] = useState('id')
  const [direction, setDirection] = useState('ASC')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Modals State
  const [formOpen, setFormOpen] = useState(false)
  const [selectedBookForEdit, setSelectedBookForEdit] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedBookForDetail, setSelectedBookForDetail] = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedBookForDelete, setSelectedBookForDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [borrowOpen, setBorrowOpen] = useState(false)
  const [selectedBookForBorrow, setSelectedBookForBorrow] = useState(null)

  const [reserveOpen, setReserveOpen] = useState(false)
  const [selectedBookForReserve, setSelectedBookForReserve] = useState(null)

  const loadBooks = useCallback(async () => {
    setLoading(true)
    setApiError(null)

    try {
      const pagedData = await bookService.getBooks({
        page,
        size: pageSize,
        sortBy,
        direction,
        title: activeSearch,
        category,
      })
      setBooks(pagedData.content || [])
      setTotalElements(pagedData.totalElements || 0)
      setTotalPages(pagedData.totalPages || 1)
    } catch (err) {
      setApiError(err.message || 'Failed to fetch catalog books.')
      setBooks([])
      setTotalElements(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sortBy, direction, activeSearch, category])

  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  const handleSearchSubmit = (e) => {
    e?.preventDefault()
    setPage(0)
    setActiveSearch(searchTerm)
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setActiveSearch('')
    setPage(0)
  }

  const handleCategoryChange = (e) => {
    setCategory(e.target.value)
    setPage(0)
  }

  const handleSortChange = (e) => {
    setSortBy(e.target.value)
    setPage(0)
  }

  const handleToggleDirection = () => {
    setDirection((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'))
    setPage(0)
  }

  // Admin Actions
  const handleOpenAdd = () => {
    setSelectedBookForEdit(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (book) => {
    setSelectedBookForEdit(book)
    setFormOpen(true)
  }

  const handleOpenDetail = (book) => {
    setSelectedBookForDetail(book)
    setDetailOpen(true)
  }

  const handleOpenDelete = (book) => {
    setSelectedBookForDelete(book)
    setDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedBookForDelete) return
    setDeleteLoading(true)
    try {
      await bookService.deleteBook(selectedBookForDelete.id)
      setFeedbackMessage(`Book "${selectedBookForDelete.title}" was removed from the catalog.`)
      setDeleteOpen(false)
      loadBooks()
    } catch (err) {
      setApiError(err.message || 'Failed to delete book.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleOpenBorrow = (book) => {
    setSelectedBookForBorrow(book)
    setBorrowOpen(true)
  }

  const handleOpenReserve = (book) => {
    setSelectedBookForReserve(book)
    setReserveOpen(true)
  }

  const handleReservationSuccess = (reservation) => {
    setFeedbackMessage(
      `Waitlist reservation #${reservation.id} confirmed for "${reservation.bookTitle}"! You are #${reservation.queuePosition || 1} in queue.`
    )
    loadBooks()
  }

  return (
    <Box>
      <PageHeader
        title="Book Catalog"
        subtitle="Explore, search, check out, and administer library titles"
        breadcrumbs={[{ label: 'Catalog', path: null }]}
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

      {/* Main Table Container Card (Image 3 "spik" Table UI style) */}
      <Card sx={{ borderRadius: 4, border: '1px solid #e2e8f0', p: { xs: 2, sm: 3.5 } }}>
        {/* Table Toolbar Header (Image 3 Style) */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
          mb={3}
        >
          {/* Left Title + Total Badge */}
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="h6" fontWeight={800} color="#0f172a">
              All Books
            </Typography>
            <Chip
              label={`${totalElements} titles`}
              size="small"
              sx={{ fontWeight: 700, bgcolor: '#eff6ff', color: '#2563eb', borderRadius: 2 }}
            />
          </Stack>

          {/* Right Filters + Search + Action Button */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center" width={{ xs: '100%', md: 'auto' }}>
            {/* Search Input */}
            <Box component="form" onSubmit={handleSearchSubmit} sx={{ width: { xs: '100%', sm: 240 } }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by title or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleClearSearch} edge="end">
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Box>

            {/* Category Dropdown */}
            <TextField
              select
              size="small"
              value={category}
              onChange={handleCategoryChange}
              sx={{ minWidth: 150, width: { xs: '100%', sm: 'auto' } }}
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat === 'ALL' ? 'All Categories' : cat}
                </MenuItem>
              ))}
            </TextField>

            {/* Sort Dropdown */}
            <TextField
              select
              size="small"
              value={sortBy}
              onChange={handleSortChange}
              sx={{ minWidth: 130, width: { xs: '100%', sm: 'auto' } }}
            >
              {SORT_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  Sort: {opt.label}
                </MenuItem>
              ))}
            </TextField>

            <Tooltip title={`Direction: ${direction}`}>
              <IconButton size="small" onClick={handleToggleDirection} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                {direction === 'ASC' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            {/* "+ Add Book" Primary Button (Matching "+ Add Library" in Image 3) */}
            {isAdmin && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenAdd}
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
                Add Book
              </Button>
            )}

            {/* Member Quick Borrow Button */}
            {!isAdmin && isAuthenticated && (
              <Button
                variant="contained"
                startIcon={<BookmarkAddOutlinedIcon />}
                onClick={() => handleOpenBorrow(null)}
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
                Borrow Book
              </Button>
            )}
          </Stack>
        </Stack>

        {/* Catalog Data Table (Image 3 Style) */}
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Book Name</TableCell>
                <TableCell>Writer / Author</TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="center">Availability</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [1, 2, 3, 4, 5, 6].map((i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton width={200} height={32} /></TableCell>
                    <TableCell><Skeleton width={140} /></TableCell>
                    <TableCell><Skeleton width={50} /></TableCell>
                    <TableCell><Skeleton width={100} /></TableCell>
                    <TableCell align="center"><Skeleton width={80} /></TableCell>
                    <TableCell align="right"><Skeleton width={100} /></TableCell>
                  </TableRow>
                ))
              ) : books.length > 0 ? (
                books.map((book) => {
                  const genreTheme = GENRE_COLORS[book.category] || { bg: '#eff6ff', color: '#2563eb' }
                  return (
                    <TableRow key={book.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      {/* Book Thumbnail + Title (Image 3 Style) */}
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.75}>
                          <Avatar
                            sx={{
                              width: 38,
                              height: 38,
                              borderRadius: 2.25,
                              bgcolor: genreTheme.bg,
                              color: genreTheme.color,
                              fontWeight: 700,
                              fontSize: '0.8125rem',
                            }}
                          >
                            <MenuBookIcon sx={{ fontSize: 20 }} />
                          </Avatar>
                          <Box sx={{ maxWidth: 280 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.25 }}>
                              {book.title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem' }}>
                              ISBN: {book.isbn}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* Author */}
                      <TableCell sx={{ color: '#334155', fontWeight: 500 }}>
                        {book.author}
                      </TableCell>

                      {/* ID chip (Image 3 "#0021" style) */}
                      <TableCell>
                        <Chip
                          label={`#${book.id}`}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            bgcolor: '#f1f5f9',
                            color: '#475569',
                            fontSize: '0.72rem',
                            borderRadius: 1.5,
                          }}
                        />
                      </TableCell>

                      {/* Category Pill */}
                      <TableCell>
                        <Chip
                          label={book.category || 'General'}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            borderRadius: 2,
                            bgcolor: genreTheme.bg,
                            color: genreTheme.color,
                            border: '1px solid transparent',
                          }}
                        />
                      </TableCell>

                      {/* Availability */}
                      <TableCell align="center">
                        <Chip
                          label={`${book.availableCopies} / ${book.totalCopies} Available`}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            bgcolor: book.availableCopies > 0 ? '#dcfce7' : '#fee2e2',
                            color: book.availableCopies > 0 ? '#15803d' : '#b91c1c',
                            borderRadius: 2,
                          }}
                        />
                      </TableCell>

                      {/* Action Icons (Image 3 Style: Trash, Edit, View, Borrow) */}
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                          {/* Borrow Button for authenticated users */}
                          {isAuthenticated && book.availableCopies > 0 && (
                            <Tooltip title="Borrow this Book">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenBorrow(book)}
                                sx={{
                                  color: '#2563eb',
                                  bgcolor: '#eff6ff',
                                  '&:hover': { bgcolor: '#dbeafe' },
                                }}
                              >
                                <BookmarkAddOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* Reserve / Waitlist Button when copies are out */}
                          {isAuthenticated && book.availableCopies <= 0 && (
                            <Tooltip title="Copies out on loan — Join Waitlist">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenReserve(book)}
                                sx={{
                                  color: '#b45309',
                                  bgcolor: '#fef3c7',
                                  '&:hover': { bgcolor: '#fde68a' },
                                }}
                              >
                                <HourglassTopRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* View Book Details */}
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => handleOpenDetail(book)} sx={{ color: '#64748b' }}>
                              <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {/* Admin Edit & Delete Icons (Image 3 style) */}
                          {isAdmin && (
                            <>
                              <Tooltip title="Edit Book">
                                <IconButton size="small" onClick={() => handleOpenEdit(book)} sx={{ color: '#64748b' }}>
                                  <EditOutlinedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Book">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDelete(book)}
                                  sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fee2e2' } }}
                                >
                                  <DeleteOutlineOutlinedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} sx={{ p: 4 }}>
                    <EmptyState
                      title="No books found"
                      description={
                        activeSearch || category !== 'ALL'
                          ? 'No titles match your current search query or filter.'
                          : 'The book catalog is currently empty.'
                      }
                      actionText={isAdmin ? 'Add First Book' : undefined}
                      onAction={isAdmin ? handleOpenAdd : undefined}
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Numbered Pill Pagination (Matching Reference Image 3: < 1 2 [3] 4 5 >) */}
        {totalPages > 1 && (
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={totalPages}
              page={page + 1}
              onChange={(e, p) => setPage(p - 1)}
              color="primary"
              shape="rounded"
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                },
                '& .Mui-selected': {
                  bgcolor: '#2563eb !important',
                  color: '#ffffff',
                },
              }}
            />
          </Box>
        )}
      </Card>

      {/* Domain Dialogs */}
      {formOpen && (
        <BookFormDialog
          open={formOpen}
          onClose={() => setFormOpen(false)}
          bookToEdit={selectedBookForEdit}
          onBookSaved={() => {
            setFeedbackMessage(selectedBookForEdit ? 'Book updated successfully.' : 'New book added to catalog.')
            setFormOpen(false)
            loadBooks()
          }}
        />
      )}

      {detailOpen && (
        <BookDetailDialog
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          book={selectedBookForDetail}
        />
      )}

      {deleteOpen && (
        <DeleteConfirmDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleConfirmDelete}
          bookTitle={selectedBookForDelete?.title}
          loading={deleteLoading}
        />
      )}

      {borrowOpen && (
        <BorrowBookDialog
          open={borrowOpen}
          onClose={() => setBorrowOpen(false)}
          preselectedBook={selectedBookForBorrow}
          onBorrowSuccess={(msg) => {
            setFeedbackMessage(msg)
            setBorrowOpen(false)
            loadBooks()
          }}
        />
      )}

      {reserveOpen && (
        <ReserveBookDialog
          open={reserveOpen}
          onClose={() => setReserveOpen(false)}
          preselectedBook={selectedBookForReserve}
          onReservationSuccess={handleReservationSuccess}
        />
      )}
    </Box>
  )
}

export default BookCatalogPage

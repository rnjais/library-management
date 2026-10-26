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
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import FilterListIcon from '@mui/icons-material/FilterList'
import bookService from '../services/bookService'
import { useAuth } from '../hooks/useAuth'
import BookFormDialog from '../components/books/BookFormDialog'
import BookDetailDialog from '../components/books/BookDetailDialog'
import DeleteConfirmDialog from '../components/books/DeleteConfirmDialog'

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

const SORT_OPTIONS = [
  { value: 'id', label: 'ID' },
  { value: 'title', label: 'Title' },
  { value: 'author', label: 'Author' },
  { value: 'category', label: 'Category' },
  { value: 'availableCopies', label: 'Availability' },
]

const BookCatalogPage = () => {
  const { isAdmin } = useAuth()

  // Data State
  const [books, setBooks] = useState([])
  const [totalElements, setTotalElements] = useState(0)
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

  // Modals & Dialogs State
  const [formOpen, setFormOpen] = useState(false)
  const [selectedBookForEdit, setSelectedBookForEdit] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedBookForDetail, setSelectedBookForDetail] = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedBookForDelete, setSelectedBookForDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Fetch Books from Backend
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
    } catch (err) {
      setApiError(err.message || 'Failed to fetch catalog books.')
      setBooks([])
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sortBy, direction, activeSearch, category])

  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  // Search Handlers
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

  // Pagination Handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setPageSize(parseInt(event.target.value, 10))
    setPage(0)
  }

  // Dialog Actions
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
      setDeleteOpen(false)
      setSelectedBookForDelete(null)
      setFeedbackMessage('Book removed from catalog.')
      loadBooks()
    } catch (err) {
      setApiError(err.message || 'Failed to delete book. Please check for active borrowings.')
      setDeleteOpen(false)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleBookSaved = (message) => {
    setFeedbackMessage(message)
    loadBooks()
  }

  return (
    <Box>
      {/* Header Section */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            {isAdmin ? 'Manage Book Catalog' : 'Book Catalog'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Explore and search available library resources, track copies, and view catalog details.
          </Typography>
        </Box>

        {isAdmin && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
            sx={{ fontWeight: 600, textTransform: 'none' }}
          >
            Add New Book
          </Button>
        )}
      </Stack>

      {/* Feedback Alerts */}
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

      {/* Filter and Search Bar Toolbar */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          {/* Title Search Input */}
          <Box component="form" onSubmit={handleSearchSubmit} sx={{ flexGrow: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by book title (e.g. Clean Code, Java, Design)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {searchTerm && (
                      <IconButton size="small" onClick={handleClearSearch} edge="end">
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    )}
                    <Button
                      variant="contained"
                      size="small"
                      type="submit"
                      sx={{ ml: 1, textTransform: 'none' }}
                    >
                      Search
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Category Filter */}
          <TextField
            select
            size="small"
            label="Category"
            value={category}
            onChange={handleCategoryChange}
            sx={{ minWidth: 180 }}
          >
            {CATEGORY_OPTIONS.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat === 'ALL' ? 'All Categories' : cat}
              </MenuItem>
            ))}
          </TextField>

          {/* Sort Selection */}
          <TextField
            select
            size="small"
            label="Sort By"
            value={sortBy}
            onChange={handleSortChange}
            sx={{ minWidth: 150 }}
          >
            {SORT_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Sort Direction Toggle */}
          <Tooltip title={`Direction: ${direction === 'ASC' ? 'Ascending' : 'Descending'}`}>
            <Button
              variant="outlined"
              size="medium"
              onClick={handleToggleDirection}
              startIcon={direction === 'ASC' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
              sx={{ minWidth: 110, textTransform: 'none' }}
            >
              {direction}
            </Button>
          </Tooltip>
        </Stack>
      </Paper>

      {/* Book Catalog Table */}
      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Table aria-label="book catalog table">
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Title & Author</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>ISBN</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                Total Copies
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                Available
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              // Loading Skeleton Rows
              Array.from({ length: pageSize }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton variant="text" width="70%" />
                    <Skeleton variant="text" width="40%" />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="rectangular" width={90} height={24} sx={{ borderRadius: 4 }} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width={110} />
                  </TableCell>
                  <TableCell align="center">
                    <Skeleton variant="text" width={30} sx={{ mx: 'auto' }} />
                  </TableCell>
                  <TableCell align="center">
                    <Skeleton variant="text" width={50} sx={{ mx: 'auto' }} />
                  </TableCell>
                  <TableCell align="right">
                    <Skeleton variant="rectangular" width={80} height={32} sx={{ ml: 'auto' }} />
                  </TableCell>
                </TableRow>
              ))
            ) : books.length > 0 ? (
              books.map((book) => {
                const isAvailable = book.availableCopies > 0
                return (
                  <TableRow key={book.id} hover>
                    {/* Title & Author */}
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={600} color="primary.main">
                        {book.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        by {book.author}
                      </Typography>
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      <Chip
                        label={book.category}
                        size="small"
                        color="default"
                        variant="outlined"
                        sx={{ fontSize: '0.72rem' }}
                      />
                    </TableCell>

                    {/* ISBN */}
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontSize="0.82rem">
                        {book.isbn}
                      </Typography>
                    </TableCell>

                    {/* Total Copies */}
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={600}>
                        {book.totalCopies}
                      </Typography>
                    </TableCell>

                    {/* Available Copies Badge */}
                    <TableCell align="center">
                      <Chip
                        label={isAvailable ? `${book.availableCopies} available` : 'Out of Stock'}
                        size="small"
                        color={isAvailable ? 'success' : 'error'}
                        variant={isAvailable ? 'outlined' : 'filled'}
                        sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                      />
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="View Specifications">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleOpenDetail(book)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {isAdmin && (
                          <>
                            <Tooltip title="Edit Book">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenEdit(book)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Delete Book">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleOpenDelete(book)}
                              >
                                <DeleteIcon fontSize="small" />
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
              // Empty State
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    No books found in catalog.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {activeSearch || category !== 'ALL'
                      ? 'Try modifying your search keywords or clearing active filters.'
                      : 'The library catalog is currently empty. Add books to get started.'}
                  </Typography>
                  {(activeSearch || category !== 'ALL') && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<FilterListIcon />}
                      onClick={() => {
                        handleClearSearch()
                        setCategory('ALL')
                      }}
                    >
                      Reset All Filters
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
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
      <BookFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        bookToEdit={selectedBookForEdit}
        onBookSaved={handleBookSaved}
      />

      <BookDetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        book={selectedBookForDetail}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        book={selectedBookForDelete}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />
    </Box>
  )
}

export default BookCatalogPage

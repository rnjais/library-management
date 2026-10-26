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
  Avatar,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityIcon from '@mui/icons-material/Visibility'
import BlockIcon from '@mui/icons-material/Block'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import FilterListIcon from '@mui/icons-material/FilterList'
import memberService from '../services/memberService'
import MemberFormDialog from '../components/members/MemberFormDialog'
import MemberDetailDialog from '../components/members/MemberDetailDialog'
import DeactivateConfirmDialog from '../components/members/DeactivateConfirmDialog'
import { formatDate } from '../utils/formatters'

const SORT_OPTIONS = [
  { value: 'id', label: 'ID' },
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'email', label: 'Email' },
  { value: 'membershipDate', label: 'Enrollment Date' },
]

const MemberManagementPage = () => {
  // Data State
  const [members, setMembers] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [feedbackMessage, setFeedbackMessage] = useState(null)

  // Filter & Pagination State
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL' or 'ACTIVE'
  const [sortBy, setSortBy] = useState('id')
  const [direction, setDirection] = useState('ASC')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Dialog State
  const [formOpen, setFormOpen] = useState(false)
  const [selectedMemberForEdit, setSelectedMemberForEdit] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedMemberForDetail, setSelectedMemberForDetail] = useState(null)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [selectedMemberForDeactivate, setSelectedMemberForDeactivate] = useState(null)
  const [deactivateLoading, setDeactivateLoading] = useState(false)

  // Load Members from Backend
  const loadMembers = useCallback(async () => {
    setLoading(true)
    setApiError(null)

    try {
      let pagedData
      if (activeSearch.trim()) {
        pagedData = await memberService.searchMembersByName({
          name: activeSearch.trim(),
          page,
          size: pageSize,
          sortBy,
          direction,
        })
      } else if (statusFilter === 'ACTIVE') {
        pagedData = await memberService.getActiveMembers({
          page,
          size: pageSize,
          sortBy,
          direction,
        })
      } else {
        pagedData = await memberService.getAllMembers({
          page,
          size: pageSize,
          sortBy,
          direction,
        })
      }

      setMembers(pagedData.content || [])
      setTotalElements(pagedData.totalElements || 0)
    } catch (err) {
      setApiError(err.message || 'Failed to fetch library members.')
      setMembers([])
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sortBy, direction, activeSearch, statusFilter])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  // Filter Handlers
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

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value)
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

  // Dialog Handlers
  const handleOpenAdd = () => {
    setSelectedMemberForEdit(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (member) => {
    setSelectedMemberForEdit(member)
    setFormOpen(true)
  }

  const handleOpenDetail = (member) => {
    setSelectedMemberForDetail(member)
    setDetailOpen(true)
  }

  const handleOpenDeactivate = (member) => {
    setSelectedMemberForDeactivate(member)
    setDeactivateOpen(true)
  }

  const handleConfirmDeactivate = async () => {
    if (!selectedMemberForDeactivate) return
    setDeactivateLoading(true)

    try {
      await memberService.deactivateMember(selectedMemberForDeactivate.id)
      setDeactivateOpen(false)
      setSelectedMemberForDeactivate(null)
      setFeedbackMessage('Member account has been deactivated.')
      loadMembers()
    } catch (err) {
      setApiError(err.message || 'Failed to deactivate member account.')
      setDeactivateOpen(false)
    } finally {
      setDeactivateLoading(false)
    }
  }

  const handleMemberSaved = (message) => {
    setFeedbackMessage(message)
    loadMembers()
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
            Patron Member Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage enrolled library members, review active accounts, update contact profiles, and register patrons.
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={handleOpenAdd}
          sx={{ fontWeight: 600, textTransform: 'none' }}
        >
          Register Member
        </Button>
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

      {/* Toolbar / Search Filter */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          {/* Name Search Field */}
          <Box component="form" onSubmit={handleSearchSubmit} sx={{ flexGrow: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search member by first or last name..."
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

          {/* Status Filter */}
          <TextField
            select
            size="small"
            label="Membership Status"
            value={statusFilter}
            onChange={handleStatusChange}
            sx={{ minWidth: 170 }}
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="ACTIVE">Active Members Only</MenuItem>
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

          {/* Direction Toggle */}
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

      {/* Member Directory Table */}
      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Table aria-label="member directory table">
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Patron Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Contact Information</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Address</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Enrollment Date</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                Status
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              // Loading Skeleton Rows
              Array.from({ length: pageSize }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="30%" />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="50%" />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width="70%" />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width="50%" />
                  </TableCell>
                  <TableCell align="center">
                    <Skeleton variant="rectangular" width={70} height={24} sx={{ mx: 'auto', borderRadius: 4 }} />
                  </TableCell>
                  <TableCell align="right">
                    <Skeleton variant="rectangular" width={80} height={32} sx={{ ml: 'auto' }} />
                  </TableCell>
                </TableRow>
              ))
            ) : members.length > 0 ? (
              members.map((member) => (
                <TableRow key={member.id} hover>
                  {/* Name & Avatar */}
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.light', fontSize: 14, fontWeight: 700 }}>
                        {member.firstName?.charAt(0) || 'M'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                          {member.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: #{member.id}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  {/* Contact Info */}
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {member.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {member.phoneNumber}
                    </Typography>
                  </TableCell>

                  {/* Address */}
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 180 }}>
                      {member.address || '—'}
                    </Typography>
                  </TableCell>

                  {/* Enrollment Date */}
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(member.membershipDate)}
                    </Typography>
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell align="center">
                    <Chip
                      label={member.active ? 'Active' : 'Inactive'}
                      size="small"
                      color={member.active ? 'success' : 'default'}
                      variant={member.active ? 'outlined' : 'filled'}
                      sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                    />
                  </TableCell>

                  {/* Action Buttons */}
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="View Member Details">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleOpenDetail(member)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Edit Profile">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenEdit(member)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {member.active && (
                        <Tooltip title="Deactivate Membership">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => handleOpenDeactivate(member)}
                          >
                            <BlockIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              // Empty State
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    No patron members found.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {activeSearch || statusFilter !== 'ALL'
                      ? 'No members match your search criteria. Try modifying your filters.'
                      : 'No members are registered yet. Register a member to get started.'}
                  </Typography>
                  {(activeSearch || statusFilter !== 'ALL') && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<FilterListIcon />}
                      onClick={() => {
                        handleClearSearch()
                        setStatusFilter('ALL')
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
      <MemberFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        memberToEdit={selectedMemberForEdit}
        onMemberSaved={handleMemberSaved}
      />

      <MemberDetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        member={selectedMemberForDetail}
      />

      <DeactivateConfirmDialog
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        member={selectedMemberForDeactivate}
        onConfirm={handleConfirmDeactivate}
        loading={deactivateLoading}
      />
    </Box>
  )
}

export default MemberManagementPage

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
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import memberService from '../services/memberService'
import MemberFormDialog from '../components/members/MemberFormDialog'
import MemberDetailDialog from '../components/members/MemberDetailDialog'
import DeactivateConfirmDialog from '../components/members/DeactivateConfirmDialog'
import DeleteMemberConfirmDialog from '../components/members/DeleteMemberConfirmDialog'
import PageHeader from '../components/common/PageHeader'
import StatusBadge from '../components/common/StatusBadge'
import EmptyState from '../components/common/EmptyState'
import { formatDate } from '../utils/formatters'

const SORT_OPTIONS = [
  { value: 'id', label: 'ID' },
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'email', label: 'Email' },
  { value: 'membershipDate', label: 'Enrollment Date' },
]

// Avatar soft background colors based on member ID
const AVATAR_COLORS = ['#eff6ff', '#f0fdf4', '#fef3c7', '#faf5ff', '#f0fdfa', '#fdf2f8']
const AVATAR_TEXT_COLORS = ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#0d9488', '#db2777']

/**
 * Modern Member Management UI (Image 3 "spik" Table Style)
 */
const MemberManagementPage = () => {
  const [members, setMembers] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [feedbackMessage, setFeedbackMessage] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('id')
  const [direction, setDirection] = useState('ASC')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Dialog States
  const [formOpen, setFormOpen] = useState(false)
  const [selectedMemberForEdit, setSelectedMemberForEdit] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedMemberForDetail, setSelectedMemberForDetail] = useState(null)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [selectedMemberForDeactivate, setSelectedMemberForDeactivate] = useState(null)
  const [deactivateLoading, setDeactivateLoading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedMemberForDelete, setSelectedMemberForDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

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
      setTotalPages(pagedData.totalPages || 1)
    } catch (err) {
      setApiError(err.message || 'Failed to fetch library members.')
      setMembers([])
      setTotalElements(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sortBy, direction, activeSearch, statusFilter])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

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

  // Action Triggers
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
      setFeedbackMessage(`Member "${selectedMemberForDeactivate.fullName}" has been deactivated.`)
      setDeactivateOpen(false)
      loadMembers()
    } catch (err) {
      setApiError(err.message || 'Failed to deactivate member.')
    } finally {
      setDeactivateLoading(false)
    }
  }

  const handleActivateMember = async (member) => {
    try {
      await memberService.activateMember(member.id)
      setFeedbackMessage(`Member "${member.fullName}" has been reactivated.`)
      loadMembers()
    } catch (err) {
      setApiError(err.message || 'Failed to reactivate member.')
    }
  }

  const handleOpenDelete = (member) => {
    setSelectedMemberForDelete(member)
    setDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedMemberForDelete) return
    setDeleteLoading(true)
    try {
      await memberService.deleteMember(selectedMemberForDelete.id)
      setFeedbackMessage(`Member account "${selectedMemberForDelete.fullName}" was permanently removed.`)
      setDeleteOpen(false)
      loadMembers()
    } catch (err) {
      setApiError(err.message || 'Failed to delete member account.')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <Box>
      <PageHeader
        title="Patron Members"
        subtitle="Manage library memberships, account activation, contact info, and loan permissions"
        breadcrumbs={[{ label: 'Members', path: null }]}
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

      {/* Main Table Container Card (Image 3 Style) */}
      <Card sx={{ borderRadius: 4, border: '1px solid #e2e8f0', p: { xs: 2, sm: 3.5 } }}>
        {/* Table Toolbar Header */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
          mb={3}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="h6" fontWeight={800} color="#0f172a">
              All Members
            </Typography>
            <Chip
              label={`${totalElements} patrons`}
              size="small"
              sx={{ fontWeight: 700, bgcolor: '#eff6ff', color: '#2563eb', borderRadius: 2 }}
            />
          </Stack>

          {/* Right Toolbar */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center" width={{ xs: '100%', md: 'auto' }}>
            <Box component="form" onSubmit={handleSearchSubmit} sx={{ width: { xs: '100%', sm: 220 } }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by name..."
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

            <TextField
              select
              size="small"
              value={statusFilter}
              onChange={handleStatusChange}
              sx={{ minWidth: 140, width: { xs: '100%', sm: 'auto' } }}
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="ACTIVE">Active Only</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              value={sortBy}
              onChange={handleSortChange}
              sx={{ minWidth: 140, width: { xs: '100%', sm: 'auto' } }}
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

            {/* "+ Register Member" Button (Image 3 "+ Add" style) */}
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
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
              Register Member
            </Button>
          </Stack>
        </Stack>

        {/* Member Data Table (Image 3 Style) */}
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Member Name</TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Contact Phone</TableCell>
                <TableCell>Enrolled Date</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [1, 2, 3, 4, 5, 6].map((i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton width={180} height={32} /></TableCell>
                    <TableCell><Skeleton width={50} /></TableCell>
                    <TableCell><Skeleton width={110} /></TableCell>
                    <TableCell><Skeleton width={90} /></TableCell>
                    <TableCell align="center"><Skeleton width={70} /></TableCell>
                    <TableCell align="right"><Skeleton width={110} /></TableCell>
                  </TableRow>
                ))
              ) : members.length > 0 ? (
                members.map((member) => {
                  const avatarBg = AVATAR_COLORS[member.id % AVATAR_COLORS.length]
                  const avatarColor = AVATAR_TEXT_COLORS[member.id % AVATAR_TEXT_COLORS.length]
                  return (
                    <TableRow key={member.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      {/* Avatar Initials + Full Name + Email (Image 3 Style) */}
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.75}>
                          <Avatar
                            sx={{
                              width: 38,
                              height: 38,
                              borderRadius: 2.25,
                              bgcolor: avatarBg,
                              color: avatarColor,
                              fontWeight: 700,
                              fontSize: '0.875rem',
                            }}
                          >
                            {(member.firstName || 'M').charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ maxWidth: 220 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.25 }}>
                              {member.fullName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem' }} noWrap>
                              {member.email}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* ID chip */}
                      <TableCell>
                        <Chip
                          label={`#${member.id}`}
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

                      {/* Phone */}
                      <TableCell sx={{ color: '#334155', fontWeight: 500 }}>
                        {member.phoneNumber || '—'}
                      </TableCell>

                      {/* Enrolled Date */}
                      <TableCell sx={{ color: '#64748b', fontSize: '0.8125rem' }}>
                        {formatDate(member.membershipDate)}
                      </TableCell>

                      {/* StatusBadge */}
                      <TableCell align="center">
                        <StatusBadge status={member.active ? 'ACTIVE' : 'INACTIVE'} />
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                          <Tooltip title="View Member Details">
                            <IconButton size="small" onClick={() => handleOpenDetail(member)} sx={{ color: '#64748b' }}>
                              <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Edit Profile">
                            <IconButton size="small" onClick={() => handleOpenEdit(member)} sx={{ color: '#64748b' }}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {member.active ? (
                            <Tooltip title="Deactivate Membership">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDeactivate(member)}
                                sx={{ color: '#f59e0b', '&:hover': { bgcolor: '#fef3c7' } }}
                              >
                                <BlockOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Reactivate Membership">
                              <IconButton
                                size="small"
                                onClick={() => handleActivateMember(member)}
                                sx={{ color: '#16a34a', '&:hover': { bgcolor: '#dcfce7' } }}
                              >
                                <HowToRegOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          <Tooltip title="Permanently Delete Member">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDelete(member)}
                              sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fee2e2' } }}
                            >
                              <DeleteOutlineOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} sx={{ p: 4 }}>
                    <EmptyState
                      title="No members found"
                      description={
                        activeSearch || statusFilter !== 'ALL'
                          ? 'No members match your search criteria. Try modifying your filters.'
                          : 'No patrons are currently registered in the system.'
                      }
                      actionText="Register Member"
                      onAction={handleOpenAdd}
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

      {/* Dialogs */}
      {formOpen && (
        <MemberFormDialog
          open={formOpen}
          onClose={() => setFormOpen(false)}
          memberToEdit={selectedMemberForEdit}
          onMemberSaved={() => {
            setFeedbackMessage(selectedMemberForEdit ? 'Member profile updated.' : 'New member enrolled.')
            setFormOpen(false)
            loadMembers()
          }}
        />
      )}

      {detailOpen && (
        <MemberDetailDialog
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          member={selectedMemberForDetail}
        />
      )}

      {deactivateOpen && (
        <DeactivateConfirmDialog
          open={deactivateOpen}
          onClose={() => setDeactivateOpen(false)}
          onConfirm={handleConfirmDeactivate}
          memberName={selectedMemberForDeactivate?.fullName}
          loading={deactivateLoading}
        />
      )}

      {deleteOpen && (
        <DeleteMemberConfirmDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleConfirmDelete}
          member={selectedMemberForDelete}
          loading={deleteLoading}
        />
      )}
    </Box>
  )
}

export default MemberManagementPage

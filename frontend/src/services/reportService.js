import api from './api'

/**
 * Service for interacting with Spring Boot Administrative Reports & Analytics REST APIs.
 * Base URL: /api/admin/reports (Requires ADMIN role)
 */
const reportService = {
  /**
   * Retrieves book inventory statistics and category breakdowns.
   * @returns {Promise<BookReportDto>}
   */
  async getBookReport() {
    const response = await api.get('/admin/reports/books')
    return response.data
  },

  /**
   * Retrieves member statistics and filtered member records with pagination.
   *
   * @param {Object} params
   * @param {boolean} [params.active]
   * @param {string} [params.startDate] YYYY-MM-DD
   * @param {string} [params.endDate] YYYY-MM-DD
   * @param {number} [params.page=0]
   * @param {number} [params.size=10]
   * @param {string} [params.sortBy='id']
   * @param {string} [params.direction='DESC']
   * @returns {Promise<MemberReportDto>}
   */
  async getMemberReport({
    active,
    startDate,
    endDate,
    page = 0,
    size = 10,
    sortBy = 'id',
    direction = 'DESC',
  } = {}) {
    const params = { page, size, sortBy, direction }
    if (active !== undefined && active !== null && active !== '') {
      params.active = active
    }
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate

    const response = await api.get('/admin/reports/members', { params })
    return response.data
  },

  /**
   * Retrieves borrowing circulation statistics and filtered loan records with pagination.
   *
   * @param {Object} params
   * @param {string} [params.status] BORROWED, RETURNED, OVERDUE
   * @param {string} [params.startDate] YYYY-MM-DD
   * @param {string} [params.endDate] YYYY-MM-DD
   * @param {number} [params.page=0]
   * @param {number} [params.size=10]
   * @param {string} [params.sortBy='borrowDate']
   * @param {string} [params.direction='DESC']
   * @returns {Promise<BorrowingReportDto>}
   */
  async getBorrowingReport({
    status,
    startDate,
    endDate,
    page = 0,
    size = 10,
    sortBy = 'borrowDate',
    direction = 'DESC',
  } = {}) {
    const params = { page, size, sortBy, direction }
    if (status && status !== 'ALL') params.status = status
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate

    const response = await api.get('/admin/reports/borrowings', { params })
    return response.data
  },

  /**
   * Retrieves currently overdue unreturned borrowing records with pagination.
   *
   * @param {Object} params
   * @param {number} [params.page=0]
   * @param {number} [params.size=10]
   * @param {string} [params.sortBy='dueDate']
   * @param {string} [params.direction='ASC']
   * @returns {Promise<PagedResponse<BorrowingResponseDto>>}
   */
  async getOverdueReport({
    page = 0,
    size = 10,
    sortBy = 'dueDate',
    direction = 'ASC',
  } = {}) {
    const response = await api.get('/admin/reports/overdue', {
      params: { page, size, sortBy, direction },
    })
    return response.data
  },

  /**
   * Retrieves fine totals, payment revenue statistics, and filtered fine records with pagination.
   *
   * @param {Object} params
   * @param {string} [params.status] PAID, UNPAID
   * @param {string} [params.startDate] YYYY-MM-DD
   * @param {string} [params.endDate] YYYY-MM-DD
   * @param {number} [params.page=0]
   * @param {number} [params.size=10]
   * @param {string} [params.sortBy='calculatedAt']
   * @param {string} [params.direction='DESC']
   * @returns {Promise<FineReportDto>}
   */
  async getFineReport({
    status,
    startDate,
    endDate,
    page = 0,
    size = 10,
    sortBy = 'calculatedAt',
    direction = 'DESC',
  } = {}) {
    const params = { page, size, sortBy, direction }
    if (status && status !== 'ALL') params.status = status
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate

    const response = await api.get('/admin/reports/fines', { params })
    return response.data
  },
}

export default reportService

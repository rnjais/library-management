import api from './api'

/**
 * Service for interacting with Spring Boot Borrowing & Circulation REST APIs.
 * Base URL: /api/borrowings
 */
const borrowingService = {
  /**
   * Check out / borrow a book for a member.
   * Roles: ADMIN, MEMBER
   *
   * @param {Object} payload - { bookId, memberId, borrowDays, dueDate }
   * @returns {Promise<BorrowingResponseDto>}
   */
  async borrowBook(payload) {
    const response = await api.post('/borrowings', payload)
    return response.data
  },

  /**
   * Return a borrowed book.
   * Roles: ADMIN, MEMBER
   *
   * @param {number|string} id - Borrowing record ID
   * @returns {Promise<BorrowingResponseDto>}
   */
  async returnBook(id) {
    const response = await api.patch(`/borrowings/${id}/return`)
    return response.data
  },

  /**
   * Get all borrowings with pagination. Requires ADMIN role.
   *
   * @param {Object} params
   * @param {number} [params.page=0]
   * @param {number} [params.size=10]
   * @param {string} [params.sortBy='id']
   * @param {string} [params.direction='DESC']
   * @returns {Promise<PagedResponse<BorrowingResponseDto>>}
   */
  async getAllBorrowings({ page = 0, size = 10, sortBy = 'id', direction = 'DESC' } = {}) {
    const response = await api.get('/borrowings', {
      params: { page, size, sortBy, direction },
    })
    return response.data
  },

  /**
   * Get all overdue borrowings. Requires ADMIN role.
   *
   * @param {Object} params
   * @param {number} [params.page=0]
   * @param {number} [params.size=10]
   * @param {string} [params.sortBy='dueDate']
   * @param {string} [params.direction='ASC']
   * @returns {Promise<PagedResponse<BorrowingResponseDto>>}
   */
  async getOverdueBorrowings({ page = 0, size = 10, sortBy = 'dueDate', direction = 'ASC' } = {}) {
    const response = await api.get('/borrowings/overdue', {
      params: { page, size, sortBy, direction },
    })
    return response.data
  },

  /**
   * Get loan history for a specific member. Roles: ADMIN, MEMBER
   *
   * @param {number|string} memberId
   * @param {Object} params
   * @param {number} [params.page=0]
   * @param {number} [params.size=10]
   * @param {string} [params.sortBy='id']
   * @param {string} [params.direction='DESC']
   * @returns {Promise<PagedResponse<BorrowingResponseDto>>}
   */
  async getBorrowingsByMember(memberId, { page = 0, size = 10, sortBy = 'id', direction = 'DESC' } = {}) {
    const response = await api.get(`/borrowings/member/${memberId}`, {
      params: { page, size, sortBy, direction },
    })
    return response.data
  },

  /**
   * Get single borrowing record by ID. Roles: ADMIN, MEMBER
   * @param {number|string} id
   * @returns {Promise<BorrowingResponseDto>}
   */
  async getBorrowingById(id) {
    const response = await api.get(`/borrowings/${id}`)
    return response.data
  },
}

export default borrowingService

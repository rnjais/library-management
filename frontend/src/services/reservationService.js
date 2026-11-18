import api from './api'

/**
 * Service for interacting with Spring Boot Book Reservation & Waitlist REST APIs.
 * Base URL: /api/reservations
 */
const reservationService = {
  /**
   * Place a new book reservation / waitlist request.
   * Roles: ADMIN, MEMBER
   *
   * @param {Object} payload - { bookId, memberId }
   * @returns {Promise<ApiResponse<ReservationResponseDto>>}
   */
  async createReservation(payload) {
    const response = await api.post('/reservations', payload)
    return response.data
  },

  /**
   * Cancel an active reservation.
   * Roles: ADMIN, MEMBER
   *
   * @param {number|string} id - Reservation ID
   * @returns {Promise<ApiResponse<ReservationResponseDto>>}
   */
  async cancelReservation(id) {
    const response = await api.patch(`/reservations/${id}/cancel`)
    return response.data
  },

  /**
   * Get reservation details by ID.
   * Roles: ADMIN, MEMBER
   *
   * @param {number|string} id
   * @returns {Promise<ApiResponse<ReservationResponseDto>>}
   */
  async getReservationById(id) {
    const response = await api.get(`/reservations/${id}`)
    return response.data
  },

  /**
   * Get reservations for the authenticated patron.
   * Roles: MEMBER, ADMIN
   *
   * @param {Object} params
   * @returns {Promise<ApiResponse<PagedResponse<ReservationResponseDto>>>}
   */
  async getMyReservations({ page = 0, size = 10, sortBy = 'reservationDate', direction = 'DESC' } = {}) {
    const response = await api.get('/reservations/my', {
      params: { page, size, sortBy, direction },
    })
    return response.data
  },

  /**
   * Get all reservations across the library system.
   * Requires ADMIN role.
   *
   * @param {Object} params
   * @returns {Promise<ApiResponse<PagedResponse<ReservationResponseDto>>>}
   */
  async getAllReservations({ status, page = 0, size = 10, sortBy = 'reservationDate', direction = 'DESC' } = {}) {
    const params = { page, size, sortBy, direction }
    if (status) {
      params.status = status
    }
    const response = await api.get('/reservations', { params })
    return response.data
  },

  /**
   * Get waitlist queue for a specific book.
   * Roles: ADMIN, MEMBER
   *
   * @param {number|string} bookId
   * @param {Object} params
   * @returns {Promise<ApiResponse<PagedResponse<ReservationResponseDto>>>}
   */
  async getBookWaitlist(bookId, { page = 0, size = 10, sortBy = 'reservationDate', direction = 'ASC' } = {}) {
    const response = await api.get(`/reservations/book/${bookId}`, {
      params: { page, size, sortBy, direction },
    })
    return response.data
  },
}

export default reservationService

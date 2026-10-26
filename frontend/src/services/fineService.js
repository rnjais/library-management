import api from './api'

/**
 * Service for interacting with Spring Boot Library Fine Management REST APIs.
 * Base URL: /api/fines
 */
const fineService = {
  /**
   * Get all fine records with pagination. Requires ADMIN role.
   *
   * @param {Object} params
   * @param {number} [params.page=0]
   * @param {number} [params.size=10]
   * @param {string} [params.sortBy='id']
   * @param {string} [params.direction='DESC']
   * @returns {Promise<PagedResponse<FineResponseDto>>}
   */
  async getAllFines({ page = 0, size = 10, sortBy = 'id', direction = 'DESC' } = {}) {
    const response = await api.get('/fines', {
      params: { page, size, sortBy, direction },
    })
    return response.data
  },

  /**
   * Get all unpaid fines with pagination. Requires ADMIN role.
   *
   * @param {Object} params
   * @param {number} [params.page=0]
   * @param {number} [params.size=10]
   * @param {string} [params.sortBy='id']
   * @param {string} [params.direction='DESC']
   * @returns {Promise<PagedResponse<FineResponseDto>>}
   */
  async getUnpaidFines({ page = 0, size = 10, sortBy = 'id', direction = 'DESC' } = {}) {
    const response = await api.get('/fines/unpaid', {
      params: { page, size, sortBy, direction },
    })
    return response.data
  },

  /**
   * Get fines for a specific member. Roles: ADMIN, MEMBER
   *
   * @param {number|string} memberId
   * @param {Object} params
   * @param {number} [params.page=0]
   * @param {number} [params.size=10]
   * @param {string} [params.sortBy='id']
   * @param {string} [params.direction='DESC']
   * @returns {Promise<PagedResponse<FineResponseDto>>}
   */
  async getMemberFines(memberId, { page = 0, size = 10, sortBy = 'id', direction = 'DESC' } = {}) {
    const response = await api.get(`/fines/member/${memberId}`, {
      params: { page, size, sortBy, direction },
    })
    return response.data
  },

  /**
   * Get total unpaid fine amount and unsettled count for a member.
   * Roles: ADMIN, MEMBER
   *
   * @param {number|string} memberId
   * @returns {Promise<MemberUnpaidFineResponseDto>}
   */
  async getMemberUnpaidTotal(memberId) {
    const response = await api.get(`/fines/member/${memberId}/unpaid-total`)
    return response.data
  },

  /**
   * Marks a fine record as PAID. Roles: ADMIN, MEMBER
   *
   * @param {number|string} id - Fine ID
   * @param {Object} [paymentData] - { paymentMethod, transactionReference, notes }
   * @returns {Promise<FineResponseDto>}
   */
  async payFine(id, paymentData = {}) {
    const response = await api.patch(`/fines/${id}/pay`, paymentData)
    return response.data
  },

  /**
   * Get fine details by ID. Roles: ADMIN, MEMBER
   * @param {number|string} id
   * @returns {Promise<FineResponseDto>}
   */
  async getFineById(id) {
    const response = await api.get(`/fines/${id}`)
    return response.data
  },
}

export default fineService

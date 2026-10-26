import api from './api'

/**
 * Service for interacting with Spring Boot Member Management REST APIs.
 * Base URL: /api/members (Requires ADMIN role)
 */
const memberService = {
  /**
   * Retrieves all members with pagination and sorting.
   *
   * @param {Object} params
   * @param {number} [params.page=0]
   * @param {number} [params.size=10]
   * @param {string} [params.sortBy='id']
   * @param {string} [params.direction='ASC']
   * @returns {Promise<PagedResponse<MemberResponseDto>>}
   */
  async getAllMembers({ page = 0, size = 10, sortBy = 'id', direction = 'ASC' } = {}) {
    const response = await api.get('/members', {
      params: { page, size, sortBy, direction },
    })
    return response.data
  },

  /**
   * Searches members matching first name or last name keyword.
   *
   * @param {Object} params
   * @param {string} params.name
   * @param {number} [params.page=0]
   * @param {number} [params.size=10]
   * @param {string} [params.sortBy='id']
   * @param {string} [params.direction='ASC']
   * @returns {Promise<PagedResponse<MemberResponseDto>>}
   */
  async searchMembersByName({ name, page = 0, size = 10, sortBy = 'id', direction = 'ASC' } = {}) {
    const response = await api.get('/members/search', {
      params: { name: name.trim(), page, size, sortBy, direction },
    })
    return response.data
  },

  /**
   * Retrieves only active members with pagination.
   *
   * @param {Object} params
   * @param {number} [params.page=0]
   * @param {number} [params.size=10]
   * @param {string} [params.sortBy='id']
   * @param {string} [params.direction='ASC']
   * @returns {Promise<PagedResponse<MemberResponseDto>>}
   */
  async getActiveMembers({ page = 0, size = 10, sortBy = 'id', direction = 'ASC' } = {}) {
    const response = await api.get('/members/active', {
      params: { page, size, sortBy, direction },
    })
    return response.data
  },

  /**
   * Retrieves member details by ID.
   * @param {number|string} id - Member ID
   * @returns {Promise<MemberResponseDto>}
   */
  async getMemberById(id) {
    const response = await api.get(`/members/${id}`)
    return response.data
  },

  /**
   * Registers a new library member. Requires ADMIN role.
   * @param {Object} memberData - { firstName, lastName, email, phoneNumber, address, active }
   * @returns {Promise<MemberResponseDto>}
   */
  async registerMember(memberData) {
    const response = await api.post('/members', memberData)
    return response.data
  },

  /**
   * Updates an existing member's profile. Requires ADMIN role.
   * @param {number|string} id - Member ID
   * @param {Object} memberData - { firstName, lastName, email, phoneNumber, address, active }
   * @returns {Promise<MemberResponseDto>}
   */
  async updateMember(id, memberData) {
    const response = await api.put(`/members/${id}`, memberData)
    return response.data
  },

  /**
   * Deactivates a member's account. Requires ADMIN role.
   * @param {number|string} id - Member ID
   * @returns {Promise<MemberResponseDto>}
   */
  async deactivateMember(id) {
    const response = await api.patch(`/members/${id}/deactivate`)
    return response.data
  },
}

export default memberService

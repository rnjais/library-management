import api from './api'

/**
 * Authentication service handling API requests to Spring Boot AuthController.
 * Endpoints:
 *   POST /api/auth/login    -> Authenticates user and returns JWT + user profile
 *   POST /api/auth/register -> Registers a new user with default MEMBER role
 */
const authService = {
  /**
   * Logs in a user with email and password.
   * @param {Object} credentials - { email, password }
   * @returns {Promise<{ token: string, tokenType: string, user: Object }>}
   */
  async login(credentials) {
    const response = await api.post('/auth/login', credentials)
    // Backend wraps response in ApiResponse: { success: true, message: '...', data: { token, tokenType, user } }
    return response.data
  },

  /**
   * Registers a new user with name, email, and password.
   * @param {Object} userData - { name, email, password }
   * @returns {Promise<Object>} Safe UserResponseDto
   */
  async register(userData) {
    const response = await api.post('/auth/register', userData)
    return response.data
  },
}

export default authService

import axios from 'axios'
import { STORAGE_KEYS } from '../utils/constants'

// Base URL defaults to '/api' which is forwarded to http://localhost:8080 by Vite proxy
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// Request Interceptor: Attach JWT Bearer Token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Format errors and handle global auth expiration
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const response = error.response
    let message = 'An unexpected error occurred. Please try again.'

    if (response) {
      // Backend ErrorResponse schema
      if (response.data && response.data.message) {
        message = response.data.message
      } else if (response.status === 401) {
        message = 'Session expired or invalid credentials. Please log in again.'
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER)
      } else if (response.status === 403) {
        message = 'Access denied. You do not have permission for this action.'
      } else if (response.status === 404) {
        message = 'The requested resource was not found.'
      } else if (response.status === 409) {
        message = response.data?.message || 'A data conflict occurred.'
      }
    } else if (error.request) {
      message = 'Cannot connect to backend server. Please verify the API is running.'
    }

    const enhancedError = new Error(message)
    enhancedError.status = response?.status
    enhancedError.data = response?.data
    enhancedError.validationErrors = response?.data?.validationErrors || {}

    return Promise.reject(enhancedError)
  }
)

export default api

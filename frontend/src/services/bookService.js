import api from './api'

/**
 * Service for interacting with Spring Boot Book Catalog REST API.
 * Base URL: /api/books
 */
const bookService = {
  /**
   * Retrieves paginated and filtered catalog books.
   *
   * @param {Object} params
   * @param {number} [params.page=0] - 0-based page index
   * @param {number} [params.size=10] - Number of items per page
   * @param {string} [params.sortBy='id'] - Field name to sort by ('id', 'title', 'author', 'category')
   * @param {string} [params.direction='ASC'] - 'ASC' or 'DESC'
   * @param {string} [params.title] - Optional title search substring
   * @param {string} [params.category] - Optional category filter
   * @returns {Promise<import('../types').PagedResponse<Book>>} PagedResponse payload
   */
  async getBooks({ page = 0, size = 10, sortBy = 'id', direction = 'ASC', title, category } = {}) {
    const queryParams = {
      page,
      size,
      sortBy,
      direction,
    }

    if (title && title.trim()) {
      queryParams.title = title.trim()
    }
    if (category && category !== 'ALL') {
      queryParams.category = category.trim()
    }

    const response = await api.get('/books', { params: queryParams })
    return response.data // Unwraps ApiResponse.data (PagedResponse)
  },

  /**
   * Retrieves a single book by ID.
   * @param {number|string} id - Book ID
   * @returns {Promise<Book>} BookResponse payload
   */
  async getBookById(id) {
    const response = await api.get(`/books/${id}`)
    return response.data
  },

  /**
   * Adds a new book to the catalog. Requires ADMIN role.
   * @param {Object} bookData - { title, author, isbn, category, totalCopies, availableCopies }
   * @returns {Promise<Book>} BookResponse payload
   */
  async addBook(bookData) {
    const response = await api.post('/books', bookData)
    return response.data
  },

  /**
   * Updates an existing book. Requires ADMIN role.
   * @param {number|string} id - Book ID
   * @param {Object} bookData - Updated book payload
   * @returns {Promise<Book>} BookResponse payload
   */
  async updateBook(id, bookData) {
    const response = await api.put(`/books/${id}`, bookData)
    return response.data
  },

  /**
   * Deletes a book from the catalog. Requires ADMIN role.
   * @param {number|string} id - Book ID
   * @returns {Promise<void>}
   */
  async deleteBook(id) {
    const response = await api.delete(`/books/${id}`)
    return response
  },
}

export default bookService

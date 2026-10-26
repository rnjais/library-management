import api from './api'

/**
 * Service handling administrator dashboard analytics and KPIs.
 * Endpoint:
 *   GET /api/admin/dashboard/summary -> Retrieves library-wide metrics (books, copies, members, loans, fines)
 */
const dashboardService = {
  /**
   * Fetches high-level dashboard metrics. Requires ADMIN role.
   * @returns {Promise<import('../types').DashboardSummary>} DashboardSummaryDto payload
   */
  async getDashboardSummary() {
    const response = await api.get('/admin/dashboard/summary')
    // Backend wraps response in ApiResponse: { success: true, message: '...', data: DashboardSummaryDto }
    return response.data
  },
}

export default dashboardService

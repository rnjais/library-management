package com.library_management.controller;

import com.library_management.dto.response.ApiResponse;
import com.library_management.dto.response.DashboardSummaryDto;
import com.library_management.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller exposing high-level metrics for the administrator dashboard.
 * Base URL: /api/admin/dashboard
 * Protected exclusively for users with role ADMIN.
 */
@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin - Dashboard", description = "Endpoints for high-level administrative KPI metrics and dashboard cards")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /**
     * GET /api/admin/dashboard/summary
     * Retrieves high-level library analytics: book inventory, membership counts,
     * active/overdue loans, and fine revenues.
     *
     * @return 200 OK with DashboardSummaryDto wrapped in ApiResponse.
     */
    @GetMapping("/summary")
    @Operation(summary = "Get dashboard summary", description = "Retrieves high-level library KPIs: book inventory counts, active/inactive members, active/overdue borrowings, and fine revenues. Requires ADMIN role.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Dashboard summary retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied: requires ADMIN role")
    })
    public ResponseEntity<ApiResponse<DashboardSummaryDto>> getDashboardSummary() {
        DashboardSummaryDto summary = dashboardService.getDashboardSummary();
        return ResponseEntity.ok(ApiResponse.success("Dashboard summary retrieved successfully", summary));
    }
}

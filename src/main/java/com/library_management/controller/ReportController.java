package com.library_management.controller;

import com.library_management.dto.response.*;
import com.library_management.entity.BorrowingStatus;
import com.library_management.entity.FineStatus;
import com.library_management.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * REST Controller exposing administrative reports and filtered analytics.
 * Base URL: /api/admin/reports
 * Protected exclusively for users with role ADMIN.
 */
@RestController
@RequestMapping("/api/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin - Reports", description = "Endpoints for in-depth administrative reports across books, members, borrowings, and fines")
public class ReportController {

    private final DashboardService dashboardService;

    public ReportController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /**
     * GET /api/admin/reports/books
     * Retrieves book inventory statistics and category breakdowns.
     *
     * @return 200 OK with BookReportDto wrapped in ApiResponse.
     */
    @GetMapping("/books")
    @Operation(summary = "Get book inventory report", description = "Generates comprehensive book catalog analytics: total titles, total copies, available copies, borrowed copies, and category distribution. Requires ADMIN role.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Book inventory report retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied: requires ADMIN role")
    })
    public ResponseEntity<ApiResponse<BookReportDto>> getBookReport() {
        BookReportDto report = dashboardService.getBookReport();
        return ResponseEntity.ok(ApiResponse.success("Book inventory report retrieved successfully", report));
    }

    /**
     * GET /api/admin/reports/members
     * Retrieves member statistics and filtered member records with pagination.
     *
     * @param active Optional active status filter (true/false).
     * @param startDate Optional registration start date (YYYY-MM-DD).
     * @param endDate Optional registration end date (YYYY-MM-DD).
     * @param page Page index (0-based, default: 0).
     * @param size Page size (default: 10, max: 100).
     * @param sortBy Field to sort by (default: 'id').
     * @param direction Sort direction ('ASC' or 'DESC', default: 'DESC').
     * @return 200 OK with MemberReportDto wrapped in ApiResponse.
     */
    @GetMapping("/members")
    @Operation(summary = "Get member patronage report", description = "Generates filtered member registration and status analytics with pagination. Requires ADMIN role.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Member report retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied: requires ADMIN role")
    })
    public ResponseEntity<ApiResponse<MemberReportDto>> getMemberReport(
            @Parameter(description = "Optional filter by member active status") @RequestParam(value = "active", required = false) Boolean active,
            @Parameter(description = "Optional registration start date (YYYY-MM-DD)") @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "Optional registration end date (YYYY-MM-DD)") @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @Parameter(description = "Page number (0-based)") @RequestParam(value = "page", defaultValue = "0") int page,
            @Parameter(description = "Number of items per page (1-100)") @RequestParam(value = "size", defaultValue = "10") int size,
            @Parameter(description = "Property to sort by") @RequestParam(value = "sortBy", defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction (ASC or DESC)") @RequestParam(value = "direction", defaultValue = "DESC") String direction) {

        Pageable pageable = buildPageable(page, size, sortBy, direction);
        MemberReportDto report = dashboardService.getMemberReport(active, startDate, endDate, pageable);
        return ResponseEntity.ok(ApiResponse.success("Member patronage report retrieved successfully", report));
    }

    /**
     * GET /api/admin/reports/borrowings
     * Retrieves borrowing circulation statistics and filtered loan records with pagination.
     *
     * @param status Optional loan status (BORROWED, RETURNED, OVERDUE).
     * @param startDate Optional borrow start date (YYYY-MM-DD).
     * @param endDate Optional borrow end date (YYYY-MM-DD).
     * @param page Page index (0-based, default: 0).
     * @param size Page size (default: 10, max: 100).
     * @param sortBy Field to sort by (default: 'borrowDate').
     * @param direction Sort direction ('ASC' or 'DESC', default: 'DESC').
     * @return 200 OK with BorrowingReportDto wrapped in ApiResponse.
     */
    @GetMapping("/borrowings")
    @Operation(summary = "Get borrowing circulation report", description = "Generates circulation statistics filtered by status and date range with pagination. Requires ADMIN role.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Borrowing report retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied: requires ADMIN role")
    })
    public ResponseEntity<ApiResponse<BorrowingReportDto>> getBorrowingReport(
            @Parameter(description = "Optional filter by loan status (BORROWED, RETURNED, OVERDUE)") @RequestParam(value = "status", required = false) BorrowingStatus status,
            @Parameter(description = "Optional borrow start date (YYYY-MM-DD)") @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "Optional borrow end date (YYYY-MM-DD)") @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @Parameter(description = "Page number (0-based)") @RequestParam(value = "page", defaultValue = "0") int page,
            @Parameter(description = "Number of items per page (1-100)") @RequestParam(value = "size", defaultValue = "10") int size,
            @Parameter(description = "Property to sort by") @RequestParam(value = "sortBy", defaultValue = "borrowDate") String sortBy,
            @Parameter(description = "Sort direction (ASC or DESC)") @RequestParam(value = "direction", defaultValue = "DESC") String direction) {

        Pageable pageable = buildPageable(page, size, sortBy, direction);
        BorrowingReportDto report = dashboardService.getBorrowingReport(status, startDate, endDate, pageable);
        return ResponseEntity.ok(ApiResponse.success("Borrowing circulation report retrieved successfully", report));
    }

    /**
     * GET /api/admin/reports/overdue
     * Retrieves currently overdue unreturned borrowing records with pagination.
     *
     * @param page Page index (0-based, default: 0).
     * @param size Page size (default: 10, max: 100).
     * @param sortBy Field to sort by (default: 'dueDate').
     * @param direction Sort direction ('ASC' or 'DESC', default: 'ASC').
     * @return 200 OK with PagedResponse of BorrowingResponseDto wrapped in ApiResponse.
     */
    @GetMapping("/overdue")
    @Operation(summary = "Get overdue loans report", description = "Generates report of currently overdue borrowings with pagination. Requires ADMIN role.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Overdue report retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied: requires ADMIN role")
    })
    public ResponseEntity<ApiResponse<PagedResponse<BorrowingResponseDto>>> getOverdueReport(
            @Parameter(description = "Page number (0-based)") @RequestParam(value = "page", defaultValue = "0") int page,
            @Parameter(description = "Number of items per page (1-100)") @RequestParam(value = "size", defaultValue = "10") int size,
            @Parameter(description = "Property to sort by") @RequestParam(value = "sortBy", defaultValue = "dueDate") String sortBy,
            @Parameter(description = "Sort direction (ASC or DESC)") @RequestParam(value = "direction", defaultValue = "ASC") String direction) {

        Pageable pageable = buildPageable(page, size, sortBy, direction);
        PagedResponse<BorrowingResponseDto> report = dashboardService.getOverdueReport(pageable);
        return ResponseEntity.ok(ApiResponse.success("Overdue borrowings report retrieved successfully", report));
    }

    /**
     * GET /api/admin/reports/fines
     * Retrieves fine totals, payment revenue statistics, and filtered fine records with pagination.
     *
     * @param status Optional fine status (PAID or UNPAID).
     * @param startDate Optional calculation start date (YYYY-MM-DD).
     * @param endDate Optional calculation end date (YYYY-MM-DD).
     * @param page Page index (0-based, default: 0).
     * @param size Page size (default: 10, max: 100).
     * @param sortBy Field to sort by (default: 'calculatedAt').
     * @param direction Sort direction ('ASC' or 'DESC', default: 'DESC').
     * @return 200 OK with FineReportDto wrapped in ApiResponse.
     */
    @GetMapping("/fines")
    @Operation(summary = "Get fine financial report", description = "Generates fine assessment and revenue metrics filtered by status and date range. Requires ADMIN role.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Fine report retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied: requires ADMIN role")
    })
    public ResponseEntity<ApiResponse<FineReportDto>> getFineReport(
            @Parameter(description = "Optional filter by fine status (PAID or UNPAID)") @RequestParam(value = "status", required = false) FineStatus status,
            @Parameter(description = "Optional calculation start date (YYYY-MM-DD)") @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "Optional calculation end date (YYYY-MM-DD)") @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @Parameter(description = "Page number (0-based)") @RequestParam(value = "page", defaultValue = "0") int page,
            @Parameter(description = "Number of items per page (1-100)") @RequestParam(value = "size", defaultValue = "10") int size,
            @Parameter(description = "Property to sort by") @RequestParam(value = "sortBy", defaultValue = "calculatedAt") String sortBy,
            @Parameter(description = "Sort direction (ASC or DESC)") @RequestParam(value = "direction", defaultValue = "DESC") String direction) {

        Pageable pageable = buildPageable(page, size, sortBy, direction);
        FineReportDto report = dashboardService.getFineReport(status, startDate, endDate, pageable);
        return ResponseEntity.ok(ApiResponse.success("Fine financial report retrieved successfully", report));
    }

    /**
     * Helper method to validate pagination parameters and construct a Pageable instance.
     */
    private Pageable buildPageable(int page, int size, String sortBy, String direction) {
        if (page < 0) {
            throw new IllegalArgumentException("Page index cannot be negative");
        }
        if (size <= 0 || size > 100) {
            throw new IllegalArgumentException("Page size must be between 1 and 100");
        }
        Sort.Direction sortDirection = direction != null && direction.equalsIgnoreCase("ASC")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        return PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
    }
}

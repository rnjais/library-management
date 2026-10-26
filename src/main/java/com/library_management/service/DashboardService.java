package com.library_management.service;

import com.library_management.dto.response.*;
import com.library_management.entity.BorrowingStatus;
import com.library_management.entity.FineStatus;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

/**
 * Service interface for administrator dashboard analytics and reporting operations.
 */
public interface DashboardService {

    /**
     * Retrieves aggregated high-level statistics across books, members, borrowings, and fines.
     *
     * @return DashboardSummaryDto containing system metrics.
     */
    DashboardSummaryDto getDashboardSummary();

    /**
     * Generates a book inventory report with copy totals and genre breakdowns.
     *
     * @return BookReportDto containing catalog analytics.
     */
    BookReportDto getBookReport();

    /**
     * Generates a member report filtered by optional active status and registration date range.
     *
     * @param active Optional active status filter.
     * @param startDate Optional registration start date.
     * @param endDate Optional registration end date.
     * @param pageable Pagination and sorting criteria.
     * @return MemberReportDto with counts and paginated member list.
     */
    MemberReportDto getMemberReport(Boolean active, LocalDate startDate, LocalDate endDate, Pageable pageable);

    /**
     * Generates a borrowing circulation report filtered by optional status and date range.
     *
     * @param status Optional loan status (BORROWED, RETURNED, OVERDUE).
     * @param startDate Optional borrow start date.
     * @param endDate Optional borrow end date.
     * @param pageable Pagination and sorting criteria.
     * @return BorrowingReportDto with circulation counts and paginated loan records.
     */
    BorrowingReportDto getBorrowingReport(BorrowingStatus status, LocalDate startDate, LocalDate endDate, Pageable pageable);

    /**
     * Generates an overdue borrowing report listing all currently unreturned overdue loans.
     *
     * @param pageable Pagination and sorting criteria.
     * @return PagedResponse containing overdue loan records.
     */
    PagedResponse<BorrowingResponseDto> getOverdueReport(Pageable pageable);

    /**
     * Generates a fine financial report filtered by optional status and date range.
     *
     * @param status Optional fine status (PAID or UNPAID).
     * @param startDate Optional calculation start date.
     * @param endDate Optional calculation end date.
     * @param pageable Pagination and sorting criteria.
     * @return FineReportDto with revenue metrics and paginated fine records.
     */
    FineReportDto getFineReport(FineStatus status, LocalDate startDate, LocalDate endDate, Pageable pageable);
}

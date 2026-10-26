package com.library_management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Data Transfer Object representing aggregate high-level metrics
 * for the library administrator dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryDto {

    // ========================
    // Book Catalog Metrics
    // ========================
    private long totalBooks;
    private long totalBookCopies;
    private long availableBookCopies;
    private long borrowedBookCopies;

    // ========================
    // Member Patron Metrics
    // ========================
    private long totalMembers;
    private long activeMembers;
    private long inactiveMembers;

    // ========================
    // Loan / Borrowing Metrics
    // ========================
    private long currentlyBorrowedBooks;
    private long overdueBorrowings;

    // ========================
    // Fine Financial Metrics
    // ========================
    private BigDecimal totalUnpaidFines;
    private long unpaidFineCount;
    private BigDecimal totalPaidFines;
    private long paidFineCount;
}

package com.library_management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object representing borrowing circulation statistics and filtered borrowing list.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BorrowingReportDto {

    private long totalBorrowings;
    private long currentlyBorrowed;
    private long returnedBorrowings;
    private long overdueBorrowings;
    private PagedResponse<BorrowingResponseDto> borrowings;
}

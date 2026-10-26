package com.library_management.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Data Transfer Object for requesting a book checkout/borrowing.
 * Contains identifiers and loan period constraints.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BorrowingRequestDto {

    @NotNull(message = "Book ID is required")
    private Long bookId;

    @NotNull(message = "Member ID is required")
    private Long memberId;

    /**
     * Optional explicit due date (must be in the future).
     * If omitted, the loan period will default based on 'borrowDays' or standard 14 days.
     */
    @Future(message = "Due date must be a future date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dueDate;

    /**
     * Optional borrowing duration in days (default: 14 days).
     */
    @Min(value = 1, message = "Borrow period must be at least 1 day")
    @Max(value = 90, message = "Borrow period cannot exceed 90 days")
    private Integer borrowDays;
}

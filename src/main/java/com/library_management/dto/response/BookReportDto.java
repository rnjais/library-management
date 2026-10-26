package com.library_management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Data Transfer Object representing book inventory analytics and category breakdowns.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookReportDto {

    private long totalBooks;
    private long totalCopies;
    private long availableCopies;
    private long borrowedCopies;
    private List<CategoryStatDto> categoryBreakdown;

    /**
     * Nested statistics for a specific book genre/category.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryStatDto {
        private String category;
        private long bookCount;
        private long totalCopies;
        private long availableCopies;
        private long borrowedCopies;
    }
}

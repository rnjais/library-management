package com.library_management.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.library_management.entity.Borrowing;
import com.library_management.entity.BorrowingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Data Transfer Object representing borrowing details returned by API endpoints.
 * Provides clean summaries of the book and member without exposing internal JPA entities.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BorrowingResponseDto {

    private Long id;
    private BookSummaryDto book;
    private MemberSummaryDto member;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate borrowDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dueDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate returnDate;

    private BorrowingStatus status;

    private Boolean overdue;

    /**
     * Nested DTO providing essential book summary details.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookSummaryDto {
        private Long id;
        private String title;
        private String author;
        private String isbn;
    }

    /**
     * Nested DTO providing essential member summary details.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemberSummaryDto {
        private Long id;
        private String fullName;
        private String email;
    }

    /**
     * Factory mapping method to transform a JPA Borrowing entity into a clean BorrowingResponseDto.
     *
     * @param borrowing The persisted JPA entity.
     * @return The formatted BorrowingResponseDto.
     */
    public static BorrowingResponseDto fromEntity(Borrowing borrowing) {
        if (borrowing == null) {
            return null;
        }

        BookSummaryDto bookSummary = null;
        if (borrowing.getBook() != null) {
            bookSummary = BookSummaryDto.builder()
                    .id(borrowing.getBook().getId())
                    .title(borrowing.getBook().getTitle())
                    .author(borrowing.getBook().getAuthor())
                    .isbn(borrowing.getBook().getIsbn())
                    .build();
        }

        MemberSummaryDto memberSummary = null;
        if (borrowing.getMember() != null) {
            memberSummary = MemberSummaryDto.builder()
                    .id(borrowing.getMember().getId())
                    .fullName(borrowing.getMember().getFullName())
                    .email(borrowing.getMember().getEmail())
                    .build();
        }

        return BorrowingResponseDto.builder()
                .id(borrowing.getId())
                .book(bookSummary)
                .member(memberSummary)
                .borrowDate(borrowing.getBorrowDate())
                .dueDate(borrowing.getDueDate())
                .returnDate(borrowing.getReturnDate())
                .status(borrowing.getStatus())
                .overdue(borrowing.isOverdue())
                .build();
    }
}

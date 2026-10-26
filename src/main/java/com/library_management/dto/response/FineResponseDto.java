package com.library_management.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.library_management.entity.Fine;
import com.library_management.entity.FineStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Data Transfer Object representing fine details returned by API endpoints.
 * Decouples database entities from API responses and provides structured summaries.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FineResponseDto {

    private Long id;
    private Long borrowingId;
    private BookSummaryDto book;
    private MemberSummaryDto member;
    private BigDecimal amount;
    private Integer overdueDays;
    private FineStatus status;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime calculatedAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime paidAt;

    /**
     * Nested book summary details for fine receipt reporting.
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
     * Nested member summary details for fine receipt reporting.
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
     * Factory mapping method to safely convert a JPA Fine entity into a clean FineResponseDto.
     *
     * @param fine The persisted Fine entity.
     * @return Formatted FineResponseDto.
     */
    public static FineResponseDto fromEntity(Fine fine) {
        if (fine == null) {
            return null;
        }

        Long borrowingId = null;
        BookSummaryDto bookSummary = null;
        MemberSummaryDto memberSummary = null;

        if (fine.getBorrowing() != null) {
            borrowingId = fine.getBorrowing().getId();

            if (fine.getBorrowing().getBook() != null) {
                bookSummary = BookSummaryDto.builder()
                        .id(fine.getBorrowing().getBook().getId())
                        .title(fine.getBorrowing().getBook().getTitle())
                        .author(fine.getBorrowing().getBook().getAuthor())
                        .isbn(fine.getBorrowing().getBook().getIsbn())
                        .build();
            }

            if (fine.getBorrowing().getMember() != null) {
                memberSummary = MemberSummaryDto.builder()
                        .id(fine.getBorrowing().getMember().getId())
                        .fullName(fine.getBorrowing().getMember().getFullName())
                        .email(fine.getBorrowing().getMember().getEmail())
                        .build();
            }
        }

        return FineResponseDto.builder()
                .id(fine.getId())
                .borrowingId(borrowingId)
                .book(bookSummary)
                .member(memberSummary)
                .amount(fine.getAmount())
                .overdueDays(fine.getOverdueDays())
                .status(fine.getStatus())
                .calculatedAt(fine.getCalculatedAt())
                .paidAt(fine.getPaidAt())
                .build();
    }
}

package com.library_management.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Set;
import java.util.stream.Collectors;

/**
 * Shared utility for validating pagination and sorting query parameters across REST controllers.
 * Enforces entity-specific sortBy allow-lists and valid ASC/DESC sort directions to prevent HTTP 500 errors.
 */
public final class PaginationUtils {

    public static final int MAX_PAGE_SIZE = 100;

    public static final Set<String> BOOK_SORT_FIELDS = Set.of(
            "id", "title", "author", "isbn", "category", "totalCopies", "availableCopies"
    );

    public static final Set<String> MEMBER_SORT_FIELDS = Set.of(
            "id", "firstName", "lastName", "email", "phoneNumber", "membershipDate", "active"
    );

    public static final Set<String> BORROWING_SORT_FIELDS = Set.of(
            "id", "borrowDate", "dueDate", "returnDate", "status"
    );

    public static final Set<String> FINE_SORT_FIELDS = Set.of(
            "id", "amount", "overdueDays", "status", "calculatedAt", "paidAt"
    );

    private PaginationUtils() {
    }

    /**
     * Validates pagination parameters, sortBy allow-list, and sort direction, returning a safe Pageable.
     */
    public static Pageable buildPageable(
            int page,
            int size,
            String sortBy,
            String direction,
            Set<String> allowedSortFields,
            Sort.Direction defaultDirection) {

        if (page < 0) {
            throw new IllegalArgumentException("Page index cannot be negative");
        }
        if (size <= 0 || size > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("Page size must be between 1 and " + MAX_PAGE_SIZE);
        }

        String cleanSortBy = sortBy != null ? sortBy.trim() : "";
        if (cleanSortBy.isEmpty() || !allowedSortFields.contains(cleanSortBy)) {
            String allowed = allowedSortFields.stream().sorted().collect(Collectors.joining(", "));
            throw new IllegalArgumentException(
                    String.format("Invalid sortBy field '%s'. Allowed fields: %s", sortBy, allowed)
            );
        }

        Sort.Direction sortDirection;
        if (direction == null || direction.isBlank()) {
            sortDirection = defaultDirection;
        } else if ("ASC".equalsIgnoreCase(direction.trim())) {
            sortDirection = Sort.Direction.ASC;
        } else if ("DESC".equalsIgnoreCase(direction.trim())) {
            sortDirection = Sort.Direction.DESC;
        } else {
            throw new IllegalArgumentException(
                    String.format("Invalid sort direction '%s'. Allowed values: ASC, DESC", direction)
            );
        }

        return PageRequest.of(page, size, Sort.by(sortDirection, cleanSortBy));
    }
}

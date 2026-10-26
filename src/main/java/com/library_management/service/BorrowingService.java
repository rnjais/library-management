package com.library_management.service;

import com.library_management.dto.request.BorrowingRequestDto;
import com.library_management.dto.response.BorrowingResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service interface defining book borrowing and returning operations.
 */
public interface BorrowingService {

    /**
     * Issues/borrows a book to a member.
     * Decrements the available copy count of the book and creates a Borrowing record.
     *
     * @param request Validated borrow request payload.
     * @return Formatted BorrowingResponseDto.
     */
    BorrowingResponseDto borrowBook(BorrowingRequestDto request);

    /**
     * Processes the return of a borrowed book.
     * Increments the available copy count of the book and updates the borrowing status to RETURNED.
     *
     * @param borrowingId The ID of the borrowing record.
     * @return Formatted BorrowingResponseDto.
     */
    BorrowingResponseDto returnBook(Long borrowingId);

    /**
     * Retrieves a borrowing record by ID.
     *
     * @param id The ID of the borrowing record.
     * @return Formatted BorrowingResponseDto.
     */
    BorrowingResponseDto getBorrowingById(Long id);

    /**
     * Retrieves all borrowing records with pagination and sorting.
     *
     * @param pageable Pagination and sorting criteria.
     * @return A page of BorrowingResponseDto.
     */
    Page<BorrowingResponseDto> getAllBorrowings(Pageable pageable);

    /**
     * Retrieves all borrowing records for a specific member with pagination.
     *
     * @param memberId The ID of the member.
     * @param pageable Pagination and sorting criteria.
     * @return A page of BorrowingResponseDto.
     */
    Page<BorrowingResponseDto> getBorrowingsByMemberId(Long memberId, Pageable pageable);

    /**
     * Retrieves the borrowing history for a specific book with pagination.
     *
     * @param bookId The ID of the book.
     * @param pageable Pagination and sorting criteria.
     * @return A page of BorrowingResponseDto.
     */
    Page<BorrowingResponseDto> getBorrowingsByBookId(Long bookId, Pageable pageable);

    /**
     * Retrieves all currently overdue borrowings with pagination.
     *
     * @param pageable Pagination and sorting criteria.
     * @return A page of overdue BorrowingResponseDto.
     */
    Page<BorrowingResponseDto> getOverdueBorrowings(Pageable pageable);
}

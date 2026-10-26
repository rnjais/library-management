package com.library_management.service;

import com.library_management.dto.request.FinePaymentRequestDto;
import com.library_management.dto.response.FineResponseDto;
import com.library_management.dto.response.MemberUnpaidFineResponseDto;
import com.library_management.entity.Borrowing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service interface defining fine management and calculation operations.
 */
public interface FineService {

    /**
     * Calculates and creates a Fine record for a returned borrowing if it is overdue.
     * Returns null if the book was returned on or before its due date.
     *
     * @param borrowing The returned Borrowing record.
     * @return Formatted FineResponseDto if fine was created, or null.
     */
    FineResponseDto calculateFineForReturn(Borrowing borrowing);

    /**
     * Marks an unpaid fine as PAID.
     *
     * @param fineId The ID of the fine to mark as paid.
     * @param paymentRequest Optional payment details.
     * @return Formatted FineResponseDto with status PAID.
     */
    FineResponseDto payFine(Long fineId, FinePaymentRequestDto paymentRequest);

    /**
     * Retrieves fine details by ID.
     *
     * @param id The ID of the fine.
     * @return Formatted FineResponseDto.
     */
    FineResponseDto getFineById(Long id);

    /**
     * Retrieves fine details for a specific borrowing transaction.
     *
     * @param borrowingId The ID of the borrowing transaction.
     * @return Formatted FineResponseDto.
     */
    FineResponseDto getFineByBorrowingId(Long borrowingId);

    /**
     * Retrieves all fines with pagination.
     *
     * @param pageable Pagination and sorting criteria.
     * @return A page of FineResponseDto.
     */
    Page<FineResponseDto> getAllFines(Pageable pageable);

    /**
     * Retrieves all fines incurred by a specific member with pagination.
     *
     * @param memberId The ID of the member.
     * @param pageable Pagination and sorting criteria.
     * @return A page of FineResponseDto.
     */
    Page<FineResponseDto> getFinesByMemberId(Long memberId, Pageable pageable);

    /**
     * Retrieves all unpaid fines with pagination.
     *
     * @param pageable Pagination and sorting criteria.
     * @return A page of unpaid FineResponseDto.
     */
    Page<FineResponseDto> getUnpaidFines(Pageable pageable);

    /**
     * Computes the total unpaid fine amount and count for a specific member.
     *
     * @param memberId The ID of the member.
     * @return MemberUnpaidFineResponseDto containing summary data.
     */
    MemberUnpaidFineResponseDto getMemberUnpaidFineTotal(Long memberId);
}

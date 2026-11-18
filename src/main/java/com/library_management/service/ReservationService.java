package com.library_management.service;

import com.library_management.dto.request.ReservationRequestDto;
import com.library_management.dto.response.ReservationResponseDto;
import com.library_management.entity.ReservationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReservationService {

    /**
     * Places a new book reservation / waitlist request.
     * Roles: ADMIN, MEMBER
     */
    ReservationResponseDto createReservation(ReservationRequestDto request);

    /**
     * Cancels an active reservation (PENDING or READY_FOR_PICKUP).
     * If the reservation was READY_FOR_PICKUP, reallocates the copy to the next patron in queue.
     * Roles: ADMIN, MEMBER
     */
    ReservationResponseDto cancelReservation(Long reservationId);

    /**
     * Retrieves details of a specific reservation.
     * Roles: ADMIN, MEMBER (with ownership check)
     */
    ReservationResponseDto getReservationById(Long reservationId);

    /**
     * Retrieves reservations for the current authenticated member.
     * Roles: MEMBER, ADMIN
     */
    Page<ReservationResponseDto> getMyReservations(Pageable pageable);

    /**
     * Retrieves all reservations (with optional status filter).
     * Roles: ADMIN
     */
    Page<ReservationResponseDto> getAllReservations(ReservationStatus status, Pageable pageable);

    /**
     * Retrieves the waitlist queue for a specific book.
     * Roles: ADMIN, MEMBER
     */
    Page<ReservationResponseDto> getBookWaitlist(Long bookId, Pageable pageable);
}

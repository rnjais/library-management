package com.library_management.controller;

import com.library_management.dto.request.ReservationRequestDto;
import com.library_management.dto.response.ApiResponse;
import com.library_management.dto.response.PagedResponse;
import com.library_management.dto.response.ReservationResponseDto;
import com.library_management.entity.ReservationStatus;
import com.library_management.service.ReservationService;
import com.library_management.util.PaginationUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller exposing endpoints for Book Reservations and Waitlist management.
 * Base URL: /api/reservations
 */
@RestController
@RequestMapping("/api/reservations")
@Tag(name = "Reservations", description = "Endpoints for placing, tracking, and managing book reservations and waitlist queues")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    /**
     * POST /api/reservations
     * Places a new book reservation or waitlist request.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('MEMBER', 'ADMIN')")
    @Operation(summary = "Place a book reservation", description = "Adds a member to the waitlist for a book when all copies are checked out or reserved. Roles: MEMBER, ADMIN.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Reservation created successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error or book has shelf copies available"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Book or Member not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Duplicate reservation or book already checked out by member")
    })
    public ResponseEntity<ApiResponse<ReservationResponseDto>> createReservation(
            @Valid @RequestBody ReservationRequestDto request) {
        ReservationResponseDto response = reservationService.createReservation(request);
        return new ResponseEntity<>(
                ApiResponse.success("Book reserved successfully. You have been added to the waitlist.", response),
                HttpStatus.CREATED
        );
    }

    /**
     * PATCH /api/reservations/{id}/cancel
     * Cancels an active reservation and promotes the next patron in line if holding a copy.
     */
    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('MEMBER', 'ADMIN')")
    @Operation(summary = "Cancel a reservation", description = "Cancels a pending or ready reservation. If ready for pickup, reallocates copy to next waitlisted member. Roles: MEMBER, ADMIN.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Reservation cancelled successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Reservation already completed or cancelled"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Reservation not found")
    })
    public ResponseEntity<ApiResponse<ReservationResponseDto>> cancelReservation(
            @Parameter(description = "Unique ID of the reservation") @PathVariable("id") Long id) {
        ReservationResponseDto response = reservationService.cancelReservation(id);
        return ResponseEntity.ok(ApiResponse.success("Reservation cancelled successfully", response));
    }

    /**
     * GET /api/reservations/{id}
     * Retrieves details and current queue position of a specific reservation.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MEMBER', 'ADMIN')")
    @Operation(summary = "Get reservation details", description = "Retrieves reservation metadata and waitlist position. Roles: MEMBER (own), ADMIN.")
    public ResponseEntity<ApiResponse<ReservationResponseDto>> getReservationById(
            @Parameter(description = "Unique ID of the reservation") @PathVariable("id") Long id) {
        ReservationResponseDto response = reservationService.getReservationById(id);
        return ResponseEntity.ok(ApiResponse.success("Reservation retrieved successfully", response));
    }

    /**
     * GET /api/reservations/my
     * Retrieves reservations placed by the authenticated patron.
     */
    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('MEMBER', 'ADMIN')")
    @Operation(summary = "Get my reservations", description = "Retrieves paginated list of reservations for the logged-in member. Roles: MEMBER, ADMIN.")
    public ResponseEntity<ApiResponse<PagedResponse<ReservationResponseDto>>> getMyReservations(
            @Parameter(description = "Page number (0-based)") @RequestParam(value = "page", defaultValue = "0") int page,
            @Parameter(description = "Number of items per page") @RequestParam(value = "size", defaultValue = "10") int size,
            @Parameter(description = "Property to sort by") @RequestParam(value = "sortBy", defaultValue = "reservationDate") String sortBy,
            @Parameter(description = "Sort direction (ASC or DESC)") @RequestParam(value = "direction", defaultValue = "DESC") String direction) {

        Pageable pageable = buildPageable(page, size, sortBy, direction);
        Page<ReservationResponseDto> reservationsPage = reservationService.getMyReservations(pageable);
        return ResponseEntity.ok(
                ApiResponse.success("Your reservations retrieved successfully", PagedResponse.fromPage(reservationsPage))
        );
    }

    /**
     * GET /api/reservations
     * Retrieves all reservations across the library system with optional status filter.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all reservations", description = "Admin endpoint to view and filter all waitlist and reservation entries. Requires ADMIN role.")
    public ResponseEntity<ApiResponse<PagedResponse<ReservationResponseDto>>> getAllReservations(
            @Parameter(description = "Optional filter by status") @RequestParam(value = "status", required = false) ReservationStatus status,
            @Parameter(description = "Page number (0-based)") @RequestParam(value = "page", defaultValue = "0") int page,
            @Parameter(description = "Number of items per page") @RequestParam(value = "size", defaultValue = "10") int size,
            @Parameter(description = "Property to sort by") @RequestParam(value = "sortBy", defaultValue = "reservationDate") String sortBy,
            @Parameter(description = "Sort direction (ASC or DESC)") @RequestParam(value = "direction", defaultValue = "DESC") String direction) {

        Pageable pageable = buildPageable(page, size, sortBy, direction);
        Page<ReservationResponseDto> reservationsPage = reservationService.getAllReservations(status, pageable);
        return ResponseEntity.ok(
                ApiResponse.success("Reservations retrieved successfully", PagedResponse.fromPage(reservationsPage))
        );
    }

    /**
     * GET /api/reservations/book/{bookId}
     * Retrieves the waitlist queue for a specific book.
     */
    @GetMapping("/book/{bookId}")
    @PreAuthorize("hasAnyRole('MEMBER', 'ADMIN')")
    @Operation(summary = "Get book waitlist", description = "Retrieves the waitlist queue for a specific book ordered chronologically. Roles: MEMBER, ADMIN.")
    public ResponseEntity<ApiResponse<PagedResponse<ReservationResponseDto>>> getBookWaitlist(
            @Parameter(description = "Unique ID of the book") @PathVariable("bookId") Long bookId,
            @Parameter(description = "Page number (0-based)") @RequestParam(value = "page", defaultValue = "0") int page,
            @Parameter(description = "Number of items per page") @RequestParam(value = "size", defaultValue = "10") int size,
            @Parameter(description = "Property to sort by") @RequestParam(value = "sortBy", defaultValue = "reservationDate") String sortBy,
            @Parameter(description = "Sort direction (ASC or DESC)") @RequestParam(value = "direction", defaultValue = "ASC") String direction) {

        Pageable pageable = buildPageable(page, size, sortBy, direction);
        Page<ReservationResponseDto> waitlistPage = reservationService.getBookWaitlist(bookId, pageable);
        return ResponseEntity.ok(
                ApiResponse.success("Book waitlist retrieved successfully", PagedResponse.fromPage(waitlistPage))
        );
    }

    private Pageable buildPageable(int page, int size, String sortBy, String direction) {
        return PaginationUtils.buildPageable(
                page, size, sortBy, direction, PaginationUtils.RESERVATION_SORT_FIELDS, Sort.Direction.DESC
        );
    }
}

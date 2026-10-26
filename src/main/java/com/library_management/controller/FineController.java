package com.library_management.controller;

import com.library_management.dto.request.FinePaymentRequestDto;
import com.library_management.dto.response.ApiResponse;
import com.library_management.dto.response.FineResponseDto;
import com.library_management.dto.response.MemberUnpaidFineResponseDto;
import com.library_management.dto.response.PagedResponse;
import com.library_management.service.FineService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller exposing endpoints for Library Fine Management.
 * Base URL: /api/fines
 */
@RestController
@RequestMapping("/api/fines")
@Tag(name = "Fines", description = "Endpoints for library overdue fine assessment, retrieval, and payment processing")
public class FineController {

    private final FineService fineService;

    // Constructor Injection
    public FineController(FineService fineService) {
        this.fineService = fineService;
    }

    /**
     * GET /api/fines/{id}
     * Retrieves fine details by fine ID.
     *
     * @param id The ID of the fine record.
     * @return 200 OK with FineResponseDto wrapped in ApiResponse.
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get fine by ID", description = "Retrieves detailed fine records by fine ID. Roles: ADMIN, MEMBER.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Fine record retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Fine not found with specified ID")
    })
    public ResponseEntity<ApiResponse<FineResponseDto>> getFineById(
            @Parameter(description = "Unique ID of the fine record") @PathVariable("id") Long id) {
        FineResponseDto response = fineService.getFineById(id);
        return ResponseEntity.ok(ApiResponse.success("Fine details retrieved successfully", response));
    }

    /**
     * GET /api/fines
     * Retrieves all fines with pagination and sorting.
     *
     * @param page Page index (0-based, default: 0).
     * @param size Page size (default: 10).
     * @param sortBy Field to sort by (default: 'id').
     * @param direction Sort order ('ASC' or 'DESC', default: 'DESC').
     * @return 200 OK with PagedResponse wrapped in ApiResponse.
     */
    @GetMapping
    @Operation(summary = "Get all fines", description = "Retrieves all fine records with pagination. Requires ADMIN role.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Fines retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid pagination or sorting parameters")
    })
    public ResponseEntity<ApiResponse<PagedResponse<FineResponseDto>>> getAllFines(
            @Parameter(description = "Page number (0-based)") @RequestParam(value = "page", defaultValue = "0") int page,
            @Parameter(description = "Number of items per page (1-100)") @RequestParam(value = "size", defaultValue = "10") int size,
            @Parameter(description = "Property to sort by") @RequestParam(value = "sortBy", defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction (ASC or DESC)") @RequestParam(value = "direction", defaultValue = "DESC") String direction) {

        Pageable pageable = buildPageable(page, size, sortBy, direction);
        Page<FineResponseDto> finesPage = fineService.getAllFines(pageable);
        return ResponseEntity.ok(
                ApiResponse.success("Fines retrieved successfully", PagedResponse.fromPage(finesPage))
        );
    }

    /**
     * GET /api/fines/unpaid
     * Retrieves all currently unpaid fines with pagination.
     *
     * @param page Page index (0-based, default: 0).
     * @param size Page size (default: 10).
     * @param sortBy Field to sort by (default: 'id').
     * @param direction Sort order ('ASC' or 'DESC', default: 'DESC').
     * @return 200 OK with PagedResponse wrapped in ApiResponse.
     */
    @GetMapping("/unpaid")
    @Operation(summary = "Get unpaid fines", description = "Retrieves all fines currently in UNPAID status. Requires ADMIN role.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Unpaid fines retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid pagination or sorting parameters")
    })
    public ResponseEntity<ApiResponse<PagedResponse<FineResponseDto>>> getUnpaidFines(
            @Parameter(description = "Page number (0-based)") @RequestParam(value = "page", defaultValue = "0") int page,
            @Parameter(description = "Number of items per page (1-100)") @RequestParam(value = "size", defaultValue = "10") int size,
            @Parameter(description = "Property to sort by") @RequestParam(value = "sortBy", defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction (ASC or DESC)") @RequestParam(value = "direction", defaultValue = "DESC") String direction) {

        Pageable pageable = buildPageable(page, size, sortBy, direction);
        Page<FineResponseDto> finesPage = fineService.getUnpaidFines(pageable);
        return ResponseEntity.ok(
                ApiResponse.success("Unpaid fines retrieved successfully", PagedResponse.fromPage(finesPage))
        );
    }

    /**
     * GET /api/fines/member/{memberId}
     * Retrieves all fines for a specific member with pagination.
     *
     * @param memberId The ID of the member.
     * @param page Page index (0-based, default: 0).
     * @param size Page size (default: 10).
     * @param sortBy Field to sort by (default: 'id').
     * @param direction Sort order ('ASC' or 'DESC', default: 'DESC').
     * @return 200 OK with PagedResponse wrapped in ApiResponse.
     */
    @GetMapping("/member/{memberId}")
    @Operation(summary = "Get fines by member", description = "Retrieves paginated fines for a specific member. Roles: ADMIN, MEMBER.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Member fines retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Member not found with specified ID")
    })
    public ResponseEntity<ApiResponse<PagedResponse<FineResponseDto>>> getFinesByMember(
            @Parameter(description = "Unique ID of the member") @PathVariable("memberId") Long memberId,
            @Parameter(description = "Page number (0-based)") @RequestParam(value = "page", defaultValue = "0") int page,
            @Parameter(description = "Number of items per page (1-100)") @RequestParam(value = "size", defaultValue = "10") int size,
            @Parameter(description = "Property to sort by") @RequestParam(value = "sortBy", defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction (ASC or DESC)") @RequestParam(value = "direction", defaultValue = "DESC") String direction) {

        Pageable pageable = buildPageable(page, size, sortBy, direction);
        Page<FineResponseDto> finesPage = fineService.getFinesByMemberId(memberId, pageable);
        return ResponseEntity.ok(
                ApiResponse.success("Member fines retrieved successfully", PagedResponse.fromPage(finesPage))
        );
    }

    /**
     * GET /api/fines/member/{memberId}/unpaid-total
     * Retrieves the total unpaid fine amount and count for a specific member.
     *
     * @param memberId The ID of the member.
     * @return 200 OK with MemberUnpaidFineResponseDto wrapped in ApiResponse.
     */
    @GetMapping("/member/{memberId}/unpaid-total")
    @Operation(summary = "Get member unpaid fine total", description = "Calculates total unpaid fines and count for a member. Roles: ADMIN, MEMBER.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Unpaid fine summary calculated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Member not found with specified ID")
    })
    public ResponseEntity<ApiResponse<MemberUnpaidFineResponseDto>> getMemberUnpaidFineTotal(
            @Parameter(description = "Unique ID of the member") @PathVariable("memberId") Long memberId) {
        MemberUnpaidFineResponseDto response = fineService.getMemberUnpaidFineTotal(memberId);
        return ResponseEntity.ok(
                ApiResponse.success("Member unpaid fine total retrieved successfully", response)
        );
    }

    /**
     * PATCH /api/fines/{id}/pay
     * Marks a fine record as PAID.
     *
     * @param id The ID of the fine to mark as paid.
     * @param request Optional payment metadata (method, transaction ref, notes).
     * @return 200 OK with the updated FineResponseDto wrapped in ApiResponse.
     */
    @PatchMapping("/{id}/pay")
    @Operation(summary = "Pay fine", description = "Marks an unpaid fine record as PAID. Roles: ADMIN, MEMBER.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Fine marked as paid successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Fine has already been paid"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Fine not found with specified ID")
    })
    public ResponseEntity<ApiResponse<FineResponseDto>> payFine(
            @Parameter(description = "Unique ID of the fine to pay") @PathVariable("id") Long id,
            @Valid @RequestBody(required = false) FinePaymentRequestDto request) {
        FineResponseDto response = fineService.payFine(id, request);
        return ResponseEntity.ok(ApiResponse.success("Fine marked as paid successfully", response));
    }

    /**
     * Helper method to validate pagination parameters and construct a Pageable instance.
     */
    private Pageable buildPageable(int page, int size, String sortBy, String direction) {
        if (page < 0) {
            throw new IllegalArgumentException("Page index cannot be negative");
        }
        if (size <= 0 || size > 100) {
            throw new IllegalArgumentException("Page size must be between 1 and 100");
        }
        Sort.Direction sortDirection = direction != null && direction.equalsIgnoreCase("DESC")
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;
        return PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
    }
}

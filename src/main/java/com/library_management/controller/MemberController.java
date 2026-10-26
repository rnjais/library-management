package com.library_management.controller;

import com.library_management.dto.request.MemberRequestDto;
import com.library_management.dto.response.ApiResponse;
import com.library_management.dto.response.MemberResponseDto;
import com.library_management.dto.response.PagedResponse;
import com.library_management.service.MemberService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller exposing Member Management endpoints.
 * Base URL: /api/members
 */
@RestController
@RequestMapping("/api/members")
@Tag(name = "Members", description = "Endpoints for member registration, profile updates, search, and lifecycle administration")
public class MemberController {

    private final MemberService memberService;

    // Constructor Injection
    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    /**
     * POST /api/members
     * Registers a new library member.
     *
     * @param request Validated member registration payload.
     * @return 201 Created with MemberResponseDto wrapped in ApiResponse.
     */
    @PostMapping
    @Operation(summary = "Register member", description = "Registers a new library member. Requires ADMIN role.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Member registered successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error in member request"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Email already registered")
    })
    public ResponseEntity<ApiResponse<MemberResponseDto>> registerMember(@Valid @RequestBody MemberRequestDto request) {
        MemberResponseDto response = memberService.registerMember(request);
        return new ResponseEntity<>(
                ApiResponse.success("Member registered successfully", response),
                HttpStatus.CREATED
        );
    }

    /**
     * GET /api/members
     * Retrieves all members with pagination and sorting.
     *
     * @param page Page index (0-based, default: 0).
     * @param size Page size (default: 10).
     * @param sortBy Field name to sort by (default: 'id').
     * @param direction Sort order ('ASC' or 'DESC', default: 'ASC').
     * @return 200 OK with PagedResponse wrapped in ApiResponse.
     */
    @GetMapping
    @Operation(summary = "Get all members", description = "Retrieves all registered members with pagination. Requires ADMIN role.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Members retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid pagination or sorting parameters")
    })
    public ResponseEntity<ApiResponse<PagedResponse<MemberResponseDto>>> getAllMembers(
            @Parameter(description = "Page number (0-based)") @RequestParam(value = "page", defaultValue = "0") int page,
            @Parameter(description = "Number of items per page (1-100)") @RequestParam(value = "size", defaultValue = "10") int size,
            @Parameter(description = "Property to sort by") @RequestParam(value = "sortBy", defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction (ASC or DESC)") @RequestParam(value = "direction", defaultValue = "ASC") String direction) {

        Pageable pageable = buildPageable(page, size, sortBy, direction);
        Page<MemberResponseDto> membersPage = memberService.getAllMembers(pageable);
        return ResponseEntity.ok(
                ApiResponse.success("Members retrieved successfully", PagedResponse.fromPage(membersPage))
        );
    }

    /**
     * GET /api/members/{id}
     * Retrieves member details by member ID.
     *
     * @param id The ID of the member.
     * @return 200 OK with MemberResponseDto wrapped in ApiResponse.
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get member by ID", description = "Retrieves member details by member ID. Requires ADMIN role.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Member retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Member not found with specified ID")
    })
    public ResponseEntity<ApiResponse<MemberResponseDto>> getMemberById(
            @Parameter(description = "Unique ID of the member") @PathVariable("id") Long id) {
        MemberResponseDto response = memberService.getMemberById(id);
        return ResponseEntity.ok(ApiResponse.success("Member retrieved successfully", response));
    }

    /**
     * GET /api/members/search
     * Searches members matching first name or last name.
     *
     * @param name The name substring to search for.
     * @param page Page index (0-based, default: 0).
     * @param size Page size (default: 10).
     * @param sortBy Field name to sort by (default: 'id').
     * @param direction Sort order ('ASC' or 'DESC', default: 'ASC').
     * @return 200 OK with PagedResponse wrapped in ApiResponse.
     */
    @GetMapping("/search")
    @Operation(summary = "Search members by name", description = "Searches members matching first name or last name keyword. Requires ADMIN role.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Members matched and retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid query or pagination parameters")
    })
    public ResponseEntity<ApiResponse<PagedResponse<MemberResponseDto>>> searchMembersByName(
            @Parameter(description = "Keyword to match against first name or last name") @RequestParam("name") String name,
            @Parameter(description = "Page number (0-based)") @RequestParam(value = "page", defaultValue = "0") int page,
            @Parameter(description = "Number of items per page (1-100)") @RequestParam(value = "size", defaultValue = "10") int size,
            @Parameter(description = "Property to sort by") @RequestParam(value = "sortBy", defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction (ASC or DESC)") @RequestParam(value = "direction", defaultValue = "ASC") String direction) {

        Pageable pageable = buildPageable(page, size, sortBy, direction);
        Page<MemberResponseDto> membersPage = memberService.searchMembersByName(name, pageable);
        return ResponseEntity.ok(
                ApiResponse.success("Members retrieved successfully", PagedResponse.fromPage(membersPage))
        );
    }

    /**
     * GET /api/members/active
     * Retrieves all active members with pagination.
     *
     * @param page Page index (0-based, default: 0).
     * @param size Page size (default: 10).
     * @param sortBy Field name to sort by (default: 'id').
     * @param direction Sort order ('ASC' or 'DESC', default: 'ASC').
     * @return 200 OK with PagedResponse wrapped in ApiResponse.
     */
    @GetMapping("/active")
    @Operation(summary = "Get active members", description = "Retrieves all members with active membership status. Requires ADMIN role.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Active members retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid pagination or sorting parameters")
    })
    public ResponseEntity<ApiResponse<PagedResponse<MemberResponseDto>>> getActiveMembers(
            @Parameter(description = "Page number (0-based)") @RequestParam(value = "page", defaultValue = "0") int page,
            @Parameter(description = "Number of items per page (1-100)") @RequestParam(value = "size", defaultValue = "10") int size,
            @Parameter(description = "Property to sort by") @RequestParam(value = "sortBy", defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction (ASC or DESC)") @RequestParam(value = "direction", defaultValue = "ASC") String direction) {

        Pageable pageable = buildPageable(page, size, sortBy, direction);
        Page<MemberResponseDto> membersPage = memberService.getActiveMembers(pageable);
        return ResponseEntity.ok(
                ApiResponse.success("Active members retrieved successfully", PagedResponse.fromPage(membersPage))
        );
    }

    /**
     * PUT /api/members/{id}
     * Updates an existing member's information.
     *
     * @param id The ID of the member to update.
     * @param request Validated update payload.
     * @return 200 OK with the updated MemberResponseDto wrapped in ApiResponse.
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update member", description = "Updates profile details for an existing member. Requires ADMIN role.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Member updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation failure on member fields"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Member not found with specified ID"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Email address already in use by another member")
    })
    public ResponseEntity<ApiResponse<MemberResponseDto>> updateMember(
            @Parameter(description = "Unique ID of the member to update") @PathVariable("id") Long id,
            @Valid @RequestBody MemberRequestDto request) {

        MemberResponseDto response = memberService.updateMember(id, request);
        return ResponseEntity.ok(ApiResponse.success("Member updated successfully", response));
    }

    /**
     * PATCH /api/members/{id}/deactivate
     * Deactivates a member's membership (soft deactivation).
     *
     * @param id The ID of the member to deactivate.
     * @return 200 OK with the updated MemberResponseDto wrapped in ApiResponse.
     */
    @PatchMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate member", description = "Deactivates member account, preventing new book borrowings. Requires ADMIN role.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Member deactivated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Member not found with specified ID")
    })
    public ResponseEntity<ApiResponse<MemberResponseDto>> deactivateMember(
            @Parameter(description = "Unique ID of the member to deactivate") @PathVariable("id") Long id) {
        MemberResponseDto response = memberService.deactivateMember(id);
        return ResponseEntity.ok(ApiResponse.success("Member deactivated successfully", response));
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

package com.library_management.controller;

import com.library_management.dto.request.BorrowingRequestDto;
import com.library_management.dto.response.ApiResponse;
import com.library_management.dto.response.BorrowingResponseDto;
import com.library_management.dto.response.PagedResponse;
import com.library_management.service.BorrowingService;
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
 * REST Controller exposing endpoints for Book Borrowing and Returning.
 * Base URL: /api/borrowings
 */
@RestController
@RequestMapping("/api/borrowings")
@Tag(name = "Borrowings", description = "Endpoints for borrowing, returning, and tracking book loan lifecycles")
public class BorrowingController {

    private final BorrowingService borrowingService;

    // Constructor Injection
    public BorrowingController(BorrowingService borrowingService) {
        this.borrowingService = borrowingService;
    }

    /**
     * POST /api/borrowings
     * Borrows a book for a library member.
     *
     * @param request Validated borrowing payload (bookId, memberId, optional dueDate/borrowDays).
     * @return 201 Created with BorrowingResponseDto wrapped in ApiResponse.
     */
    @PostMapping
    @Operation(summary = "Borrow a book", description = "Issues a book loan to a member, decrements inventory, and sets due date. Roles: ADMIN, MEMBER.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Book borrowed successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error, member inactive, or max active loans reached"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Book or Member not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "No copies available or member already has active loan for this book")
    })
    public ResponseEntity<ApiResponse<BorrowingResponseDto>> borrowBook(
            @Valid @RequestBody BorrowingRequestDto request) {
        BorrowingResponseDto response = borrowingService.borrowBook(request);
        return new ResponseEntity<>(
                ApiResponse.success("Book borrowed successfully", response),
                HttpStatus.CREATED
        );
    }

    /**
     * PATCH /api/borrowings/{id}/return
     * Returns a borrowed book back to the library catalog.
     *
     * @param id The ID of the borrowing record.
     * @return 200 OK with the updated BorrowingResponseDto wrapped in ApiResponse.
     */
    @PatchMapping("/{id}/return")
    @Operation(summary = "Return a borrowed book", description = "Returns a book, increments inventory, and calculates overdue fines if returned late. Roles: ADMIN, MEMBER.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Book returned successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Book has already been returned"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Borrowing record not found")
    })
    public ResponseEntity<ApiResponse<BorrowingResponseDto>> returnBook(
            @Parameter(description = "Unique ID of the borrowing record") @PathVariable("id") Long id) {
        BorrowingResponseDto response = borrowingService.returnBook(id);
        return ResponseEntity.ok(ApiResponse.success("Book returned successfully", response));
    }

    /**
     * GET /api/borrowings/overdue
     * Retrieves all currently overdue borrowings with pagination.
     *
     * @param page Page index (0-based, default: 0).
     * @param size Page size (default: 10).
     * @param sortBy Field to sort by (default: 'dueDate').
     * @param direction Sort order ('ASC' or 'DESC', default: 'ASC').
     * @return 200 OK with PagedResponse wrapped in ApiResponse.
     */
    @GetMapping("/overdue")
    @Operation(summary = "Get overdue borrowings", description = "Retrieves all currently active borrowings whose due date has elapsed. Requires ADMIN role.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Overdue borrowings retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid pagination or sorting parameters")
    })
    public ResponseEntity<ApiResponse<PagedResponse<BorrowingResponseDto>>> getOverdueBorrowings(
            @Parameter(description = "Page number (0-based)") @RequestParam(value = "page", defaultValue = "0") int page,
            @Parameter(description = "Number of items per page (1-100)") @RequestParam(value = "size", defaultValue = "10") int size,
            @Parameter(description = "Property to sort by") @RequestParam(value = "sortBy", defaultValue = "dueDate") String sortBy,
            @Parameter(description = "Sort direction (ASC or DESC)") @RequestParam(value = "direction", defaultValue = "ASC") String direction) {

        Pageable pageable = buildPageable(page, size, sortBy, direction);
        Page<BorrowingResponseDto> overduePage = borrowingService.getOverdueBorrowings(pageable);
        return ResponseEntity.ok(
                ApiResponse.success("Overdue borrowings retrieved successfully", PagedResponse.fromPage(overduePage))
        );
    }

    /**
     * GET /api/borrowings/member/{memberId}
     * Retrieves borrowing history for a specific member with pagination.
     *
     * @param memberId The ID of the member.
     * @param page Page index (0-based, default: 0).
     * @param size Page size (default: 10).
     * @param sortBy Field to sort by (default: 'id').
     * @param direction Sort order ('ASC' or 'DESC', default: 'DESC').
     * @return 200 OK with PagedResponse wrapped in ApiResponse.
     */
    @GetMapping("/member/{memberId}")
    @Operation(summary = "Get borrowings by member", description = "Retrieves paginated loan history for a specific member ID. Roles: ADMIN, MEMBER.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Member borrowings retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Member not found with specified ID")
    })
    public ResponseEntity<ApiResponse<PagedResponse<BorrowingResponseDto>>> getBorrowingsByMember(
            @Parameter(description = "Unique ID of the member") @PathVariable("memberId") Long memberId,
            @Parameter(description = "Page number (0-based)") @RequestParam(value = "page", defaultValue = "0") int page,
            @Parameter(description = "Number of items per page (1-100)") @RequestParam(value = "size", defaultValue = "10") int size,
            @Parameter(description = "Property to sort by") @RequestParam(value = "sortBy", defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction (ASC or DESC)") @RequestParam(value = "direction", defaultValue = "DESC") String direction) {

        Pageable pageable = buildPageable(page, size, sortBy, direction);
        Page<BorrowingResponseDto> borrowingsPage = borrowingService.getBorrowingsByMemberId(memberId, pageable);
        return ResponseEntity.ok(
                ApiResponse.success("Member borrowings retrieved successfully", PagedResponse.fromPage(borrowingsPage))
        );
    }

    /**
     * GET /api/borrowings/book/{bookId}
     * Retrieves borrowing history for a specific book with pagination.
     *
     * @param bookId The ID of the book.
     * @param page Page index (0-based, default: 0).
     * @param size Page size (default: 10).
     * @param sortBy Field to sort by (default: 'id').
     * @param direction Sort order ('ASC' or 'DESC', default: 'DESC').
     * @return 200 OK with PagedResponse wrapped in ApiResponse.
     */
    @GetMapping("/book/{bookId}")
    @Operation(summary = "Get borrowings by book", description = "Retrieves loan records for a specific book ID. Requires ADMIN role.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Book borrowings retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Book not found with specified ID")
    })
    public ResponseEntity<ApiResponse<PagedResponse<BorrowingResponseDto>>> getBorrowingsByBook(
            @Parameter(description = "Unique ID of the book") @PathVariable("bookId") Long bookId,
            @Parameter(description = "Page number (0-based)") @RequestParam(value = "page", defaultValue = "0") int page,
            @Parameter(description = "Number of items per page (1-100)") @RequestParam(value = "size", defaultValue = "10") int size,
            @Parameter(description = "Property to sort by") @RequestParam(value = "sortBy", defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction (ASC or DESC)") @RequestParam(value = "direction", defaultValue = "DESC") String direction) {

        Pageable pageable = buildPageable(page, size, sortBy, direction);
        Page<BorrowingResponseDto> borrowingsPage = borrowingService.getBorrowingsByBookId(bookId, pageable);
        return ResponseEntity.ok(
                ApiResponse.success("Book borrowings retrieved successfully", PagedResponse.fromPage(borrowingsPage))
        );
    }

    /**
     * GET /api/borrowings/{id}
     * Retrieves details of a specific borrowing record by ID.
     *
     * @param id The ID of the borrowing record.
     * @return 200 OK with BorrowingResponseDto wrapped in ApiResponse.
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get borrowing by ID", description = "Retrieves single borrowing record details by ID. Roles: ADMIN, MEMBER.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Borrowing record found and retrieved"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Borrowing record not found with specified ID")
    })
    public ResponseEntity<ApiResponse<BorrowingResponseDto>> getBorrowingById(
            @Parameter(description = "Unique ID of the borrowing record") @PathVariable("id") Long id) {
        BorrowingResponseDto response = borrowingService.getBorrowingById(id);
        return ResponseEntity.ok(ApiResponse.success("Borrowing details retrieved successfully", response));
    }

    /**
     * GET /api/borrowings
     * Retrieves all borrowings with pagination and sorting.
     *
     * @param page Page index (0-based, default: 0).
     * @param size Page size (default: 10).
     * @param sortBy Field to sort by (default: 'id').
     * @param direction Sort order ('ASC' or 'DESC', default: 'DESC').
     * @return 200 OK with PagedResponse wrapped in ApiResponse.
     */
    @GetMapping
    @Operation(summary = "Get all borrowings", description = "Retrieves all library loans with pagination and sorting. Requires ADMIN role.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Borrowings retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid pagination or sorting parameters")
    })
    public ResponseEntity<ApiResponse<PagedResponse<BorrowingResponseDto>>> getAllBorrowings(
            @Parameter(description = "Page number (0-based)") @RequestParam(value = "page", defaultValue = "0") int page,
            @Parameter(description = "Number of items per page (1-100)") @RequestParam(value = "size", defaultValue = "10") int size,
            @Parameter(description = "Property to sort by") @RequestParam(value = "sortBy", defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction (ASC or DESC)") @RequestParam(value = "direction", defaultValue = "DESC") String direction) {

        Pageable pageable = buildPageable(page, size, sortBy, direction);
        Page<BorrowingResponseDto> borrowingsPage = borrowingService.getAllBorrowings(pageable);
        return ResponseEntity.ok(
                ApiResponse.success("Borrowings retrieved successfully", PagedResponse.fromPage(borrowingsPage))
        );
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

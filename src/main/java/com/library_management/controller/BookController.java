package com.library_management.controller;

import com.library_management.dto.request.BookRequest;
import com.library_management.dto.response.ApiResponse;
import com.library_management.dto.response.BookResponse;
import com.library_management.dto.response.PagedResponse;
import com.library_management.service.BookService;
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
 * REST Controller exposing endpoints for Book Catalog management.
 * Base path: /api/books
 */
@RestController
@RequestMapping("/api/books")
@Tag(name = "Books", description = "Endpoints for managing book inventory, cataloging, searching, and pagination")
public class BookController {

    private final BookService bookService;

    // Constructor Injection
    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    /**
     * POST /api/books
     * Adds a new book to the catalog.
     *
     * @param request Validated book creation payload.
     * @return 201 Created with the created BookResponse wrapped in ApiResponse.
     */
    @PostMapping
    @Operation(summary = "Add a new book", description = "Adds a new book to the catalog. Requires ADMIN role.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Book created successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error on book fields"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Book with identical ISBN already exists")
    })
    public ResponseEntity<ApiResponse<BookResponse>> addBook(@Valid @RequestBody BookRequest request) {
        BookResponse response = bookService.addBook(request);
        return new ResponseEntity<>(
                ApiResponse.success("Book created successfully", response),
                HttpStatus.CREATED
        );
    }

    /**
     * GET /api/books
     * Retrieves books with pagination, sorting, and optional title/category search filters.
     *
     * @param page Page index (0-based, default: 0).
     * @param size Page size (default: 10).
     * @param sortBy Field to sort by (default: 'id').
     * @param direction Sort direction 'ASC' or 'DESC' (default: 'ASC').
     * @param title Optional case-insensitive title search keyword.
     * @param category Optional category filter.
     * @return 200 OK with PagedResponse wrapped in ApiResponse.
     */
    @GetMapping
    @Operation(summary = "Get all books", description = "Retrieves paginated and filtered catalog books. Public endpoint.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Books retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid pagination or sorting parameters")
    })
    public ResponseEntity<ApiResponse<PagedResponse<BookResponse>>> getAllBooks(
            @Parameter(description = "Page number (0-based)") @RequestParam(value = "page", defaultValue = "0") int page,
            @Parameter(description = "Number of items per page (1-100)") @RequestParam(value = "size", defaultValue = "10") int size,
            @Parameter(description = "Property to sort by") @RequestParam(value = "sortBy", defaultValue = "id") String sortBy,
            @Parameter(description = "Sort direction (ASC or DESC)") @RequestParam(value = "direction", defaultValue = "ASC") String direction,
            @Parameter(description = "Optional filter by title substring") @RequestParam(value = "title", required = false) String title,
            @Parameter(description = "Optional filter by category") @RequestParam(value = "category", required = false) String category) {

        // Validate pagination constraints
        if (page < 0) {
            throw new IllegalArgumentException("Page index cannot be negative");
        }
        if (size <= 0 || size > 100) {
            throw new IllegalArgumentException("Page size must be between 1 and 100");
        }

        // Build Sort and Pageable
        Sort.Direction sortDirection = direction.equalsIgnoreCase("DESC") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Sort sort = Sort.by(sortDirection, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<BookResponse> booksPage = bookService.getAllBooks(title, category, pageable);
        return ResponseEntity.ok(
                ApiResponse.success("Books retrieved successfully", PagedResponse.fromPage(booksPage))
        );
    }

    /**
     * GET /api/books/{id}
     * Retrieves a single book by ID.
     *
     * @param id The ID of the book.
     * @return 200 OK with the BookResponse wrapped in ApiResponse.
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get book by ID", description = "Retrieves detailed information of a book by its database ID. Public endpoint.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Book found and retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Book not found with specified ID")
    })
    public ResponseEntity<ApiResponse<BookResponse>> getBookById(
            @Parameter(description = "Unique ID of the book") @PathVariable("id") Long id) {
        BookResponse response = bookService.getBookById(id);
        return ResponseEntity.ok(ApiResponse.success("Book retrieved successfully", response));
    }

    /**
     * PUT /api/books/{id}
     * Updates an existing book.
     *
     * @param id The ID of the book to update.
     * @param request Validated book update payload.
     * @return 200 OK with the updated BookResponse wrapped in ApiResponse.
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update book", description = "Updates details of an existing book. Requires ADMIN role.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Book updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation failure or available copies exceed total copies"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Book not found with specified ID"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "ISBN conflict with another book")
    })
    public ResponseEntity<ApiResponse<BookResponse>> updateBook(
            @Parameter(description = "Unique ID of the book to update") @PathVariable("id") Long id,
            @Valid @RequestBody BookRequest request) {
        BookResponse response = bookService.updateBook(id, request);
        return ResponseEntity.ok(ApiResponse.success("Book updated successfully", response));
    }

    /**
     * DELETE /api/books/{id}
     * Deletes a book from the catalog.
     *
     * @param id The ID of the book to delete.
     * @return 200 OK with success message wrapped in ApiResponse.
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete book", description = "Deletes a book from catalog. Fails if copies are currently borrowed. Requires ADMIN role.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Book deleted successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Book not found with specified ID"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Cannot delete book while copies are borrowed out")
    })
    public ResponseEntity<ApiResponse<Void>> deleteBook(
            @Parameter(description = "Unique ID of the book to delete") @PathVariable("id") Long id) {
        bookService.deleteBook(id);
        return ResponseEntity.ok(ApiResponse.success("Book deleted successfully"));
    }
}

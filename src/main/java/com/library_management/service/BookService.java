package com.library_management.service;

import com.library_management.dto.request.BookRequest;
import com.library_management.dto.response.BookResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service interface defining business operations for the Book catalog.
 */
public interface BookService {

    /**
     * Adds a new book to the catalog after validating uniqueness of ISBN and inventory rules.
     *
     * @param request Validated book creation payload.
     * @return The created BookResponse DTO.
     */
    BookResponse addBook(BookRequest request);

    /**
     * Retrieves a single book by its primary ID.
     *
     * @param id The ID of the book.
     * @return The BookResponse DTO.
     * @throws com.library_management.exception.ResourceNotFoundException if no book exists with the given ID.
     */
    BookResponse getBookById(Long id);

    /**
     * Retrieves a paginated and filtered list of books.
     *
     * @param title Optional title search keyword.
     * @param category Optional category filter.
     * @param pageable Pagination and sorting criteria.
     * @return A Page of BookResponse DTOs.
     */
    Page<BookResponse> getAllBooks(String title, String category, Pageable pageable);

    /**
     * Updates an existing book's details while preventing ISBN collision and inventory corruption.
     *
     * @param id The ID of the book to update.
     * @param request Validated book update payload.
     * @return The updated BookResponse DTO.
     */
    BookResponse updateBook(Long id, BookRequest request);

    /**
     * Deletes a book from the catalog.
     *
     * @param id The ID of the book to delete.
     * @throws com.library_management.exception.ResourceNotFoundException if the book is not found.
     */
    void deleteBook(Long id);
}

package com.library_management.service.impl;

import com.library_management.dto.request.BookRequest;
import com.library_management.dto.response.BookResponse;
import com.library_management.entity.Book;
import com.library_management.exception.BookNotAvailableException;
import com.library_management.exception.DuplicateResourceException;
import com.library_management.exception.ResourceNotFoundException;
import com.library_management.repository.BookRepository;
import com.library_management.service.BookService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

/**
 * Production implementation of BookService.
 * Contains business validations, transactional boundaries, and entity-DTO transformations.
 */
@Slf4j
@Service
public class BookServiceImpl implements BookService {

    private final BookRepository bookRepository;

    // Constructor Injection
    public BookServiceImpl(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    @Override
    @Transactional
    public BookResponse addBook(BookRequest request) {
        if (request.getIsbn() == null || request.getIsbn().isBlank()) {
            throw new IllegalArgumentException("ISBN must not be null or blank");
        }
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("Title must not be null or blank");
        }
        if (request.getAuthor() == null || request.getAuthor().isBlank()) {
            throw new IllegalArgumentException("Author must not be null or blank");
        }
        if (request.getCategory() == null || request.getCategory().isBlank()) {
            throw new IllegalArgumentException("Category must not be null or blank");
        }
        if (request.getTotalCopies() == null) {
            throw new IllegalArgumentException("Total copies must not be null");
        }

        String isbn = request.getIsbn().trim();
        log.info("Adding new book with ISBN: {}", isbn);

        // 1. Check for duplicate ISBN
        if (bookRepository.existsByIsbn(isbn)) {
            throw new DuplicateResourceException("Book", "isbn", isbn);
        }

        // 2. Validate inventory counts
        int totalCopies = request.getTotalCopies();
        int availableCopies = request.getAvailableCopies() != null ? request.getAvailableCopies() : totalCopies;

        if (availableCopies > totalCopies) {
            throw new IllegalArgumentException(
                String.format("Available copies (%d) cannot exceed total copies (%d)", availableCopies, totalCopies)
            );
        }

        // 3. Map to Entity
        Book book = Book.builder()
                .title(request.getTitle().trim())
                .author(request.getAuthor().trim())
                .isbn(isbn)
                .category(request.getCategory().trim())
                .totalCopies(totalCopies)
                .availableCopies(availableCopies)
                .build();

        // 4. Save and return response DTO
        Book savedBook = bookRepository.save(book);
        log.info("Successfully added book with ID: {}", savedBook.getId());
        return BookResponse.fromEntity(savedBook);
    }

    @Override
    @Transactional(readOnly = true)
    public BookResponse getBookById(Long id) {
        log.debug("Fetching book with ID: {}", id);
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book", "id", id));
        return BookResponse.fromEntity(book);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BookResponse> getAllBooks(String title, String category, Pageable pageable) {
        log.debug("Fetching books with title filter: '{}', category filter: '{}', pageable: {}", title, category, pageable);
        
        String cleanTitle = (title != null && !title.isBlank()) ? title.trim() : null;
        String cleanCategory = (category != null && !category.isBlank()) ? category.trim() : null;

        Page<Book> booksPage = bookRepository.searchBooks(cleanTitle, cleanCategory, pageable);
        return booksPage.map(BookResponse::fromEntity);
    }

    @Override
    @Transactional
    public BookResponse updateBook(Long id, BookRequest request) {
        log.info("Updating book with ID: {}", id);

        if (request.getIsbn() == null || request.getIsbn().isBlank()) {
            throw new IllegalArgumentException("ISBN must not be null or blank");
        }
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("Title must not be null or blank");
        }
        if (request.getAuthor() == null || request.getAuthor().isBlank()) {
            throw new IllegalArgumentException("Author must not be null or blank");
        }
        if (request.getCategory() == null || request.getCategory().isBlank()) {
            throw new IllegalArgumentException("Category must not be null or blank");
        }
        if (request.getTotalCopies() == null) {
            throw new IllegalArgumentException("Total copies must not be null");
        }

        // 1. Verify existence
        Book existingBook = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book", "id", id));

        // 2. Verify ISBN uniqueness (excluding current book's ID)
        String newIsbn = request.getIsbn().trim();
        if (bookRepository.existsByIsbnAndIdNot(newIsbn, id)) {
            throw new DuplicateResourceException("Book", "isbn", newIsbn);
        }

        // 3. Calculate borrowed/issued copies
        int currentTotal = existingBook.getTotalCopies();
        int currentAvailable = existingBook.getAvailableCopies();
        int currentlyBorrowed = currentTotal - currentAvailable;

        int newTotal = request.getTotalCopies();

        // Ensure total copies is not reduced below currently borrowed count
        if (newTotal < currentlyBorrowed) {
            throw new IllegalArgumentException(
                String.format("Total copies (%d) cannot be less than currently borrowed copies (%d)", newTotal, currentlyBorrowed)
            );
        }

        // 4. Update inventory counts without accidentally resetting active availability
        int newAvailable;
        if (request.getAvailableCopies() != null) {
            newAvailable = request.getAvailableCopies();
            if (newAvailable > newTotal) {
                throw new IllegalArgumentException(
                    String.format("Available copies (%d) cannot exceed total copies (%d)", newAvailable, newTotal)
                );
            }
        } else {
            // Preserve active borrowings: adjust available copies by the delta of total copies
            int delta = newTotal - currentTotal;
            newAvailable = Math.max(0, currentAvailable + delta);
        }

        // 5. Update book fields
        existingBook.setTitle(request.getTitle().trim());
        existingBook.setAuthor(request.getAuthor().trim());
        existingBook.setIsbn(newIsbn);
        existingBook.setCategory(request.getCategory().trim());
        existingBook.setTotalCopies(newTotal);
        existingBook.setAvailableCopies(newAvailable);

        Book updatedBook = bookRepository.save(existingBook);
        log.info("Successfully updated book with ID: {}", updatedBook.getId());
        return BookResponse.fromEntity(updatedBook);
    }

    @Override
    @Transactional
    public void deleteBook(Long id) {
        log.info("Deleting book with ID: {}", id);

        // 1. Verify existence
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book", "id", id));

        // 2. Prevent deletion if copies are currently borrowed out
        if (!Objects.equals(book.getAvailableCopies(), book.getTotalCopies())) {
            int borrowed = book.getTotalCopies() - book.getAvailableCopies();
            throw new BookNotAvailableException(
                String.format("Cannot delete book with ID %d because %d copy/copies are currently borrowed out", id, borrowed)
            );
        }

        bookRepository.delete(book);
        log.info("Successfully deleted book with ID: {}", id);
    }
}

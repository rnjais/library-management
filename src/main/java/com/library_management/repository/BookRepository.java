package com.library_management.repository;

import com.library_management.entity.Book;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for the Book entity.
 * Provides CRUD operations, derived query methods, and custom search functionality.
 */
@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    /**
     * Finds a book by its unique ISBN.
     * Derived query: SELECT b FROM Book b WHERE b.isbn = :isbn
     *
     * @param isbn The unique ISBN number.
     * @return An Optional containing the Book if found, or empty.
     */
    Optional<Book> findByIsbn(String isbn);

    /**
     * Checks if a book exists with the given ISBN.
     * Optimized existence check (avoids loading entity into memory).
     *
     * @param isbn The ISBN to check.
     * @return true if a book exists with this ISBN.
     */
    boolean existsByIsbn(String isbn);

    /**
     * Checks if another book with the given ISBN exists, excluding the specified book ID.
     * Crucial for updating existing books without triggering false duplicate conflicts.
     *
     * @param isbn The ISBN to check.
     * @param id The ID of the book being updated.
     * @return true if another book already claims this ISBN.
     */
    boolean existsByIsbnAndIdNot(String isbn, Long id);

    /**
     * Finds books whose title contains the specified text, ignoring case.
     *
     * @param title The substring to search for.
     * @param pageable Pagination and sorting criteria.
     * @return A page of matching books.
     */
    Page<Book> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    /**
     * Finds books belonging to a specific category, ignoring case.
     *
     * @param category The category name.
     * @param pageable Pagination and sorting criteria.
     * @return A page of matching books.
     */
    Page<Book> findByCategoryIgnoreCase(String category, Pageable pageable);

    /**
     * Dynamic search supporting optional title (case-insensitive contains) and optional category (case-insensitive exact match)
     * with pagination and sorting in a single unified query.
     *
     * @param title Optional title keyword (if null or blank, matches all titles).
     * @param category Optional category name (if null or blank, matches all categories).
     * @param pageable Pagination and sorting parameters.
     * @return A page of books matching the search criteria.
     */
    @Query("SELECT b FROM Book b WHERE " +
           "(:title IS NULL OR :title = '' OR LOWER(b.title) LIKE LOWER(CONCAT('%', :title, '%'))) AND " +
           "(:category IS NULL OR :category = '' OR LOWER(b.category) = LOWER(:category))")
    Page<Book> searchBooks(@Param("title") String title,
                           @Param("category") String category,
                           Pageable pageable);

    /**
     * Retrieves a book by ID with an exclusive PESSIMISTIC_WRITE lock (SELECT ... FOR UPDATE).
     * Prevents race conditions during concurrent borrowing and returning operations.
     *
     * @param id The ID of the book.
     * @return Optional containing the locked Book entity.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Book b WHERE b.id = :id")
    Optional<Book> findByIdWithPessimisticLock(@Param("id") Long id);

    /**
     * Calculates the sum of all book copies across the library catalog.
     * Returns 0 if catalog is empty.
     */
    @Query("SELECT COALESCE(SUM(b.totalCopies), 0) FROM Book b")
    long sumTotalCopies();

    /**
     * Calculates the sum of all currently available book copies.
     * Returns 0 if catalog is empty.
     */
    @Query("SELECT COALESCE(SUM(b.availableCopies), 0) FROM Book b")
    long sumAvailableCopies();

    /**
     * Aggregates book counts and copy totals grouped by genre/category.
     * Each row in result contains [category, bookCount, totalCopies, availableCopies].
     */
    @Query("SELECT b.category, COUNT(b), COALESCE(SUM(b.totalCopies), 0), COALESCE(SUM(b.availableCopies), 0) " +
           "FROM Book b GROUP BY b.category ORDER BY b.category ASC")
    List<Object[]> aggregateByCategory();
}

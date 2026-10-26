package com.library_management.repository;

import com.library_management.entity.Borrowing;
import com.library_management.entity.BorrowingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for the Borrowing entity.
 * Provides query methods for loans, overdue tracking, and member checkout checks.
 */
@Repository
public interface BorrowingRepository extends JpaRepository<Borrowing, Long> {

    /**
     * Finds a borrowing record by ID, fetching the associated Book and Member eagerly
     * to avoid N+1 queries.
     *
     * @param id The borrowing record ID.
     * @return Optional containing Borrowing if found.
     */
    @Override
    @EntityGraph(attributePaths = {"book", "member"})
    Optional<Borrowing> findById(Long id);

    /**
     * Retrieves all borrowings with pagination, eagerly fetching Book and Member.
     *
     * @param pageable Pagination and sorting criteria.
     * @return A page of borrowings.
     */
    @Override
    @EntityGraph(attributePaths = {"book", "member"})
    Page<Borrowing> findAll(Pageable pageable);

    /**
     * Finds all borrowings for a given member with pagination.
     *
     * @param memberId The ID of the member.
     * @param pageable Pagination and sorting criteria.
     * @return A page of borrowings for the specified member.
     */
    @EntityGraph(attributePaths = {"book", "member"})
    Page<Borrowing> findByMemberId(Long memberId, Pageable pageable);

    /**
     * Finds all borrowings for a given member.
     *
     * @param memberId The ID of the member.
     * @return List of borrowings for the member.
     */
    @EntityGraph(attributePaths = {"book", "member"})
    List<Borrowing> findByMemberId(Long memberId);

    /**
     * Finds the borrowing history for a given book with pagination.
     *
     * @param bookId The ID of the book.
     * @param pageable Pagination and sorting criteria.
     * @return A page of borrowings for the specified book.
     */
    @EntityGraph(attributePaths = {"book", "member"})
    Page<Borrowing> findByBookId(Long bookId, Pageable pageable);

    /**
     * Finds the borrowing history for a given book.
     *
     * @param bookId The ID of the book.
     * @return List of borrowings for the book.
     */
    @EntityGraph(attributePaths = {"book", "member"})
    List<Borrowing> findByBookId(Long bookId);

    /**
     * Finds all currently active (unreturned) borrowings.
     *
     * @param pageable Pagination and sorting criteria.
     * @return A page of active borrowings.
     */
    @EntityGraph(attributePaths = {"book", "member"})
    Page<Borrowing> findByReturnDateIsNull(Pageable pageable);

    /**
     * Finds borrowings by status with pagination.
     *
     * @param status The status enum value (BORROWED, RETURNED, OVERDUE).
     * @param pageable Pagination and sorting criteria.
     * @return A page of borrowings with the specified status.
     */
    @EntityGraph(attributePaths = {"book", "member"})
    Page<Borrowing> findByStatus(BorrowingStatus status, Pageable pageable);

    /**
     * Finds borrowings that are overdue:
     * - Have not yet been returned (returnDate IS NULL)
     * - Their due date is strictly before the specified current date.
     *
     * @param currentDate The current reference date (e.g. LocalDate.now()).
     * @param pageable Pagination and sorting criteria.
     * @return A page of overdue borrowings.
     */
    @EntityGraph(attributePaths = {"book", "member"})
    @Query("SELECT b FROM Borrowing b WHERE b.returnDate IS NULL AND b.dueDate < :currentDate")
    Page<Borrowing> findOverdueBorrowings(@Param("currentDate") LocalDate currentDate, Pageable pageable);

    /**
     * Checks if a member already has an active (unreturned) loan for a specific book.
     * Used to prevent a member from borrowing the same book twice simultaneously.
     *
     * @param memberId The ID of the member.
     * @param bookId The ID of the book.
     * @return true if an unreturned borrowing exists for this member and book.
     */
    boolean existsByMemberIdAndBookIdAndReturnDateIsNull(Long memberId, Long bookId);

    /**
     * Counts how many active (unreturned) books a member currently has checked out.
     *
     * @param memberId The ID of the member.
     * @return Total count of active borrowings.
     */
    long countByMemberIdAndReturnDateIsNull(Long memberId);

    /**
     * Batch updates status of unreturned loans past their due date from BORROWED to OVERDUE.
     *
     * @param overdueStatus Target status (OVERDUE).
     * @param borrowedStatus Source status (BORROWED).
     * @param currentDate Reference date (e.g. LocalDate.now()).
     * @return Number of records updated.
     */
    @Modifying
    @Query("UPDATE Borrowing b SET b.status = :overdueStatus " +
           "WHERE b.status = :borrowedStatus AND b.returnDate IS NULL AND b.dueDate < :currentDate")
    int updateOverdueStatus(@Param("overdueStatus") BorrowingStatus overdueStatus,
                            @Param("borrowedStatus") BorrowingStatus borrowedStatus,
                            @Param("currentDate") LocalDate currentDate);

    /**
     * Counts currently borrowed (unreturned) books.
     */
    long countByReturnDateIsNull();

    /**
     * Counts overdue unreturned borrowings as of the given date.
     */
    @Query("SELECT COUNT(b) FROM Borrowing b WHERE b.returnDate IS NULL AND b.dueDate < :currentDate")
    long countOverdueBorrowings(@Param("currentDate") LocalDate currentDate);

    /**
     * Counts borrowings by status.
     */
    long countByStatus(BorrowingStatus status);

    /**
     * Counts borrowings within a borrow date range.
     */
    long countByBorrowDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * Finds borrowings filtered by optional status and optional date range with pagination.
     */
    @EntityGraph(attributePaths = {"book", "member"})
    @Query("SELECT b FROM Borrowing b WHERE " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:startDate IS NULL OR b.borrowDate >= :startDate) AND " +
           "(:endDate IS NULL OR b.borrowDate <= :endDate)")
    Page<Borrowing> searchBorrowingsReport(@Param("status") BorrowingStatus status,
                                          @Param("startDate") LocalDate startDate,
                                          @Param("endDate") LocalDate endDate,
                                          Pageable pageable);

    /**
     * Finds active (unreturned) borrowings whose due date falls on the specified target date.
     * Used by DueDateReminderScheduler to identify loans due soon (e.g. in 2 days).
     */
    @EntityGraph(attributePaths = {"book", "member"})
    @Query("SELECT b FROM Borrowing b WHERE b.returnDate IS NULL AND b.dueDate = :targetDueDate")
    List<Borrowing> findActiveBorrowingsDueOn(@Param("targetDueDate") LocalDate targetDueDate);

    /**
     * Finds active (unreturned) borrowings that are overdue as of the current date.
     * Used by DueDateReminderScheduler to dispatch overdue notices.
     */
    @EntityGraph(attributePaths = {"book", "member"})
    @Query("SELECT b FROM Borrowing b WHERE b.returnDate IS NULL AND b.dueDate < :currentDate")
    List<Borrowing> findActiveOverdueBorrowings(@Param("currentDate") LocalDate currentDate);
}

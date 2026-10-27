package com.library_management.repository;

import com.library_management.entity.Fine;
import com.library_management.entity.FineStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Spring Data JPA repository for Fine entities.
 * Provides query methods for fine retrieval, status filtering, and member liability aggregations.
 */
@Repository
public interface FineRepository extends JpaRepository<Fine, Long> {

    /**
     * Finds a fine by its primary key with eager loading of borrowing, book, and member.
     * Prevents N+1 query overhead.
     *
     * @param id The fine ID.
     * @return Optional containing the Fine if found.
     */
    @Override
    @EntityGraph(attributePaths = {"borrowing", "borrowing.book", "borrowing.member"})
    Optional<Fine> findById(Long id);

    /**
     * Retrieves all fines with pagination, eagerly loading associated borrowing relations.
     *
     * @param pageable Pagination and sorting criteria.
     * @return A page of fines.
     */
    @Override
    @EntityGraph(attributePaths = {"borrowing", "borrowing.book", "borrowing.member"})
    Page<Fine> findAll(Pageable pageable);

    /**
     * Finds a fine associated with a specific borrowing record.
     *
     * @param borrowingId The ID of the borrowing transaction.
     * @return Optional containing the Fine if found.
     */
    @EntityGraph(attributePaths = {"borrowing", "borrowing.book", "borrowing.member"})
    Optional<Fine> findByBorrowingId(Long borrowingId);

    /**
     * Checks if a fine record already exists for a borrowing transaction.
     * Used to prevent duplicate fine calculations.
     *
     * @param borrowingId The ID of the borrowing transaction.
     * @return true if a fine record already exists.
     */
    boolean existsByBorrowingId(Long borrowingId);

    /**
     * Finds all fines for a specific library member with pagination.
     *
     * @param memberId The ID of the member.
     * @param pageable Pagination and sorting criteria.
     * @return A page of fines belonging to the member.
     */
    @EntityGraph(attributePaths = {"borrowing", "borrowing.book", "borrowing.member"})
    @Query("SELECT f FROM Fine f WHERE f.borrowing.member.id = :memberId")
    Page<Fine> findByMemberId(@Param("memberId") Long memberId, Pageable pageable);

    /**
     * Finds fines by payment status (UNPAID or PAID) with pagination.
     *
     * @param status The fine payment status.
     * @param pageable Pagination and sorting criteria.
     * @return A page of fines matching the status.
     */
    @EntityGraph(attributePaths = {"borrowing", "borrowing.book", "borrowing.member"})
    Page<Fine> findByStatus(FineStatus status, Pageable pageable);

    /**
     * Calculates the sum of fines for a member with a specific payment status.
     * Returns 0.00 if the member has no fines with the status.
     *
     * @param memberId The ID of the member.
     * @param status The payment status (e.g. UNPAID).
     * @return The aggregated fine sum as BigDecimal.
     */
    @Query("SELECT COALESCE(SUM(f.amount), 0.00) FROM Fine f " +
           "WHERE f.borrowing.member.id = :memberId AND f.status = :status")
    BigDecimal sumAmountByMemberIdAndStatus(@Param("memberId") Long memberId,
                                            @Param("status") FineStatus status);

    /**
     * Counts the number of fines for a member with a specific payment status.
     *
     * @param memberId The ID of the member.
     * @param status The payment status (e.g. UNPAID).
     * @return The count of matching fine records.
     */
    @Query("SELECT COUNT(f) FROM Fine f " +
           "WHERE f.borrowing.member.id = :memberId AND f.status = :status")
    long countByMemberIdAndStatus(@Param("memberId") Long memberId,
                                  @Param("status") FineStatus status);

    /**
     * Calculates the sum of fine amounts across the entire library for a specific status.
     * Returns 0.00 if no records exist with this status.
     */
    @Query("SELECT COALESCE(SUM(f.amount), 0.00) FROM Fine f WHERE f.status = :status")
    BigDecimal sumAmountByStatus(@Param("status") FineStatus status);

    /**
     * Counts the total number of fines across the entire library for a specific status.
     */
    long countByStatus(FineStatus status);

    /**
     * Calculates the total sum of all fines ever generated.
     */
    @Query("SELECT COALESCE(SUM(f.amount), 0.00) FROM Fine f")
    BigDecimal sumTotalAmount();

    /**
     * Finds fines filtered by optional status and optional calculation timestamp range with pagination.
     */
    @EntityGraph(attributePaths = {"borrowing", "borrowing.book", "borrowing.member"})
    @Query("SELECT f FROM Fine f WHERE " +
           "(:status IS NULL OR f.status = :status) AND " +
           "(:startDateTime IS NULL OR f.calculatedAt >= :startDateTime) AND " +
           "(:endDateTime IS NULL OR f.calculatedAt <= :endDateTime)")
    Page<Fine> searchFinesReport(@Param("status") FineStatus status,
                                @Param("startDateTime") LocalDateTime startDateTime,
                                @Param("endDateTime") LocalDateTime endDateTime,
                                Pageable pageable);

    /**
     * Deletes all fine records for loans associated with a member.
     *
     * @param memberId The member ID.
     */
    @Modifying
    @Query("DELETE FROM Fine f WHERE f.borrowing.id IN (SELECT b.id FROM Borrowing b WHERE b.member.id = :memberId)")
    void deleteByMemberId(@Param("memberId") Long memberId);
}

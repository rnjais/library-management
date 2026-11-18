package com.library_management.repository;

import com.library_management.entity.Reservation;
import com.library_management.entity.ReservationStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    @Query("SELECT r FROM Reservation r JOIN FETCH r.book JOIN FETCH r.member WHERE r.id = :id")
    Optional<Reservation> findByIdWithDetails(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Reservation r JOIN FETCH r.book JOIN FETCH r.member WHERE r.id = :id")
    Optional<Reservation> findByIdWithPessimisticLock(@Param("id") Long id);

    /**
     * Finds the next waiting patron in FIFO queue for a specific book.
     */
    Optional<Reservation> findFirstByBookIdAndStatusOrderByReservationDateAsc(Long bookId, ReservationStatus status);

    /**
     * Finds an active reservation for a specific member and book.
     */
    Optional<Reservation> findByBookIdAndMemberIdAndStatus(Long bookId, Long memberId, ReservationStatus status);

    /**
     * Checks if a member already has an active reservation (PENDING or READY_FOR_PICKUP) for a book.
     */
    boolean existsByBookIdAndMemberIdAndStatusIn(Long bookId, Long memberId, Collection<ReservationStatus> statuses);

    /**
     * Counts active reservations held for pickup for a book.
     */
    long countByBookIdAndStatus(Long bookId, ReservationStatus status);

    /**
     * Calculates a patron's position in the waitlist queue.
     */
    long countByBookIdAndStatusAndReservationDateLessThanEqual(Long bookId, ReservationStatus status, LocalDateTime reservationDate);

    /**
     * Paged reservations for a specific member.
     */
    @Query("SELECT r FROM Reservation r JOIN FETCH r.book WHERE r.member.id = :memberId ORDER BY r.reservationDate DESC")
    Page<Reservation> findByMemberId(@Param("memberId") Long memberId, Pageable pageable);

    /**
     * Paged waitlist queue for a book.
     */
    @Query("SELECT r FROM Reservation r JOIN FETCH r.member WHERE r.book.id = :bookId ORDER BY r.reservationDate ASC")
    Page<Reservation> findByBookId(@Param("bookId") Long bookId, Pageable pageable);

    /**
     * All reservations filtered by status.
     */
    @Query("SELECT r FROM Reservation r JOIN FETCH r.book JOIN FETCH r.member WHERE r.status = :status ORDER BY r.reservationDate DESC")
    Page<Reservation> findByStatus(@Param("status") ReservationStatus status, Pageable pageable);

    /**
     * Finds expired ready reservations whose pickup deadline has elapsed.
     */
    @Query("SELECT r FROM Reservation r JOIN FETCH r.book WHERE r.status = 'READY_FOR_PICKUP' AND r.pickupDeadline < :now")
    List<Reservation> findExpiredPickupReservations(@Param("now") LocalDateTime now);

    /**
     * Cleanup helpers for safe book/member deletion.
     */
    long countByBookIdAndStatusIn(Long bookId, Collection<ReservationStatus> statuses);

    long countByMemberIdAndStatusIn(Long memberId, Collection<ReservationStatus> statuses);

    void deleteByBookId(Long bookId);

    void deleteByMemberId(Long memberId);
}

package com.library_management.repository;

import com.library_management.entity.BorrowingReminder;
import com.library_management.entity.ReminderType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

/**
 * Spring Data JPA repository for the BorrowingReminder audit entity.
 * Provides lookup methods to prevent duplicate email reminders.
 */
@Repository
public interface BorrowingReminderRepository extends JpaRepository<BorrowingReminder, Long> {

    /**
     * Checks if a reminder of the specified type has ever been sent for this borrowing loan.
     * Used primarily for UPCOMING_DUE reminders so members only receive one advance reminder per checkout.
     *
     * @param borrowingId The ID of the borrowing record.
     * @param reminderType The type of reminder.
     * @return true if a reminder of this type was already sent.
     */
    boolean existsByBorrowingIdAndReminderType(Long borrowingId, ReminderType reminderType);

    /**
     * Checks if a reminder of the specified type has already been sent on a specific calendar date.
     * Used for OVERDUE reminders to prevent spamming members more than once per day.
     *
     * @param borrowingId The ID of the borrowing record.
     * @param reminderType The type of reminder.
     * @param sentDate The calendar date.
     * @return true if already sent on this date.
     */
    boolean existsByBorrowingIdAndReminderTypeAndSentDate(Long borrowingId, ReminderType reminderType, LocalDate sentDate);

    /**
     * Deletes all reminder logs for loans associated with a member.
     *
     * @param memberId The member ID.
     */
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM BorrowingReminder br WHERE br.borrowing.id IN (SELECT b.id FROM Borrowing b WHERE b.member.id = :memberId)")
    void deleteByMemberId(@org.springframework.data.repository.query.Param("memberId") Long memberId);
}

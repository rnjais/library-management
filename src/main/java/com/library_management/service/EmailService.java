package com.library_management.service;

import com.library_management.entity.Borrowing;
import com.library_management.entity.Fine;

/**
 * Service interface for composing and dispatching library notifications and reminder emails.
 * Keeps messaging and presentation logic decoupled from core database workflows.
 */
public interface EmailService {

    /**
     * Sends an email confirmation to the member when a book is successfully borrowed.
     *
     * @param borrowing The persisted borrowing record containing book and member details.
     */
    void sendBorrowingConfirmation(Borrowing borrowing);

    /**
     * Sends an email confirmation to the member when a borrowed book is successfully returned.
     *
     * @param borrowing The updated borrowing record containing return date.
     */
    void sendReturnConfirmation(Borrowing borrowing);

    /**
     * Sends an advance reminder to the member that their book loan is due soon.
     *
     * @param borrowing The active borrowing record.
     * @param daysRemaining Number of calendar days left until the due date.
     */
    void sendUpcomingDueDateReminder(Borrowing borrowing, int daysRemaining);

    /**
     * Sends an urgent reminder to the member that their book loan is overdue.
     *
     * @param borrowing The unreturned borrowing record past its due date.
     * @param overdueDays Number of days the book has been overdue.
     */
    void sendOverdueReminder(Borrowing borrowing, int overdueDays);

    /**
     * Sends a notification to the member when an overdue fine has been levied.
     *
     * @param fine The persisted fine record containing amount and overdue days.
     */
    void sendFineCreatedNotification(Fine fine);

    /**
     * Sends an email payment receipt to the member when a fine has been marked as paid.
     *
     * @param fine The updated fine record with status PAID and payment timestamp.
     */
    void sendFinePaidNotification(Fine fine);
}

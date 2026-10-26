package com.library_management.event;

import com.library_management.entity.Borrowing;
import lombok.Getter;

/**
 * Domain event published immediately after a book checkout is successfully saved.
 * Consumed by NotificationEventListener after the database transaction commits.
 */
@Getter
public class BookBorrowedEvent {

    private final Borrowing borrowing;

    public BookBorrowedEvent(Borrowing borrowing) {
        this.borrowing = borrowing;
    }
}

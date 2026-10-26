package com.library_management.event;

import com.library_management.entity.Borrowing;
import lombok.Getter;

/**
 * Domain event published immediately after a book return is successfully saved.
 * Consumed by NotificationEventListener after the database transaction commits.
 */
@Getter
public class BookReturnedEvent {

    private final Borrowing borrowing;

    public BookReturnedEvent(Borrowing borrowing) {
        this.borrowing = borrowing;
    }
}

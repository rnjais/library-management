package com.library_management.event;

import com.library_management.entity.Fine;
import lombok.Getter;

/**
 * Domain event published immediately after an overdue fine is calculated and saved.
 * Consumed by NotificationEventListener after the database transaction commits.
 */
@Getter
public class FineCreatedEvent {

    private final Fine fine;

    public FineCreatedEvent(Fine fine) {
        this.fine = fine;
    }
}

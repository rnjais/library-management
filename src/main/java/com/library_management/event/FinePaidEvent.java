package com.library_management.event;

import com.library_management.entity.Fine;
import lombok.Getter;

/**
 * Domain event published immediately after an overdue fine payment is saved.
 * Consumed by NotificationEventListener after the database transaction commits.
 */
@Getter
public class FinePaidEvent {

    private final Fine fine;

    public FinePaidEvent(Fine fine) {
        this.fine = fine;
    }
}

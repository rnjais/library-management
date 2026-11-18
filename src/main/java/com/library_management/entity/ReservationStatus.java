package com.library_management.entity;

/**
 * Lifecycle status of a book waitlist reservation.
 */
public enum ReservationStatus {
    /**
     * Waiting in FIFO queue for an available copy.
     */
    PENDING,

    /**
     * A copy has been returned and is reserved exclusively for this patron.
     */
    READY_FOR_PICKUP,

    /**
     * The patron checked out the reserved book copy.
     */
    FULFILLED,

    /**
     * Cancelled by the patron or library staff.
     */
    CANCELLED,

    /**
     * The patron failed to pick up the book within the pickup deadline.
     */
    EXPIRED
}

package com.library_management.entity;

/**
 * Enumeration representing the category of scheduled notification reminder sent to a member.
 */
public enum ReminderType {
    /**
     * Advance notice that a book loan is approaching its due date.
     */
    UPCOMING_DUE,

    /**
     * Urgent notice that a book loan has passed its due date and is incurring fines.
     */
    OVERDUE
}

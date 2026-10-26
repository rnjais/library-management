package com.library_management.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * JPA Entity tracking reminder emails sent to members.
 * Maps to the 'borrowing_reminders' table in MySQL.
 *
 * Enforces a unique constraint on (borrowing_id, reminder_type, sent_date)
 * to prevent duplicate reminder notifications from being sent on the same day.
 */
@Entity
@Table(
    name = "borrowing_reminders",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_borrowing_reminder_daily",
            columnNames = {"borrowing_id", "reminder_type", "sent_date"}
        )
    },
    indexes = {
        @Index(name = "idx_reminder_borrowing", columnList = "borrowing_id"),
        @Index(name = "idx_reminder_type_date", columnList = "reminder_type, sent_date")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BorrowingReminder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Borrowing reference is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "borrowing_id", nullable = false)
    private Borrowing borrowing;

    @NotNull(message = "Reminder type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "reminder_type", nullable = false, length = 30)
    private ReminderType reminderType;

    @NotNull(message = "Sent date is required")
    @Column(name = "sent_date", nullable = false)
    private LocalDate sentDate;

    @NotNull(message = "Sent timestamp is required")
    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @PrePersist
    private void prePersistDefaults() {
        if (this.sentDate == null) {
            this.sentDate = LocalDate.now();
        }
        if (this.sentAt == null) {
            this.sentAt = LocalDateTime.now();
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BorrowingReminder that = (BorrowingReminder) o;
        return id != null && Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}

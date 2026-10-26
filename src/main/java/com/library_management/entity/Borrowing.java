package com.library_management.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.Objects;

/**
 * JPA Entity representing a book borrowing record.
 * Maps to the 'borrowings' table in MySQL.
 *
 * Establishes a Many-to-One relationship with Book and Member:
 * - A single Book can have multiple borrowing records over time.
 * - A single Member can borrow multiple books over time.
 */
@Entity
@Table(
    name = "borrowings",
    indexes = {
        @Index(name = "idx_borrowing_member", columnList = "member_id"),
        @Index(name = "idx_borrowing_book", columnList = "book_id"),
        @Index(name = "idx_borrowing_status", columnList = "status"),
        @Index(name = "idx_borrowing_due_date", columnList = "due_date")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Borrowing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Book reference is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @NotNull(message = "Member reference is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @NotNull(message = "Borrow date is required")
    @Column(name = "borrow_date", nullable = false)
    private LocalDate borrowDate;

    @NotNull(message = "Due date is required")
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "return_date")
    private LocalDate returnDate;

    @NotNull(message = "Borrowing status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private BorrowingStatus status;

    /**
     * Entity lifecycle callback executed prior to persistence.
     * Sets automatic defaults if not provided.
     */
    @PrePersist
    private void prePersistDefaults() {
        if (this.borrowDate == null) {
            this.borrowDate = LocalDate.now();
        }
        if (this.status == null) {
            this.status = BorrowingStatus.BORROWED;
        }
    }

    /**
     * Checks if this borrowing has been returned.
     */
    public boolean isReturned() {
        return this.returnDate != null || this.status == BorrowingStatus.RETURNED;
    }

    /**
     * Checks if this borrowing is currently active (not yet returned).
     */
    public boolean isActive() {
        return !isReturned();
    }

    /**
     * Checks if this borrowing is currently overdue.
     */
    public boolean isOverdue() {
        return !isReturned() && this.dueDate != null && LocalDate.now().isAfter(this.dueDate);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Borrowing borrowing = (Borrowing) o;
        return id != null && Objects.equals(id, borrowing.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "Borrowing{" +
                "id=" + id +
                ", bookId=" + (book != null ? book.getId() : null) +
                ", memberId=" + (member != null ? member.getId() : null) +
                ", borrowDate=" + borrowDate +
                ", dueDate=" + dueDate +
                ", returnDate=" + returnDate +
                ", status=" + status +
                '}';
    }
}

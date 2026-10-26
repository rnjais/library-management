package com.library_management.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * JPA Entity representing a fine incurred due to overdue book return.
 * Maps to the 'fines' table in MySQL.
 *
 * Enforces a One-to-One relationship with Borrowing, with a UNIQUE database constraint
 * on 'borrowing_id' to prevent duplicate fines for the same loan.
 */
@Entity
@Table(
    name = "fines",
    indexes = {
        @Index(name = "idx_fine_borrowing", columnList = "borrowing_id", unique = true),
        @Index(name = "idx_fine_status", columnList = "status"),
        @Index(name = "idx_fine_calculated_at", columnList = "calculated_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Fine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Borrowing record reference is required")
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "borrowing_id", nullable = false, unique = true)
    private Borrowing borrowing;

    @NotNull(message = "Fine amount is required")
    @DecimalMin(value = "0.00", message = "Fine amount cannot be negative")
    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @NotNull(message = "Overdue days count is required")
    @Min(value = 0, message = "Overdue days cannot be negative")
    @Column(name = "overdue_days", nullable = false)
    private Integer overdueDays;

    @NotNull(message = "Fine status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private FineStatus status;

    @NotNull(message = "Calculation timestamp is required")
    @Column(name = "calculated_at", nullable = false, updatable = false)
    private LocalDateTime calculatedAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    /**
     * Entity lifecycle callback executed prior to persistence.
     * Sets automatic defaults if not provided.
     */
    @PrePersist
    private void prePersistDefaults() {
        if (this.calculatedAt == null) {
            this.calculatedAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = FineStatus.UNPAID;
        }
    }

    /**
     * Checks if this fine has already been marked as PAID.
     */
    public boolean isPaid() {
        return FineStatus.PAID.equals(this.status);
    }

    /**
     * Checks if this fine is currently UNPAID.
     */
    public boolean isUnpaid() {
        return FineStatus.UNPAID.equals(this.status);
    }

    /**
     * Convenience domain method to transition the fine to PAID status.
     */
    public void markAsPaid() {
        this.status = FineStatus.PAID;
        this.paidAt = LocalDateTime.now();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Fine fine = (Fine) o;
        return id != null && Objects.equals(id, fine.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "Fine{" +
                "id=" + id +
                ", borrowingId=" + (borrowing != null ? borrowing.getId() : null) +
                ", amount=" + amount +
                ", overdueDays=" + overdueDays +
                ", status=" + status +
                ", calculatedAt=" + calculatedAt +
                ", paidAt=" + paidAt +
                '}';
    }
}

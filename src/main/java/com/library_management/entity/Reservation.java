package com.library_management.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * JPA Entity representing a book waitlist reservation.
 * Maps to the 'reservations' table in MySQL.
 */
@Entity
@Table(
    name = "reservations",
    indexes = {
        @Index(name = "idx_reservation_book_status", columnList = "book_id, status"),
        @Index(name = "idx_reservation_member_status", columnList = "member_id, status"),
        @Index(name = "idx_reservation_date", columnList = "reservation_date"),
        @Index(name = "idx_reservation_pickup_deadline", columnList = "pickup_deadline")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reservation {

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

    @NotNull(message = "Reservation date is required")
    @Column(name = "reservation_date", nullable = false)
    private LocalDateTime reservationDate;

    @NotNull(message = "Reservation status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ReservationStatus status;

    @Column(name = "pickup_deadline")
    private LocalDateTime pickupDeadline;

    @Column(name = "fulfilled_at")
    private LocalDateTime fulfilledAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @PrePersist
    protected void onCreate() {
        if (this.reservationDate == null) {
            this.reservationDate = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = ReservationStatus.PENDING;
        }
    }

    public boolean isPending() {
        return this.status == ReservationStatus.PENDING;
    }

    public boolean isReadyForPickup() {
        return this.status == ReservationStatus.READY_FOR_PICKUP;
    }

    public boolean isExpired() {
        return this.status == ReservationStatus.EXPIRED ||
                (this.status == ReservationStatus.READY_FOR_PICKUP &&
                        this.pickupDeadline != null &&
                        LocalDateTime.now().isAfter(this.pickupDeadline));
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Reservation that = (Reservation) o;
        return id != null && Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}

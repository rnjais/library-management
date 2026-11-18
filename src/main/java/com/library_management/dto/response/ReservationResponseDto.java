package com.library_management.dto.response;

import com.library_management.entity.Reservation;
import com.library_management.entity.ReservationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationResponseDto {

    private Long id;

    // Book Information
    private Long bookId;
    private String bookTitle;
    private String bookAuthor;
    private String bookIsbn;
    private String bookCategory;

    // Member Information
    private Long memberId;
    private String memberName;
    private String memberEmail;

    // Reservation Details
    private LocalDateTime reservationDate;
    private ReservationStatus status;
    private LocalDateTime pickupDeadline;
    private LocalDateTime fulfilledAt;
    private LocalDateTime cancelledAt;

    /**
     * Queue position for PENDING reservations (1 = next in line).
     */
    private Long queuePosition;

    public static ReservationResponseDto fromEntity(Reservation reservation) {
        return fromEntity(reservation, null);
    }

    public static ReservationResponseDto fromEntity(Reservation reservation, Long queuePosition) {
        if (reservation == null) {
            return null;
        }

        ReservationResponseDtoBuilder builder = ReservationResponseDto.builder()
                .id(reservation.getId())
                .reservationDate(reservation.getReservationDate())
                .status(reservation.getStatus())
                .pickupDeadline(reservation.getPickupDeadline())
                .fulfilledAt(reservation.getFulfilledAt())
                .cancelledAt(reservation.getCancelledAt())
                .queuePosition(queuePosition);

        if (reservation.getBook() != null) {
            builder.bookId(reservation.getBook().getId())
                    .bookTitle(reservation.getBook().getTitle())
                    .bookAuthor(reservation.getBook().getAuthor())
                    .bookIsbn(reservation.getBook().getIsbn())
                    .bookCategory(reservation.getBook().getCategory());
        }

        if (reservation.getMember() != null) {
            builder.memberId(reservation.getMember().getId())
                    .memberName(reservation.getMember().getFullName())
                    .memberEmail(reservation.getMember().getEmail());
        }

        return builder.build();
    }
}

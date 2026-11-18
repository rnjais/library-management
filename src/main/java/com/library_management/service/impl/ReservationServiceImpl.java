package com.library_management.service.impl;

import com.library_management.config.BorrowingProperties;
import com.library_management.dto.request.ReservationRequestDto;
import com.library_management.dto.response.ReservationResponseDto;
import com.library_management.entity.Book;
import com.library_management.entity.FineStatus;
import com.library_management.entity.Member;
import com.library_management.entity.Reservation;
import com.library_management.entity.ReservationStatus;
import com.library_management.entity.User;
import com.library_management.exception.DuplicateResourceException;
import com.library_management.exception.InactiveMemberException;
import com.library_management.exception.ResourceNotFoundException;
import com.library_management.repository.BookRepository;
import com.library_management.repository.BorrowingRepository;
import com.library_management.repository.FineRepository;
import com.library_management.repository.MemberRepository;
import com.library_management.repository.ReservationRepository;
import com.library_management.service.ReservationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service implementation for managing book reservations and waitlist FIFO queues.
 * Handles concurrency, inventory reservation locks, auto-promotion, and role-based ownership.
 */
@Slf4j
@Service
@Transactional(readOnly = true)
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final BookRepository bookRepository;
    private final MemberRepository memberRepository;
    private final BorrowingRepository borrowingRepository;
    private final FineRepository fineRepository;
    private final BorrowingProperties borrowingProperties;

    public ReservationServiceImpl(
            ReservationRepository reservationRepository,
            BookRepository bookRepository,
            MemberRepository memberRepository,
            BorrowingRepository borrowingRepository,
            FineRepository fineRepository,
            BorrowingProperties borrowingProperties) {
        this.reservationRepository = reservationRepository;
        this.bookRepository = bookRepository;
        this.memberRepository = memberRepository;
        this.borrowingRepository = borrowingRepository;
        this.fineRepository = fineRepository;
        this.borrowingProperties = borrowingProperties;
    }

    /**
     * Places a new reservation for a book.
     */
    @Override
    @Transactional
    public ReservationResponseDto createReservation(ReservationRequestDto request) {
        if (request == null) {
            throw new IllegalArgumentException("Reservation request cannot be null");
        }
        if (request.getBookId() == null) {
            throw new IllegalArgumentException("Book ID cannot be null");
        }

        // 1. Lock book to serialize inventory and waitlist state
        Book book = bookRepository.findByIdWithPessimisticLock(request.getBookId())
                .orElseThrow(() -> new ResourceNotFoundException("Book", "id", request.getBookId()));

        // 2. Resolve member (enforces ownership when caller has ROLE_MEMBER)
        Member member = resolveMemberForReservation(request.getMemberId());

        // 3. Member active check
        if (Boolean.FALSE.equals(member.getActive())) {
            log.warn("Inactive member id={} attempted to reserve book id={}", member.getId(), book.getId());
            throw new InactiveMemberException(member.getId());
        }

        // 4. Block if member has unpaid fines and policy is active
        if (borrowingProperties.isBlockOnUnpaidFines()) {
            long unpaidFinesCount = fineRepository.countByMemberIdAndStatus(member.getId(), FineStatus.UNPAID);
            if (unpaidFinesCount > 0) {
                log.warn("Member id={} blocked from reserving book id={} due to {} unpaid fine(s)",
                        member.getId(), book.getId(), unpaidFinesCount);
                throw new IllegalStateException(
                        String.format("Cannot place reservation: Member has %d unpaid fine(s). Please settle outstanding fines first.",
                                unpaidFinesCount)
                );
            }
        }

        // 5. Prevent reserving a book the member already actively borrows
        if (borrowingRepository.existsByMemberIdAndBookIdAndReturnDateIsNull(member.getId(), book.getId())) {
            log.warn("Member id={} already has an active loan for book id={}", member.getId(), book.getId());
            throw new DuplicateResourceException("You cannot reserve a book that you currently have checked out.");
        }

        // 6. Prevent duplicate active reservations (PENDING or READY_FOR_PICKUP)
        if (reservationRepository.existsByBookIdAndMemberIdAndStatusIn(
                book.getId(), member.getId(), List.of(ReservationStatus.PENDING, ReservationStatus.READY_FOR_PICKUP))) {
            log.warn("Member id={} already has an active reservation for book id={}", member.getId(), book.getId());
            throw new DuplicateResourceException("You already have an active reservation for this book: " + book.getTitle());
        }

        // 7. Verify inventory allows waitlisting (if copies are free and not reserved for pickup, direct borrow is required)
        long readyCount = reservationRepository.countByBookIdAndStatus(book.getId(), ReservationStatus.READY_FOR_PICKUP);
        if (book.getAvailableCopies() > readyCount) {
            log.info("Book id={} has available shelf copies ({}/{} ready reserved). Direct borrowing is possible.",
                    book.getId(), book.getAvailableCopies(), readyCount);
            throw new IllegalStateException(
                    String.format("Copies of '%s' are currently available on the shelf. You can borrow it directly without joining the waitlist.",
                            book.getTitle())
            );
        }

        // 8. Build and save new PENDING reservation
        Reservation reservation = Reservation.builder()
                .book(book)
                .member(member)
                .reservationDate(LocalDateTime.now())
                .status(ReservationStatus.PENDING)
                .build();

        Reservation saved = reservationRepository.save(reservation);
        log.info("Created reservation id={} for member id={} on book id={}", saved.getId(), member.getId(), book.getId());

        // 9. Calculate initial queue position
        long queuePosition = reservationRepository.countByBookIdAndStatusAndReservationDateLessThanEqual(
                book.getId(), ReservationStatus.PENDING, saved.getReservationDate()
        );

        return ReservationResponseDto.fromEntity(saved, queuePosition);
    }

    /**
     * Cancels an active reservation.
     * If the cancelled reservation was READY_FOR_PICKUP, auto-promotes the next PENDING patron in the waitlist.
     */
    @Override
    @Transactional
    public ReservationResponseDto cancelReservation(Long reservationId) {
        if (reservationId == null) {
            throw new IllegalArgumentException("Reservation ID cannot be null");
        }

        Reservation reservation = reservationRepository.findByIdWithPessimisticLock(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", "id", reservationId));

        enforceReservationOwnership(reservation);

        if (reservation.getStatus() == ReservationStatus.CANCELLED ||
            reservation.getStatus() == ReservationStatus.FULFILLED ||
            reservation.getStatus() == ReservationStatus.EXPIRED) {
            throw new IllegalStateException("Cannot cancel reservation with status: " + reservation.getStatus());
        }

        boolean wasReadyForPickup = reservation.getStatus() == ReservationStatus.READY_FOR_PICKUP;

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation.setCancelledAt(LocalDateTime.now());
        Reservation updated = reservationRepository.save(reservation);
        log.info("Cancelled reservation id={}", updated.getId());

        // If the cancelled reservation was holding a copy, promote the next waiting patron
        if (wasReadyForPickup) {
            promoteNextInQueue(reservation.getBook().getId());
        }

        return ReservationResponseDto.fromEntity(updated);
    }

    @Override
    public ReservationResponseDto getReservationById(Long reservationId) {
        if (reservationId == null) {
            throw new IllegalArgumentException("Reservation ID cannot be null");
        }

        Reservation reservation = reservationRepository.findByIdWithDetails(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", "id", reservationId));

        enforceReservationOwnership(reservation);

        Long queuePosition = null;
        if (reservation.getStatus() == ReservationStatus.PENDING) {
            queuePosition = reservationRepository.countByBookIdAndStatusAndReservationDateLessThanEqual(
                    reservation.getBook().getId(), ReservationStatus.PENDING, reservation.getReservationDate()
            );
        }

        return ReservationResponseDto.fromEntity(reservation, queuePosition);
    }

    @Override
    public Page<ReservationResponseDto> getMyReservations(Pageable pageable) {
        Optional<String> memberEmailOpt = getAuthenticatedMemberEmail();
        String email = memberEmailOpt.orElseGet(() -> {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            return auth != null ? auth.getName() : null;
        });

        if (email == null) {
            throw new AccessDeniedException("Access denied: Caller is not authenticated.");
        }

        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("Access denied: No member profile linked to account."));

        Page<Reservation> page = reservationRepository.findByMemberId(member.getId(), pageable);
        return page.map(res -> {
            Long queuePos = null;
            if (res.getStatus() == ReservationStatus.PENDING) {
                queuePos = reservationRepository.countByBookIdAndStatusAndReservationDateLessThanEqual(
                        res.getBook().getId(), ReservationStatus.PENDING, res.getReservationDate()
                );
            }
            return ReservationResponseDto.fromEntity(res, queuePos);
        });
    }

    @Override
    public Page<ReservationResponseDto> getAllReservations(ReservationStatus status, Pageable pageable) {
        Page<Reservation> page;
        if (status != null) {
            page = reservationRepository.findByStatus(status, pageable);
        } else {
            page = reservationRepository.findAll(pageable);
        }

        return page.map(res -> {
            Long queuePos = null;
            if (res.getStatus() == ReservationStatus.PENDING) {
                queuePos = reservationRepository.countByBookIdAndStatusAndReservationDateLessThanEqual(
                        res.getBook().getId(), ReservationStatus.PENDING, res.getReservationDate()
                );
            }
            return ReservationResponseDto.fromEntity(res, queuePos);
        });
    }

    @Override
    public Page<ReservationResponseDto> getBookWaitlist(Long bookId, Pageable pageable) {
        if (!bookRepository.existsById(bookId)) {
            throw new ResourceNotFoundException("Book", "id", bookId);
        }

        Page<Reservation> page = reservationRepository.findByBookId(bookId, pageable);
        return page.map(res -> {
            Long queuePos = null;
            if (res.getStatus() == ReservationStatus.PENDING) {
                queuePos = reservationRepository.countByBookIdAndStatusAndReservationDateLessThanEqual(
                        bookId, ReservationStatus.PENDING, res.getReservationDate()
                );
            }
            return ReservationResponseDto.fromEntity(res, queuePos);
        });
    }

    /**
     * Promotes the oldest PENDING reservation for a book to READY_FOR_PICKUP.
     * Sets a 48-hour pickup deadline.
     */
    private void promoteNextInQueue(Long bookId) {
        Optional<Reservation> nextInLine = reservationRepository.findFirstByBookIdAndStatusOrderByReservationDateAsc(
                bookId, ReservationStatus.PENDING
        );

        if (nextInLine.isPresent()) {
            Reservation next = nextInLine.get();
            next.setStatus(ReservationStatus.READY_FOR_PICKUP);
            next.setPickupDeadline(LocalDateTime.now().plusHours(48));
            reservationRepository.save(next);
            log.info("Promoted waitlist reservation id={} for member id={} on book id={} to READY_FOR_PICKUP",
                    next.getId(), next.getMember().getId(), bookId);
        }
    }

    /**
     * Resolves the Member entity for a reservation request, enforcing role-based ownership.
     */
    private Member resolveMemberForReservation(Long requestedMemberId) {
        Optional<String> memberEmailOpt = getAuthenticatedMemberEmail();
        if (memberEmailOpt.isEmpty()) {
            // ADMIN caller
            if (requestedMemberId == null) {
                throw new IllegalArgumentException("Member ID is required when creating reservation as an administrator");
            }
            return memberRepository.findById(requestedMemberId)
                    .orElseThrow(() -> new ResourceNotFoundException("Member", "id", requestedMemberId));
        }

        // ROLE_MEMBER caller
        Member callerMember = findOrCreateMemberForAuthenticatedCaller(memberEmailOpt.get());
        if (requestedMemberId != null && !callerMember.getId().equals(requestedMemberId)) {
            log.warn("IDOR attempt blocked on createReservation: caller email={} (memberId={}) tried reserving for memberId={}",
                    memberEmailOpt.get(), callerMember.getId(), requestedMemberId);
            throw new AccessDeniedException("Access denied: You can only place reservations for your own membership account.");
        }
        return callerMember;
    }

    /**
     * Enforces ownership of reservation for ROLE_MEMBER callers.
     */
    private void enforceReservationOwnership(Reservation reservation) {
        Optional<String> memberEmailOpt = getAuthenticatedMemberEmail();
        if (memberEmailOpt.isEmpty()) {
            return; // ADMIN has unrestricted access
        }

        Member callerMember = memberRepository.findByEmail(memberEmailOpt.get())
                .orElseThrow(() -> new AccessDeniedException("Access denied: No member profile is linked to your account."));

        if (reservation.getMember() == null || !callerMember.getId().equals(reservation.getMember().getId())) {
            log.warn("IDOR attempt blocked on reservation id={}: caller email={} does not own reservation",
                    reservation.getId(), memberEmailOpt.get());
            throw new AccessDeniedException("Access denied: You can only access your own reservations.");
        }
    }

    private Optional<String> getAuthenticatedMemberEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (isAdmin) {
            return Optional.empty();
        }
        boolean isMember = auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_MEMBER".equals(a.getAuthority()));
        if (!isMember) {
            return Optional.empty();
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof User user) {
            return Optional.ofNullable(user.getEmail());
        }
        if (principal instanceof UserDetails userDetails) {
            return Optional.ofNullable(userDetails.getUsername());
        }
        return Optional.ofNullable(auth.getName());
    }

    private Member findOrCreateMemberForAuthenticatedCaller(String email) {
        return memberRepository.findByEmail(email)
                .orElseGet(() -> {
                    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                    String fullName = (auth != null && auth.getPrincipal() instanceof User user && user.getName() != null)
                            ? user.getName().trim()
                            : "Library Member";
                    String[] parts = fullName.split("\\s+", 2);
                    String firstName = parts[0];
                    String lastName = parts.length > 1 && !parts[1].isBlank() ? parts[1] : "-";

                    return memberRepository.save(Member.builder()
                            .firstName(firstName)
                            .lastName(lastName)
                            .email(email)
                            .phoneNumber("N/A")
                            .membershipDate(LocalDate.now())
                            .active(true)
                            .build());
                });
    }
}

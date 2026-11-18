package com.library_management.service.impl;

import com.library_management.config.BorrowingProperties;
import com.library_management.dto.request.ReservationRequestDto;
import com.library_management.dto.response.ReservationResponseDto;
import com.library_management.entity.*;
import com.library_management.exception.DuplicateResourceException;
import com.library_management.exception.InactiveMemberException;
import com.library_management.exception.ResourceNotFoundException;
import com.library_management.repository.BookRepository;
import com.library_management.repository.BorrowingRepository;
import com.library_management.repository.FineRepository;
import com.library_management.repository.MemberRepository;
import com.library_management.repository.ReservationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReservationServiceImplTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private BookRepository bookRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private BorrowingRepository borrowingRepository;

    @Mock
    private FineRepository fineRepository;

    @Spy
    private BorrowingProperties borrowingProperties = new BorrowingProperties();

    @InjectMocks
    private ReservationServiceImpl reservationService;

    private Book sampleBook;
    private Member sampleMember;
    private Reservation sampleReservation;

    @BeforeEach
    void setUp() {
        sampleBook = Book.builder()
                .id(1L)
                .title("Effective Java")
                .author("Joshua Bloch")
                .isbn("978-0134685991")
                .category("Programming")
                .totalCopies(3)
                .availableCopies(0)
                .build();

        sampleMember = Member.builder()
                .id(10L)
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .active(true)
                .build();

        sampleReservation = Reservation.builder()
                .id(100L)
                .book(sampleBook)
                .member(sampleMember)
                .reservationDate(LocalDateTime.now())
                .status(ReservationStatus.PENDING)
                .build();

        // Clear security context before each test
        SecurityContextHolder.clearContext();
    }

    private void authenticateAsAdmin() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "admin@library.com", "password", List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private void authenticateAsMember(Member member) {
        User user = User.builder()
                .id(member.getId())
                .email(member.getEmail())
                .name(member.getFullName())
                .role(Role.MEMBER)
                .build();
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                user, "password", List.of(new SimpleGrantedAuthority("ROLE_MEMBER"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("Should successfully create reservation when 0 copies available")
    void shouldCreateReservationSuccessfully_WhenNoCopiesAvailable() {
        authenticateAsMember(sampleMember);
        ReservationRequestDto request = new ReservationRequestDto(1L, 10L);

        when(bookRepository.findByIdWithPessimisticLock(1L)).thenReturn(Optional.of(sampleBook));
        when(memberRepository.findByEmail(sampleMember.getEmail())).thenReturn(Optional.of(sampleMember));
        when(fineRepository.countByMemberIdAndStatus(10L, FineStatus.UNPAID)).thenReturn(0L);
        when(borrowingRepository.existsByMemberIdAndBookIdAndReturnDateIsNull(10L, 1L)).thenReturn(false);
        when(reservationRepository.existsByBookIdAndMemberIdAndStatusIn(eq(1L), eq(10L), any())).thenReturn(false);
        when(reservationRepository.countByBookIdAndStatus(1L, ReservationStatus.READY_FOR_PICKUP)).thenReturn(0L);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> {
            Reservation r = invocation.getArgument(0);
            r.setId(101L);
            return r;
        });
        when(reservationRepository.countByBookIdAndStatusAndReservationDateLessThanEqual(eq(1L), eq(ReservationStatus.PENDING), any()))
                .thenReturn(1L);

        ReservationResponseDto response = reservationService.createReservation(request);

        assertNotNull(response);
        assertEquals(101L, response.getId());
        assertEquals(ReservationStatus.PENDING, response.getStatus());
        assertEquals(1L, response.getQueuePosition());
        assertEquals("Effective Java", response.getBookTitle());
    }

    @Test
    @DisplayName("Should fail reservation when copies are freely available on shelf")
    void shouldFailReservation_WhenShelfCopiesAreAvailable() {
        authenticateAsMember(sampleMember);
        sampleBook.setAvailableCopies(2);
        ReservationRequestDto request = new ReservationRequestDto(1L, 10L);

        when(bookRepository.findByIdWithPessimisticLock(1L)).thenReturn(Optional.of(sampleBook));
        when(memberRepository.findByEmail(sampleMember.getEmail())).thenReturn(Optional.of(sampleMember));
        when(fineRepository.countByMemberIdAndStatus(10L, FineStatus.UNPAID)).thenReturn(0L);
        when(borrowingRepository.existsByMemberIdAndBookIdAndReturnDateIsNull(10L, 1L)).thenReturn(false);
        when(reservationRepository.existsByBookIdAndMemberIdAndStatusIn(eq(1L), eq(10L), any())).thenReturn(false);
        when(reservationRepository.countByBookIdAndStatus(1L, ReservationStatus.READY_FOR_PICKUP)).thenReturn(0L);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                reservationService.createReservation(request)
        );
        assertTrue(ex.getMessage().contains("currently available on the shelf"));
    }

    @Test
    @DisplayName("Should block reservation if member has unpaid fines")
    void shouldFailReservation_WhenMemberHasUnpaidFines() {
        authenticateAsMember(sampleMember);
        ReservationRequestDto request = new ReservationRequestDto(1L, 10L);

        when(bookRepository.findByIdWithPessimisticLock(1L)).thenReturn(Optional.of(sampleBook));
        when(memberRepository.findByEmail(sampleMember.getEmail())).thenReturn(Optional.of(sampleMember));
        when(fineRepository.countByMemberIdAndStatus(10L, FineStatus.UNPAID)).thenReturn(1L);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                reservationService.createReservation(request)
        );
        assertTrue(ex.getMessage().contains("unpaid fine"));
    }

    @Test
    @DisplayName("Should block duplicate active reservation for same book")
    void shouldFailReservation_WhenDuplicateReservationExists() {
        authenticateAsMember(sampleMember);
        ReservationRequestDto request = new ReservationRequestDto(1L, 10L);

        when(bookRepository.findByIdWithPessimisticLock(1L)).thenReturn(Optional.of(sampleBook));
        when(memberRepository.findByEmail(sampleMember.getEmail())).thenReturn(Optional.of(sampleMember));
        when(fineRepository.countByMemberIdAndStatus(10L, FineStatus.UNPAID)).thenReturn(0L);
        when(borrowingRepository.existsByMemberIdAndBookIdAndReturnDateIsNull(10L, 1L)).thenReturn(false);
        when(reservationRepository.existsByBookIdAndMemberIdAndStatusIn(eq(1L), eq(10L), any())).thenReturn(true);

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class, () ->
                reservationService.createReservation(request)
        );
        assertTrue(ex.getMessage().contains("already have an active reservation"));
    }

    @Test
    @DisplayName("Should block reservation if member already has book checked out")
    void shouldFailReservation_WhenMemberAlreadyBorrowedBook() {
        authenticateAsMember(sampleMember);
        ReservationRequestDto request = new ReservationRequestDto(1L, 10L);

        when(bookRepository.findByIdWithPessimisticLock(1L)).thenReturn(Optional.of(sampleBook));
        when(memberRepository.findByEmail(sampleMember.getEmail())).thenReturn(Optional.of(sampleMember));
        when(fineRepository.countByMemberIdAndStatus(10L, FineStatus.UNPAID)).thenReturn(0L);
        when(borrowingRepository.existsByMemberIdAndBookIdAndReturnDateIsNull(10L, 1L)).thenReturn(true);

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class, () ->
                reservationService.createReservation(request)
        );
        assertTrue(ex.getMessage().contains("currently have checked out"));
    }

    @Test
    @DisplayName("Should cancel PENDING reservation successfully")
    void shouldCancelPendingReservationSuccessfully() {
        authenticateAsMember(sampleMember);

        when(reservationRepository.findByIdWithPessimisticLock(100L)).thenReturn(Optional.of(sampleReservation));
        when(memberRepository.findByEmail(sampleMember.getEmail())).thenReturn(Optional.of(sampleMember));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReservationResponseDto response = reservationService.cancelReservation(100L);

        assertNotNull(response);
        assertEquals(ReservationStatus.CANCELLED, response.getStatus());
        assertNotNull(response.getCancelledAt());
        verify(reservationRepository, never()).findFirstByBookIdAndStatusOrderByReservationDateAsc(any(), any());
    }

    @Test
    @DisplayName("Should cancel READY_FOR_PICKUP reservation and auto-promote next in line")
    void shouldCancelReadyReservation_AndPromoteNextInLine() {
        authenticateAsAdmin();
        sampleReservation.setStatus(ReservationStatus.READY_FOR_PICKUP);
        sampleReservation.setPickupDeadline(LocalDateTime.now().plusHours(24));

        Member nextMember = Member.builder().id(20L).firstName("Bob").lastName("Jones").email("bob@example.com").build();
        Reservation nextPending = Reservation.builder()
                .id(102L)
                .book(sampleBook)
                .member(nextMember)
                .reservationDate(LocalDateTime.now().minusHours(1))
                .status(ReservationStatus.PENDING)
                .build();

        when(reservationRepository.findByIdWithPessimisticLock(100L)).thenReturn(Optional.of(sampleReservation));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(reservationRepository.findFirstByBookIdAndStatusOrderByReservationDateAsc(1L, ReservationStatus.PENDING))
                .thenReturn(Optional.of(nextPending));

        ReservationResponseDto response = reservationService.cancelReservation(100L);

        assertEquals(ReservationStatus.CANCELLED, response.getStatus());
        assertEquals(ReservationStatus.READY_FOR_PICKUP, nextPending.getStatus());
        assertNotNull(nextPending.getPickupDeadline());
        verify(reservationRepository, times(2)).save(any(Reservation.class));
    }

    @Test
    @DisplayName("Should reject cancellation of already cancelled reservation")
    void shouldFailCancel_WhenAlreadyCancelled() {
        authenticateAsAdmin();
        sampleReservation.setStatus(ReservationStatus.CANCELLED);

        when(reservationRepository.findByIdWithPessimisticLock(100L)).thenReturn(Optional.of(sampleReservation));

        assertThrows(IllegalStateException.class, () ->
                reservationService.cancelReservation(100L)
        );
    }

    @Test
    @DisplayName("Should prevent member from cancelling another member's reservation (IDOR)")
    void shouldPreventMemberFromCancellingOtherMemberReservation() {
        Member otherMember = Member.builder().id(999L).email("attacker@example.com").build();
        authenticateAsMember(otherMember);

        when(reservationRepository.findByIdWithPessimisticLock(100L)).thenReturn(Optional.of(sampleReservation));
        when(memberRepository.findByEmail(otherMember.getEmail())).thenReturn(Optional.of(otherMember));

        assertThrows(AccessDeniedException.class, () ->
                reservationService.cancelReservation(100L)
        );
    }

    @Test
    @DisplayName("Should retrieve waitlist queue for a book")
    void shouldRetrieveBookWaitlist() {
        Pageable pageable = PageRequest.of(0, 10);
        when(bookRepository.existsById(1L)).thenReturn(true);
        when(reservationRepository.findByBookId(1L, pageable))
                .thenReturn(new PageImpl<>(List.of(sampleReservation), pageable, 1));
        when(reservationRepository.countByBookIdAndStatusAndReservationDateLessThanEqual(eq(1L), eq(ReservationStatus.PENDING), any()))
                .thenReturn(1L);

        Page<ReservationResponseDto> result = reservationService.getBookWaitlist(1L, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(1L, result.getContent().get(0).getQueuePosition());
    }
}

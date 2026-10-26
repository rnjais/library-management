package com.library_management.service.impl;

import com.library_management.config.FineProperties;
import com.library_management.dto.response.FineResponseDto;
import com.library_management.dto.response.MemberUnpaidFineResponseDto;
import com.library_management.entity.*;
import com.library_management.exception.FineAlreadyPaidException;
import com.library_management.exception.ResourceNotFoundException;
import com.library_management.repository.FineRepository;
import com.library_management.repository.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FineServiceImplTest {

    @Mock
    private FineRepository fineRepository;

    @Mock
    private FineProperties fineProperties;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private FineServiceImpl fineService;

    private Book sampleBook;
    private Member sampleMember;
    private Borrowing onTimeBorrowing;
    private Borrowing overdueBorrowing;
    private Fine sampleFine;

    @BeforeEach
    void setUp() {
        sampleBook = Book.builder()
                .id(1L)
                .title("Effective Java")
                .author("Joshua Bloch")
                .isbn("978-0134685991")
                .build();

        sampleMember = Member.builder()
                .id(10L)
                .firstName("Bob")
                .lastName("Jones")
                .email("bob@example.com")
                .build();

        onTimeBorrowing = Borrowing.builder()
                .id(101L)
                .book(sampleBook)
                .member(sampleMember)
                .borrowDate(LocalDate.of(2026, 10, 1))
                .dueDate(LocalDate.of(2026, 10, 15))
                .returnDate(LocalDate.of(2026, 10, 15))
                .status(BorrowingStatus.RETURNED)
                .build();

        overdueBorrowing = Borrowing.builder()
                .id(102L)
                .book(sampleBook)
                .member(sampleMember)
                .borrowDate(LocalDate.of(2026, 10, 1))
                .dueDate(LocalDate.of(2026, 10, 15))
                .returnDate(LocalDate.of(2026, 10, 20)) // 5 days overdue
                .status(BorrowingStatus.RETURNED)
                .build();

        sampleFine = Fine.builder()
                .id(501L)
                .borrowing(overdueBorrowing)
                .amount(new BigDecimal("25.00"))
                .overdueDays(5)
                .status(FineStatus.UNPAID)
                .calculatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void shouldNotCalculateFineWhenReturnedOnTime() {
        FineResponseDto response = fineService.calculateFineForReturn(onTimeBorrowing);

        assertNull(response);
        verify(fineRepository, never()).save(any(Fine.class));
    }

    @Test
    void shouldCalculateFineWhenReturnedOverdue() {
        when(fineProperties.getDailyRate()).thenReturn(new BigDecimal("5.00"));
        when(fineProperties.getCurrency()).thenReturn("INR");
        when(fineRepository.existsByBorrowingId(102L)).thenReturn(false);
        when(fineRepository.save(any(Fine.class))).thenReturn(sampleFine);

        FineResponseDto response = fineService.calculateFineForReturn(overdueBorrowing);

        assertNotNull(response);
        assertEquals(501L, response.getId());
        assertEquals(new BigDecimal("25.00"), response.getAmount());
        assertEquals(5, response.getOverdueDays());
        assertEquals(FineStatus.UNPAID, response.getStatus());
        verify(fineRepository, times(1)).save(any(Fine.class));
        verify(eventPublisher, times(1)).publishEvent(any(com.library_management.event.FineCreatedEvent.class));
    }

    @Test
    void shouldAvoidDuplicateFineCalculation() {
        when(fineRepository.existsByBorrowingId(102L)).thenReturn(true);
        when(fineRepository.findByBorrowingId(102L)).thenReturn(Optional.of(sampleFine));

        FineResponseDto response = fineService.calculateFineForReturn(overdueBorrowing);

        assertNotNull(response);
        assertEquals(501L, response.getId());
        verify(fineRepository, never()).save(any(Fine.class));
    }

    @Test
    void shouldPayFineSuccessfully() {
        when(fineRepository.findById(501L)).thenReturn(Optional.of(sampleFine));
        when(fineRepository.save(any(Fine.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FineResponseDto response = fineService.payFine(501L, null);

        assertNotNull(response);
        assertEquals(FineStatus.PAID, response.getStatus());
        assertNotNull(response.getPaidAt());
        verify(fineRepository, times(1)).save(sampleFine);
        verify(eventPublisher, times(1)).publishEvent(any(com.library_management.event.FinePaidEvent.class));
    }

    @Test
    void shouldRejectPayFineWhenAlreadyPaid() {
        sampleFine.setStatus(FineStatus.PAID);
        sampleFine.setPaidAt(LocalDateTime.now());

        when(fineRepository.findById(501L)).thenReturn(Optional.of(sampleFine));

        assertThrows(FineAlreadyPaidException.class, () -> fineService.payFine(501L, null));
        verify(fineRepository, never()).save(any(Fine.class));
    }

    @Test
    void shouldRejectPayFineWhenNotFound() {
        when(fineRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> fineService.payFine(999L, null));
    }

    @Test
    void shouldGetMemberUnpaidFineTotal() {
        when(memberRepository.findById(10L)).thenReturn(Optional.of(sampleMember));
        when(fineRepository.sumAmountByMemberIdAndStatus(10L, FineStatus.UNPAID))
                .thenReturn(new BigDecimal("35.00"));
        when(fineRepository.countByMemberIdAndStatus(10L, FineStatus.UNPAID))
                .thenReturn(2L);

        MemberUnpaidFineResponseDto summary = fineService.getMemberUnpaidFineTotal(10L);

        assertNotNull(summary);
        assertEquals(10L, summary.getMemberId());
        assertEquals(new BigDecimal("35.00"), summary.getTotalUnpaidAmount());
        assertEquals(2L, summary.getUnpaidFinesCount());
    }
}

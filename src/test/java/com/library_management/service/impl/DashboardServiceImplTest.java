package com.library_management.service.impl;

import com.library_management.dto.response.*;
import com.library_management.entity.*;
import com.library_management.repository.BookRepository;
import com.library_management.repository.BorrowingRepository;
import com.library_management.repository.FineRepository;
import com.library_management.repository.MemberRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardServiceImplTest {

    @Mock
    private BookRepository bookRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private BorrowingRepository borrowingRepository;

    @Mock
    private FineRepository fineRepository;

    @InjectMocks
    private DashboardServiceImpl dashboardService;

    @Test
    void shouldCompileDashboardSummarySuccessfully() {
        when(bookRepository.count()).thenReturn(150L);
        when(bookRepository.sumTotalCopies()).thenReturn(500L);
        when(bookRepository.sumAvailableCopies()).thenReturn(420L);

        when(memberRepository.count()).thenReturn(200L);
        when(memberRepository.countByActiveTrue()).thenReturn(180L);
        when(memberRepository.countByActiveFalse()).thenReturn(20L);

        when(borrowingRepository.countByReturnDateIsNull()).thenReturn(80L);
        when(borrowingRepository.countOverdueBorrowings(any(LocalDate.class))).thenReturn(12L);

        when(fineRepository.sumAmountByStatus(FineStatus.UNPAID)).thenReturn(new BigDecimal("150.00"));
        when(fineRepository.countByStatus(FineStatus.UNPAID)).thenReturn(6L);
        when(fineRepository.sumAmountByStatus(FineStatus.PAID)).thenReturn(new BigDecimal("350.00"));
        when(fineRepository.countByStatus(FineStatus.PAID)).thenReturn(14L);

        DashboardSummaryDto summary = dashboardService.getDashboardSummary();

        assertNotNull(summary);
        assertEquals(150L, summary.getTotalBooks());
        assertEquals(500L, summary.getTotalBookCopies());
        assertEquals(420L, summary.getAvailableBookCopies());
        assertEquals(80L, summary.getBorrowedBookCopies());

        assertEquals(200L, summary.getTotalMembers());
        assertEquals(180L, summary.getActiveMembers());
        assertEquals(20L, summary.getInactiveMembers());

        assertEquals(80L, summary.getCurrentlyBorrowedBooks());
        assertEquals(12L, summary.getOverdueBorrowings());

        assertEquals(new BigDecimal("150.00"), summary.getTotalUnpaidFines());
        assertEquals(6L, summary.getUnpaidFineCount());
        assertEquals(new BigDecimal("350.00"), summary.getTotalPaidFines());
        assertEquals(14L, summary.getPaidFineCount());

        verify(bookRepository, times(1)).count();
        verify(bookRepository, times(1)).sumTotalCopies();
        verify(bookRepository, times(1)).sumAvailableCopies();
        verify(memberRepository, times(1)).count();
        verify(borrowingRepository, times(1)).countByReturnDateIsNull();
        verify(fineRepository, times(1)).sumAmountByStatus(FineStatus.UNPAID);
    }

    @Test
    void shouldHandleEmptyDatabaseGracefully() {
        when(bookRepository.count()).thenReturn(0L);
        when(bookRepository.sumTotalCopies()).thenReturn(0L);
        when(bookRepository.sumAvailableCopies()).thenReturn(0L);

        when(memberRepository.count()).thenReturn(0L);
        when(memberRepository.countByActiveTrue()).thenReturn(0L);
        when(memberRepository.countByActiveFalse()).thenReturn(0L);

        when(borrowingRepository.countByReturnDateIsNull()).thenReturn(0L);
        when(borrowingRepository.countOverdueBorrowings(any(LocalDate.class))).thenReturn(0L);

        when(fineRepository.sumAmountByStatus(FineStatus.UNPAID)).thenReturn(null);
        when(fineRepository.countByStatus(FineStatus.UNPAID)).thenReturn(0L);
        when(fineRepository.sumAmountByStatus(FineStatus.PAID)).thenReturn(null);
        when(fineRepository.countByStatus(FineStatus.PAID)).thenReturn(0L);

        DashboardSummaryDto summary = dashboardService.getDashboardSummary();

        assertNotNull(summary);
        assertEquals(0L, summary.getTotalBooks());
        assertEquals(0L, summary.getTotalBookCopies());
        assertEquals(0L, summary.getAvailableBookCopies());
        assertEquals(0L, summary.getBorrowedBookCopies());
        assertEquals(0L, summary.getTotalMembers());
        assertEquals(0L, summary.getActiveMembers());
        assertEquals(0L, summary.getInactiveMembers());
        assertEquals(0L, summary.getCurrentlyBorrowedBooks());
        assertEquals(0L, summary.getOverdueBorrowings());
        assertEquals(BigDecimal.ZERO, summary.getTotalUnpaidFines());
        assertEquals(0L, summary.getUnpaidFineCount());
        assertEquals(BigDecimal.ZERO, summary.getTotalPaidFines());
        assertEquals(0L, summary.getPaidFineCount());
    }

    @Test
    void shouldGetBookReportSuccessfully() {
        when(bookRepository.count()).thenReturn(50L);
        when(bookRepository.sumTotalCopies()).thenReturn(200L);
        when(bookRepository.sumAvailableCopies()).thenReturn(150L);

        Object[] row1 = new Object[]{"Fiction", 20L, 80L, 60L};
        Object[] row2 = new Object[]{"Science", 30L, 120L, 90L};
        when(bookRepository.aggregateByCategory()).thenReturn(List.of(row1, row2));

        BookReportDto report = dashboardService.getBookReport();

        assertNotNull(report);
        assertEquals(50L, report.getTotalBooks());
        assertEquals(200L, report.getTotalCopies());
        assertEquals(150L, report.getAvailableCopies());
        assertEquals(50L, report.getBorrowedCopies());
        assertEquals(2, report.getCategoryBreakdown().size());
        assertEquals("Fiction", report.getCategoryBreakdown().get(0).getCategory());
        assertEquals(20L, report.getCategoryBreakdown().get(0).getBookCount());
        assertEquals(80L, report.getCategoryBreakdown().get(0).getTotalCopies());
        assertEquals(60L, report.getCategoryBreakdown().get(0).getAvailableCopies());
        assertEquals(20L, report.getCategoryBreakdown().get(0).getBorrowedCopies());
    }

    @Test
    void shouldGetMemberReportSuccessfully() {
        when(memberRepository.count()).thenReturn(100L);
        when(memberRepository.countByActiveTrue()).thenReturn(90L);
        when(memberRepository.countByActiveFalse()).thenReturn(10L);

        Member member = Member.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .email("john@example.com")
                .phoneNumber("1234567890")
                .active(true)
                .membershipDate(LocalDate.now())
                .build();

        Page<Member> memberPage = new PageImpl<>(List.of(member));
        Pageable pageable = PageRequest.of(0, 10);
        when(memberRepository.searchMembersReport(eq(true), any(), any(), eq(pageable))).thenReturn(memberPage);

        MemberReportDto report = dashboardService.getMemberReport(true, null, null, pageable);

        assertNotNull(report);
        assertEquals(100L, report.getTotalMembers());
        assertEquals(90L, report.getActiveMembers());
        assertEquals(10L, report.getInactiveMembers());
        assertEquals(1, report.getMembers().getContent().size());
        assertEquals("john@example.com", report.getMembers().getContent().get(0).getEmail());
    }

    @Test
    void shouldGetBorrowingReportSuccessfully() {
        when(borrowingRepository.count()).thenReturn(50L);
        when(borrowingRepository.countByReturnDateIsNull()).thenReturn(20L);
        when(borrowingRepository.countByStatus(BorrowingStatus.RETURNED)).thenReturn(30L);
        when(borrowingRepository.countOverdueBorrowings(any(LocalDate.class))).thenReturn(5L);

        Book book = Book.builder().id(1L).title("Test Book").build();
        Member member = Member.builder().id(1L).firstName("John").lastName("Doe").build();
        Borrowing borrowing = Borrowing.builder()
                .id(101L)
                .book(book)
                .member(member)
                .borrowDate(LocalDate.now().minusDays(5))
                .dueDate(LocalDate.now().plusDays(9))
                .status(BorrowingStatus.BORROWED)
                .build();

        Page<Borrowing> borrowingPage = new PageImpl<>(List.of(borrowing));
        Pageable pageable = PageRequest.of(0, 10);
        when(borrowingRepository.searchBorrowingsReport(eq(BorrowingStatus.BORROWED), any(), any(), eq(pageable)))
                .thenReturn(borrowingPage);

        BorrowingReportDto report = dashboardService.getBorrowingReport(BorrowingStatus.BORROWED, null, null, pageable);

        assertNotNull(report);
        assertEquals(50L, report.getTotalBorrowings());
        assertEquals(20L, report.getCurrentlyBorrowed());
        assertEquals(30L, report.getReturnedBorrowings());
        assertEquals(5L, report.getOverdueBorrowings());
        assertEquals(1, report.getBorrowings().getContent().size());
    }

    @Test
    void shouldGetOverdueReportSuccessfully() {
        Book book = Book.builder().id(1L).title("Overdue Book").build();
        Member member = Member.builder().id(1L).firstName("Jane").lastName("Doe").build();
        Borrowing overdueBorrowing = Borrowing.builder()
                .id(102L)
                .book(book)
                .member(member)
                .borrowDate(LocalDate.now().minusDays(20))
                .dueDate(LocalDate.now().minusDays(6))
                .status(BorrowingStatus.OVERDUE)
                .build();

        Page<Borrowing> overduePage = new PageImpl<>(List.of(overdueBorrowing));
        Pageable pageable = PageRequest.of(0, 10);
        when(borrowingRepository.findOverdueBorrowings(any(LocalDate.class), eq(pageable))).thenReturn(overduePage);

        PagedResponse<BorrowingResponseDto> report = dashboardService.getOverdueReport(pageable);

        assertNotNull(report);
        assertEquals(1, report.getContent().size());
        assertEquals(102L, report.getContent().get(0).getId());
    }

    @Test
    void shouldGetFineReportSuccessfully() {
        when(fineRepository.sumTotalAmount()).thenReturn(new BigDecimal("500.00"));
        when(fineRepository.sumAmountByStatus(FineStatus.PAID)).thenReturn(new BigDecimal("300.00"));
        when(fineRepository.sumAmountByStatus(FineStatus.UNPAID)).thenReturn(new BigDecimal("200.00"));
        when(fineRepository.countByStatus(FineStatus.PAID)).thenReturn(10L);
        when(fineRepository.countByStatus(FineStatus.UNPAID)).thenReturn(5L);

        Book book = Book.builder().id(1L).title("Book").build();
        Member member = Member.builder().id(1L).firstName("A").lastName("B").build();
        Borrowing borrowing = Borrowing.builder().id(1L).book(book).member(member).build();
        Fine fine = Fine.builder()
                .id(501L)
                .borrowing(borrowing)
                .amount(new BigDecimal("25.00"))
                .overdueDays(5)
                .status(FineStatus.UNPAID)
                .calculatedAt(LocalDateTime.now())
                .build();

        Page<Fine> finePage = new PageImpl<>(List.of(fine));
        Pageable pageable = PageRequest.of(0, 10);
        when(fineRepository.searchFinesReport(eq(FineStatus.UNPAID), any(), any(), eq(pageable))).thenReturn(finePage);

        FineReportDto report = dashboardService.getFineReport(FineStatus.UNPAID, null, null, pageable);

        assertNotNull(report);
        assertEquals(new BigDecimal("500.00"), report.getTotalFineAmount());
        assertEquals(new BigDecimal("300.00"), report.getPaidFineAmount());
        assertEquals(new BigDecimal("200.00"), report.getUnpaidFineAmount());
        assertEquals(15L, report.getTotalFineCount());
        assertEquals(10L, report.getPaidFineCount());
        assertEquals(5L, report.getUnpaidFineCount());
        assertEquals(1, report.getFines().getContent().size());
    }

    @Test
    void shouldRejectInvalidDateRange() {
        LocalDate startDate = LocalDate.of(2026, 12, 1);
        LocalDate endDate = LocalDate.of(2026, 11, 1);
        Pageable pageable = PageRequest.of(0, 10);

        assertThrows(IllegalArgumentException.class, () ->
                dashboardService.getMemberReport(null, startDate, endDate, pageable));
        assertThrows(IllegalArgumentException.class, () ->
                dashboardService.getBorrowingReport(null, startDate, endDate, pageable));
        assertThrows(IllegalArgumentException.class, () ->
                dashboardService.getFineReport(null, startDate, endDate, pageable));
    }
}

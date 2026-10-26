package com.library_management.service.impl;

import com.library_management.dto.response.*;
import com.library_management.entity.BorrowingStatus;
import com.library_management.entity.FineStatus;
import com.library_management.repository.BookRepository;
import com.library_management.repository.BorrowingRepository;
import com.library_management.repository.FineRepository;
import com.library_management.repository.MemberRepository;
import com.library_management.service.DashboardService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Service implementation for compiling administrator dashboard statistics and reports.
 * Uses efficient database aggregation queries and guarantees non-null default values.
 */
@Slf4j
@Service
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final BookRepository bookRepository;
    private final MemberRepository memberRepository;
    private final BorrowingRepository borrowingRepository;
    private final FineRepository fineRepository;

    public DashboardServiceImpl(
            BookRepository bookRepository,
            MemberRepository memberRepository,
            BorrowingRepository borrowingRepository,
            FineRepository fineRepository) {
        this.bookRepository = bookRepository;
        this.memberRepository = memberRepository;
        this.borrowingRepository = borrowingRepository;
        this.fineRepository = fineRepository;
    }

    @Override
    public DashboardSummaryDto getDashboardSummary() {
        log.info("Compiling library dashboard summary metrics");

        // 1. Book Catalog Metrics
        long totalBooks = bookRepository.count();
        long totalBookCopies = bookRepository.sumTotalCopies();
        long availableBookCopies = bookRepository.sumAvailableCopies();
        long borrowedBookCopies = Math.max(0, totalBookCopies - availableBookCopies);

        // 2. Member Patron Metrics
        long totalMembers = memberRepository.count();
        long activeMembers = memberRepository.countByActiveTrue();
        long inactiveMembers = memberRepository.countByActiveFalse();

        // 3. Borrowing & Circulation Metrics
        long currentlyBorrowedBooks = borrowingRepository.countByReturnDateIsNull();
        long overdueBorrowings = borrowingRepository.countOverdueBorrowings(LocalDate.now());

        // 4. Fine & Financial Metrics
        BigDecimal totalUnpaidFines = fineRepository.sumAmountByStatus(FineStatus.UNPAID);
        long unpaidFineCount = fineRepository.countByStatus(FineStatus.UNPAID);

        BigDecimal totalPaidFines = fineRepository.sumAmountByStatus(FineStatus.PAID);
        long paidFineCount = fineRepository.countByStatus(FineStatus.PAID);

        // Safe null fallbacks for BigDecimal amounts
        BigDecimal safeUnpaidFines = totalUnpaidFines != null ? totalUnpaidFines : BigDecimal.ZERO;
        BigDecimal safePaidFines = totalPaidFines != null ? totalPaidFines : BigDecimal.ZERO;

        log.debug("Dashboard summary compiled: books={}, members={}, loans={}, overdue={}, unpaidFines={}",
                totalBooks, totalMembers, currentlyBorrowedBooks, overdueBorrowings, safeUnpaidFines);

        return DashboardSummaryDto.builder()
                .totalBooks(totalBooks)
                .totalBookCopies(totalBookCopies)
                .availableBookCopies(availableBookCopies)
                .borrowedBookCopies(borrowedBookCopies)
                .totalMembers(totalMembers)
                .activeMembers(activeMembers)
                .inactiveMembers(inactiveMembers)
                .currentlyBorrowedBooks(currentlyBorrowedBooks)
                .overdueBorrowings(overdueBorrowings)
                .totalUnpaidFines(safeUnpaidFines)
                .unpaidFineCount(unpaidFineCount)
                .totalPaidFines(safePaidFines)
                .paidFineCount(paidFineCount)
                .build();
    }

    @Override
    public BookReportDto getBookReport() {
        log.info("Generating book inventory report");
        long totalBooks = bookRepository.count();
        long totalCopies = bookRepository.sumTotalCopies();
        long availableCopies = bookRepository.sumAvailableCopies();
        long borrowedCopies = Math.max(0, totalCopies - availableCopies);

        List<BookReportDto.CategoryStatDto> categoryStats = bookRepository.aggregateByCategory().stream()
                .map(row -> {
                    String category = row[0] != null ? (String) row[0] : "Uncategorized";
                    long count = row[1] != null ? ((Number) row[1]).longValue() : 0L;
                    long tot = row[2] != null ? ((Number) row[2]).longValue() : 0L;
                    long avail = row[3] != null ? ((Number) row[3]).longValue() : 0L;
                    return BookReportDto.CategoryStatDto.builder()
                            .category(category)
                            .bookCount(count)
                            .totalCopies(tot)
                            .availableCopies(avail)
                            .borrowedCopies(Math.max(0, tot - avail))
                            .build();
                })
                .toList();

        return BookReportDto.builder()
                .totalBooks(totalBooks)
                .totalCopies(totalCopies)
                .availableCopies(availableCopies)
                .borrowedCopies(borrowedCopies)
                .categoryBreakdown(categoryStats)
                .build();
    }

    @Override
    public MemberReportDto getMemberReport(Boolean active, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        validateDateRange(startDate, endDate);
        log.info("Generating member patronage report (active={}, startDate={}, endDate={})", active, startDate, endDate);

        long totalMembers = memberRepository.count();
        long activeMembers = memberRepository.countByActiveTrue();
        long inactiveMembers = memberRepository.countByActiveFalse();

        Page<MemberResponseDto> membersPage = memberRepository
                .searchMembersReport(active, startDate, endDate, pageable)
                .map(MemberResponseDto::fromEntity);

        return MemberReportDto.builder()
                .totalMembers(totalMembers)
                .activeMembers(activeMembers)
                .inactiveMembers(inactiveMembers)
                .members(PagedResponse.fromPage(membersPage))
                .build();
    }

    @Override
    public BorrowingReportDto getBorrowingReport(BorrowingStatus status, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        validateDateRange(startDate, endDate);
        log.info("Generating borrowing report (status={}, startDate={}, endDate={})", status, startDate, endDate);

        long totalBorrowings = borrowingRepository.count();
        long currentlyBorrowed = borrowingRepository.countByReturnDateIsNull();
        long returnedBorrowings = borrowingRepository.countByStatus(BorrowingStatus.RETURNED);
        long overdueBorrowings = borrowingRepository.countOverdueBorrowings(LocalDate.now());

        Page<BorrowingResponseDto> borrowingPage = borrowingRepository
                .searchBorrowingsReport(status, startDate, endDate, pageable)
                .map(BorrowingResponseDto::fromEntity);

        return BorrowingReportDto.builder()
                .totalBorrowings(totalBorrowings)
                .currentlyBorrowed(currentlyBorrowed)
                .returnedBorrowings(returnedBorrowings)
                .overdueBorrowings(overdueBorrowings)
                .borrowings(PagedResponse.fromPage(borrowingPage))
                .build();
    }

    @Override
    public PagedResponse<BorrowingResponseDto> getOverdueReport(Pageable pageable) {
        log.info("Generating overdue borrowing records report");
        Page<BorrowingResponseDto> overduePage = borrowingRepository
                .findOverdueBorrowings(LocalDate.now(), pageable)
                .map(BorrowingResponseDto::fromEntity);
        return PagedResponse.fromPage(overduePage);
    }

    @Override
    public FineReportDto getFineReport(FineStatus status, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        validateDateRange(startDate, endDate);
        log.info("Generating fine report (status={}, startDate={}, endDate={})", status, startDate, endDate);

        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(LocalTime.MAX) : null;

        BigDecimal totalFineAmount = fineRepository.sumTotalAmount();
        BigDecimal paidFineAmount = fineRepository.sumAmountByStatus(FineStatus.PAID);
        BigDecimal unpaidFineAmount = fineRepository.sumAmountByStatus(FineStatus.UNPAID);

        long paidCount = fineRepository.countByStatus(FineStatus.PAID);
        long unpaidCount = fineRepository.countByStatus(FineStatus.UNPAID);
        long totalCount = paidCount + unpaidCount;

        Page<FineResponseDto> finesPage = fineRepository
                .searchFinesReport(status, startDateTime, endDateTime, pageable)
                .map(FineResponseDto::fromEntity);

        return FineReportDto.builder()
                .totalFineAmount(totalFineAmount != null ? totalFineAmount : BigDecimal.ZERO)
                .paidFineAmount(paidFineAmount != null ? paidFineAmount : BigDecimal.ZERO)
                .unpaidFineAmount(unpaidFineAmount != null ? unpaidFineAmount : BigDecimal.ZERO)
                .totalFineCount(totalCount)
                .paidFineCount(paidCount)
                .unpaidFineCount(unpaidCount)
                .fines(PagedResponse.fromPage(finesPage))
                .build();
    }

    /**
     * Validates that startDate is not chronologically after endDate.
     */
    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("Start date cannot be after end date");
        }
    }
}

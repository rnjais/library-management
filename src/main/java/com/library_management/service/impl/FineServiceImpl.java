package com.library_management.service.impl;

import com.library_management.config.FineProperties;
import com.library_management.dto.request.FinePaymentRequestDto;
import com.library_management.dto.response.FineResponseDto;
import com.library_management.dto.response.MemberUnpaidFineResponseDto;
import com.library_management.entity.Borrowing;
import com.library_management.entity.Fine;
import com.library_management.entity.FineStatus;
import com.library_management.entity.Member;
import com.library_management.event.FineCreatedEvent;
import com.library_management.event.FinePaidEvent;
import com.library_management.exception.FineAlreadyPaidException;
import com.library_management.exception.ResourceNotFoundException;
import com.library_management.repository.FineRepository;
import com.library_management.repository.MemberRepository;
import com.library_management.service.FineService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Service implementation containing business logic for Fine Management.
 * Handles overdue calculations, fine recording, and payment transitions.
 */
@Slf4j
@Service
@Transactional(readOnly = true)
public class FineServiceImpl implements FineService {

    private final FineRepository fineRepository;
    private final FineProperties fineProperties;
    private final MemberRepository memberRepository;
    private final ApplicationEventPublisher eventPublisher;

    // Constructor Injection
    public FineServiceImpl(
            FineRepository fineRepository,
            FineProperties fineProperties,
            MemberRepository memberRepository,
            ApplicationEventPublisher eventPublisher) {
        this.fineRepository = fineRepository;
        this.fineProperties = fineProperties;
        this.memberRepository = memberRepository;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Calculates and creates a fine record for an overdue returned borrowing.
     * Part of the transactional boundary with book-return workflow.
     */
    @Override
    @Transactional
    public FineResponseDto calculateFineForReturn(Borrowing borrowing) {
        if (borrowing == null) {
            throw new IllegalArgumentException("Borrowing record cannot be null");
        }

        if (borrowing.getReturnDate() == null || borrowing.getDueDate() == null) {
            log.warn("Cannot calculate fine: missing returnDate or dueDate for borrowing id={}", borrowing.getId());
            return null;
        }

        // 1. Verify if the book was returned overdue
        if (!borrowing.getReturnDate().isAfter(borrowing.getDueDate())) {
            log.info("Book returned on or before due date for borrowing id={}. No fine charged.", borrowing.getId());
            return null;
        }

        // 2. Prevent duplicate fine creation
        if (fineRepository.existsByBorrowingId(borrowing.getId())) {
            log.warn("Fine already exists for borrowing id={}. Skipping duplicate creation.", borrowing.getId());
            Fine existingFine = fineRepository.findByBorrowingId(borrowing.getId()).orElse(null);
            return FineResponseDto.fromEntity(existingFine);
        }

        // 3. Calculate overdue calendar days
        long overdueDays = ChronoUnit.DAYS.between(borrowing.getDueDate(), borrowing.getReturnDate());

        // 4. Calculate fine amount = overdueDays * dailyRate
        BigDecimal dailyRate = fineProperties.getDailyRate();
        BigDecimal fineAmount = dailyRate
                .multiply(BigDecimal.valueOf(overdueDays))
                .setScale(2, RoundingMode.HALF_UP);

        // 5. Persist the fine record
        Fine fine = Fine.builder()
                .borrowing(borrowing)
                .amount(fineAmount)
                .overdueDays((int) overdueDays)
                .status(FineStatus.UNPAID)
                .calculatedAt(LocalDateTime.now())
                .build();

        Fine savedFine = fineRepository.save(fine);
        log.info("Generated fine id={} of {} {} for borrowing id={} ({} overdue days)",
                savedFine.getId(), fineAmount, fineProperties.getCurrency(), borrowing.getId(), overdueDays);

        // Publish event for post-commit fine notice
        eventPublisher.publishEvent(new FineCreatedEvent(savedFine));

        return FineResponseDto.fromEntity(savedFine);
    }

    /**
     * Marks an existing fine as PAID.
     */
    @Override
    @Transactional
    public FineResponseDto payFine(Long fineId, FinePaymentRequestDto paymentRequest) {
        if (fineId == null) {
            throw new IllegalArgumentException("Fine ID cannot be null");
        }

        // 1. Verify fine exists
        Fine fine = fineRepository.findById(fineId)
                .orElseThrow(() -> new ResourceNotFoundException("Fine", "id", fineId));

        // 2. Prevent paying an already-paid fine
        if (fine.isPaid()) {
            log.warn("Attempted to pay already-paid fine id={}", fineId);
            throw new FineAlreadyPaidException(fineId);
        }

        // 3. Mark fine as paid
        fine.markAsPaid();
        Fine updatedFine = fineRepository.save(fine);

        // Publish event for post-commit fine payment receipt
        eventPublisher.publishEvent(new FinePaidEvent(updatedFine));

        log.info("Fine id={} successfully marked as PAID. Amount: {} {}",
                fineId, updatedFine.getAmount(), fineProperties.getCurrency());

        return FineResponseDto.fromEntity(updatedFine);
    }

    @Override
    public FineResponseDto getFineById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Fine ID cannot be null");
        }
        Fine fine = fineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fine", "id", id));
        return FineResponseDto.fromEntity(fine);
    }

    @Override
    public FineResponseDto getFineByBorrowingId(Long borrowingId) {
        if (borrowingId == null) {
            throw new IllegalArgumentException("Borrowing ID cannot be null");
        }
        Fine fine = fineRepository.findByBorrowingId(borrowingId)
                .orElseThrow(() -> new ResourceNotFoundException("Fine", "borrowingId", borrowingId));
        return FineResponseDto.fromEntity(fine);
    }

    @Override
    public Page<FineResponseDto> getAllFines(Pageable pageable) {
        if (pageable == null) {
            throw new IllegalArgumentException("Pageable cannot be null");
        }
        return fineRepository.findAll(pageable).map(FineResponseDto::fromEntity);
    }

    @Override
    public Page<FineResponseDto> getFinesByMemberId(Long memberId, Pageable pageable) {
        if (memberId == null) {
            throw new IllegalArgumentException("Member ID cannot be null");
        }
        if (!memberRepository.existsById(memberId)) {
            throw new ResourceNotFoundException("Member", "id", memberId);
        }
        return fineRepository.findByMemberId(memberId, pageable).map(FineResponseDto::fromEntity);
    }

    @Override
    public Page<FineResponseDto> getUnpaidFines(Pageable pageable) {
        if (pageable == null) {
            throw new IllegalArgumentException("Pageable cannot be null");
        }
        return fineRepository.findByStatus(FineStatus.UNPAID, pageable).map(FineResponseDto::fromEntity);
    }

    @Override
    public MemberUnpaidFineResponseDto getMemberUnpaidFineTotal(Long memberId) {
        if (memberId == null) {
            throw new IllegalArgumentException("Member ID cannot be null");
        }
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member", "id", memberId));

        BigDecimal totalUnpaid = fineRepository.sumAmountByMemberIdAndStatus(memberId, FineStatus.UNPAID);
        long count = fineRepository.countByMemberIdAndStatus(memberId, FineStatus.UNPAID);

        return MemberUnpaidFineResponseDto.builder()
                .memberId(member.getId())
                .memberName(member.getFullName())
                .memberEmail(member.getEmail())
                .totalUnpaidAmount(totalUnpaid)
                .unpaidFinesCount(count)
                .build();
    }
}

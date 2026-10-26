package com.library_management.service.impl;

import com.library_management.dto.request.BorrowingRequestDto;
import com.library_management.dto.response.BorrowingResponseDto;
import com.library_management.entity.Book;
import com.library_management.entity.Borrowing;
import com.library_management.entity.BorrowingStatus;
import com.library_management.entity.Member;
import com.library_management.exception.*;
import com.library_management.event.BookBorrowedEvent;
import com.library_management.event.BookReturnedEvent;
import com.library_management.repository.BookRepository;
import com.library_management.repository.BorrowingRepository;
import com.library_management.repository.MemberRepository;
import com.library_management.service.BorrowingService;
import com.library_management.service.FineService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Service implementation containing business logic for borrowing and returning books.
 * Enforces inventory consistency, member validation, and concurrency protection.
 */
@Slf4j
@Service
@Transactional(readOnly = true)
public class BorrowingServiceImpl implements BorrowingService {

    private final BorrowingRepository borrowingRepository;
    private final BookRepository bookRepository;
    private final MemberRepository memberRepository;
    private final FineService fineService;
    private final ApplicationEventPublisher eventPublisher;

    // Constructor Injection
    public BorrowingServiceImpl(
            BorrowingRepository borrowingRepository,
            BookRepository bookRepository,
            MemberRepository memberRepository,
            FineService fineService,
            ApplicationEventPublisher eventPublisher) {
        this.borrowingRepository = borrowingRepository;
        this.bookRepository = bookRepository;
        this.memberRepository = memberRepository;
        this.fineService = fineService;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Borrows a book for a member.
     * Uses pessimistic locking to prevent concurrency race conditions on inventory count.
     */
    @Override
    @Transactional
    public BorrowingResponseDto borrowBook(BorrowingRequestDto request) {
        if (request == null) {
            throw new IllegalArgumentException("Borrowing request cannot be null");
        }
        if (request.getBookId() == null) {
            throw new IllegalArgumentException("Book ID cannot be null");
        }
        if (request.getMemberId() == null) {
            throw new IllegalArgumentException("Member ID cannot be null");
        }

        // 1. Verify book existence with pessimistic lock (SELECT ... FOR UPDATE)
        Book book = bookRepository.findByIdWithPessimisticLock(request.getBookId())
                .orElseThrow(() -> new ResourceNotFoundException("Book", "id", request.getBookId()));

        // 2. Verify member existence
        Member member = memberRepository.findById(request.getMemberId())
                .orElseThrow(() -> new ResourceNotFoundException("Member", "id", request.getMemberId()));

        // 3. Verify member is active
        if (Boolean.FALSE.equals(member.getActive())) {
            log.warn("Inactive member id={} attempted to borrow book id={}", member.getId(), book.getId());
            throw new InactiveMemberException(member.getId());
        }

        // 4. Prevent duplicate active borrowing of the same book by the same member
        if (borrowingRepository.existsByMemberIdAndBookIdAndReturnDateIsNull(member.getId(), book.getId())) {
            log.warn("Member id={} already has an active loan for book id={}", member.getId(), book.getId());
            throw new DuplicateResourceException("Member already has an active borrowing for book: " + book.getTitle());
        }

        // 5. Verify book has available copies
        if (!book.isAvailable() || book.getAvailableCopies() <= 0) {
            log.warn("Book id={} has 0 available copies for borrowing", book.getId());
            throw new BookNotAvailableException(book.getId());
        }

        // 6. Calculate due date
        LocalDate dueDate;
        if (request.getDueDate() != null) {
            if (!request.getDueDate().isAfter(LocalDate.now())) {
                throw new IllegalArgumentException("Due date must be in the future");
            }
            dueDate = request.getDueDate();
        } else if (request.getBorrowDays() != null) {
            dueDate = LocalDate.now().plusDays(request.getBorrowDays());
        } else {
            dueDate = LocalDate.now().plusDays(14); // Default 14-day borrowing duration
        }

        // 7. Decrement book available copies
        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepository.save(book);

        // 8. Create and persist borrowing record
        Borrowing borrowing = Borrowing.builder()
                .book(book)
                .member(member)
                .borrowDate(LocalDate.now())
                .dueDate(dueDate)
                .status(BorrowingStatus.BORROWED)
                .build();

        Borrowing savedBorrowing = borrowingRepository.save(borrowing);
        log.info("Book id={} successfully borrowed by member id={}, borrowingId={}",
                book.getId(), member.getId(), savedBorrowing.getId());

        // Publish event for post-commit asynchronous notification
        eventPublisher.publishEvent(new BookBorrowedEvent(savedBorrowing));

        return BorrowingResponseDto.fromEntity(savedBorrowing);
    }

    /**
     * Processes return of a borrowed book.
     * Enforces that a book cannot be returned more than once.
     */
    @Override
    @Transactional
    public BorrowingResponseDto returnBook(Long borrowingId) {
        if (borrowingId == null) {
            throw new IllegalArgumentException("Borrowing ID cannot be null");
        }

        // 1. Verify borrowing record exists
        Borrowing borrowing = borrowingRepository.findById(borrowingId)
                .orElseThrow(() -> new ResourceNotFoundException("Borrowing", "id", borrowingId));

        // 2. Ensure book has not already been returned
        if (borrowing.isReturned() || borrowing.getReturnDate() != null || borrowing.getStatus() == BorrowingStatus.RETURNED) {
            log.warn("Attempted to return already returned borrowing id={}", borrowingId);
            throw new BookAlreadyReturnedException(borrowingId);
        }

        // 3. Retrieve book with pessimistic lock
        Book book = bookRepository.findByIdWithPessimisticLock(borrowing.getBook().getId())
                .orElse(borrowing.getBook());

        // 4. Safely increment available copies (never exceed total copies)
        if (book.getAvailableCopies() < book.getTotalCopies()) {
            book.setAvailableCopies(book.getAvailableCopies() + 1);
            bookRepository.save(book);
        }

        // 5. Update borrowing record
        borrowing.setReturnDate(LocalDate.now());
        borrowing.setStatus(BorrowingStatus.RETURNED);
        Borrowing updatedBorrowing = borrowingRepository.save(borrowing);

        // 6. Calculate fine if overdue (participates in same @Transactional boundary)
        fineService.calculateFineForReturn(updatedBorrowing);

        // Publish event for post-commit asynchronous notification
        eventPublisher.publishEvent(new BookReturnedEvent(updatedBorrowing));

        log.info("Borrowing id={} successfully returned. Book id={} available copies now: {}",
                borrowingId, book.getId(), book.getAvailableCopies());

        return BorrowingResponseDto.fromEntity(updatedBorrowing);
    }

    @Override
    public BorrowingResponseDto getBorrowingById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Borrowing ID cannot be null");
        }
        Borrowing borrowing = borrowingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Borrowing", "id", id));
        return BorrowingResponseDto.fromEntity(borrowing);
    }

    @Override
    public Page<BorrowingResponseDto> getAllBorrowings(Pageable pageable) {
        if (pageable == null) {
            throw new IllegalArgumentException("Pageable cannot be null");
        }
        return borrowingRepository.findAll(pageable).map(BorrowingResponseDto::fromEntity);
    }

    @Override
    public Page<BorrowingResponseDto> getBorrowingsByMemberId(Long memberId, Pageable pageable) {
        if (memberId == null) {
            throw new IllegalArgumentException("Member ID cannot be null");
        }
        if (!memberRepository.existsById(memberId)) {
            throw new ResourceNotFoundException("Member", "id", memberId);
        }
        return borrowingRepository.findByMemberId(memberId, pageable).map(BorrowingResponseDto::fromEntity);
    }

    @Override
    public Page<BorrowingResponseDto> getBorrowingsByBookId(Long bookId, Pageable pageable) {
        if (bookId == null) {
            throw new IllegalArgumentException("Book ID cannot be null");
        }
        if (!bookRepository.existsById(bookId)) {
            throw new ResourceNotFoundException("Book", "id", bookId);
        }
        return borrowingRepository.findByBookId(bookId, pageable).map(BorrowingResponseDto::fromEntity);
    }

    @Override
    public Page<BorrowingResponseDto> getOverdueBorrowings(Pageable pageable) {
        if (pageable == null) {
            throw new IllegalArgumentException("Pageable cannot be null");
        }
        return borrowingRepository.findOverdueBorrowings(LocalDate.now(), pageable)
                .map(BorrowingResponseDto::fromEntity);
    }
}

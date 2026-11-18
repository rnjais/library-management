package com.library_management.service.impl;

import com.library_management.config.BorrowingProperties;
import com.library_management.dto.request.BorrowingRequestDto;
import com.library_management.dto.response.BorrowingResponseDto;
import com.library_management.entity.Book;
import com.library_management.entity.Borrowing;
import com.library_management.entity.BorrowingStatus;
import com.library_management.entity.FineStatus;
import com.library_management.entity.Member;
import com.library_management.entity.Role;
import com.library_management.entity.User;
import com.library_management.exception.*;
import com.library_management.event.BookBorrowedEvent;
import com.library_management.event.BookReturnedEvent;
import com.library_management.repository.BookRepository;
import com.library_management.repository.BorrowingRepository;
import com.library_management.repository.FineRepository;
import com.library_management.repository.MemberRepository;
import com.library_management.service.BorrowingService;
import com.library_management.service.FineService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;

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
    private final FineRepository fineRepository;
    private final FineService fineService;
    private final BorrowingProperties borrowingProperties;
    private final ApplicationEventPublisher eventPublisher;

    // Constructor Injection
    public BorrowingServiceImpl(
            BorrowingRepository borrowingRepository,
            BookRepository bookRepository,
            MemberRepository memberRepository,
            FineRepository fineRepository,
            FineService fineService,
            BorrowingProperties borrowingProperties,
            ApplicationEventPublisher eventPublisher) {
        this.borrowingRepository = borrowingRepository;
        this.bookRepository = bookRepository;
        this.memberRepository = memberRepository;
        this.fineRepository = fineRepository;
        this.fineService = fineService;
        this.borrowingProperties = borrowingProperties;
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

        // 2. Verify member existence & enforce ownership when caller is a MEMBER
        Member member = resolveMemberForBorrow(request.getMemberId());

        // 3. Verify member is active
        if (Boolean.FALSE.equals(member.getActive())) {
            log.warn("Inactive member id={} attempted to borrow book id={}", member.getId(), book.getId());
            throw new InactiveMemberException(member.getId());
        }

        // 4. Enforce maximum active borrowing limit per member
        long activeLoansCount = borrowingRepository.countByMemberIdAndReturnDateIsNull(member.getId());
        int maxActiveLoans = borrowingProperties.getMaxActiveLoans();
        if (activeLoansCount >= maxActiveLoans) {
            log.warn("Member id={} reached max active loan limit ({}/{})", member.getId(), activeLoansCount, maxActiveLoans);
            throw new IllegalStateException(
                    String.format("Borrowing limit reached: Member already has %d active book loan(s) (maximum allowed: %d).",
                            activeLoansCount, maxActiveLoans)
            );
        }

        // 5. Block checkout if member has unpaid fines (when policy enabled)
        if (borrowingProperties.isBlockOnUnpaidFines()) {
            long unpaidFinesCount = fineRepository.countByMemberIdAndStatus(member.getId(), FineStatus.UNPAID);
            if (unpaidFinesCount > 0) {
                log.warn("Member id={} blocked from borrowing due to {} unpaid fine(s)", member.getId(), unpaidFinesCount);
                throw new IllegalStateException(
                        String.format("Cannot borrow books: Member has %d unpaid fine(s). Please settle outstanding fines first.",
                                unpaidFinesCount)
                );
            }
        }

        // 6. Prevent duplicate active borrowing of the same book by the same member
        if (borrowingRepository.existsByMemberIdAndBookIdAndReturnDateIsNull(member.getId(), book.getId())) {
            log.warn("Member id={} already has an active loan for book id={}", member.getId(), book.getId());
            throw new DuplicateResourceException("Member already has an active borrowing for book: " + book.getTitle());
        }

        // 7. Verify book has available copies
        if (!book.isAvailable() || book.getAvailableCopies() <= 0) {
            log.warn("Book id={} has 0 available copies for borrowing", book.getId());
            throw new BookNotAvailableException(book.getId());
        }

        // 8. Calculate and bound due date
        LocalDate today = LocalDate.now();
        int maxBorrowDays = borrowingProperties.getMaxBorrowDays();
        LocalDate maxAllowedDueDate = today.plusDays(maxBorrowDays);
        LocalDate dueDate;
        if (request.getDueDate() != null) {
            if (!request.getDueDate().isAfter(today)) {
                throw new IllegalArgumentException("Due date must be in the future");
            }
            if (request.getDueDate().isAfter(maxAllowedDueDate)) {
                throw new IllegalArgumentException(
                        String.format("Due date cannot exceed %d days from today (latest allowed: %s)",
                                maxBorrowDays, maxAllowedDueDate)
                );
            }
            dueDate = request.getDueDate();
        } else if (request.getBorrowDays() != null) {
            if (request.getBorrowDays() < 1 || request.getBorrowDays() > maxBorrowDays) {
                throw new IllegalArgumentException(
                        String.format("Borrow duration must be between 1 and %d days", maxBorrowDays)
                );
            }
            dueDate = today.plusDays(request.getBorrowDays());
        } else {
            dueDate = today.plusDays(borrowingProperties.getDefaultBorrowDays());
        }

        // 9. Decrement book available copies
        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepository.save(book);

        // 10. Create and persist borrowing record
        Borrowing borrowing = Borrowing.builder()
                .book(book)
                .member(member)
                .borrowDate(today)
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
     * Uses pessimistic locking on Borrowing and Book to prevent concurrent double-return races.
     */
    @Override
    @Transactional
    public BorrowingResponseDto returnBook(Long borrowingId) {
        if (borrowingId == null) {
            throw new IllegalArgumentException("Borrowing ID cannot be null");
        }

        // 1. Acquire pessimistic write lock on borrowing record to serialize concurrent return attempts
        Borrowing borrowing = borrowingRepository.findByIdWithPessimisticLock(borrowingId)
                .orElseThrow(() -> new ResourceNotFoundException("Borrowing", "id", borrowingId));

        // 2. Enforce object-level ownership (MEMBER can only return their own loan)
        enforceBorrowingOwnership(borrowing);

        // 3. Ensure book has not already been returned
        if (borrowing.isReturned() || borrowing.getReturnDate() != null || borrowing.getStatus() == BorrowingStatus.RETURNED) {
            log.warn("Attempted to return already returned borrowing id={}", borrowingId);
            throw new BookAlreadyReturnedException(borrowingId);
        }

        // 4. Retrieve book with pessimistic lock
        Book book = bookRepository.findByIdWithPessimisticLock(borrowing.getBook().getId())
                .orElse(borrowing.getBook());

        // 5. Safely increment available copies (never exceed total copies)
        if (book.getAvailableCopies() < book.getTotalCopies()) {
            book.setAvailableCopies(book.getAvailableCopies() + 1);
            bookRepository.save(book);
        }

        // 6. Update borrowing record
        borrowing.setReturnDate(LocalDate.now());
        borrowing.setStatus(BorrowingStatus.RETURNED);
        Borrowing updatedBorrowing = borrowingRepository.save(borrowing);

        // 7. Calculate fine if overdue (participates in same @Transactional boundary)
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
        enforceBorrowingOwnership(borrowing);
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
        enforceRequestedMemberOwnership(memberId);
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

    /**
     * Resolves the target Member for checkout.
     * For ROLE_MEMBER callers, enforces strict ownership so a member cannot borrow on behalf of another member.
     */
    private Member resolveMemberForBorrow(Long requestedMemberId) {
        Optional<String> memberEmailOpt = getAuthenticatedMemberEmail();
        if (memberEmailOpt.isEmpty()) {
            return memberRepository.findById(requestedMemberId)
                    .orElseThrow(() -> new ResourceNotFoundException("Member", "id", requestedMemberId));
        }

        Member callerMember = findOrCreateMemberForAuthenticatedCaller(memberEmailOpt.get());
        if (!callerMember.getId().equals(requestedMemberId)) {
            log.warn("IDOR attempt blocked on borrowBook: caller email={} (memberId={}) attempted to borrow for memberId={}",
                    memberEmailOpt.get(), callerMember.getId(), requestedMemberId);
            throw new AccessDeniedException("Access denied: You can only borrow books for your own membership account.");
        }
        return callerMember;
    }

    /**
     * Ensures a ROLE_MEMBER caller can only view or mutate their own Borrowing record.
     * Fails closed if the caller has no linked Member profile.
     */
    private void enforceBorrowingOwnership(Borrowing borrowing) {
        Optional<String> memberEmailOpt = getAuthenticatedMemberEmail();
        if (memberEmailOpt.isEmpty()) {
            return;
        }
        Member callerMember = memberRepository.findByEmail(memberEmailOpt.get())
                .orElseThrow(() -> new AccessDeniedException("Access denied: No member profile is linked to your account."));
        if (borrowing.getMember() == null || !callerMember.getId().equals(borrowing.getMember().getId())) {
            log.warn("IDOR attempt blocked on borrowingId={}: caller email={} (memberId={}) does not own record",
                    borrowing.getId(), memberEmailOpt.get(), callerMember.getId());
            throw new AccessDeniedException("Access denied: You can only access or return your own borrowing records.");
        }
    }

    /**
     * Ensures a ROLE_MEMBER caller can only query their own memberId.
     * Fails closed (403 Forbidden) instead of falling back to the requested memberId.
     */
    private void enforceRequestedMemberOwnership(Long requestedMemberId) {
        Optional<String> memberEmailOpt = getAuthenticatedMemberEmail();
        if (memberEmailOpt.isEmpty()) {
            return;
        }
        Member callerMember = memberRepository.findByEmail(memberEmailOpt.get())
                .orElseThrow(() -> new AccessDeniedException("Access denied: No member profile is linked to your account."));
        if (!callerMember.getId().equals(requestedMemberId)) {
            log.warn("IDOR attempt blocked on member borrowings query: caller email={} (memberId={}) requested memberId={}",
                    memberEmailOpt.get(), callerMember.getId(), requestedMemberId);
            throw new AccessDeniedException("Access denied: You can only view your own borrowing records.");
        }
    }

    /**
     * Returns the authenticated caller's email if the caller is a non-admin ROLE_MEMBER.
     * Returns Optional.empty() for ADMIN callers or unauthenticated unit-test invocations.
     */
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

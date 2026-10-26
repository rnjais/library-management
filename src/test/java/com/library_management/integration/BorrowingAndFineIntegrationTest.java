package com.library_management.integration;

import com.library_management.dto.request.BorrowingRequestDto;
import com.library_management.dto.response.BorrowingResponseDto;
import com.library_management.dto.response.FineResponseDto;
import com.library_management.entity.*;
import com.library_management.exception.DuplicateResourceException;
import com.library_management.exception.FineAlreadyPaidException;
import com.library_management.repository.BookRepository;
import com.library_management.repository.BorrowingRepository;
import com.library_management.repository.FineRepository;
import com.library_management.repository.MemberRepository;
import com.library_management.service.BorrowingService;
import com.library_management.service.FineService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

/**
 * End-to-end integration test validating the complete transactional lifecycle:
 * Book checkout -> Concurrency checks -> Overdue check-in -> Fine generation -> Payment.
 * Runs against the isolated MySQL test database.
 */
@SpringBootTest
@Transactional
class BorrowingAndFineIntegrationTest {

    @Autowired
    private BorrowingService borrowingService;

    @Autowired
    private FineService fineService;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private BorrowingRepository borrowingRepository;

    @Autowired
    private FineRepository fineRepository;

    private Book testBook;
    private Member testMember;

    @BeforeEach
    void setUp() {
        testBook = bookRepository.save(Book.builder()
                .title("Domain-Driven Design")
                .author("Eric Evans")
                .isbn("978-0321125217")
                .category("Software Architecture")
                .totalCopies(3)
                .availableCopies(3)
                .build());

        testMember = memberRepository.save(Member.builder()
                .firstName("Michael")
                .lastName("Scott")
                .email("michael.scott@dundermifflin.com")
                .phoneNumber("+91 9876543210")
                .active(true)
                .build());
    }

    @Test
    @DisplayName("Integration: Borrow book successfully updates database inventory and creates loan record")
    void testBorrowBook_TransactionalInventoryUpdate() {
        BorrowingRequestDto request = BorrowingRequestDto.builder()
                .bookId(testBook.getId())
                .memberId(testMember.getId())
                .borrowDays(14)
                .build();

        BorrowingResponseDto response = borrowingService.borrowBook(request);

        assertNotNull(response);
        assertNotNull(response.getId());
        assertEquals(BorrowingStatus.BORROWED, response.getStatus());

        // Verify database inventory decremented
        Book updatedBook = bookRepository.findById(testBook.getId()).orElseThrow();
        assertEquals(2, updatedBook.getAvailableCopies());
    }

    @Test
    @DisplayName("Integration: Prevent duplicate active checkout of the same book by the same member")
    void testBorrowBook_DuplicateActiveLoanPrevented() {
        BorrowingRequestDto request = BorrowingRequestDto.builder()
                .bookId(testBook.getId())
                .memberId(testMember.getId())
                .borrowDays(14)
                .build();

        // First checkout succeeds
        borrowingService.borrowBook(request);

        // Second checkout of identical book must throw DuplicateResourceException
        assertThrows(DuplicateResourceException.class, () -> borrowingService.borrowBook(request));

        // Verify inventory was only decremented once
        Book updatedBook = bookRepository.findById(testBook.getId()).orElseThrow();
        assertEquals(2, updatedBook.getAvailableCopies());
    }

    @Test
    @DisplayName("Integration: Return overdue book restores inventory and creates fine record")
    void testReturnBook_OverdueGeneratesFine() {
        // 1. Borrow book
        BorrowingRequestDto request = BorrowingRequestDto.builder()
                .bookId(testBook.getId())
                .memberId(testMember.getId())
                .borrowDays(14)
                .build();

        BorrowingResponseDto borrowResponse = borrowingService.borrowBook(request);
        Long borrowingId = borrowResponse.getId();

        // 2. Simulate loan being 4 days overdue
        Borrowing borrowing = borrowingRepository.findById(borrowingId).orElseThrow();
        borrowing.setDueDate(LocalDate.now().minusDays(4));
        borrowingRepository.save(borrowing);

        // 3. Process return
        BorrowingResponseDto returnResponse = borrowingService.returnBook(borrowingId);

        // 4. Verify book inventory restored in database
        Book restoredBook = bookRepository.findById(testBook.getId()).orElseThrow();
        assertEquals(3, restoredBook.getAvailableCopies());
        assertEquals(BorrowingStatus.RETURNED, returnResponse.getStatus());
        assertNotNull(returnResponse.getReturnDate());

        // 5. Verify fine record generated in database
        assertTrue(fineRepository.existsByBorrowingId(borrowingId));
        Fine fine = fineRepository.findByBorrowingId(borrowingId).orElseThrow();
        assertEquals(4, fine.getOverdueDays());
        assertEquals(new BigDecimal("20.00"), fine.getAmount()); // 4 days * 5.00/day
        assertEquals(FineStatus.UNPAID, fine.getStatus());
        assertNotNull(fine.getCalculatedAt());
        assertNull(fine.getPaidAt());
    }

    @Test
    @DisplayName("Integration: Pay fine transitions status to PAID and rejects duplicate payments")
    void testPayFine_TransitionsStatusAndPreventsDuplicatePayment() {
        // 1. Setup an overdue borrowing and fine
        Borrowing borrowing = borrowingRepository.save(Borrowing.builder()
                .book(testBook)
                .member(testMember)
                .borrowDate(LocalDate.now().minusDays(20))
                .dueDate(LocalDate.now().minusDays(5))
                .returnDate(LocalDate.now())
                .status(BorrowingStatus.RETURNED)
                .build());

        Fine fine = fineRepository.save(Fine.builder()
                .borrowing(borrowing)
                .amount(new BigDecimal("25.00"))
                .overdueDays(5)
                .status(FineStatus.UNPAID)
                .build());

        // 2. Pay fine
        FineResponseDto payResponse = fineService.payFine(fine.getId(), null);

        assertNotNull(payResponse);
        assertEquals(FineStatus.PAID, payResponse.getStatus());
        assertNotNull(payResponse.getPaidAt());

        // 3. Verify in database
        Fine updatedFine = fineRepository.findById(fine.getId()).orElseThrow();
        assertEquals(FineStatus.PAID, updatedFine.getStatus());
        assertNotNull(updatedFine.getPaidAt());

        // 4. Attempting to pay again throws FineAlreadyPaidException
        assertThrows(FineAlreadyPaidException.class, () -> fineService.payFine(fine.getId(), null));
    }
}

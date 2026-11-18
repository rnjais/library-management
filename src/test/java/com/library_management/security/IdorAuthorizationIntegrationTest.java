package com.library_management.security;

import com.library_management.entity.*;
import com.library_management.repository.BookRepository;
import com.library_management.repository.BorrowingRepository;
import com.library_management.repository.FineRepository;
import com.library_management.repository.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end integration tests verifying object-level ownership (anti-IDOR / BOLA)
 * and ADMIN-only fine settlement across Borrowing and Fine endpoints.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class IdorAuthorizationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private BorrowingRepository borrowingRepository;

    @Autowired
    private FineRepository fineRepository;

    private Book book;
    private Member memberA;
    private Member memberB;
    private Borrowing borrowingA;
    private Borrowing borrowingB;
    private Fine fineA;
    private Fine fineB;

    @BeforeEach
    void setUp() {
        book = bookRepository.save(Book.builder()
                .title("Effective Java Security Edition")
                .author("Joshua Bloch")
                .isbn("978-9999888877")
                .category("Software Engineering")
                .totalCopies(5)
                .availableCopies(3)
                .build());

        memberA = memberRepository.save(Member.builder()
                .firstName("Alice")
                .lastName("Tester")
                .email("alice.idor@example.com")
                .phoneNumber("+91 9000000001")
                .active(true)
                .build());

        memberB = memberRepository.save(Member.builder()
                .firstName("Bob")
                .lastName("Victim")
                .email("bob.idor@example.com")
                .phoneNumber("+91 9000000002")
                .active(true)
                .build());

        borrowingA = borrowingRepository.save(Borrowing.builder()
                .book(book)
                .member(memberA)
                .borrowDate(LocalDate.now().minusDays(10))
                .dueDate(LocalDate.now().plusDays(4))
                .status(BorrowingStatus.BORROWED)
                .build());

        borrowingB = borrowingRepository.save(Borrowing.builder()
                .book(book)
                .member(memberB)
                .borrowDate(LocalDate.now().minusDays(20))
                .dueDate(LocalDate.now().minusDays(6))
                .status(BorrowingStatus.OVERDUE)
                .build());

        fineA = fineRepository.save(Fine.builder()
                .borrowing(borrowingA)
                .amount(new BigDecimal("15.00"))
                .overdueDays(3)
                .status(FineStatus.UNPAID)
                .calculatedAt(LocalDateTime.now())
                .build());

        fineB = fineRepository.save(Fine.builder()
                .borrowing(borrowingB)
                .amount(new BigDecimal("30.00"))
                .overdueDays(6)
                .status(FineStatus.UNPAID)
                .calculatedAt(LocalDateTime.now())
                .build());
    }

    @Test
    @DisplayName("MEMBER A cannot return MEMBER B's borrowing (403 Forbidden)")
    @WithMockUser(username = "alice.idor@example.com", roles = "MEMBER")
    void memberCannotReturnAnotherMembersBorrowing() throws Exception {
        mockMvc.perform(patch("/api/borrowings/" + borrowingB.getId() + "/return"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("MEMBER A cannot read MEMBER B's borrowing by ID (403 Forbidden)")
    @WithMockUser(username = "alice.idor@example.com", roles = "MEMBER")
    void memberCannotReadAnotherMembersBorrowingById() throws Exception {
        mockMvc.perform(get("/api/borrowings/" + borrowingB.getId()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("MEMBER A cannot list MEMBER B's borrowings (403 Forbidden)")
    @WithMockUser(username = "alice.idor@example.com", roles = "MEMBER")
    void memberCannotListAnotherMembersBorrowings() throws Exception {
        mockMvc.perform(get("/api/borrowings/member/" + memberB.getId()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("MEMBER A cannot borrow a book using MEMBER B's memberId (403 Forbidden)")
    @WithMockUser(username = "alice.idor@example.com", roles = "MEMBER")
    void memberCannotBorrowForAnotherMember() throws Exception {
        String payload = String.format("{\"bookId\": %d, \"memberId\": %d, \"borrowDays\": 14}",
                book.getId(), memberB.getId());

        mockMvc.perform(post("/api/borrowings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("MEMBER A cannot read MEMBER B's fine by ID (403 Forbidden)")
    @WithMockUser(username = "alice.idor@example.com", roles = "MEMBER")
    void memberCannotReadAnotherMembersFineById() throws Exception {
        mockMvc.perform(get("/api/fines/" + fineB.getId()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("MEMBER A cannot list MEMBER B's fines or unpaid total (403 Forbidden)")
    @WithMockUser(username = "alice.idor@example.com", roles = "MEMBER")
    void memberCannotReadAnotherMembersFinesOrUnpaidTotal() throws Exception {
        mockMvc.perform(get("/api/fines/member/" + memberB.getId()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));

        mockMvc.perform(get("/api/fines/member/" + memberB.getId() + "/unpaid-total"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("MEMBER cannot mark even their own fine as PAID (403 Forbidden)")
    @WithMockUser(username = "alice.idor@example.com", roles = "MEMBER")
    void memberCannotSelfPayFine() throws Exception {
        mockMvc.perform(patch("/api/fines/" + fineA.getId() + "/pay")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"paymentMethod\": \"CASH\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("Unlinked MEMBER fails closed with 403 Forbidden when querying any memberId")
    @WithMockUser(username = "orphan.member@example.com", roles = "MEMBER")
    void unlinkedMemberFailsClosed() throws Exception {
        mockMvc.perform(get("/api/borrowings/member/" + memberB.getId()))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/fines/member/" + memberB.getId()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("MEMBER A can still read and return their own borrowing and view their own fine (200 OK)")
    @WithMockUser(username = "alice.idor@example.com", roles = "MEMBER")
    void memberCanAccessOwnBorrowingAndFine() throws Exception {
        mockMvc.perform(get("/api/borrowings/" + borrowingA.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(borrowingA.getId()));

        mockMvc.perform(get("/api/borrowings/member/" + memberA.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1));

        mockMvc.perform(get("/api/fines/" + fineA.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(fineA.getId()));

        mockMvc.perform(get("/api/fines/member/" + memberA.getId() + "/unpaid-total"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unpaidFinesCount").value(1));

        mockMvc.perform(patch("/api/borrowings/" + borrowingA.getId() + "/return"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("RETURNED"));
    }

    @Test
    @DisplayName("ADMIN can mark fine PAID and payment audit metadata is persisted and returned")
    @WithMockUser(username = "admin@library.com", roles = "ADMIN")
    void adminCanPayFineAndPersistPaymentMetadata() throws Exception {
        String payload = """
                {
                  "paymentMethod": "UPI",
                  "transactionReference": "UPI-2026-001",
                  "notes": "Collected at library counter"
                }
                """;

        mockMvc.perform(patch("/api/fines/" + fineB.getId() + "/pay")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PAID"))
                .andExpect(jsonPath("$.data.paymentMethod").value("UPI"))
                .andExpect(jsonPath("$.data.transactionReference").value("UPI-2026-001"))
                .andExpect(jsonPath("$.data.paymentNotes").value("Collected at library counter"));
    }
}

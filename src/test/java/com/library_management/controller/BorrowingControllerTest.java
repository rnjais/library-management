package com.library_management.controller;

import com.library_management.dto.request.BorrowingRequestDto;
import com.library_management.dto.response.BorrowingResponseDto;
import com.library_management.entity.BorrowingStatus;
import com.library_management.exception.*;
import com.library_management.service.BorrowingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class BorrowingControllerTest {

    private MockMvc mockMvc;

    @Mock
    private BorrowingService borrowingService;

    @InjectMocks
    private BorrowingController borrowingController;

    private BorrowingResponseDto sampleResponse;

    private static final String VALID_BORROW_JSON = """
            {
              "bookId": 1,
              "memberId": 10,
              "borrowDays": 14
            }
            """;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders
                .standaloneSetup(borrowingController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        sampleResponse = BorrowingResponseDto.builder()
                .id(100L)
                .book(BorrowingResponseDto.BookSummaryDto.builder()
                        .id(1L)
                        .title("Clean Architecture")
                        .author("Robert C. Martin")
                        .isbn("978-0134494166")
                        .build())
                .member(BorrowingResponseDto.MemberSummaryDto.builder()
                        .id(10L)
                        .fullName("Alice Smith")
                        .email("alice@example.com")
                        .build())
                .borrowDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(14))
                .status(BorrowingStatus.BORROWED)
                .overdue(false)
                .build();
    }

    @Test
    void shouldBorrowBookSuccessfully() throws Exception {
        when(borrowingService.borrowBook(any(BorrowingRequestDto.class))).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/borrowings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BORROW_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Book borrowed successfully"))
                .andExpect(jsonPath("$.data.id").value(100))
                .andExpect(jsonPath("$.data.book.title").value("Clean Architecture"))
                .andExpect(jsonPath("$.data.member.email").value("alice@example.com"))
                .andExpect(jsonPath("$.data.status").value("BORROWED"));
    }

    @Test
    void shouldRejectBorrowWithMissingFields() throws Exception {
        String invalidJson = """
                {
                  "bookId": null,
                  "memberId": null
                }
                """;

        mockMvc.perform(post("/api/borrowings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.bookId").exists())
                .andExpect(jsonPath("$.validationErrors.memberId").exists());
    }

    @Test
    void shouldRejectBorrowWhenBookUnavailable() throws Exception {
        when(borrowingService.borrowBook(any(BorrowingRequestDto.class)))
                .thenThrow(new BookNotAvailableException(1L));

        mockMvc.perform(post("/api/borrowings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BORROW_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("Book with ID 1 is currently not available for borrowing"));
    }

    @Test
    void shouldRejectBorrowWhenMemberInactive() throws Exception {
        when(borrowingService.borrowBook(any(BorrowingRequestDto.class)))
                .thenThrow(new InactiveMemberException(10L));

        mockMvc.perform(post("/api/borrowings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BORROW_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Member with ID 10 is inactive and cannot borrow books"));
    }

    @Test
    void shouldReturnBookSuccessfully() throws Exception {
        sampleResponse.setStatus(BorrowingStatus.RETURNED);
        sampleResponse.setReturnDate(LocalDate.now());

        when(borrowingService.returnBook(100L)).thenReturn(sampleResponse);

        mockMvc.perform(patch("/api/borrowings/100/return"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Book returned successfully"))
                .andExpect(jsonPath("$.data.status").value("RETURNED"))
                .andExpect(jsonPath("$.data.returnDate").exists());
    }

    @Test
    void shouldRejectReturnWhenAlreadyReturned() throws Exception {
        when(borrowingService.returnBook(100L))
                .thenThrow(new BookAlreadyReturnedException(100L));

        mockMvc.perform(patch("/api/borrowings/100/return"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Borrowing record with ID 100 has already been returned"));
    }

    @Test
    void shouldGetBorrowingByIdSuccessfully() throws Exception {
        when(borrowingService.getBorrowingById(100L)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/borrowings/100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(100));
    }

    @Test
    void shouldReturn404WhenBorrowingNotFound() throws Exception {
        when(borrowingService.getBorrowingById(999L))
                .thenThrow(new ResourceNotFoundException("Borrowing", "id", 999L));

        mockMvc.perform(get("/api/borrowings/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Borrowing not found with id: '999'"));
    }

    @Test
    void shouldGetAllBorrowingsPaged() throws Exception {
        Page<BorrowingResponseDto> page = new PageImpl<>(Collections.singletonList(sampleResponse));
        when(borrowingService.getAllBorrowings(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/borrowings")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].id").value(100));
    }

    @Test
    void shouldGetBorrowingsByMember() throws Exception {
        Page<BorrowingResponseDto> page = new PageImpl<>(Collections.singletonList(sampleResponse));
        when(borrowingService.getBorrowingsByMemberId(eq(10L), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/borrowings/member/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].member.id").value(10));
    }

    @Test
    void shouldGetBorrowingsByBook() throws Exception {
        Page<BorrowingResponseDto> page = new PageImpl<>(Collections.singletonList(sampleResponse));
        when(borrowingService.getBorrowingsByBookId(eq(1L), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/borrowings/book/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].book.id").value(1));
    }

    @Test
    void shouldGetOverdueBorrowings() throws Exception {
        sampleResponse.setStatus(BorrowingStatus.OVERDUE);
        sampleResponse.setOverdue(true);
        Page<BorrowingResponseDto> page = new PageImpl<>(Collections.singletonList(sampleResponse));
        when(borrowingService.getOverdueBorrowings(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/borrowings/overdue"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].overdue").value(true));
    }
}

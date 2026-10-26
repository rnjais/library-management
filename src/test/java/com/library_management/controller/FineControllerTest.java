package com.library_management.controller;

import com.library_management.dto.response.FineResponseDto;
import com.library_management.dto.response.MemberUnpaidFineResponseDto;
import com.library_management.entity.FineStatus;
import com.library_management.exception.FineAlreadyPaidException;
import com.library_management.exception.GlobalExceptionHandler;
import com.library_management.exception.ResourceNotFoundException;
import com.library_management.service.FineService;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class FineControllerTest {

    private MockMvc mockMvc;

    @Mock
    private FineService fineService;

    @InjectMocks
    private FineController fineController;

    private FineResponseDto sampleFineResponse;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders
                .standaloneSetup(fineController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        sampleFineResponse = FineResponseDto.builder()
                .id(1L)
                .borrowingId(100L)
                .book(FineResponseDto.BookSummaryDto.builder()
                        .id(5L)
                        .title("Clean Architecture")
                        .author("Robert C. Martin")
                        .isbn("978-0134494166")
                        .build())
                .member(FineResponseDto.MemberSummaryDto.builder()
                        .id(10L)
                        .fullName("Alice Smith")
                        .email("alice@example.com")
                        .build())
                .amount(new BigDecimal("25.00"))
                .overdueDays(5)
                .status(FineStatus.UNPAID)
                .calculatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void shouldGetFineByIdSuccessfully() throws Exception {
        when(fineService.getFineById(1L)).thenReturn(sampleFineResponse);

        mockMvc.perform(get("/api/fines/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.amount").value(25.00))
                .andExpect(jsonPath("$.data.overdueDays").value(5))
                .andExpect(jsonPath("$.data.status").value("UNPAID"));
    }

    @Test
    void shouldReturn404WhenFineNotFound() throws Exception {
        when(fineService.getFineById(999L))
                .thenThrow(new ResourceNotFoundException("Fine", "id", 999L));

        mockMvc.perform(get("/api/fines/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Fine not found with id: '999'"));
    }

    @Test
    void shouldGetAllFinesPaged() throws Exception {
        Page<FineResponseDto> page = new PageImpl<>(Collections.singletonList(sampleFineResponse));
        when(fineService.getAllFines(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/fines")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].id").value(1));
    }

    @Test
    void shouldGetUnpaidFines() throws Exception {
        Page<FineResponseDto> page = new PageImpl<>(Collections.singletonList(sampleFineResponse));
        when(fineService.getUnpaidFines(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/fines/unpaid"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].status").value("UNPAID"));
    }

    @Test
    void shouldGetFinesByMember() throws Exception {
        Page<FineResponseDto> page = new PageImpl<>(Collections.singletonList(sampleFineResponse));
        when(fineService.getFinesByMemberId(eq(10L), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/fines/member/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].member.id").value(10));
    }

    @Test
    void shouldGetMemberUnpaidFineTotal() throws Exception {
        MemberUnpaidFineResponseDto summary = MemberUnpaidFineResponseDto.builder()
                .memberId(10L)
                .memberName("Alice Smith")
                .memberEmail("alice@example.com")
                .totalUnpaidAmount(new BigDecimal("35.00"))
                .unpaidFinesCount(2L)
                .build();

        when(fineService.getMemberUnpaidFineTotal(10L)).thenReturn(summary);

        mockMvc.perform(get("/api/fines/member/10/unpaid-total"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalUnpaidAmount").value(35.00))
                .andExpect(jsonPath("$.data.unpaidFinesCount").value(2));
    }

    @Test
    void shouldPayFineSuccessfully() throws Exception {
        sampleFineResponse.setStatus(FineStatus.PAID);
        sampleFineResponse.setPaidAt(LocalDateTime.now());

        when(fineService.payFine(eq(1L), any())).thenReturn(sampleFineResponse);

        mockMvc.perform(patch("/api/fines/1/pay")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"paymentMethod\": \"CASH\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Fine marked as paid successfully"))
                .andExpect(jsonPath("$.data.status").value("PAID"));
    }

    @Test
    void shouldRejectPayFineWhenAlreadyPaid() throws Exception {
        when(fineService.payFine(eq(1L), any()))
                .thenThrow(new FineAlreadyPaidException(1L));

        mockMvc.perform(patch("/api/fines/1/pay"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("Fine with ID 1 has already been paid"));
    }
}

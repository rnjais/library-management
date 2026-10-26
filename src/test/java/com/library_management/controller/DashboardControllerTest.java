package com.library_management.controller;

import com.library_management.dto.response.DashboardSummaryDto;
import com.library_management.exception.GlobalExceptionHandler;
import com.library_management.service.DashboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class DashboardControllerTest {

    private MockMvc mockMvc;

    @Mock
    private DashboardService dashboardService;

    @InjectMocks
    private DashboardController dashboardController;

    private DashboardSummaryDto sampleSummary;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders
                .standaloneSetup(dashboardController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        sampleSummary = DashboardSummaryDto.builder()
                .totalBooks(100L)
                .totalBookCopies(350L)
                .availableBookCopies(300L)
                .borrowedBookCopies(50L)
                .totalMembers(120L)
                .activeMembers(110L)
                .inactiveMembers(10L)
                .currentlyBorrowedBooks(50L)
                .overdueBorrowings(8L)
                .totalUnpaidFines(new BigDecimal("120.00"))
                .unpaidFineCount(5L)
                .totalPaidFines(new BigDecimal("250.00"))
                .paidFineCount(10L)
                .build();
    }

    @Test
    void shouldReturnDashboardSummarySuccessfully() throws Exception {
        when(dashboardService.getDashboardSummary()).thenReturn(sampleSummary);

        mockMvc.perform(get("/api/admin/dashboard/summary")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Dashboard summary retrieved successfully"))
                .andExpect(jsonPath("$.data.totalBooks").value(100))
                .andExpect(jsonPath("$.data.totalBookCopies").value(350))
                .andExpect(jsonPath("$.data.availableBookCopies").value(300))
                .andExpect(jsonPath("$.data.borrowedBookCopies").value(50))
                .andExpect(jsonPath("$.data.totalMembers").value(120))
                .andExpect(jsonPath("$.data.activeMembers").value(110))
                .andExpect(jsonPath("$.data.inactiveMembers").value(10))
                .andExpect(jsonPath("$.data.currentlyBorrowedBooks").value(50))
                .andExpect(jsonPath("$.data.overdueBorrowings").value(8))
                .andExpect(jsonPath("$.data.totalUnpaidFines").value(120.00))
                .andExpect(jsonPath("$.data.unpaidFineCount").value(5))
                .andExpect(jsonPath("$.data.totalPaidFines").value(250.00))
                .andExpect(jsonPath("$.data.paidFineCount").value(10));
    }
}

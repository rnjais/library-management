package com.library_management.controller;

import com.library_management.dto.response.*;
import com.library_management.entity.BorrowingStatus;
import com.library_management.entity.FineStatus;
import com.library_management.exception.GlobalExceptionHandler;
import com.library_management.service.DashboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ReportControllerTest {

    private MockMvc mockMvc;

    @Mock
    private DashboardService dashboardService;

    @InjectMocks
    private ReportController reportController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders
                .standaloneSetup(reportController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void shouldGetBookReportSuccessfully() throws Exception {
        BookReportDto.CategoryStatDto categoryStat = BookReportDto.CategoryStatDto.builder()
                .category("Technology")
                .bookCount(10L)
                .totalCopies(40L)
                .availableCopies(35L)
                .borrowedCopies(5L)
                .build();

        BookReportDto report = BookReportDto.builder()
                .totalBooks(10L)
                .totalCopies(40L)
                .availableCopies(35L)
                .borrowedCopies(5L)
                .categoryBreakdown(List.of(categoryStat))
                .build();

        when(dashboardService.getBookReport()).thenReturn(report);

        mockMvc.perform(get("/api/admin/reports/books")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalBooks").value(10))
                .andExpect(jsonPath("$.data.categoryBreakdown[0].category").value("Technology"));
    }

    @Test
    void shouldGetMemberReportSuccessfully() throws Exception {
        MemberReportDto report = MemberReportDto.builder()
                .totalMembers(50L)
                .activeMembers(45L)
                .inactiveMembers(5L)
                .members(PagedResponse.fromPage(Page.empty()))
                .build();

        when(dashboardService.getMemberReport(any(), any(), any(), any(Pageable.class))).thenReturn(report);

        mockMvc.perform(get("/api/admin/reports/members")
                        .param("active", "true")
                        .param("startDate", "2026-01-01")
                        .param("endDate", "2026-12-31")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalMembers").value(50))
                .andExpect(jsonPath("$.data.activeMembers").value(45));
    }

    @Test
    void shouldGetBorrowingReportSuccessfully() throws Exception {
        BorrowingReportDto report = BorrowingReportDto.builder()
                .totalBorrowings(30L)
                .currentlyBorrowed(10L)
                .returnedBorrowings(20L)
                .overdueBorrowings(2L)
                .borrowings(PagedResponse.fromPage(Page.empty()))
                .build();

        when(dashboardService.getBorrowingReport(any(), any(), any(), any(Pageable.class))).thenReturn(report);

        mockMvc.perform(get("/api/admin/reports/borrowings")
                        .param("status", "BORROWED")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalBorrowings").value(30))
                .andExpect(jsonPath("$.data.currentlyBorrowed").value(10));
    }

    @Test
    void shouldGetOverdueReportSuccessfully() throws Exception {
        PagedResponse<BorrowingResponseDto> report = PagedResponse.fromPage(Page.empty());

        when(dashboardService.getOverdueReport(any(Pageable.class))).thenReturn(report);

        mockMvc.perform(get("/api/admin/reports/overdue")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray());
    }

    @Test
    void shouldGetFineReportSuccessfully() throws Exception {
        FineReportDto report = FineReportDto.builder()
                .totalFineAmount(new BigDecimal("500.00"))
                .paidFineAmount(new BigDecimal("300.00"))
                .unpaidFineAmount(new BigDecimal("200.00"))
                .totalFineCount(15L)
                .paidFineCount(10L)
                .unpaidFineCount(5L)
                .fines(PagedResponse.fromPage(Page.empty()))
                .build();

        when(dashboardService.getFineReport(any(), any(), any(), any(Pageable.class))).thenReturn(report);

        mockMvc.perform(get("/api/admin/reports/fines")
                        .param("status", "UNPAID")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalFineAmount").value(500.00))
                .andExpect(jsonPath("$.data.unpaidFineAmount").value(200.00));
    }

    @Test
    void shouldRejectInvalidPaginationParameters() throws Exception {
        mockMvc.perform(get("/api/admin/reports/members")
                        .param("page", "-1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Page index cannot be negative"));
    }
}

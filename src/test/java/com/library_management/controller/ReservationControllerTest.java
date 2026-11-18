package com.library_management.controller;

import com.library_management.dto.request.ReservationRequestDto;
import com.library_management.dto.response.ReservationResponseDto;
import com.library_management.entity.ReservationStatus;
import com.library_management.exception.GlobalExceptionHandler;
import com.library_management.exception.ResourceNotFoundException;
import com.library_management.service.ReservationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ReservationControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ReservationService reservationService;

    @InjectMocks
    private ReservationController reservationController;

    private ReservationResponseDto sampleResponse;

    private static final String VALID_RESERVATION_JSON = """
            {
              "bookId": 1,
              "memberId": 10
            }
            """;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders
                .standaloneSetup(reservationController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        sampleResponse = ReservationResponseDto.builder()
                .id(100L)
                .bookId(1L)
                .bookTitle("Clean Architecture")
                .bookAuthor("Robert C. Martin")
                .bookIsbn("978-0134494166")
                .bookCategory("Software")
                .memberId(10L)
                .memberName("John Doe")
                .memberEmail("john@example.com")
                .reservationDate(LocalDateTime.now())
                .status(ReservationStatus.PENDING)
                .queuePosition(1L)
                .build();
    }

    @Test
    @DisplayName("POST /api/reservations - should return 201 Created on valid request")
    void shouldCreateReservation_WhenValidRequest() throws Exception {
        when(reservationService.createReservation(any(ReservationRequestDto.class))).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/reservations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_RESERVATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(100))
                .andExpect(jsonPath("$.data.bookTitle").value("Clean Architecture"))
                .andExpect(jsonPath("$.data.queuePosition").value(1));

        verify(reservationService, times(1)).createReservation(any(ReservationRequestDto.class));
    }

    @Test
    @DisplayName("PATCH /api/reservations/{id}/cancel - should return 200 OK")
    void shouldCancelReservation_WhenValidId() throws Exception {
        sampleResponse.setStatus(ReservationStatus.CANCELLED);
        sampleResponse.setCancelledAt(LocalDateTime.now());
        when(reservationService.cancelReservation(100L)).thenReturn(sampleResponse);

        mockMvc.perform(patch("/api/reservations/100/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));

        verify(reservationService, times(1)).cancelReservation(100L);
    }

    @Test
    @DisplayName("GET /api/reservations/{id} - should return 200 OK")
    void shouldGetReservationById_WhenFound() throws Exception {
        when(reservationService.getReservationById(100L)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/reservations/100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(100));

        verify(reservationService, times(1)).getReservationById(100L);
    }

    @Test
    @DisplayName("GET /api/reservations/{id} - should return 404 when not found")
    void shouldReturn404_WhenReservationNotFound() throws Exception {
        when(reservationService.getReservationById(999L))
                .thenThrow(new ResourceNotFoundException("Reservation", "id", 999L));

        mockMvc.perform(get("/api/reservations/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @DisplayName("GET /api/reservations/my - should return 200 OK with paginated user reservations")
    void shouldGetMyReservations() throws Exception {
        when(reservationService.getMyReservations(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleResponse)));

        mockMvc.perform(get("/api/reservations/my?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].id").value(100));
    }

    @Test
    @DisplayName("GET /api/reservations - should return 200 OK for admin list")
    void shouldGetAllReservations() throws Exception {
        when(reservationService.getAllReservations(any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleResponse)));

        mockMvc.perform(get("/api/reservations?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].id").value(100));
    }

    @Test
    @DisplayName("GET /api/reservations/book/{bookId} - should return 200 OK with waitlist queue")
    void shouldGetBookWaitlist() throws Exception {
        when(reservationService.getBookWaitlist(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleResponse)));

        mockMvc.perform(get("/api/reservations/book/1?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].bookTitle").value("Clean Architecture"));
    }
}

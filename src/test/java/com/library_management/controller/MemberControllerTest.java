package com.library_management.controller;

import com.library_management.dto.request.MemberRequestDto;
import com.library_management.dto.response.MemberResponseDto;
import com.library_management.exception.DuplicateResourceException;
import com.library_management.exception.GlobalExceptionHandler;
import com.library_management.exception.ResourceNotFoundException;
import com.library_management.service.MemberService;
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

class MemberControllerTest {

    private MockMvc mockMvc;

    @Mock
    private MemberService memberService;

    @InjectMocks
    private MemberController memberController;

    private MemberResponseDto sampleMember;

    private static final String VALID_MEMBER_JSON = """
            {
              "firstName": "John",
              "lastName": "Doe",
              "email": "john.doe@example.com",
              "phoneNumber": "1234567890"
            }
            """;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders
                .standaloneSetup(memberController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        sampleMember = MemberResponseDto.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .phoneNumber("1234567890")
                .membershipDate(LocalDate.now())
                .active(true)
                .build();
    }

    @Test
    void shouldRegisterMemberSuccessfully() throws Exception {
        when(memberService.registerMember(any(MemberRequestDto.class))).thenReturn(sampleMember);

        mockMvc.perform(post("/api/members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_MEMBER_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Member registered successfully"))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.firstName").value("John"))
                .andExpect(jsonPath("$.data.email").value("john.doe@example.com"))
                .andExpect(jsonPath("$.data.active").value(true));
    }

    @Test
    void shouldRejectRegisterMemberWithDuplicateEmail() throws Exception {
        when(memberService.registerMember(any(MemberRequestDto.class)))
                .thenThrow(new DuplicateResourceException("Member", "email", "john.doe@example.com"));

        mockMvc.perform(post("/api/members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_MEMBER_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("Member already exists with email: 'john.doe@example.com'"));
    }

    @Test
    void shouldRejectRegisterMemberWithInvalidEmail() throws Exception {
        String invalidJson = """
                {
                  "firstName": "John",
                  "lastName": "Doe",
                  "email": "not-a-valid-email",
                  "phoneNumber": "1234567890"
                }
                """;

        mockMvc.perform(post("/api/members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.validationErrors.email").exists());
    }

    @Test
    void shouldRejectRegisterMemberWithMissingFields() throws Exception {
        String invalidJson = """
                {
                  "firstName": "",
                  "lastName": "",
                  "email": "",
                  "phoneNumber": ""
                }
                """;

        mockMvc.perform(post("/api/members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.firstName").exists())
                .andExpect(jsonPath("$.validationErrors.lastName").exists())
                .andExpect(jsonPath("$.validationErrors.email").exists())
                .andExpect(jsonPath("$.validationErrors.phoneNumber").exists());
    }

    @Test
    void shouldGetMemberByIdSuccessfully() throws Exception {
        when(memberService.getMemberById(1L)).thenReturn(sampleMember);

        mockMvc.perform(get("/api/members/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.email").value("john.doe@example.com"));
    }

    @Test
    void shouldReturn404WhenMemberNotFound() throws Exception {
        when(memberService.getMemberById(999L))
                .thenThrow(new ResourceNotFoundException("Member", "id", 999L));

        mockMvc.perform(get("/api/members/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Member not found with id: '999'"));
    }

    @Test
    void shouldGetAllMembersPaged() throws Exception {
        Page<MemberResponseDto> page = new PageImpl<>(Collections.singletonList(sampleMember));
        when(memberService.getAllMembers(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/members")
                        .param("page", "0")
                        .param("size", "10")
                        .param("sortBy", "id")
                        .param("direction", "ASC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].id").value(1))
                .andExpect(jsonPath("$.data.totalElements").value(1));
    }

    @Test
    void shouldSearchMembersByName() throws Exception {
        Page<MemberResponseDto> page = new PageImpl<>(Collections.singletonList(sampleMember));
        when(memberService.searchMembersByName(eq("John"), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/members/search")
                        .param("name", "John"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].firstName").value("John"));
    }

    @Test
    void shouldGetActiveMembers() throws Exception {
        Page<MemberResponseDto> page = new PageImpl<>(Collections.singletonList(sampleMember));
        when(memberService.getActiveMembers(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/members/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].active").value(true));
    }

    @Test
    void shouldUpdateMemberSuccessfully() throws Exception {
        MemberResponseDto updatedMember = MemberResponseDto.builder()
                .id(1L)
                .firstName("John")
                .lastName("Smith")
                .email("john.smith@example.com")
                .phoneNumber("9876543210")
                .membershipDate(LocalDate.now())
                .active(true)
                .build();

        when(memberService.updateMember(eq(1L), any(MemberRequestDto.class))).thenReturn(updatedMember);

        String updateJson = """
                {
                  "firstName": "John",
                  "lastName": "Smith",
                  "email": "john.smith@example.com",
                  "phoneNumber": "9876543210"
                }
                """;

        mockMvc.perform(put("/api/members/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.lastName").value("Smith"))
                .andExpect(jsonPath("$.data.email").value("john.smith@example.com"));
    }

    @Test
    void shouldDeactivateMemberSuccessfully() throws Exception {
        MemberResponseDto deactivatedMember = MemberResponseDto.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .phoneNumber("1234567890")
                .membershipDate(LocalDate.now())
                .active(false)
                .build();

        when(memberService.deactivateMember(1L)).thenReturn(deactivatedMember);

        mockMvc.perform(patch("/api/members/1/deactivate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Member deactivated successfully"))
                .andExpect(jsonPath("$.data.active").value(false));
    }

    @Test
    void shouldRejectInvalidPaginationParameters() throws Exception {
        mockMvc.perform(get("/api/members")
                        .param("page", "-1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Page index cannot be negative"));
    }

    @Test
    void shouldDeleteMemberSuccessfully() throws Exception {
        doNothing().when(memberService).deleteMember(1L);

        mockMvc.perform(delete("/api/members/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Member deleted successfully"));

        verify(memberService, times(1)).deleteMember(1L);
    }

    @Test
    void shouldReturn404WhenDeletingNonExistentMember() throws Exception {
        doThrow(new ResourceNotFoundException("Member", "id", 999L))
                .when(memberService).deleteMember(999L);

        mockMvc.perform(delete("/api/members/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));

        verify(memberService, times(1)).deleteMember(999L);
    }
}

package com.library_management.service.impl;

import com.library_management.dto.request.MemberRequestDto;
import com.library_management.dto.response.MemberResponseDto;
import com.library_management.entity.Member;
import com.library_management.exception.DuplicateResourceException;
import com.library_management.exception.ResourceNotFoundException;
import com.library_management.repository.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for MemberServiceImpl using the Arrange-Act-Assert (AAA) pattern.
 */
@ExtendWith(MockitoExtension.class)
class MemberServiceImplTest {

    @Mock
    private MemberRepository memberRepository;

    @InjectMocks
    private MemberServiceImpl memberService;

    private Member sampleMember;
    private MemberRequestDto sampleRequest;

    @BeforeEach
    void setUp() {
        sampleMember = Member.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .phoneNumber("+91 9876543210")
                .address("123 Main Street")
                .membershipDate(LocalDate.now())
                .active(true)
                .build();

        sampleRequest = MemberRequestDto.builder()
                .firstName("John")
                .lastName("Doe")
                .email("JOHN.DOE@example.com") // test normalization to lowercase
                .phoneNumber("+91 9876543210")
                .address("123 Main Street")
                .active(true)
                .build();
    }

    @Test
    @DisplayName("Arrange-Act-Assert: Should register new member successfully with normalized email")
    void testRegisterMember_Success() {
        // Arrange
        when(memberRepository.existsByEmail("john.doe@example.com")).thenReturn(false);
        when(memberRepository.save(any(Member.class))).thenReturn(sampleMember);

        // Act
        MemberResponseDto response = memberService.registerMember(sampleRequest);

        // Assert
        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("john.doe@example.com", response.getEmail());
        assertTrue(response.getActive());
        verify(memberRepository, times(1)).existsByEmail("john.doe@example.com");
        verify(memberRepository, times(1)).save(any(Member.class));
    }

    @Test
    @DisplayName("Should throw DuplicateResourceException when email already exists")
    void testRegisterMember_DuplicateEmail_ThrowsException() {
        // Arrange
        when(memberRepository.existsByEmail("john.doe@example.com")).thenReturn(true);

        // Act & Assert
        DuplicateResourceException exception = assertThrows(
                DuplicateResourceException.class,
                () -> memberService.registerMember(sampleRequest)
        );

        assertTrue(exception.getMessage().contains("john.doe@example.com"));
        verify(memberRepository, never()).save(any(Member.class));
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException when required fields are blank")
    void testRegisterMember_BlankFields_ThrowsException() {
        sampleRequest.setEmail("   ");
        assertThrows(IllegalArgumentException.class, () -> memberService.registerMember(sampleRequest));

        sampleRequest.setEmail("valid@test.com");
        sampleRequest.setFirstName("");
        assertThrows(IllegalArgumentException.class, () -> memberService.registerMember(sampleRequest));
    }

    @Test
    @DisplayName("Should retrieve member by ID successfully")
    void testGetMemberById_Success() {
        // Arrange
        when(memberRepository.findById(1L)).thenReturn(Optional.of(sampleMember));

        // Act
        MemberResponseDto response = memberService.getMemberById(1L);

        // Assert
        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("John", response.getFirstName());
        assertEquals("Doe", response.getLastName());
        verify(memberRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when member ID does not exist")
    void testGetMemberById_NotFound_ThrowsException() {
        // Arrange
        when(memberRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> memberService.getMemberById(999L));
    }

    @Test
    @DisplayName("Should retrieve all members with pagination")
    void testGetAllMembers_Success() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<Member> pagedMembers = new PageImpl<>(List.of(sampleMember), pageable, 1);
        when(memberRepository.findAll(pageable)).thenReturn(pagedMembers);

        // Act
        Page<MemberResponseDto> result = memberService.getAllMembers(pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("John", result.getContent().get(0).getFirstName());
    }

    @Test
    @DisplayName("Should search members by name keyword")
    void testSearchMembersByName_Success() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<Member> pagedMembers = new PageImpl<>(List.of(sampleMember), pageable, 1);
        when(memberRepository.searchByName("Doe", pageable)).thenReturn(pagedMembers);

        // Act
        Page<MemberResponseDto> result = memberService.searchMembersByName("Doe", pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(memberRepository, times(1)).searchByName("Doe", pageable);
    }

    @Test
    @DisplayName("Should retrieve only active members")
    void testGetActiveMembers_Success() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<Member> pagedMembers = new PageImpl<>(List.of(sampleMember), pageable, 1);
        when(memberRepository.findByActiveTrue(pageable)).thenReturn(pagedMembers);

        // Act
        Page<MemberResponseDto> result = memberService.getActiveMembers(pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertTrue(result.getContent().get(0).getActive());
    }

    @Test
    @DisplayName("Should update existing member successfully")
    void testUpdateMember_Success() {
        // Arrange
        MemberRequestDto updateRequest = MemberRequestDto.builder()
                .firstName("John Updated")
                .lastName("Doe")
                .email("john.updated@example.com")
                .phoneNumber("+91 9999999999")
                .address("New Address 456")
                .active(true)
                .build();

        when(memberRepository.findById(1L)).thenReturn(Optional.of(sampleMember));
        when(memberRepository.existsByEmailAndIdNot("john.updated@example.com", 1L)).thenReturn(false);
        when(memberRepository.save(any(Member.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        MemberResponseDto response = memberService.updateMember(1L, updateRequest);

        // Assert
        assertNotNull(response);
        assertEquals("John Updated", response.getFirstName());
        assertEquals("john.updated@example.com", response.getEmail());
        verify(memberRepository, times(1)).save(sampleMember);
    }

    @Test
    @DisplayName("Should throw DuplicateResourceException on update when email collides with another member")
    void testUpdateMember_EmailCollision_ThrowsException() {
        // Arrange
        when(memberRepository.findById(1L)).thenReturn(Optional.of(sampleMember));
        when(memberRepository.existsByEmailAndIdNot("john.doe@example.com", 1L)).thenReturn(true);

        // Act & Assert
        assertThrows(DuplicateResourceException.class, () -> memberService.updateMember(1L, sampleRequest));
        verify(memberRepository, never()).save(any(Member.class));
    }

    @Test
    @DisplayName("Should deactivate member (soft delete)")
    void testDeactivateMember_Success() {
        // Arrange
        when(memberRepository.findById(1L)).thenReturn(Optional.of(sampleMember));
        when(memberRepository.save(any(Member.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        MemberResponseDto response = memberService.deactivateMember(1L);

        // Assert
        assertNotNull(response);
        assertFalse(response.getActive());
        assertFalse(sampleMember.getActive());
        verify(memberRepository, times(1)).save(sampleMember);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when deactivating non-existent member")
    void testDeactivateMember_NotFound_ThrowsException() {
        // Arrange
        when(memberRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> memberService.deactivateMember(999L));
        verify(memberRepository, never()).save(any(Member.class));
    }
}

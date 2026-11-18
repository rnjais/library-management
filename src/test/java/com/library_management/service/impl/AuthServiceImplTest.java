package com.library_management.service.impl;

import com.library_management.dto.request.LoginRequestDto;
import com.library_management.dto.request.RegisterRequestDto;
import com.library_management.dto.response.AuthResponseDto;
import com.library_management.dto.response.UserResponseDto;
import com.library_management.entity.Member;
import com.library_management.entity.Role;
import com.library_management.entity.User;
import com.library_management.exception.DuplicateResourceException;
import com.library_management.repository.MemberRepository;
import com.library_management.repository.UserRepository;
import com.library_management.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthServiceImpl authService;

    private RegisterRequestDto registerRequest;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        registerRequest = RegisterRequestDto.builder()
                .name("Alice Smith")
                .email("alice@example.com")
                .password("secret123")
                .build();

        sampleUser = User.builder()
                .id(1L)
                .name("Alice Smith")
                .email("alice@example.com")
                .password("$2a$10$hashedPasswordHere")
                .role(Role.MEMBER)
                .enabled(true)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void shouldRegisterUserSuccessfully() {
        Member linkedMember = Member.builder().id(10L).email("alice@example.com").active(true).build();
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("$2a$10$hashedPasswordHere");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(memberRepository.findByEmail("alice@example.com")).thenReturn(Optional.empty());
        when(memberRepository.save(any(Member.class))).thenReturn(linkedMember);

        UserResponseDto response = authService.register(registerRequest);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals(10L, response.getMemberId());
        assertEquals("Alice Smith", response.getName());
        assertEquals("alice@example.com", response.getEmail());
        assertEquals(Role.MEMBER, response.getRole());
        assertTrue(response.getEnabled());
        verify(passwordEncoder, times(1)).encode("secret123");
        verify(userRepository, times(1)).save(any(User.class));
        verify(memberRepository, times(1)).save(any(Member.class));
    }

    @Test
    void shouldRejectDuplicateEmail() {
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> authService.register(registerRequest));
        verify(passwordEncoder, never()).encode(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void shouldRejectNullRequest() {
        assertThrows(IllegalArgumentException.class, () -> authService.register(null));
    }

    @Test
    void shouldLoginSuccessfully() {
        LoginRequestDto loginRequest = LoginRequestDto.builder()
                .email("alice@example.com")
                .password("secret123")
                .build();

        Member linkedMember = Member.builder().id(10L).email("alice@example.com").active(true).build();
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(sampleUser);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(auth);
        when(memberRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(linkedMember));
        when(jwtService.generateToken(sampleUser)).thenReturn("mock.jwt.token");

        AuthResponseDto response = authService.login(loginRequest);

        assertNotNull(response);
        assertEquals("mock.jwt.token", response.getToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals("alice@example.com", response.getUser().getEmail());
        assertEquals(10L, response.getUser().getMemberId());
        assertEquals(Role.MEMBER, response.getUser().getRole());
        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtService, times(1)).generateToken(sampleUser);
    }

    @Test
    void shouldThrowBadCredentialsExceptionWhenPasswordWrong() {
        LoginRequestDto loginRequest = LoginRequestDto.builder()
                .email("alice@example.com")
                .password("wrongpassword")
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Invalid email or password"));

        assertThrows(BadCredentialsException.class, () -> authService.login(loginRequest));
        verify(jwtService, never()).generateToken(any());
    }

    @Test
    void shouldRejectNullLoginRequest() {
        assertThrows(IllegalArgumentException.class, () -> authService.login(null));
    }
}

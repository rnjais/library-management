package com.library_management.service.impl;

import com.library_management.dto.request.LoginRequestDto;
import com.library_management.dto.request.RegisterRequestDto;
import com.library_management.dto.response.AuthResponseDto;
import com.library_management.dto.response.UserResponseDto;
import com.library_management.entity.Role;
import com.library_management.entity.User;
import com.library_management.exception.DuplicateResourceException;
import com.library_management.repository.UserRepository;
import com.library_management.security.JwtService;
import com.library_management.service.AuthService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Service implementation for user registration and authentication workflows.
 */
@Slf4j
@Service
@Transactional(readOnly = true)
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    // Constructor Injection
    public AuthServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    /**
     * Registers a new user.
     * Enforces unique email, hashes password with BCrypt, and defaults to role MEMBER.
     */
    @Override
    @Transactional
    public UserResponseDto register(RegisterRequestDto request) {
        if (request == null) {
            throw new IllegalArgumentException("Registration request cannot be null");
        }

        String email = request.getEmail().trim().toLowerCase();

        // 1. Verify email uniqueness
        if (userRepository.existsByEmail(email)) {
            log.warn("Registration rejected: duplicate email '{}'", email);
            throw new DuplicateResourceException("User", "email", email);
        }

        // 2. Hash password securely
        String hashedPassword = passwordEncoder.encode(request.getPassword().trim());

        // 3. Build user entity (always assign MEMBER for public registrations)
        User user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .password(hashedPassword)
                .role(Role.MEMBER)
                .enabled(true)
                .createdAt(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered successfully with id={}, email={}, role={}",
                savedUser.getId(), savedUser.getEmail(), savedUser.getRole());

        return UserResponseDto.fromEntity(savedUser);
    }

    /**
     * Authenticates user credentials and generates a signed JWT token.
     *
     * @param request Validated login payload (email, password).
     * @return AuthResponseDto containing the JWT token and safe user details.
     */
    @Override
    public AuthResponseDto login(LoginRequestDto request) {
        if (request == null) {
            throw new IllegalArgumentException("Login request cannot be null");
        }

        String email = request.getEmail().trim().toLowerCase();
        String password = request.getPassword().trim();

        // 1. Authenticate credentials via Spring Security's AuthenticationManager
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
        );

        // 2. Retrieve authenticated User entity principal
        User user = (User) authentication.getPrincipal();

        // 3. Generate signed JWT token
        String token = jwtService.generateToken(user);

        log.info("User logged in successfully with email={}, role={}", user.getEmail(), user.getRole());

        // 4. Return safe AuthResponseDto
        return AuthResponseDto.builder()
                .token(token)
                .tokenType("Bearer")
                .user(UserResponseDto.fromEntity(user))
                .build();
    }
}

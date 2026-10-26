package com.library_management.controller;

import com.library_management.dto.request.LoginRequestDto;
import com.library_management.dto.request.RegisterRequestDto;
import com.library_management.dto.response.ApiResponse;
import com.library_management.dto.response.AuthResponseDto;
import com.library_management.dto.response.UserResponseDto;
import com.library_management.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller exposing public authentication endpoints.
 * Base URL: /api/auth
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Endpoints for user registration and JWT authentication")
public class AuthController {

    private final AuthService authService;

    // Constructor Injection
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * POST /api/auth/register
     * Public user registration endpoint. Assigns role MEMBER by default.
     *
     * @param request Validated registration payload (name, email, password).
     * @return 201 Created with safe UserResponseDto wrapped in ApiResponse.
     */
    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Registers a new user account with default MEMBER role.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "User registered successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error in request payload"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Email already in use")
    })
    public ResponseEntity<ApiResponse<UserResponseDto>> register(
            @Valid @RequestBody RegisterRequestDto request) {
        UserResponseDto response = authService.register(request);
        return new ResponseEntity<>(
                ApiResponse.success("User registered successfully", response),
                HttpStatus.CREATED
        );
    }

    /**
     * POST /api/auth/login
     * Authenticates user with email and password and returns a signed JWT token.
     *
     * @param request Validated login payload (email, password).
     * @return 200 OK with AuthResponseDto (token, tokenType, safe user) wrapped in ApiResponse.
     */
    @PostMapping("/login")
    @Operation(summary = "User login", description = "Authenticates user credentials and returns a signed JWT Bearer token.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Login successful, JWT token returned"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation failure on login fields"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Invalid credentials or account inactive")
    })
    public ResponseEntity<ApiResponse<AuthResponseDto>> login(
            @Valid @RequestBody LoginRequestDto request) {
        AuthResponseDto response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }
}

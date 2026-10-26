package com.library_management.service;

import com.library_management.dto.request.LoginRequestDto;
import com.library_management.dto.request.RegisterRequestDto;
import com.library_management.dto.response.AuthResponseDto;
import com.library_management.dto.response.UserResponseDto;

/**
 * Service interface defining authentication and registration operations.
 */
public interface AuthService {

    /**
     * Registers a new user account with role MEMBER and BCrypt password hashing.
     *
     * @param request Validated registration payload.
     * @return Safe UserResponseDto without password fields.
     */
    UserResponseDto register(RegisterRequestDto request);

    /**
     * Authenticates user credentials and generates a signed JWT token.
     *
     * @param request Validated login payload (email, password).
     * @return AuthResponseDto containing the JWT token and safe user details.
     */
    AuthResponseDto login(LoginRequestDto request);
}

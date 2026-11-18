package com.library_management.security;

import com.library_management.config.JwtProperties;
import com.library_management.entity.Role;
import com.library_management.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for JwtService covering token generation, claim validation,
 * expiration fail-closed behavior, tampering detection, and startup key validation.
 */
class JwtServiceTest {

    private static final String VALID_BASE64_SECRET = Base64.getEncoder()
            .encodeToString("0123456789abcdef0123456789abcdef0123456789abcdef".getBytes());

    private JwtService jwtService;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        JwtProperties properties = new JwtProperties();
        properties.setSecretKey(VALID_BASE64_SECRET);
        properties.setExpirationMs(3600_000L);
        jwtService = new JwtService(properties);
        jwtService.initSigningKey();

        sampleUser = User.builder()
                .id(42L)
                .name("Alice Tester")
                .email("alice@example.com")
                .password("encoded")
                .role(Role.MEMBER)
                .enabled(true)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Should generate valid JWT containing username and role claims")
    void shouldGenerateAndValidateToken() {
        String token = jwtService.generateToken(sampleUser);

        assertNotNull(token);
        assertEquals("alice@example.com", jwtService.extractUsername(token));
        assertEquals("MEMBER", jwtService.extractRole(token));
        assertFalse(jwtService.isTokenExpired(token));
        assertTrue(jwtService.isTokenValid(token, sampleUser));

        Claims claims = jwtService.extractAllClaims(token);
        assertNotNull(claims);
        assertTrue(jwtService.isTokenValid(claims, sampleUser));
    }

    @Test
    @DisplayName("Should reject token belonging to a different user")
    void shouldRejectTokenForDifferentUser() {
        String token = jwtService.generateToken(sampleUser);

        User otherUser = User.builder()
                .id(99L)
                .name("Bob")
                .email("bob@example.com")
                .password("encoded")
                .role(Role.MEMBER)
                .enabled(true)
                .build();

        assertFalse(jwtService.isTokenValid(token, otherUser));
    }

    @Test
    @DisplayName("Should reject expired token")
    void shouldRejectExpiredToken() {
        JwtProperties expiredProps = new JwtProperties();
        expiredProps.setSecretKey(VALID_BASE64_SECRET);
        expiredProps.setExpirationMs(-10_000L);
        JwtService expiredJwtService = new JwtService(expiredProps);
        expiredJwtService.initSigningKey();

        String expiredToken = expiredJwtService.generateToken(sampleUser);

        assertTrue(jwtService.isTokenExpired(expiredToken));
        assertFalse(jwtService.isTokenValid(expiredToken, sampleUser));
    }

    @Test
    @DisplayName("Should reject tampered or malformed token")
    void shouldRejectTamperedAndMalformedTokens() {
        String validToken = jwtService.generateToken(sampleUser);
        String tamperedToken = validToken.substring(0, validToken.length() - 4) + "AAAA";

        assertNull(jwtService.extractAllClaims(tamperedToken));
        assertFalse(jwtService.isTokenValid(tamperedToken, sampleUser));
        assertTrue(jwtService.isTokenExpired(tamperedToken));

        assertNull(jwtService.extractAllClaims("not.a.jwt"));
        assertFalse(jwtService.isTokenValid("not.a.jwt", sampleUser));
    }

    @Test
    @DisplayName("Should fail closed when a signed token has no expiration claim")
    void shouldFailClosedWhenExpirationClaimMissing() {
        String tokenWithoutExp = Jwts.builder()
                .subject("alice@example.com")
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(VALID_BASE64_SECRET)))
                .compact();

        assertTrue(jwtService.isTokenExpired(tokenWithoutExp));
        assertFalse(jwtService.isTokenValid(tokenWithoutExp, sampleUser));
    }

    @Test
    @DisplayName("Should fail fast on startup when JWT secret is missing or shorter than 256 bits")
    void shouldRejectWeakOrMissingSecretKey() {
        JwtProperties missingProps = new JwtProperties();
        missingProps.setSecretKey("   ");
        JwtService missingKeyService = new JwtService(missingProps);
        assertThrows(IllegalStateException.class, missingKeyService::initSigningKey);

        JwtProperties weakProps = new JwtProperties();
        weakProps.setSecretKey(Base64.getEncoder().encodeToString("too-short-secret".getBytes()));
        JwtService weakKeyService = new JwtService(weakProps);
        assertThrows(IllegalStateException.class, weakKeyService::initSigningKey);
    }
}

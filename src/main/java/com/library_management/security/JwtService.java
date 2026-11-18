package com.library_management.security;

import com.library_management.config.JwtProperties;
import com.library_management.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Service for generating, parsing, and validating JSON Web Tokens (JWT).
 */
@Slf4j
@Service
public class JwtService {

    private static final int MIN_SECRET_KEY_BYTES = 32; // 256 bits minimum for HMAC-SHA256

    private final JwtProperties jwtProperties;
    private volatile SecretKey cachedSigningKey;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    /**
     * Validates and caches the HMAC signing key once at application startup (fail-fast).
     */
    @PostConstruct
    public void initSigningKey() {
        this.cachedSigningKey = buildValidatedSigningKey();
    }

    /**
     * Generates a signed JWT token for the authenticated user, including their role claim.
     *
     * @param userDetails The authenticated user principal.
     * @return Compact serialized JWT token string.
     */
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();

        if (userDetails instanceof User user) {
            claims.put("userId", user.getId());
            claims.put("name", user.getName());
            claims.put("role", user.getRole().name());
        } else {
            String role = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .findFirst()
                    .orElse("ROLE_MEMBER");
            claims.put("role", role);
        }

        return buildToken(claims, userDetails.getUsername(), jwtProperties.getExpirationMs());
    }

    /**
     * Builds and signs a JWT token with the specified claims, subject, and expiration.
     */
    private String buildToken(Map<String, Object> extraClaims, String subject, long expirationMs) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .claims(extraClaims)
                .subject(subject)
                .issuedAt(new Date(now))
                .expiration(new Date(now + expirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Extracts the username (email subject) from the token.
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extracts the role claim from the token.
     */
    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    /**
     * Extracts a single claim from the token payload using a claims resolver function.
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claims != null ? claimsResolver.apply(claims) : null;
    }

    /**
     * Validates whether a token belongs to the given user and has not expired (single parse).
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            Claims claims = extractAllClaims(token);
            return isTokenValid(claims, userDetails);
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Validates pre-parsed JWT claims against the loaded user details without re-parsing the token.
     */
    public boolean isTokenValid(Claims claims, UserDetails userDetails) {
        if (claims == null || userDetails == null) {
            return false;
        }
        String username = claims.getSubject();
        return username != null
                && username.equalsIgnoreCase(userDetails.getUsername())
                && !isClaimsExpired(claims);
    }

    /**
     * Checks if the token has passed its expiration timestamp.
     * Fails closed (returns true) when expiration claim is missing or unparseable.
     */
    public boolean isTokenExpired(String token) {
        Claims claims = extractAllClaims(token);
        return isClaimsExpired(claims);
    }

    private boolean isClaimsExpired(Claims claims) {
        if (claims == null) {
            return true;
        }
        Date expiration = claims.getExpiration();
        return expiration == null || expiration.before(new Date());
    }

    /**
     * Parses and cryptographically verifies the token signature.
     */
    public Claims extractAllClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("JWT parsing failed: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Returns the cached cryptographic signing key, initializing lazily if constructed outside Spring.
     */
    private SecretKey getSigningKey() {
        SecretKey key = this.cachedSigningKey;
        if (key == null) {
            key = buildValidatedSigningKey();
            this.cachedSigningKey = key;
        }
        return key;
    }

    /**
     * Decodes and strictly validates the configured Base64 JWT secret (>= 256 bits).
     */
    private SecretKey buildValidatedSigningKey() {
        String configuredSecret = jwtProperties.getSecretKey();
        if (configuredSecret == null || configuredSecret.isBlank()) {
            throw new IllegalStateException("JWT secret key is not configured. Set app.jwt.secret-key / JWT_SECRET_KEY.");
        }
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(configuredSecret.trim());
        } catch (Exception e) {
            throw new IllegalStateException("JWT secret key must be a valid Base64-encoded string.", e);
        }
        if (keyBytes.length < MIN_SECRET_KEY_BYTES) {
            throw new IllegalStateException("JWT secret key must be at least 256 bits (32 bytes) after Base64 decoding.");
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }
}

package com.library_management.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

/**
 * Configuration properties for JWT authentication.
 * Binds properties under the 'app.jwt' prefix and requires an externalized secret key.
 */
@Getter
@Setter
@Component
@Validated
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    /**
     * Base64-encoded secret key used for HMAC-SHA signing (minimum 256 bits / 32 bytes).
     * Must be supplied via environment variable (JWT_SECRET_KEY) or gitignored .env.
     */
    @NotBlank(message = "JWT secret key must be configured via app.jwt.secret-key / JWT_SECRET_KEY")
    private String secretKey;

    /**
     * Expiration time in milliseconds (default: 86,400,000 ms = 24 hours).
     */
    @Positive(message = "JWT expiration duration must be positive")
    private long expirationMs = 86400000L;
}

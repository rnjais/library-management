package com.library_management.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for JWT authentication.
 * Binds properties under the 'app.jwt' prefix from application.yml.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    /**
     * Base64/plain secret key used for HMAC-SHA signing (minimum 256 bits).
     */
    private String secretKey = "dGhpcy1pcy1hLXNhZmUtZGV2ZWxvcG1lbnQtdGVzdC1qd3Qtc2VjcmV0LWtleS0yNTYtYml0cw==";

    /**
     * Expiration time in milliseconds (default: 86,400,000 ms = 24 hours).
     */
    private long expirationMs = 86400000L;
}

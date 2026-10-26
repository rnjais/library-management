package com.library_management.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for application email dispatching.
 * Binds properties prefixed with 'app.mail' in application.yml.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.mail")
public class MailProperties {

    /**
     * Default 'From' email address displayed in outgoing emails.
     * Default: noreply@librarymanagement.com
     */
    private String from = "noreply@librarymanagement.com";

    /**
     * Display name of the sender.
     * Default: Library Management System
     */
    private String senderName = "Library Management System";

    /**
     * Flag to enable or disable actual email dispatching.
     * Useful for disabling emails during local development or testing.
     * Default: true
     */
    private boolean enabled = true;
}

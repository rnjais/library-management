package com.library_management.config;

import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

/**
 * Configuration properties governing library borrowing policies.
 * Binds properties under the 'app.borrowing' prefix.
 */
@Getter
@Setter
@Component
@Validated
@ConfigurationProperties(prefix = "app.borrowing")
public class BorrowingProperties {

    /**
     * Maximum number of simultaneous active (unreturned) loans allowed per member.
     */
    @Positive(message = "Maximum active loans per member must be positive")
    private int maxActiveLoans = 5;

    /**
     * Default loan duration in days when neither dueDate nor borrowDays is specified.
     */
    @Positive(message = "Default borrow days must be positive")
    private int defaultBorrowDays = 14;

    /**
     * Upper bound on loan duration in days (applies to both borrowDays and explicit dueDate).
     */
    @Positive(message = "Maximum borrow days must be positive")
    private int maxBorrowDays = 90;

    /**
     * Whether to prevent members with unpaid fines from checking out additional books.
     */
    private boolean blockOnUnpaidFines = true;
}

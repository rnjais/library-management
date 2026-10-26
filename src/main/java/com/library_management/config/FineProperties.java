package com.library_management.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Configuration properties for Library Fine Management.
 * Binds properties under the 'app.fine' prefix from application.yml.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.fine")
public class FineProperties {

    /**
     * Daily fine rate charged per overdue calendar day. Default: 5.00
     */
    private BigDecimal dailyRate = new BigDecimal("5.00");

    /**
     * Currency code used for reporting. Default: INR
     */
    private String currency = "INR";
}

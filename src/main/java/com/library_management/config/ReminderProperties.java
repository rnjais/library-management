package com.library_management.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for automated due-date reminders and schedulers.
 * Binds properties prefixed with 'app.reminders' in application.yml.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.reminders")
public class ReminderProperties {

    /**
     * Number of calendar days before the loan due date to dispatch an upcoming due reminder.
     * Default: 2 days
     */
    private int daysBeforeDue = 2;

    /**
     * Cron expression defining when the daily reminder scheduler runs.
     * Default: 0 0 8 * * ? (Every day at 8:00 AM)
     */
    private String cron = "0 0 8 * * ?";
}

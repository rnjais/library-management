package com.library_management.scheduler;

import com.library_management.config.ReminderProperties;
import com.library_management.entity.Borrowing;
import com.library_management.entity.BorrowingReminder;
import com.library_management.entity.ReminderType;
import com.library_management.repository.BorrowingReminderRepository;
import com.library_management.repository.BorrowingRepository;
import com.library_management.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Scheduled background task for identifying upcoming due and overdue book loans,
 * dispatching notification emails, and recording audits to prevent duplicate emails.
 */
@Slf4j
@Component
public class DueDateReminderScheduler {

    private final BorrowingRepository borrowingRepository;
    private final BorrowingReminderRepository reminderRepository;
    private final EmailService emailService;
    private final ReminderProperties reminderProperties;

    // Constructor Injection
    public DueDateReminderScheduler(
            BorrowingRepository borrowingRepository,
            BorrowingReminderRepository reminderRepository,
            EmailService emailService,
            ReminderProperties reminderProperties) {
        this.borrowingRepository = borrowingRepository;
        this.reminderRepository = reminderRepository;
        this.emailService = emailService;
        this.reminderProperties = reminderProperties;
    }

    /**
     * Executes according to configurable cron expression (default: daily at 8:00 AM).
     * Processes both advance upcoming due reminders and overdue alerts.
     */
    @Scheduled(cron = "${app.reminders.cron:0 0 8 * * ?}")
    @Transactional
    public void runDailyReminders() {
        LocalDate today = LocalDate.now();
        log.info("Starting automated due-date reminder scheduler for date: {}", today);

        int upcomingSent = processUpcomingDueReminders(today);
        int overdueSent = processOverdueReminders(today);

        log.info("Due-date reminder scheduler completed. Dispatched {} upcoming due reminder(s) and {} overdue notice(s)",
                upcomingSent, overdueSent);
    }

    /**
     * Identifies active unreturned loans due in 'app.reminders.days-before-due' days (default: 2 days)
     * and sends advance notices, skipping loans that have already received an upcoming reminder.
     *
     * @param today Current date.
     * @return Number of reminders sent.
     */
    public int processUpcomingDueReminders(LocalDate today) {
        int daysBeforeDue = reminderProperties.getDaysBeforeDue();
        LocalDate targetDueDate = today.plusDays(daysBeforeDue);

        List<Borrowing> dueLoans = borrowingRepository.findActiveBorrowingsDueOn(targetDueDate);
        int sentCount = 0;

        for (Borrowing loan : dueLoans) {
            // Guarantee: Returned books never receive reminders
            if (loan.isReturned() || loan.getReturnDate() != null) {
                continue;
            }

            // Duplicate Prevention: Check if upcoming reminder was already sent for this loan
            if (reminderRepository.existsByBorrowingIdAndReminderType(loan.getId(), ReminderType.UPCOMING_DUE)) {
                log.debug("Upcoming reminder already sent for borrowing id={}. Skipping duplicate.", loan.getId());
                continue;
            }

            try {
                emailService.sendUpcomingDueDateReminder(loan, daysBeforeDue);

                // Record audit to prevent duplicate sending
                BorrowingReminder reminder = BorrowingReminder.builder()
                        .borrowing(loan)
                        .reminderType(ReminderType.UPCOMING_DUE)
                        .sentDate(today)
                        .sentAt(LocalDateTime.now())
                        .build();
                reminderRepository.save(reminder);
                sentCount++;

            } catch (Exception ex) {
                log.error("Failed to process upcoming due reminder for borrowing id={}: {}",
                        loan.getId(), ex.getMessage(), ex);
            }
        }

        return sentCount;
    }

    /**
     * Identifies active unreturned loans whose due date is before today and sends overdue alerts,
     * ensuring at most one overdue reminder is dispatched per borrowing per calendar day.
     *
     * @param today Current date.
     * @return Number of notices sent.
     */
    public int processOverdueReminders(LocalDate today) {
        List<Borrowing> overdueLoans = borrowingRepository.findActiveOverdueBorrowings(today);
        int sentCount = 0;

        for (Borrowing loan : overdueLoans) {
            // Guarantee: Returned books never receive reminders
            if (loan.isReturned() || loan.getReturnDate() != null) {
                continue;
            }

            // Duplicate Prevention: Check if overdue reminder was already sent today
            if (reminderRepository.existsByBorrowingIdAndReminderTypeAndSentDate(loan.getId(), ReminderType.OVERDUE, today)) {
                log.debug("Overdue reminder already sent today for borrowing id={}. Skipping duplicate.", loan.getId());
                continue;
            }

            long overdueDays = ChronoUnit.DAYS.between(loan.getDueDate(), today);
            if (overdueDays <= 0) {
                continue;
            }

            try {
                emailService.sendOverdueReminder(loan, (int) overdueDays);

                // Record audit to prevent duplicate sending on the same day
                BorrowingReminder reminder = BorrowingReminder.builder()
                        .borrowing(loan)
                        .reminderType(ReminderType.OVERDUE)
                        .sentDate(today)
                        .sentAt(LocalDateTime.now())
                        .build();
                reminderRepository.save(reminder);
                sentCount++;

            } catch (Exception ex) {
                log.error("Failed to process overdue reminder for borrowing id={}: {}",
                        loan.getId(), ex.getMessage(), ex);
            }
        }

        return sentCount;
    }
}

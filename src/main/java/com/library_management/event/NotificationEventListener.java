package com.library_management.event;

import com.library_management.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Spring Event Listener that receives library domain events.
 * Uses @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
 * to guarantee that emails are only dispatched after MySQL database transactions
 * have successfully committed.
 *
 * Annotated with @Async to execute email delivery on a background worker thread,
 * ensuring zero added latency to user HTTP requests.
 */
@Slf4j
@Component
public class NotificationEventListener {

    private final EmailService emailService;

    public NotificationEventListener(EmailService emailService) {
        this.emailService = emailService;
    }

    /**
     * Listens for BookBorrowedEvent after successful commit.
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleBookBorrowed(BookBorrowedEvent event) {
        if (event == null || event.getBorrowing() == null) {
            log.warn("Received empty BookBorrowedEvent. Skipping notification.");
            return;
        }
        log.info("Processing post-commit borrowing notification for borrowingId={}", event.getBorrowing().getId());
        emailService.sendBorrowingConfirmation(event.getBorrowing());
    }

    /**
     * Listens for BookReturnedEvent after successful commit.
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleBookReturned(BookReturnedEvent event) {
        if (event == null || event.getBorrowing() == null) {
            log.warn("Received empty BookReturnedEvent. Skipping notification.");
            return;
        }
        log.info("Processing post-commit return notification for borrowingId={}", event.getBorrowing().getId());
        emailService.sendReturnConfirmation(event.getBorrowing());
    }

    /**
     * Listens for FineCreatedEvent after successful commit.
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleFineCreated(FineCreatedEvent event) {
        if (event == null || event.getFine() == null) {
            log.warn("Received empty FineCreatedEvent. Skipping notification.");
            return;
        }
        log.info("Processing post-commit fine created notification for fineId={}", event.getFine().getId());
        emailService.sendFineCreatedNotification(event.getFine());
    }

    /**
     * Listens for FinePaidEvent after successful commit.
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleFinePaid(FinePaidEvent event) {
        if (event == null || event.getFine() == null) {
            log.warn("Received empty FinePaidEvent. Skipping notification.");
            return;
        }
        log.info("Processing post-commit fine paid notification for fineId={}", event.getFine().getId());
        emailService.sendFinePaidNotification(event.getFine());
    }
}

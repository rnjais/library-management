package com.library_management.scheduler;

import com.library_management.entity.BorrowingStatus;
import com.library_management.repository.BorrowingRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Scheduled task to periodically synchronize the database status of overdue loans.
 * Ensures the 'status' column in MySQL reflects 'OVERDUE' for reports and admin audits,
 * while real-time API queries dynamically evaluate overdue state based on the current date.
 */
@Slf4j
@Component
public class OverdueBorrowingScheduler {

    private final BorrowingRepository borrowingRepository;

    // Constructor Injection
    public OverdueBorrowingScheduler(BorrowingRepository borrowingRepository) {
        this.borrowingRepository = borrowingRepository;
    }

    /**
     * Executes once every day at midnight (00:00:00) using configurable cron expression.
     * Identifies all unreturned loans where dueDate < today and updates status from BORROWED to OVERDUE.
     */
    @Scheduled(cron = "${app.borrowing.overdue-cron:0 0 0 * * ?}")
    @Transactional
    public void synchronizeOverdueStatus() {
        LocalDate today = LocalDate.now();
        log.info("Starting scheduled overdue status synchronization for date: {}", today);

        int updatedCount = borrowingRepository.updateOverdueStatus(
                BorrowingStatus.OVERDUE,
                BorrowingStatus.BORROWED,
                today
        );

        log.info("Overdue status synchronization complete. {} borrowing records updated to OVERDUE", updatedCount);
    }
}

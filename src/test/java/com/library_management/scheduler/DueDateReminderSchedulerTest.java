package com.library_management.scheduler;

import com.library_management.config.ReminderProperties;
import com.library_management.entity.*;
import com.library_management.repository.BorrowingReminderRepository;
import com.library_management.repository.BorrowingRepository;
import com.library_management.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DueDateReminderSchedulerTest {

    @Mock
    private BorrowingRepository borrowingRepository;

    @Mock
    private BorrowingReminderRepository reminderRepository;

    @Mock
    private EmailService emailService;

    @Spy
    private ReminderProperties reminderProperties = new ReminderProperties();

    @InjectMocks
    private DueDateReminderScheduler scheduler;

    private Member sampleMember;
    private Book sampleBook;
    private Borrowing dueSoonLoan;
    private Borrowing overdueLoan;
    private LocalDate today;

    @BeforeEach
    void setUp() {
        today = LocalDate.now();
        reminderProperties.setDaysBeforeDue(2);

        sampleMember = Member.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .active(true)
                .build();

        sampleBook = Book.builder()
                .id(10L)
                .title("Clean Architecture")
                .author("Robert C. Martin")
                .build();

        dueSoonLoan = Borrowing.builder()
                .id(101L)
                .member(sampleMember)
                .book(sampleBook)
                .borrowDate(today.minusDays(12))
                .dueDate(today.plusDays(2))
                .status(BorrowingStatus.BORROWED)
                .build();

        overdueLoan = Borrowing.builder()
                .id(102L)
                .member(sampleMember)
                .book(sampleBook)
                .borrowDate(today.minusDays(20))
                .dueDate(today.minusDays(5))
                .status(BorrowingStatus.OVERDUE)
                .build();
    }

    @Test
    @DisplayName("Should send upcoming due reminder and record audit when not previously sent")
    void testProcessUpcomingDueReminders_Success() {
        LocalDate targetDueDate = today.plusDays(2);
        when(borrowingRepository.findActiveBorrowingsDueOn(targetDueDate)).thenReturn(List.of(dueSoonLoan));
        when(reminderRepository.existsByBorrowingIdAndReminderType(101L, ReminderType.UPCOMING_DUE)).thenReturn(false);

        int sent = scheduler.processUpcomingDueReminders(today);

        assertEquals(1, sent);
        verify(emailService, times(1)).sendUpcomingDueDateReminder(dueSoonLoan, 2);
        verify(reminderRepository, times(1)).save(any(BorrowingReminder.class));
    }

    @Test
    @DisplayName("Should skip upcoming due reminder if already recorded as sent (duplicate prevention)")
    void testProcessUpcomingDueReminders_DuplicatePrevented() {
        LocalDate targetDueDate = today.plusDays(2);
        when(borrowingRepository.findActiveBorrowingsDueOn(targetDueDate)).thenReturn(List.of(dueSoonLoan));
        when(reminderRepository.existsByBorrowingIdAndReminderType(101L, ReminderType.UPCOMING_DUE)).thenReturn(true);

        int sent = scheduler.processUpcomingDueReminders(today);

        assertEquals(0, sent);
        verify(emailService, never()).sendUpcomingDueDateReminder(any(), anyInt());
        verify(reminderRepository, never()).save(any(BorrowingReminder.class));
    }

    @Test
    @DisplayName("Should never send upcoming reminder if book has been returned")
    void testProcessUpcomingDueReminders_ReturnedBookExcluded() {
        dueSoonLoan.setReturnDate(today);
        dueSoonLoan.setStatus(BorrowingStatus.RETURNED);

        LocalDate targetDueDate = today.plusDays(2);
        when(borrowingRepository.findActiveBorrowingsDueOn(targetDueDate)).thenReturn(List.of(dueSoonLoan));

        int sent = scheduler.processUpcomingDueReminders(today);

        assertEquals(0, sent);
        verify(emailService, never()).sendUpcomingDueDateReminder(any(), anyInt());
        verify(reminderRepository, never()).save(any(BorrowingReminder.class));
    }

    @Test
    @DisplayName("Should send overdue alert and record audit when not sent today")
    void testProcessOverdueReminders_Success() {
        when(borrowingRepository.findActiveOverdueBorrowings(today)).thenReturn(List.of(overdueLoan));
        when(reminderRepository.existsByBorrowingIdAndReminderTypeAndSentDate(102L, ReminderType.OVERDUE, today)).thenReturn(false);

        int sent = scheduler.processOverdueReminders(today);

        assertEquals(1, sent);
        verify(emailService, times(1)).sendOverdueReminder(overdueLoan, 5);
        verify(reminderRepository, times(1)).save(any(BorrowingReminder.class));
    }

    @Test
    @DisplayName("Should skip overdue alert if already sent today (duplicate prevention)")
    void testProcessOverdueReminders_DuplicatePreventedToday() {
        when(borrowingRepository.findActiveOverdueBorrowings(today)).thenReturn(List.of(overdueLoan));
        when(reminderRepository.existsByBorrowingIdAndReminderTypeAndSentDate(102L, ReminderType.OVERDUE, today)).thenReturn(true);

        int sent = scheduler.processOverdueReminders(today);

        assertEquals(0, sent);
        verify(emailService, never()).sendOverdueReminder(any(), anyInt());
        verify(reminderRepository, never()).save(any(BorrowingReminder.class));
    }

    @Test
    @DisplayName("Should never send overdue alert if book has been returned")
    void testProcessOverdueReminders_ReturnedBookExcluded() {
        overdueLoan.setReturnDate(today);
        overdueLoan.setStatus(BorrowingStatus.RETURNED);

        when(borrowingRepository.findActiveOverdueBorrowings(today)).thenReturn(List.of(overdueLoan));

        int sent = scheduler.processOverdueReminders(today);

        assertEquals(0, sent);
        verify(emailService, never()).sendOverdueReminder(any(), anyInt());
        verify(reminderRepository, never()).save(any(BorrowingReminder.class));
    }

    @Test
    @DisplayName("Should execute daily reminder job combining upcoming and overdue workflows")
    void testRunDailyReminders() {
        when(borrowingRepository.findActiveBorrowingsDueOn(any())).thenReturn(Collections.emptyList());
        when(borrowingRepository.findActiveOverdueBorrowings(any())).thenReturn(Collections.emptyList());

        scheduler.runDailyReminders();

        verify(borrowingRepository, times(1)).findActiveBorrowingsDueOn(today.plusDays(2));
        verify(borrowingRepository, times(1)).findActiveOverdueBorrowings(today);
    }
}

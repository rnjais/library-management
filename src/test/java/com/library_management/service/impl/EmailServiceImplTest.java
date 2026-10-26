package com.library_management.service.impl;

import com.library_management.config.FineProperties;
import com.library_management.config.MailProperties;
import com.library_management.entity.*;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceImplTest {

    @Mock
    private JavaMailSender mailSender;

    @Spy
    private MailProperties mailProperties = new MailProperties();

    @Spy
    private FineProperties fineProperties = new FineProperties();

    @InjectMocks
    private EmailServiceImpl emailService;

    private Member member;
    private Book book;
    private Borrowing borrowing;
    private Fine fine;

    @BeforeEach
    void setUp() {
        mailProperties.setEnabled(true);
        mailProperties.setFrom("test@library.com");
        mailProperties.setSenderName("Test Library");

        member = Member.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .phoneNumber("1234567890")
                .active(true)
                .build();

        book = Book.builder()
                .id(10L)
                .title("Clean Architecture")
                .author("Robert C. Martin")
                .isbn("9780134494166")
                .category("Computer Science")
                .totalCopies(5)
                .availableCopies(4)
                .build();

        borrowing = Borrowing.builder()
                .id(100L)
                .member(member)
                .book(book)
                .borrowDate(LocalDate.now().minusDays(10))
                .dueDate(LocalDate.now().plusDays(4))
                .status(BorrowingStatus.BORROWED)
                .build();

        fine = Fine.builder()
                .id(50L)
                .borrowing(borrowing)
                .amount(new BigDecimal("25.00"))
                .overdueDays(5)
                .status(FineStatus.UNPAID)
                .calculatedAt(LocalDateTime.now())
                .build();
    }

    private void mockCreateMimeMessage() {
        MimeMessage mimeMessage = new MimeMessage((Session) null);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
    }

    @Test
    @DisplayName("Should successfully send borrowing confirmation email")
    void testSendBorrowingConfirmation() {
        mockCreateMimeMessage();

        assertDoesNotThrow(() -> emailService.sendBorrowingConfirmation(borrowing));

        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Should successfully send book return confirmation email")
    void testSendReturnConfirmation() {
        mockCreateMimeMessage();
        borrowing.setReturnDate(LocalDate.now());
        borrowing.setStatus(BorrowingStatus.RETURNED);

        assertDoesNotThrow(() -> emailService.sendReturnConfirmation(borrowing));

        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Should successfully send upcoming due date reminder email")
    void testSendUpcomingDueDateReminder() {
        mockCreateMimeMessage();

        assertDoesNotThrow(() -> emailService.sendUpcomingDueDateReminder(borrowing, 2));

        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Should successfully send overdue book reminder email")
    void testSendOverdueReminder() {
        mockCreateMimeMessage();

        assertDoesNotThrow(() -> emailService.sendOverdueReminder(borrowing, 3));

        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Should successfully send fine created notification email")
    void testSendFineCreatedNotification() {
        mockCreateMimeMessage();

        assertDoesNotThrow(() -> emailService.sendFineCreatedNotification(fine));

        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Should successfully send fine paid notification receipt email")
    void testSendFinePaidNotification() {
        mockCreateMimeMessage();
        fine.setStatus(FineStatus.PAID);
        fine.setPaidAt(LocalDateTime.now());

        assertDoesNotThrow(() -> emailService.sendFinePaidNotification(fine));

        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Should skip sending when email dispatching is disabled via configuration")
    void testSendEmail_WhenDisabled_ShouldNotSend() {
        mailProperties.setEnabled(false);

        assertDoesNotThrow(() -> emailService.sendBorrowingConfirmation(borrowing));

        verify(mailSender, never()).send(any(MimeMessage.class));
        verify(mailSender, never()).createMimeMessage();
    }

    @Test
    @DisplayName("Should catch MailException without throwing or crashing the application")
    void testSendEmail_WhenSmtpErrorOccurs_ShouldCatchGracefully() {
        mockCreateMimeMessage();
        doThrow(new MailSendException("SMTP server connection timeout"))
                .when(mailSender).send(any(MimeMessage.class));

        assertDoesNotThrow(() -> emailService.sendBorrowingConfirmation(borrowing));

        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Should safely handle null borrowing or missing member without throwing")
    void testSendEmail_WhenBorrowingOrMemberNull_ShouldSkipSafely() {
        assertDoesNotThrow(() -> emailService.sendBorrowingConfirmation(null));

        borrowing.setMember(null);
        assertDoesNotThrow(() -> emailService.sendBorrowingConfirmation(borrowing));

        verify(mailSender, never()).send(any(MimeMessage.class));
    }
}

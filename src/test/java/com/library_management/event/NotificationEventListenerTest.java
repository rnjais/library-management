package com.library_management.event;

import com.library_management.entity.Borrowing;
import com.library_management.service.EmailService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationEventListenerTest {

    @Mock
    private EmailService emailService;

    @InjectMocks
    private NotificationEventListener listener;

    @Test
    @DisplayName("Should invoke emailService.sendBorrowingConfirmation on BookBorrowedEvent")
    void testHandleBookBorrowed() {
        Borrowing borrowing = Borrowing.builder().id(101L).build();
        BookBorrowedEvent event = new BookBorrowedEvent(borrowing);

        listener.handleBookBorrowed(event);

        verify(emailService, times(1)).sendBorrowingConfirmation(borrowing);
    }

    @Test
    @DisplayName("Should invoke emailService.sendReturnConfirmation on BookReturnedEvent")
    void testHandleBookReturned() {
        Borrowing borrowing = Borrowing.builder().id(102L).build();
        BookReturnedEvent event = new BookReturnedEvent(borrowing);

        listener.handleBookReturned(event);

        verify(emailService, times(1)).sendReturnConfirmation(borrowing);
    }

    @Test
    @DisplayName("Should invoke emailService.sendFineCreatedNotification on FineCreatedEvent")
    void testHandleFineCreated() {
        com.library_management.entity.Fine fine = com.library_management.entity.Fine.builder().id(201L).build();
        FineCreatedEvent event = new FineCreatedEvent(fine);

        listener.handleFineCreated(event);

        verify(emailService, times(1)).sendFineCreatedNotification(fine);
    }

    @Test
    @DisplayName("Should invoke emailService.sendFinePaidNotification on FinePaidEvent")
    void testHandleFinePaid() {
        com.library_management.entity.Fine fine = com.library_management.entity.Fine.builder().id(202L).build();
        FinePaidEvent event = new FinePaidEvent(fine);

        listener.handleFinePaid(event);

        verify(emailService, times(1)).sendFinePaidNotification(fine);
    }

    @Test
    @DisplayName("Should safely handle null event or null entities without throwing")
    void testHandleNullEvents() {
        listener.handleBookBorrowed(null);
        listener.handleBookBorrowed(new BookBorrowedEvent(null));

        listener.handleBookReturned(null);
        listener.handleBookReturned(new BookReturnedEvent(null));

        listener.handleFineCreated(null);
        listener.handleFineCreated(new FineCreatedEvent(null));

        listener.handleFinePaid(null);
        listener.handleFinePaid(new FinePaidEvent(null));

        verifyNoInteractions(emailService);
    }
}

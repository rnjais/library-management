package com.library_management.scheduler;

import com.library_management.entity.BorrowingStatus;
import com.library_management.repository.BorrowingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OverdueBorrowingSchedulerTest {

    @Mock
    private BorrowingRepository borrowingRepository;

    @InjectMocks
    private OverdueBorrowingScheduler scheduler;

    @Test
    void shouldExecuteOverdueSynchronization() {
        when(borrowingRepository.updateOverdueStatus(
                eq(BorrowingStatus.OVERDUE),
                eq(BorrowingStatus.BORROWED),
                any(LocalDate.class)
        )).thenReturn(3);

        scheduler.synchronizeOverdueStatus();

        verify(borrowingRepository, times(1)).updateOverdueStatus(
                eq(BorrowingStatus.OVERDUE),
                eq(BorrowingStatus.BORROWED),
                any(LocalDate.class)
        );
    }
}

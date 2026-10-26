package com.library_management.service.impl;

import com.library_management.dto.request.BorrowingRequestDto;
import com.library_management.dto.response.BorrowingResponseDto;
import com.library_management.entity.Book;
import com.library_management.entity.Borrowing;
import com.library_management.entity.BorrowingStatus;
import com.library_management.entity.Member;
import com.library_management.exception.*;
import com.library_management.repository.BookRepository;
import com.library_management.repository.BorrowingRepository;
import com.library_management.repository.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BorrowingServiceImplTest {

    @Mock
    private BorrowingRepository borrowingRepository;

    @Mock
    private BookRepository bookRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private com.library_management.service.FineService fineService;

    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private BorrowingServiceImpl borrowingService;

    private Book sampleBook;
    private Member sampleMember;
    private Borrowing sampleBorrowing;

    @BeforeEach
    void setUp() {
        sampleBook = Book.builder()
                .id(1L)
                .title("Clean Architecture")
                .author("Robert C. Martin")
                .isbn("978-0134494166")
                .category("Architecture")
                .totalCopies(5)
                .availableCopies(3)
                .build();

        sampleMember = Member.builder()
                .id(10L)
                .firstName("Alice")
                .lastName("Smith")
                .email("alice@example.com")
                .phoneNumber("1234567890")
                .active(true)
                .build();

        sampleBorrowing = Borrowing.builder()
                .id(100L)
                .book(sampleBook)
                .member(sampleMember)
                .borrowDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(14))
                .status(BorrowingStatus.BORROWED)
                .build();
    }

    @Test
    void shouldBorrowBookSuccessfully() {
        BorrowingRequestDto request = BorrowingRequestDto.builder()
                .bookId(1L)
                .memberId(10L)
                .borrowDays(14)
                .build();

        when(bookRepository.findByIdWithPessimisticLock(1L)).thenReturn(Optional.of(sampleBook));
        when(memberRepository.findById(10L)).thenReturn(Optional.of(sampleMember));
        when(borrowingRepository.existsByMemberIdAndBookIdAndReturnDateIsNull(10L, 1L)).thenReturn(false);
        when(borrowingRepository.save(any(Borrowing.class))).thenReturn(sampleBorrowing);

        BorrowingResponseDto response = borrowingService.borrowBook(request);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals(2, sampleBook.getAvailableCopies()); // decremented from 3 to 2
        verify(bookRepository, times(1)).save(sampleBook);
        verify(borrowingRepository, times(1)).save(any(Borrowing.class));
        verify(eventPublisher, times(1)).publishEvent(any(com.library_management.event.BookBorrowedEvent.class));
    }

    @Test
    void shouldRejectBorrowWhenBookNotFound() {
        BorrowingRequestDto request = BorrowingRequestDto.builder()
                .bookId(999L)
                .memberId(10L)
                .build();

        when(bookRepository.findByIdWithPessimisticLock(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> borrowingService.borrowBook(request));
        verify(borrowingRepository, never()).save(any(Borrowing.class));
    }

    @Test
    void shouldRejectBorrowWhenMemberNotFound() {
        BorrowingRequestDto request = BorrowingRequestDto.builder()
                .bookId(1L)
                .memberId(999L)
                .build();

        when(bookRepository.findByIdWithPessimisticLock(1L)).thenReturn(Optional.of(sampleBook));
        when(memberRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> borrowingService.borrowBook(request));
        verify(borrowingRepository, never()).save(any(Borrowing.class));
    }

    @Test
    void shouldRejectBorrowWhenMemberInactive() {
        sampleMember.setActive(false);
        BorrowingRequestDto request = BorrowingRequestDto.builder()
                .bookId(1L)
                .memberId(10L)
                .build();

        when(bookRepository.findByIdWithPessimisticLock(1L)).thenReturn(Optional.of(sampleBook));
        when(memberRepository.findById(10L)).thenReturn(Optional.of(sampleMember));

        assertThrows(InactiveMemberException.class, () -> borrowingService.borrowBook(request));
        verify(borrowingRepository, never()).save(any(Borrowing.class));
    }

    @Test
    void shouldRejectBorrowWhenMemberAlreadyBorrowedBook() {
        BorrowingRequestDto request = BorrowingRequestDto.builder()
                .bookId(1L)
                .memberId(10L)
                .build();

        when(bookRepository.findByIdWithPessimisticLock(1L)).thenReturn(Optional.of(sampleBook));
        when(memberRepository.findById(10L)).thenReturn(Optional.of(sampleMember));
        when(borrowingRepository.existsByMemberIdAndBookIdAndReturnDateIsNull(10L, 1L)).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> borrowingService.borrowBook(request));
        verify(borrowingRepository, never()).save(any(Borrowing.class));
    }

    @Test
    void shouldRejectBorrowWhenBookUnavailable() {
        sampleBook.setAvailableCopies(0);
        BorrowingRequestDto request = BorrowingRequestDto.builder()
                .bookId(1L)
                .memberId(10L)
                .build();

        when(bookRepository.findByIdWithPessimisticLock(1L)).thenReturn(Optional.of(sampleBook));
        when(memberRepository.findById(10L)).thenReturn(Optional.of(sampleMember));
        when(borrowingRepository.existsByMemberIdAndBookIdAndReturnDateIsNull(10L, 1L)).thenReturn(false);

        assertThrows(BookNotAvailableException.class, () -> borrowingService.borrowBook(request));
        verify(borrowingRepository, never()).save(any(Borrowing.class));
    }

    @Test
    void shouldReturnBookSuccessfully() {
        when(borrowingRepository.findById(100L)).thenReturn(Optional.of(sampleBorrowing));
        when(bookRepository.findByIdWithPessimisticLock(1L)).thenReturn(Optional.of(sampleBook));
        when(borrowingRepository.save(any(Borrowing.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BorrowingResponseDto response = borrowingService.returnBook(100L);

        assertNotNull(response);
        assertEquals(BorrowingStatus.RETURNED, response.getStatus());
        assertNotNull(response.getReturnDate());
        assertEquals(4, sampleBook.getAvailableCopies()); // incremented from 3 to 4
        verify(bookRepository, times(1)).save(sampleBook);
        verify(borrowingRepository, times(1)).save(sampleBorrowing);
        verify(eventPublisher, times(1)).publishEvent(any(com.library_management.event.BookReturnedEvent.class));
    }

    @Test
    void shouldRejectReturnWhenAlreadyReturned() {
        sampleBorrowing.setReturnDate(LocalDate.now());
        sampleBorrowing.setStatus(BorrowingStatus.RETURNED);

        when(borrowingRepository.findById(100L)).thenReturn(Optional.of(sampleBorrowing));

        assertThrows(BookAlreadyReturnedException.class, () -> borrowingService.returnBook(100L));
        verify(bookRepository, never()).save(any(Book.class));
    }

    @Test
    void shouldRejectReturnWhenBorrowingNotFound() {
        when(borrowingRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> borrowingService.returnBook(999L));
        verify(bookRepository, never()).save(any(Book.class));
    }
}

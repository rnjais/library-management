package com.library_management.service.impl;

import com.library_management.dto.request.BookRequest;
import com.library_management.dto.response.BookResponse;
import com.library_management.entity.Book;
import com.library_management.exception.BookNotAvailableException;
import com.library_management.exception.DuplicateResourceException;
import com.library_management.exception.ResourceNotFoundException;
import com.library_management.repository.BookRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for BookServiceImpl using the Arrange-Act-Assert (AAA) pattern.
 */
@ExtendWith(MockitoExtension.class)
class BookServiceImplTest {

    @Mock
    private BookRepository bookRepository;

    @InjectMocks
    private BookServiceImpl bookService;

    private Book sampleBook;
    private BookRequest sampleRequest;

    @BeforeEach
    void setUp() {
        sampleBook = Book.builder()
                .id(1L)
                .title("Clean Architecture")
                .author("Robert C. Martin")
                .isbn("978-0134494166")
                .category("Computer Science")
                .totalCopies(5)
                .availableCopies(5)
                .build();

        sampleRequest = BookRequest.builder()
                .title("Clean Architecture")
                .author("Robert C. Martin")
                .isbn("978-0134494166")
                .category("Computer Science")
                .totalCopies(5)
                .availableCopies(5)
                .build();
    }

    @Test
    @DisplayName("Arrange-Act-Assert: Should add new book successfully")
    void testAddBook_Success() {
        // Arrange
        when(bookRepository.existsByIsbn("978-0134494166")).thenReturn(false);
        when(bookRepository.save(any(Book.class))).thenReturn(sampleBook);

        // Act
        BookResponse response = bookService.addBook(sampleRequest);

        // Assert
        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Clean Architecture", response.getTitle());
        assertEquals("978-0134494166", response.getIsbn());
        verify(bookRepository, times(1)).existsByIsbn("978-0134494166");
        verify(bookRepository, times(1)).save(any(Book.class));
    }

    @Test
    @DisplayName("Should throw DuplicateResourceException when ISBN already exists")
    void testAddBook_DuplicateIsbn_ThrowsException() {
        // Arrange
        when(bookRepository.existsByIsbn("978-0134494166")).thenReturn(true);

        // Act & Assert
        DuplicateResourceException exception = assertThrows(
                DuplicateResourceException.class,
                () -> bookService.addBook(sampleRequest)
        );

        assertTrue(exception.getMessage().contains("978-0134494166"));
        verify(bookRepository, never()).save(any(Book.class));
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException when available copies exceed total copies")
    void testAddBook_AvailableExceedsTotal_ThrowsException() {
        // Arrange
        sampleRequest.setAvailableCopies(10);
        sampleRequest.setTotalCopies(5);
        when(bookRepository.existsByIsbn("978-0134494166")).thenReturn(false);

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> bookService.addBook(sampleRequest));
        verify(bookRepository, never()).save(any(Book.class));
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException when required book fields are blank")
    void testAddBook_BlankFields_ThrowsException() {
        sampleRequest.setTitle("   ");
        assertThrows(IllegalArgumentException.class, () -> bookService.addBook(sampleRequest));

        sampleRequest.setTitle("Title");
        sampleRequest.setIsbn("");
        assertThrows(IllegalArgumentException.class, () -> bookService.addBook(sampleRequest));
    }

    @Test
    @DisplayName("Should retrieve book by ID successfully")
    void testGetBookById_Success() {
        // Arrange
        when(bookRepository.findById(1L)).thenReturn(Optional.of(sampleBook));

        // Act
        BookResponse response = bookService.getBookById(1L);

        // Assert
        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Clean Architecture", response.getTitle());
        verify(bookRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when book ID is not found")
    void testGetBookById_NotFound_ThrowsException() {
        // Arrange
        when(bookRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> bookService.getBookById(999L));
    }

    @Test
    @DisplayName("Should retrieve filtered and paginated books")
    void testGetAllBooks_Success() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<Book> pagedBooks = new PageImpl<>(List.of(sampleBook), pageable, 1);
        when(bookRepository.searchBooks("Clean", "Computer Science", pageable)).thenReturn(pagedBooks);

        // Act
        Page<BookResponse> result = bookService.getAllBooks("Clean", "Computer Science", pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Clean Architecture", result.getContent().get(0).getTitle());
    }

    @Test
    @DisplayName("Should update existing book successfully")
    void testUpdateBook_Success() {
        // Arrange
        BookRequest updateRequest = BookRequest.builder()
                .title("Clean Architecture Updated")
                .author("Robert C. Martin")
                .isbn("978-0134494166")
                .category("Software Engineering")
                .totalCopies(6)
                .availableCopies(6)
                .build();

        when(bookRepository.findById(1L)).thenReturn(Optional.of(sampleBook));
        when(bookRepository.existsByIsbnAndIdNot("978-0134494166", 1L)).thenReturn(false);
        when(bookRepository.save(any(Book.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        BookResponse response = bookService.updateBook(1L, updateRequest);

        // Assert
        assertNotNull(response);
        assertEquals("Clean Architecture Updated", response.getTitle());
        assertEquals(6, response.getTotalCopies());
        verify(bookRepository, times(1)).save(sampleBook);
    }

    @Test
    @DisplayName("Should throw DuplicateResourceException on update if new ISBN collides with another book")
    void testUpdateBook_IsbnCollision_ThrowsException() {
        // Arrange
        when(bookRepository.findById(1L)).thenReturn(Optional.of(sampleBook));
        when(bookRepository.existsByIsbnAndIdNot("978-0134494166", 1L)).thenReturn(true);

        // Act & Assert
        assertThrows(DuplicateResourceException.class, () -> bookService.updateBook(1L, sampleRequest));
        verify(bookRepository, never()).save(any(Book.class));
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException on update if total copies is reduced below borrowed count")
    void testUpdateBook_TotalCopiesBelowBorrowed_ThrowsException() {
        // Arrange: 5 total copies, 2 available => 3 copies currently borrowed
        sampleBook.setTotalCopies(5);
        sampleBook.setAvailableCopies(2);

        // Attempt to reduce total copies to 2 (which is less than 3 currently borrowed)
        BookRequest invalidUpdateRequest = BookRequest.builder()
                .title("Clean Architecture")
                .author("Robert C. Martin")
                .isbn("978-0134494166")
                .category("Computer Science")
                .totalCopies(2)
                .build();

        when(bookRepository.findById(1L)).thenReturn(Optional.of(sampleBook));
        when(bookRepository.existsByIsbnAndIdNot("978-0134494166", 1L)).thenReturn(false);

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> bookService.updateBook(1L, invalidUpdateRequest));
        verify(bookRepository, never()).save(any(Book.class));
    }

    @Test
    @DisplayName("Should delete book when all copies are returned and available")
    void testDeleteBook_Success() {
        // Arrange: all 5 copies available
        when(bookRepository.findById(1L)).thenReturn(Optional.of(sampleBook));

        // Act
        bookService.deleteBook(1L);

        // Assert
        verify(bookRepository, times(1)).delete(sampleBook);
    }

    @Test
    @DisplayName("Should throw BookNotAvailableException when deleting a book with active borrowings")
    void testDeleteBook_WithActiveBorrowings_ThrowsException() {
        // Arrange: 5 total, only 3 available (2 borrowed out)
        sampleBook.setTotalCopies(5);
        sampleBook.setAvailableCopies(3);
        when(bookRepository.findById(1L)).thenReturn(Optional.of(sampleBook));

        // Act & Assert
        assertThrows(BookNotAvailableException.class, () -> bookService.deleteBook(1L));
        verify(bookRepository, never()).delete(any(Book.class));
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when deleting non-existent book")
    void testDeleteBook_NotFound_ThrowsException() {
        // Arrange
        when(bookRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> bookService.deleteBook(999L));
        verify(bookRepository, never()).delete(any(Book.class));
    }
}

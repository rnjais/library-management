package com.library_management.controller;

import com.library_management.dto.request.BookRequest;
import com.library_management.dto.response.BookResponse;
import com.library_management.exception.DuplicateResourceException;
import com.library_management.exception.GlobalExceptionHandler;
import com.library_management.exception.ResourceNotFoundException;
import com.library_management.service.BookService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class BookControllerTest {

    private MockMvc mockMvc;

    @Mock
    private BookService bookService;

    @InjectMocks
    private BookController bookController;

    private BookResponse sampleResponse;

    private static final String VALID_BOOK_JSON = """
            {
              "title": "Clean Code",
              "author": "Robert C. Martin",
              "isbn": "978-0132350884",
              "category": "Programming",
              "totalCopies": 10,
              "availableCopies": 10
            }
            """;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders
                .standaloneSetup(bookController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        sampleResponse = BookResponse.builder()
                .id(1L)
                .title("Clean Code")
                .author("Robert C. Martin")
                .isbn("978-0132350884")
                .category("Programming")
                .totalCopies(10)
                .availableCopies(10)
                .build();
    }

    @Test
    void shouldAddBookSuccessfully() throws Exception {
        when(bookService.addBook(any(BookRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BOOK_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.title").value("Clean Code"))
                .andExpect(jsonPath("$.data.isbn").value("978-0132350884"));
    }

    @Test
    void shouldRejectAddBookWithDuplicateIsbn() throws Exception {
        when(bookService.addBook(any(BookRequest.class)))
                .thenThrow(new DuplicateResourceException("Book", "isbn", "978-0132350884"));

        mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BOOK_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"));
    }

    @Test
    void shouldRejectAddBookWithMissingFields() throws Exception {
        String invalidJson = """
                {
                  "title": "",
                  "author": "",
                  "isbn": "123",
                  "category": "",
                  "totalCopies": -1
                }
                """;

        mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.title").exists())
                .andExpect(jsonPath("$.validationErrors.author").exists())
                .andExpect(jsonPath("$.validationErrors.isbn").exists());
    }

    @Test
    void shouldGetBookByIdSuccessfully() throws Exception {
        when(bookService.getBookById(1L)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/books/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.title").value("Clean Code"));
    }

    @Test
    void shouldReturn404WhenBookNotFoundById() throws Exception {
        when(bookService.getBookById(99L))
                .thenThrow(new ResourceNotFoundException("Book", "id", 99L));

        mockMvc.perform(get("/api/books/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Book not found with id: '99'"));
    }

    @Test
    void shouldListBooksWithPaginationAndFiltering() throws Exception {
        Page<BookResponse> page = new PageImpl<>(Collections.singletonList(sampleResponse));
        when(bookService.getAllBooks(eq("Clean"), eq("Programming"), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/books")
                        .param("title", "Clean")
                        .param("category", "Programming")
                        .param("page", "0")
                        .param("size", "10")
                        .param("sortBy", "title")
                        .param("direction", "ASC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].title").value("Clean Code"))
                .andExpect(jsonPath("$.data.pageNumber").value(0))
                .andExpect(jsonPath("$.data.pageSize").value(1))
                .andExpect(jsonPath("$.data.totalElements").value(1));
    }

    @Test
    void shouldUpdateBookSuccessfully() throws Exception {
        when(bookService.updateBook(eq(1L), any(BookRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(put("/api/books/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_BOOK_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Clean Code"));
    }

    @Test
    void shouldDeleteBookSuccessfully() throws Exception {
        doNothing().when(bookService).deleteBook(1L);

        mockMvc.perform(delete("/api/books/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Book deleted successfully"));
    }

    @Test
    void shouldReturn404WhenDeletingNonexistentBook() throws Exception {
        doThrow(new ResourceNotFoundException("Book", "id", 99L))
                .when(bookService).deleteBook(99L);

        mockMvc.perform(delete("/api/books/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }
}

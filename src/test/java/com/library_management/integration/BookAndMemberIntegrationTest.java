package com.library_management.integration;

import com.library_management.entity.Book;
import com.library_management.entity.Member;
import com.library_management.repository.BookRepository;
import com.library_management.repository.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * End-to-end integration test validating REST API endpoints, request validation,
 * role authorization, and global exception responses against the isolated test database.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class BookAndMemberIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private MemberRepository memberRepository;

    private Book existingBook;
    private Member existingMember;

    @BeforeEach
    void setUp() {
        existingBook = bookRepository.save(Book.builder()
                .title("Refactoring")
                .author("Martin Fowler")
                .isbn("978-0201485677")
                .category("Computer Science")
                .totalCopies(4)
                .availableCopies(4)
                .build());

        existingMember = memberRepository.save(Member.builder()
                .firstName("Jim")
                .lastName("Halpert")
                .email("jim.halpert@dundermifflin.com")
                .phoneNumber("+91 9876543211")
                .active(true)
                .build());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("Integration: POST /api/books with blank fields returns 400 Bad Request with field errors")
    void testCreateBook_ValidationFailure_Returns400() throws Exception {
        String invalidJson = """
                {
                    "title": "",
                    "author": "",
                    "isbn": "",
                    "category": "",
                    "totalCopies": 0
                }
                """;

        mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.validationErrors.title").exists())
                .andExpect(jsonPath("$.validationErrors.author").exists())
                .andExpect(jsonPath("$.validationErrors.isbn").exists());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("Integration: POST /api/books with duplicate ISBN returns 409 Conflict")
    void testCreateBook_DuplicateIsbn_Returns409() throws Exception {
        String duplicateJson = """
                {
                    "title": "Refactoring Second Edition",
                    "author": "Martin Fowler",
                    "isbn": "978-0201485677",
                    "category": "Computer Science",
                    "totalCopies": 2,
                    "availableCopies": 2
                }
                """;

        mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(duplicateJson))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message", containsString("978-0201485677")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("Integration: POST /api/members with invalid email format returns 400 Bad Request")
    void testRegisterMember_InvalidEmailFormat_Returns400() throws Exception {
        String invalidMemberJson = """
                {
                    "firstName": "Dwight",
                    "lastName": "Schrute",
                    "email": "not-a-valid-email",
                    "phoneNumber": "+91 9876543212"
                }
                """;

        mockMvc.perform(post("/api/members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidMemberJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.email").exists());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("Integration: POST /api/members with duplicate email returns 409 Conflict")
    void testRegisterMember_DuplicateEmail_Returns409() throws Exception {
        String duplicateEmailJson = """
                {
                    "firstName": "Jim",
                    "lastName": "Halpert",
                    "email": "jim.halpert@dundermifflin.com",
                    "phoneNumber": "+91 9111111111"
                }
                """;

        mockMvc.perform(post("/api/members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(duplicateEmailJson))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message", containsString("jim.halpert@dundermifflin.com")));
    }

    @Test
    @DisplayName("Integration: GET /api/books/{id} with non-existent ID returns 404 Not Found")
    void testGetBookById_NotFound_Returns404() throws Exception {
        mockMvc.perform(get("/api/books/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message", containsString("999999")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("Integration: DELETE /api/books/{id} when copies are borrowed out returns 409 Conflict")
    void testDeleteBook_WithActiveBorrowing_Returns409() throws Exception {
        // Simulate a book with 1 active loan (availableCopies < totalCopies)
        existingBook.setAvailableCopies(3); // 1 copy borrowed out
        bookRepository.save(existingBook);

        mockMvc.perform(delete("/api/books/" + existingBook.getId()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message", containsString("currently borrowed out")));
    }
}

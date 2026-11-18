package com.library_management.exception;

import com.library_management.dto.response.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.*;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;

    @RestController
    @RequestMapping("/test")
    static class TestController {

        @GetMapping("/not-found")
        public void throwNotFound() {
            throw new ResourceNotFoundException("Book", "id", 99L);
        }

        @GetMapping("/book-unavailable")
        public void throwBookUnavailable() {
            throw new BookNotAvailableException(42L);
        }

        @GetMapping("/success")
        public ApiResponse<String> returnSuccess() {
            return ApiResponse.success("Operation completed", "Sample Payload");
        }

        @PostMapping("/validate")
        public ApiResponse<String> validatePayload(@Valid @RequestBody DummyDto dto) {
            return ApiResponse.success("Valid payload");
        }

        @GetMapping("/server-error")
        public void throwUnexpected() {
            throw new RuntimeException("Unexpected internal DB connection failure");
        }

        @GetMapping("/items/{id}")
        public ApiResponse<Long> getItem(@PathVariable("id") Long id) {
            return ApiResponse.success("Found", id);
        }

        @GetMapping("/required-param")
        public ApiResponse<String> requiredParam(@RequestParam("keyword") String keyword) {
            return ApiResponse.success("Ok", keyword);
        }

        @GetMapping("/lock-conflict")
        public void throwLockConflict() {
            throw new org.springframework.dao.PessimisticLockingFailureException("Deadlock found");
        }
    }

    @Data
    static class DummyDto {
        @NotBlank(message = "Title must not be blank")
        private String title;
    }

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new TestController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void shouldReturn404WhenResourceNotFoundExceptionThrown() throws Exception {
        mockMvc.perform(get("/test/not-found"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Book not found with id: '99'"))
                .andExpect(jsonPath("$.path").value("/test/not-found"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void shouldReturn409WhenBookNotAvailableExceptionThrown() throws Exception {
        mockMvc.perform(get("/test/book-unavailable"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("Book with ID 42 is currently not available for borrowing"))
                .andExpect(jsonPath("$.path").value("/test/book-unavailable"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void shouldReturn400WhenValidationFails() throws Exception {
        mockMvc.perform(post("/test/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.validationErrors.title").value("Title must not be blank"))
                .andExpect(jsonPath("$.path").value("/test/validate"));
    }

    @Test
    void shouldReturn500WithoutLeakingInternalDetailsWhenUnexpectedExceptionOccurs() throws Exception {
        mockMvc.perform(get("/test/server-error"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.error").value("Internal Server Error"))
                .andExpect(jsonPath("$.message").value("An unexpected internal error occurred. Please contact support or try again later."))
                .andExpect(jsonPath("$.path").value("/test/server-error"));
    }

    @Test
    void shouldReturnStandardApiResponseForSuccess() throws Exception {
        mockMvc.perform(get("/test/success"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Operation completed"))
                .andExpect(jsonPath("$.data").value("Sample Payload"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void shouldReturn400WhenJsonIsMalformed() throws Exception {
        mockMvc.perform(post("/test/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{invalid-json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Malformed JSON request or invalid field format. Please verify your request payload."));
    }

    @Test
    void shouldReturn400WhenPathVariableTypeMismatches() throws Exception {
        mockMvc.perform(get("/test/items/not-a-number"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Invalid value 'not-a-number' for parameter 'id'."));
    }

    @Test
    void shouldReturn400WhenRequiredQueryParamIsMissing() throws Exception {
        mockMvc.perform(get("/test/required-param"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Required query parameter 'keyword' is missing."));
    }

    @Test
    void shouldReturn405WhenHttpMethodNotSupported() throws Exception {
        mockMvc.perform(post("/test/success"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.status").value(405))
                .andExpect(jsonPath("$.message").value("HTTP method 'POST' is not supported for this endpoint."));
    }

    @Test
    void shouldReturn415WhenMediaTypeNotSupported() throws Exception {
        mockMvc.perform(post("/test/validate")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("plain text"))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.status").value(415));
    }

    @Test
    void shouldReturn409WhenLockingFailureOccurs() throws Exception {
        mockMvc.perform(get("/test/lock-conflict"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }
}

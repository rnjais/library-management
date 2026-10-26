package com.library_management.security;

import com.library_management.dto.response.ErrorResponse;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;

class JwtAccessDeniedHandlerTest {

    private JwtAccessDeniedHandler accessDeniedHandler;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        accessDeniedHandler = new JwtAccessDeniedHandler(objectMapper);
    }

    @Test
    void shouldWriteStandardizedErrorResponseOnAccessDenied() throws IOException, ServletException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/members");
        MockHttpServletResponse response = new MockHttpServletResponse();

        accessDeniedHandler.handle(request, response, new AccessDeniedException("Access is denied"));

        assertEquals(403, response.getStatus());
        assertEquals("application/json", response.getContentType());

        String jsonResponse = response.getContentAsString();
        assertNotNull(jsonResponse);

        ErrorResponse errorResponse = objectMapper.readValue(jsonResponse, ErrorResponse.class);
        assertEquals(403, errorResponse.getStatus());
        assertEquals("Forbidden", errorResponse.getError());
        assertEquals("/api/members", errorResponse.getPath());
        assertEquals("Access denied: You do not have permission to access this resource.", errorResponse.getMessage());
    }
}

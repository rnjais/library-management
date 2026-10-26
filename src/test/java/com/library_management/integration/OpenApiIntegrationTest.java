package com.library_management.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration test verifying OpenAPI 3.0 specification and Swagger UI availability.
 * Asserts unauthenticated public access and expected API metadata and security definitions.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
class OpenApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("OpenAPI JSON: /v3/api-docs returns 200 OK and contains expected API metadata and security scheme")
    void openApiDocs_shouldReturnApiMetadataAndSecurityScheme() throws Exception {
        mockMvc.perform(get("/v3/api-docs")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.openapi", notNullValue()))
                .andExpect(jsonPath("$.info.title", is("Library Management System API")))
                .andExpect(jsonPath("$.info.version", is("1.0.0")))
                .andExpect(jsonPath("$.components.securitySchemes.bearerAuth.type", is("http")))
                .andExpect(jsonPath("$.components.securitySchemes.bearerAuth.scheme", is("bearer")))
                .andExpect(jsonPath("$.components.securitySchemes.bearerAuth.bearerFormat", is("JWT")))
                .andExpect(jsonPath("$.paths['/api/auth/login']", notNullValue()))
                .andExpect(jsonPath("$.paths['/api/books']", notNullValue()))
                .andExpect(jsonPath("$.paths['/api/borrowings']", notNullValue()))
                .andExpect(jsonPath("$.paths['/api/fines']", notNullValue()))
                .andExpect(jsonPath("$.paths['/api/admin/dashboard/summary']", notNullValue()));
    }

    @Test
    @DisplayName("Swagger UI: /swagger-ui/index.html is accessible publicly without authentication")
    void swaggerUi_shouldBeAccessibleWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML));
    }
}

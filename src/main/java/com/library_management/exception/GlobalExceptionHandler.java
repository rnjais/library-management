package com.library_management.exception;

import com.library_management.dto.response.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.InvalidDataAccessApiUsageException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.data.core.PropertyReferenceException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.HashMap;
import java.util.Map;

/**
 * Centralized exception handler for all controllers.
 * Intercepts exceptions and returns standardized ErrorResponse JSON payloads.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles entity not found scenarios (HTTP 404).
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(
            ResourceNotFoundException ex,
            HttpServletRequest request) {
        log.warn("Resource not found at [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.NOT_FOUND, ex.getMessage(), request.getRequestURI());
    }

    /**
     * Handles book unavailability / business rule violations (HTTP 409).
     */
    @ExceptionHandler(BookNotAvailableException.class)
    public ResponseEntity<ErrorResponse> handleBookNotAvailableException(
            BookNotAvailableException ex,
            HttpServletRequest request) {
        log.warn("Book availability conflict at [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.CONFLICT, ex.getMessage(), request.getRequestURI());
    }

    /**
     * Handles returning a book that has already been returned (HTTP 409).
     */
    @ExceptionHandler(BookAlreadyReturnedException.class)
    public ResponseEntity<ErrorResponse> handleBookAlreadyReturnedException(
            BookAlreadyReturnedException ex,
            HttpServletRequest request) {
        log.warn("Book already returned conflict at [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.CONFLICT, ex.getMessage(), request.getRequestURI());
    }

    /**
     * Handles fine payment attempts on already-paid fines (HTTP 409).
     */
    @ExceptionHandler(FineAlreadyPaidException.class)
    public ResponseEntity<ErrorResponse> handleFineAlreadyPaidException(
            FineAlreadyPaidException ex,
            HttpServletRequest request) {
        log.warn("Fine already paid conflict at [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.CONFLICT, ex.getMessage(), request.getRequestURI());
    }

    /**
     * Handles duplicate fine creation attempts (HTTP 409).
     */
    @ExceptionHandler(FineAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleFineAlreadyExistsException(
            FineAlreadyExistsException ex,
            HttpServletRequest request) {
        log.warn("Fine duplicate conflict at [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.CONFLICT, ex.getMessage(), request.getRequestURI());
    }

    /**
     * Handles operations attempted by inactive members (HTTP 400).
     */
    @ExceptionHandler(InactiveMemberException.class)
    public ResponseEntity<ErrorResponse> handleInactiveMemberException(
            InactiveMemberException ex,
            HttpServletRequest request) {
        log.warn("Inactive member action at [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request.getRequestURI());
    }

    /**
     * Handles duplicate key / uniqueness conflicts (e.g. duplicate ISBN) (HTTP 409).
     */
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateResourceException(
            DuplicateResourceException ex,
            HttpServletRequest request) {
        log.warn("Duplicate resource conflict at [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.CONFLICT, ex.getMessage(), request.getRequestURI());
    }

    /**
     * Handles bad credentials or authentication failures (HTTP 401).
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationException(
            AuthenticationException ex,
            HttpServletRequest request) {
        log.warn("Authentication failed at [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.UNAUTHORIZED, "Invalid email or password", request.getRequestURI());
    }

    /**
     * Handles authorization / permission failures (HTTP 403).
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(
            AccessDeniedException ex,
            HttpServletRequest request) {
        log.warn("Access denied at [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.FORBIDDEN, "Access denied: You do not have permission to access this resource.", request.getRequestURI());
    }

    /**
     * Handles illegal arguments and invalid domain inputs (e.g. inventory constraints) (HTTP 400).
     */
    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(
            RuntimeException ex,
            HttpServletRequest request) {
        log.warn("Invalid argument/state at [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request.getRequestURI());
    }

    /**
     * Handles request body validation failures (@Valid, @NotNull, @NotBlank, etc.) (HTTP 400).
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                fieldErrors.put(error.getField(), error.getDefaultMessage())
        );

        log.warn("Validation failed at [{}]: {}", request.getRequestURI(), fieldErrors);

        ErrorResponse response = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                "Validation failed for one or more fields",
                request.getRequestURI(),
                fieldErrors
        );

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles URI / query param constraint violations (HTTP 400).
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolationException(
            ConstraintViolationException ex,
            HttpServletRequest request) {
        log.warn("Constraint violation at [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request.getRequestURI());
    }

    /**
     * Handles Spring Framework method-level parameter validation failures (HTTP 400).
     */
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ErrorResponse> handleHandlerMethodValidationException(
            HandlerMethodValidationException ex,
            HttpServletRequest request) {
        log.warn("Method parameter validation failed at [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Validation failed for request parameters.", request.getRequestURI());
    }

    /**
     * Handles malformed JSON payloads, invalid date/enum strings, or unreadable request bodies (HTTP 400).
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadableException(
            HttpMessageNotReadableException ex,
            HttpServletRequest request) {
        log.warn("Unreadable HTTP message at [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(
                HttpStatus.BAD_REQUEST,
                "Malformed JSON request or invalid field format. Please verify your request payload.",
                request.getRequestURI()
        );
    }

    /**
     * Handles path/query parameter type conversion errors (e.g. non-numeric IDs or invalid enum/date params) (HTTP 400).
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentTypeMismatchException(
            MethodArgumentTypeMismatchException ex,
            HttpServletRequest request) {
        String message = String.format("Invalid value '%s' for parameter '%s'.", ex.getValue(), ex.getName());
        log.warn("Type mismatch at [{}]: {}", request.getRequestURI(), message);
        return buildErrorResponse(HttpStatus.BAD_REQUEST, message, request.getRequestURI());
    }

    /**
     * Handles missing required query parameters (HTTP 400).
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingServletRequestParameterException(
            MissingServletRequestParameterException ex,
            HttpServletRequest request) {
        String message = String.format("Required query parameter '%s' is missing.", ex.getParameterName());
        log.warn("Missing parameter at [{}]: {}", request.getRequestURI(), message);
        return buildErrorResponse(HttpStatus.BAD_REQUEST, message, request.getRequestURI());
    }

    /**
     * Handles invalid Spring Data sort/property references (HTTP 400).
     */
    @ExceptionHandler({PropertyReferenceException.class, InvalidDataAccessApiUsageException.class})
    public ResponseEntity<ErrorResponse> handleInvalidQueryPropertyException(
            RuntimeException ex,
            HttpServletRequest request) {
        log.warn("Invalid query/sort property at [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Invalid query or sort parameter provided.", request.getRequestURI());
    }

    /**
     * Handles unsupported HTTP methods (HTTP 405).
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupportedException(
            HttpRequestMethodNotSupportedException ex,
            HttpServletRequest request) {
        String message = String.format("HTTP method '%s' is not supported for this endpoint.", ex.getMethod());
        log.warn("Method not allowed at [{}]: {}", request.getRequestURI(), message);
        return buildErrorResponse(HttpStatus.METHOD_NOT_ALLOWED, message, request.getRequestURI());
    }

    /**
     * Handles unsupported Content-Type headers (HTTP 415).
     */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMediaTypeNotSupportedException(
            HttpMediaTypeNotSupportedException ex,
            HttpServletRequest request) {
        log.warn("Unsupported media type at [{}]: {}", request.getRequestURI(), ex.getContentType());
        return buildErrorResponse(
                HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "Unsupported Content-Type. Please send requests as 'application/json'.",
                request.getRequestURI()
        );
    }

    /**
     * Handles optimistic and pessimistic database locking conflicts (HTTP 409).
     */
    @ExceptionHandler({OptimisticLockingFailureException.class, PessimisticLockingFailureException.class})
    public ResponseEntity<ErrorResponse> handleLockingFailureException(
            RuntimeException ex,
            HttpServletRequest request) {
        log.warn("Concurrency lock conflict at [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(
                HttpStatus.CONFLICT,
                "The resource is currently being modified by another request. Please retry.",
                request.getRequestURI()
        );
    }

    /**
     * Handles database integrity conflicts (e.g. unique constraint violations, duplicate ISBN/email) (HTTP 409).
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolationException(
            DataIntegrityViolationException ex,
            HttpServletRequest request) {
        log.error("Database conflict at [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(
                HttpStatus.CONFLICT,
                "Database constraint violation: A resource with this identifier already exists or references invalid data.",
                request.getRequestURI()
        );
    }

    /**
     * Handles requests for routes or static resources that do not exist (HTTP 404).
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResourceFoundException(
            NoResourceFoundException ex,
            HttpServletRequest request) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, "No resource found for this path", request.getRequestURI());
    }

    /**
     * Fallback handler for all uncaught unexpected exceptions (HTTP 500).
     * Prevents internal stack traces from leaking to API clients.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(
            Exception ex,
            HttpServletRequest request) {
        log.error("Unhandled exception at [{}]:", request.getRequestURI(), ex);
        return buildErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected internal error occurred. Please contact support or try again later.",
                request.getRequestURI()
        );
    }

    /**
     * Helper to build clean, standardized ErrorResponse objects without duplicate logic.
     */
    private ResponseEntity<ErrorResponse> buildErrorResponse(HttpStatus status, String message, String path) {
        ErrorResponse errorResponse = new ErrorResponse(
                status.value(),
                status.getReasonPhrase(),
                message,
                path
        );
        return new ResponseEntity<>(errorResponse, status);
    }
}

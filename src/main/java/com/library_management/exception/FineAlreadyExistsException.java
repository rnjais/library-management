package com.library_management.exception;

/**
 * Exception thrown when attempting to generate a duplicate fine for a borrowing transaction.
 */
public class FineAlreadyExistsException extends RuntimeException {

    public FineAlreadyExistsException(String message) {
        super(message);
    }

    public FineAlreadyExistsException(Long borrowingId) {
        super(String.format("A fine record already exists for borrowing ID %d", borrowingId));
    }
}

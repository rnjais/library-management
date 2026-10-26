package com.library_management.exception;

/**
 * Exception thrown when attempting to pay a fine that has already been marked as PAID.
 */
public class FineAlreadyPaidException extends RuntimeException {

    public FineAlreadyPaidException(String message) {
        super(message);
    }

    public FineAlreadyPaidException(Long fineId) {
        super(String.format("Fine with ID %d has already been paid", fineId));
    }
}

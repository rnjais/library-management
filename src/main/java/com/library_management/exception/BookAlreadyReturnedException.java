package com.library_management.exception;

/**
 * Exception thrown when attempting to return a book that has already been returned.
 */
public class BookAlreadyReturnedException extends RuntimeException {

    public BookAlreadyReturnedException(String message) {
        super(message);
    }

    public BookAlreadyReturnedException(Long borrowingId) {
        super(String.format("Borrowing record with ID %d has already been returned", borrowingId));
    }
}

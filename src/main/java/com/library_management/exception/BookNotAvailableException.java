package com.library_management.exception;

public class BookNotAvailableException extends RuntimeException {

    public BookNotAvailableException(String message) {
        super(message);
    }

    public BookNotAvailableException(Long bookId) {
        super(String.format("Book with ID %d is currently not available for borrowing", bookId));
    }
}

package com.library_management.exception;

/**
 * Exception thrown when an inactive or suspended member attempts to perform member actions
 * such as borrowing library books.
 */
public class InactiveMemberException extends RuntimeException {

    public InactiveMemberException(String message) {
        super(message);
    }

    public InactiveMemberException(Long memberId) {
        super(String.format("Member with ID %d is inactive and cannot borrow books", memberId));
    }
}

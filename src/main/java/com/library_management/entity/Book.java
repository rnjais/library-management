package com.library_management.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.Objects;

/**
 * JPA Entity representing a Book in the library catalog.
 * Maps to the 'books' table in MySQL.
 */
@Entity
@Table(
    name = "books",
    indexes = {
        @Index(name = "idx_book_isbn", columnList = "isbn", unique = true),
        @Index(name = "idx_book_category", columnList = "category"),
        @Index(name = "idx_book_title", columnList = "title")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Title is required")
    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @NotBlank(message = "Author is required")
    @Column(name = "author", nullable = false, length = 255)
    private String author;

    @NotBlank(message = "ISBN is required")
    @Column(name = "isbn", nullable = false, unique = true, length = 20)
    private String isbn;

    @NotBlank(message = "Category is required")
    @Column(name = "category", nullable = false, length = 100)
    private String category;

    @NotNull(message = "Total copies cannot be null")
    @Min(value = 0, message = "Total copies must be zero or positive")
    @Column(name = "total_copies", nullable = false)
    private Integer totalCopies;

    @NotNull(message = "Available copies cannot be null")
    @Min(value = 0, message = "Available copies must be zero or positive")
    @Column(name = "available_copies", nullable = false)
    private Integer availableCopies;

    /**
     * JPA lifecycle callback executed before INSERT and UPDATE.
     * Enforces the business invariant that available copies can never exceed total copies.
     */
    @PrePersist
    @PreUpdate
    private void validateInventoryConstraint() {
        if (availableCopies != null && totalCopies != null && availableCopies > totalCopies) {
            throw new IllegalStateException(
                String.format("Available copies (%d) cannot exceed total copies (%d)", availableCopies, totalCopies)
            );
        }
    }

    /**
     * Convenience business method to check if copies are available for borrowing.
     */
    public boolean isAvailable() {
        return this.availableCopies != null && this.availableCopies > 0;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Book book = (Book) o;
        return Objects.equals(isbn, book.isbn);
    }

    @Override
    public int hashCode() {
        return Objects.hash(isbn);
    }

    @Override
    public String toString() {
        return "Book{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", author='" + author + '\'' +
                ", isbn='" + isbn + '\'' +
                ", category='" + category + '\'' +
                ", totalCopies=" + totalCopies +
                ", availableCopies=" + availableCopies +
                '}';
    }
}

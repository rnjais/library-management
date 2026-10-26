package com.library_management.dto.response;

import com.library_management.entity.Book;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object representing a Book returned to API consumers.
 * Decouples the internal database entity from the public API contract.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookResponse {

    private Long id;
    private String title;
    private String author;
    private String isbn;
    private String category;
    private Integer totalCopies;
    private Integer availableCopies;

    /**
     * Factory mapping method to transform a JPA Book entity into a clean BookResponse DTO.
     *
     * @param book The persisted JPA entity.
     * @return The formatted BookResponse DTO.
     */
    public static BookResponse fromEntity(Book book) {
        if (book == null) {
            return null;
        }
        return BookResponse.builder()
                .id(book.getId())
                .title(book.getTitle())
                .author(book.getAuthor())
                .isbn(book.getIsbn())
                .category(book.getCategory())
                .totalCopies(book.getTotalCopies())
                .availableCopies(book.getAvailableCopies())
                .build();
    }
}

package com.library_management.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.library_management.entity.Role;
import com.library_management.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Data Transfer Object representing safe user details in API responses.
 * Never serializes or exposes password hashes.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDto {

    private Long id;
    private Long memberId;
    private String name;
    private String email;
    private Role role;
    private Boolean enabled;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    /**
     * Factory mapping method to safely convert a JPA User entity into a UserResponseDto.
     *
     * @param user The User entity.
     * @return Safe UserResponseDto without password fields.
     */
    public static UserResponseDto fromEntity(User user) {
        return fromEntity(user, null);
    }

    /**
     * Factory mapping method to safely convert a JPA User entity into a UserResponseDto
     * with its linked library Member ID.
     *
     * @param user The User entity.
     * @param memberId The linked Member entity ID (if applicable).
     * @return Safe UserResponseDto without password fields.
     */
    public static UserResponseDto fromEntity(User user, Long memberId) {
        if (user == null) {
            return null;
        }
        return UserResponseDto.builder()
                .id(user.getId())
                .memberId(memberId)
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .enabled(user.getEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }
}

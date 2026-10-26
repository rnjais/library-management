package com.library_management.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.library_management.entity.Member;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Data Transfer Object representing member details returned by API endpoints.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberResponseDto {

    private Long id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String address;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate membershipDate;

    private Boolean active;

    /**
     * Maps a persisted Member entity into a MemberResponseDto.
     *
     * @param member The Member entity.
     * @return The formatted MemberResponseDto.
     */
    public static MemberResponseDto fromEntity(Member member) {
        if (member == null) {
            return null;
        }
        return MemberResponseDto.builder()
                .id(member.getId())
                .firstName(member.getFirstName())
                .lastName(member.getLastName())
                .fullName(member.getFullName())
                .email(member.getEmail())
                .phoneNumber(member.getPhoneNumber())
                .address(member.getAddress())
                .membershipDate(member.getMembershipDate())
                .active(member.getActive())
                .build();
    }
}

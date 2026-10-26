package com.library_management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object representing member patronage analytics and filtered member list.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberReportDto {

    private long totalMembers;
    private long activeMembers;
    private long inactiveMembers;
    private PagedResponse<MemberResponseDto> members;
}

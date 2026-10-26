package com.library_management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Data Transfer Object summarizing a member's outstanding unpaid fine liabilities.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberUnpaidFineResponseDto {

    private Long memberId;
    private String memberName;
    private String memberEmail;
    private BigDecimal totalUnpaidAmount;
    private Long unpaidFinesCount;
}

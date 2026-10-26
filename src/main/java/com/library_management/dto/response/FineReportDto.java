package com.library_management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Data Transfer Object representing fine revenue statistics and filtered fine list.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FineReportDto {

    private BigDecimal totalFineAmount;
    private BigDecimal paidFineAmount;
    private BigDecimal unpaidFineAmount;
    private long totalFineCount;
    private long paidFineCount;
    private long unpaidFineCount;
    private PagedResponse<FineResponseDto> fines;
}

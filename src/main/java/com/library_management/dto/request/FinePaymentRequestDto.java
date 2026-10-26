package com.library_management.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Optional Data Transfer Object for recording fine payment details.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinePaymentRequestDto {

    @Size(max = 50, message = "Payment method description cannot exceed 50 characters")
    private String paymentMethod; // e.g. CASH, CARD, UPI

    @Size(max = 100, message = "Transaction reference cannot exceed 100 characters")
    private String transactionReference;

    @Size(max = 255, message = "Payment notes cannot exceed 255 characters")
    private String notes;
}

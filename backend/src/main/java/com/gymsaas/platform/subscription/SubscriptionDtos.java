package com.gymsaas.platform.subscription;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import com.gymsaas.platform.payment.Payment;

public class SubscriptionDtos {

    public record AssignSubscriptionRequest(@NotNull Long memberId, @NotNull Long planId) {}

    public record EnrollInPlanRequest(@NotNull Long planId, @NotNull Payment.PaymentMethod paymentMethod) {}

    public record SubscriptionResponse(Long id, Long memberId, String gymName, String planName, BigDecimal price,
                                       LocalDate startDate, LocalDate endDate, String status) {}

    public record EnrollmentResponse(SubscriptionResponse subscription, PaymentResponse payment) {}

    public record PaymentResponse(Long id, Long memberId, String memberName, String memberPhone,
                                  Long subscriptionId, String planName, BigDecimal amount,
                                  LocalDate paymentDate, String paymentMethod, String status, String reference) {}

    public record ManagedSubscriptionResponse(Long id, Long memberId, String memberName, String memberPhone,
                                              String planName, BigDecimal price, LocalDate startDate,
                                              LocalDate endDate, String status) {}
}

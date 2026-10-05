package com.gymsaas.platform.plan;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public class PlanDtos {

    public record CreatePlanRequest(
            @NotBlank String name,
            @NotNull @Positive Integer durationDays,
            @NotNull @Positive BigDecimal price
    ) {}

    public record PlanResponse(Long id, String name, Integer durationDays, BigDecimal price, String status) {
        public static PlanResponse from(MembershipPlan plan) {
            return new PlanResponse(plan.getId(), plan.getName(), plan.getDurationDays(), plan.getPrice(), plan.getStatus().name());
        }
    }
}

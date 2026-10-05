package com.gymsaas.platform.billing;

import com.gymsaas.platform.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * The monthly platform fee the super admin (PLATFORM_ADMIN) charges each
 * gym owner — defaulting to ₹2,500 / month per gym, mirroring the member-subscription
 * lifecycle (ACTIVE → EXPIRING → EXPIRED) so the super admin sees, at a glance,
 * which gyms are paid up, which are about to lapse, and which have lapsed.
 *
 * One row per gym (unique gym_id). This is a platform-owned, cross-tenant row,
 * so it is intentionally NOT annotated with the tenantFilter — only
 * PLATFORM_ADMIN endpoints ever touch it.
 */
@Entity
@Table(name = "gym_platform_fee")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GymPlatformFee extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gym_id", nullable = false)
    private Long gymId;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal amount = new BigDecimal("2500.00");

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    /** The next due / period-end date for the current paid period. */
    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private FeeStatus status = FeeStatus.ACTIVE;

    public enum FeeStatus { ACTIVE, EXPIRING, EXPIRED, SUSPENDED }
}
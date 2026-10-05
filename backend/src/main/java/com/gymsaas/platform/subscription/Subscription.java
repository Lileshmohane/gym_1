package com.gymsaas.platform.subscription;

import com.gymsaas.platform.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;

import java.time.LocalDate;

// Database Schema Design Document, Section 3.4.
@Entity
@Table(name = "subscription")
@Filter(name = "tenantFilter", condition = "gym_id = :gymId")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Subscription extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gym_id", nullable = false)
    private Long gymId;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "plan_id", nullable = false)
    private Long planId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SubscriptionStatus status = SubscriptionStatus.ACTIVE;

    public enum SubscriptionStatus { PENDING_PAYMENT, ACTIVE, EXPIRING, EXPIRED, CANCELLED }
}

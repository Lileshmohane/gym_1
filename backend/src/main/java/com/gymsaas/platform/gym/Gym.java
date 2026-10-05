package com.gymsaas.platform.gym;

import com.gymsaas.platform.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

// Database Schema Design Document, Section 3.1. NOT filtered by tenantFilter
// — this IS the tenant, there's nothing to scope it against.
@Entity
@Table(name = "gym")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Gym extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(length = 255)
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private GymStatus status = GymStatus.TRIAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "plan_tier", nullable = false, length = 20)
    @Builder.Default
    private PlanTier planTier = PlanTier.BASIC;

    // Registration approval gate. A gym self-registered from the mobile app
    // starts PENDING and its owner cannot log in until the super admin
    // approves it. Gyms created directly by the super admin start APPROVED.
    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false, length = 20)
    @Builder.Default
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;

    @Column(name = "approval_note", length = 255)
    private String approvalNote;

    @Column(name = "approved_at")
    private Instant approvedAt;

    public enum GymStatus { ACTIVE, SUSPENDED, TRIAL }
    public enum PlanTier { BASIC, STANDARD, PREMIUM }
    public enum ApprovalStatus { PENDING, APPROVED, REJECTED }
}

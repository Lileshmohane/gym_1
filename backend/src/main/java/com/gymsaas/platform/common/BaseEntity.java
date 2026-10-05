package com.gymsaas.platform.common;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

// Shared created_at / updated_at columns — Database Schema Design Document,
// every table definition includes these.
//
// The "tenantFilter" definition lives here (on the shared MappedSuperclass)
// rather than per-entity or at package level — this is the well-supported,
// standard Hibernate location for a FilterDef shared across many entities.
// Each tenant-owned subclass (User, MembershipPlan, Subscription, Payment,
// Reminder, DeviceToken, Attendance, AuditLog) adds its own
// @Filter(name = "tenantFilter", condition = "gym_id = :gymId") referencing
// this definition by name. See TenantFilterAspect for where it's enabled.
@Getter
@Setter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@FilterDef(name = "tenantFilter", parameters = @ParamDef(name = "gymId", type = Long.class))
public abstract class BaseEntity {

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;
}

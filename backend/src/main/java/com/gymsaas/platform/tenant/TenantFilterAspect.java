package com.gymsaas.platform.tenant;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.hibernate.Session;
import org.springframework.stereotype.Component;

/**
 * The fail-closed half of tenant isolation (Technical Architecture Document,
 * Section 4.1). Before EVERY Spring Data repository call, if the current
 * request belongs to a gym (TenantContext has a gymId), enable Hibernate's
 * "tenantFilter" on the session that is about to run the query — so every
 * SELECT against a tenant-owned entity gets `AND gym_id = :gymId` appended,
 * even if a developer forgets to add a gym predicate.
 *
 * Why an aspect and not a servlet filter: services are @Transactional, so
 * the shared EntityManager proxy resolves to the transaction's real session
 * here — exactly the session the query will run on. Enabling is idempotent.
 *
 * No gymId in TenantContext (login, PLATFORM_ADMIN, scheduled jobs) means
 * no filter — those paths are intentionally cross-tenant.
 *
 * KNOWN HIBERNATE LIMITATION: filters do NOT apply to lookups by primary key
 * (findById / em.find). That is why services use findByIdAndGymId(...) and
 * explicit gym checks rather than bare findById for tenant-owned rows.
 */
@Aspect
@Component
public class TenantFilterAspect {

    @PersistenceContext
    private EntityManager entityManager;

    @Before("execution(* org.springframework.data.repository.Repository+.*(..))")
    public void enableTenantFilter() {
        Long gymId = TenantContext.getGymId();
        if (gymId == null) return;
        Session session = entityManager.unwrap(Session.class);
        session.enableFilter("tenantFilter").setParameter("gymId", gymId);
    }
}

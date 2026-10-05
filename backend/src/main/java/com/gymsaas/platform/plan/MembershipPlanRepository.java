package com.gymsaas.platform.plan;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MembershipPlanRepository extends JpaRepository<MembershipPlan, Long> {
    List<MembershipPlan> findAllByGymIdAndStatus(Long gymId, MembershipPlan.PlanStatus status);
    Optional<MembershipPlan> findByIdAndGymId(Long id, Long gymId);

    // Used by the super-admin hard-delete cascade (PlatformAdminService).
    @org.springframework.transaction.annotation.Transactional
    void deleteAllByGymId(Long gymId);
}

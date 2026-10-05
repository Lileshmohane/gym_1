package com.gymsaas.platform.plan;

import com.gymsaas.platform.common.ResourceNotFoundException;
import com.gymsaas.platform.plan.PlanDtos.*;
import com.gymsaas.platform.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PlanService {

    private final MembershipPlanRepository planRepository;

    public PlanService(MembershipPlanRepository planRepository) {
        this.planRepository = planRepository;
    }

    @Transactional
    public PlanResponse create(CreatePlanRequest request) {
        MembershipPlan plan = planRepository.save(MembershipPlan.builder()
                .gymId(TenantContext.getGymId())
                .name(request.name())
                .durationDays(request.durationDays())
                .price(request.price())
                .status(MembershipPlan.PlanStatus.ACTIVE)
                .build());
        return PlanResponse.from(plan);
    }

    @Transactional(readOnly = true)
    public List<PlanResponse> listActive() {
        return planRepository.findAllByGymIdAndStatus(TenantContext.getGymId(), MembershipPlan.PlanStatus.ACTIVE)
                .stream().map(PlanResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public MembershipPlan findOwnedOrThrow(Long planId) {
        return planRepository.findByIdAndGymId(planId, TenantContext.getGymId())
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));
    }
}

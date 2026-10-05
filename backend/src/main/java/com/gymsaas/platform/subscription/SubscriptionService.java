package com.gymsaas.platform.subscription;

import com.gymsaas.platform.common.ResourceNotFoundException;
import com.gymsaas.platform.gym.Gym;
import com.gymsaas.platform.gym.GymRepository;
import com.gymsaas.platform.member.AppUser;
import com.gymsaas.platform.member.AppUserRepository;
import com.gymsaas.platform.payment.Payment;
import com.gymsaas.platform.payment.PaymentRepository;
import com.gymsaas.platform.plan.MembershipPlan;
import com.gymsaas.platform.plan.MembershipPlanRepository;
import com.gymsaas.platform.subscription.SubscriptionDtos.*;
import com.gymsaas.platform.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final PaymentRepository paymentRepository;
    private final MembershipPlanRepository planRepository;
    private final AppUserRepository userRepository;
    private final GymRepository gymRepository;

    public SubscriptionService(SubscriptionRepository subscriptionRepository, PaymentRepository paymentRepository,
                               MembershipPlanRepository planRepository, AppUserRepository userRepository,
                               GymRepository gymRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.paymentRepository = paymentRepository;
        this.planRepository = planRepository;
        this.userRepository = userRepository;
        this.gymRepository = gymRepository;
    }

    @Transactional
    public EnrollmentResponse enroll(Long memberId, EnrollInPlanRequest request) {
        Long gymId = TenantContext.getGymId();
        LocalDate today = LocalDate.now();
        boolean hasOutstandingOrActivePlan = subscriptionRepository.findAllByGymIdAndMemberId(gymId, memberId).stream()
                .anyMatch(subscription -> subscription.getStatus() == Subscription.SubscriptionStatus.PENDING_PAYMENT
                        || ((subscription.getStatus() == Subscription.SubscriptionStatus.ACTIVE
                        || subscription.getStatus() == Subscription.SubscriptionStatus.EXPIRING)
                        && !subscription.getEndDate().isBefore(today)));
        if (hasOutstandingOrActivePlan) {
            throw new IllegalArgumentException("A pending or active membership already exists.");
        }

        MembershipPlan plan = planRepository.findByIdAndGymId(request.planId(), gymId)
                .filter(item -> item.getStatus() == MembershipPlan.PlanStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));

        Subscription subscription = subscriptionRepository.save(Subscription.builder()
                .gymId(gymId)
                .memberId(memberId)
                .planId(plan.getId())
                .startDate(today)
                .endDate(today.plusDays(plan.getDurationDays()))
                .status(Subscription.SubscriptionStatus.PENDING_PAYMENT)
                .build());

        Payment payment = paymentRepository.save(Payment.builder()
                .gymId(gymId)
                .memberId(memberId)
                .subscriptionId(subscription.getId())
                .amount(plan.getPrice())
                .paymentDate(today)
                .paymentMethod(request.paymentMethod())
                .status(Payment.PaymentStatus.PENDING)
                .reference("ENR-" + UUID.randomUUID())
                .build());

        return new EnrollmentResponse(toResponse(subscription, plan, null), new PaymentResponse(
                payment.getId(), memberId, null, null, subscription.getId(), plan.getName(), payment.getAmount(),
                payment.getPaymentDate(), payment.getPaymentMethod().name(), payment.getStatus().name(), payment.getReference()));
    }

    @Transactional(readOnly = true)
    public SubscriptionResponse getMine(Long memberId) {
        Long gymId = TenantContext.getGymId();
        Subscription subscription = subscriptionRepository.findAllByGymIdAndMemberIdOrderByEndDateDesc(gymId, memberId)
                .stream().filter(item -> item.getStatus() != Subscription.SubscriptionStatus.CANCELLED)
                .findFirst().orElseThrow(() -> new ResourceNotFoundException("Membership not found"));
        MembershipPlan plan = planRepository.findByIdAndGymId(subscription.getPlanId(), gymId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));
        Gym gym = gymRepository.findById(gymId).orElseThrow(() -> new ResourceNotFoundException("Gym not found"));
        return toResponse(subscription, plan, gym.getName());
    }

    @Transactional(readOnly = true)
    public List<ManagedSubscriptionResponse> listForGym() {
        Long gymId = TenantContext.getGymId();
        LocalDate today = LocalDate.now();
        return subscriptionRepository.findAllByGymIdOrderByEndDateAsc(gymId).stream()
                .map(subscription -> {
                    AppUser member = userRepository.findByIdAndGymId(subscription.getMemberId(), gymId)
                            .orElseThrow(() -> new ResourceNotFoundException("Member not found"));
                    MembershipPlan plan = planRepository.findByIdAndGymId(subscription.getPlanId(), gymId)
                            .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));
                    return new ManagedSubscriptionResponse(subscription.getId(), member.getId(), member.getName(),
                            member.getPhone(), plan.getName(), plan.getPrice(), subscription.getStartDate(),
                            subscription.getEndDate(), displayStatus(subscription, today));
                }).toList();
    }

    private String displayStatus(Subscription subscription, LocalDate today) {
        if (subscription.getStatus() == Subscription.SubscriptionStatus.PENDING_PAYMENT) return "PENDING_PAYMENT";
        if (subscription.getStatus() == Subscription.SubscriptionStatus.CANCELLED) return "CANCELLED";
        if (subscription.getEndDate().isBefore(today)) return "EXPIRED";
        if (!subscription.getEndDate().isAfter(today.plusDays(3))) return "EXPIRING";
        return "ACTIVE";
    }

    private SubscriptionResponse toResponse(Subscription subscription, MembershipPlan plan, String gymName) {
        return new SubscriptionResponse(subscription.getId(), subscription.getMemberId(), gymName, plan.getName(),
                plan.getPrice(), subscription.getStartDate(), subscription.getEndDate(), subscription.getStatus().name());
    }
}
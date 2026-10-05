package com.gymsaas.platform.payment;

import com.gymsaas.platform.common.ResourceNotFoundException;
import com.gymsaas.platform.gym.Gym;
import com.gymsaas.platform.gym.GymRepository;
import com.gymsaas.platform.member.AppUser;
import com.gymsaas.platform.member.AppUserRepository;
import com.gymsaas.platform.notification.WhatsAppService;
import com.gymsaas.platform.plan.MembershipPlan;
import com.gymsaas.platform.plan.MembershipPlanRepository;
import com.gymsaas.platform.subscription.Subscription;
import com.gymsaas.platform.subscription.SubscriptionRepository;
import com.gymsaas.platform.subscription.SubscriptionDtos.PaymentResponse;
import com.gymsaas.platform.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final AppUserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final MembershipPlanRepository planRepository;
        private final GymRepository gymRepository;
        private final WhatsAppService whatsAppService;

    public PaymentService(PaymentRepository paymentRepository, AppUserRepository userRepository,
                                                  SubscriptionRepository subscriptionRepository, MembershipPlanRepository planRepository,
                                                  GymRepository gymRepository, WhatsAppService whatsAppService) {
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.planRepository = planRepository;
                this.gymRepository = gymRepository;
                this.whatsAppService = whatsAppService;
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> mine(Long memberId) {
        Long gymId = TenantContext.getGymId();
        return paymentRepository.findAllByGymIdAndMemberIdOrderByPaymentDateDesc(gymId, memberId).stream()
                .map(payment -> toResponse(payment, memberId, gymId))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> pendingForGym() {
        Long gymId = TenantContext.getGymId();
        return paymentRepository.findAllByGymIdAndStatusOrderByPaymentDateAsc(gymId, Payment.PaymentStatus.PENDING)
                .stream().map(payment -> toResponse(payment, payment.getMemberId(), gymId)).toList();
    }

    @Transactional
    public PaymentResponse confirm(Long paymentId) {
        Long gymId = TenantContext.getGymId();
        Payment payment = paymentRepository.findByIdAndGymId(paymentId, gymId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
        if (payment.getStatus() != Payment.PaymentStatus.PENDING || payment.getSubscriptionId() == null) {
            throw new IllegalArgumentException("Only pending membership payments can be confirmed.");
        }

        Subscription subscription = subscriptionRepository.findByIdAndGymId(payment.getSubscriptionId(), gymId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found"));
        if (subscription.getStatus() != Subscription.SubscriptionStatus.PENDING_PAYMENT) {
            throw new IllegalArgumentException("This membership is no longer awaiting payment.");
        }

        MembershipPlan plan = planRepository.findByIdAndGymId(subscription.getPlanId(), gymId)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));
        LocalDate startDate = LocalDate.now();
        subscription.setStartDate(startDate);
        subscription.setEndDate(startDate.plusDays(plan.getDurationDays()));
        subscription.setStatus(Subscription.SubscriptionStatus.ACTIVE);
        payment.setStatus(Payment.PaymentStatus.COMPLETED);
        payment.setPaymentDate(startDate);
        subscriptionRepository.save(subscription);
        paymentRepository.save(payment);
        AppUser member = userRepository.findByIdAndGymId(payment.getMemberId(), gymId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));
        Gym gym = gymRepository.findById(gymId).orElseThrow(() -> new ResourceNotFoundException("Gym not found"));
        whatsAppService.sendPaymentReceipt(payment, member, gym, plan);
        return toResponse(payment, payment.getMemberId(), gymId);
    }

    private PaymentResponse toResponse(Payment payment, Long memberId, Long gymId) {
        AppUser member = userRepository.findByIdAndGymId(memberId, gymId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));
        String planName = null;
        if (payment.getSubscriptionId() != null) {
            Subscription subscription = subscriptionRepository.findByIdAndGymId(payment.getSubscriptionId(), gymId)
                    .orElseThrow(() -> new ResourceNotFoundException("Subscription not found"));
            planName = planRepository.findByIdAndGymId(subscription.getPlanId(), gymId)
                    .map(MembershipPlan::getName).orElse(null);
        }
        return new PaymentResponse(payment.getId(), member.getId(), member.getName(), member.getPhone(),
                payment.getSubscriptionId(), planName, payment.getAmount(), payment.getPaymentDate(),
                payment.getPaymentMethod().name(), payment.getStatus().name(), payment.getReference());
    }
}
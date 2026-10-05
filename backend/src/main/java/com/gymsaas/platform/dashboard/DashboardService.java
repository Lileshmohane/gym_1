package com.gymsaas.platform.dashboard;

import com.gymsaas.platform.attendance.AttendanceRepository;
import com.gymsaas.platform.member.AppUser;
import com.gymsaas.platform.member.AppUserRepository;
import com.gymsaas.platform.member.Role;
import com.gymsaas.platform.payment.PaymentRepository;
import com.gymsaas.platform.plan.MembershipPlan;
import com.gymsaas.platform.plan.MembershipPlanRepository;
import com.gymsaas.platform.subscription.Subscription;
import com.gymsaas.platform.subscription.Subscription.SubscriptionStatus;
import com.gymsaas.platform.subscription.SubscriptionRepository;
import com.gymsaas.platform.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.util.List;

@Service
public class DashboardService {

    public record DashboardResponse(
            long activeMembers,
            long activeSubscriptions,
            long expiringWithin7Days,
            long expired,
            BigDecimal revenueThisMonth,
                long checkInsToday,
                List<MembershipEntry> activeMemberList,
                List<MembershipEntry> expiringMembers,
                List<MembershipEntry> expiredMembers
    ) {}

            public record MembershipEntry(Long memberId, String name, String phone, String planName, LocalDate endDate) {}

    private final AppUserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PaymentRepository paymentRepository;
    private final AttendanceRepository attendanceRepository;
    private final MembershipPlanRepository planRepository;

    public DashboardService(AppUserRepository userRepository, SubscriptionRepository subscriptionRepository,
                             PaymentRepository paymentRepository, AttendanceRepository attendanceRepository,
                             MembershipPlanRepository planRepository) {
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.paymentRepository = paymentRepository;
        this.attendanceRepository = attendanceRepository;
        this.planRepository = planRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse summary() {
        Long gymId = TenantContext.getGymId();
        LocalDate today = LocalDate.now();
        ZoneId zone = ZoneId.systemDefault();
        Instant dayStart = today.atStartOfDay(zone).toInstant();
        List<Subscription> subscriptions = subscriptionRepository.findAllByGymIdOrderByEndDateAsc(gymId);
        List<MembershipEntry> activeMembers = subscriptions.stream()
            .filter(subscription -> isCurrentActive(subscription, today) && subscription.getEndDate().isAfter(today.plusDays(3)))
            .map(this::toMembershipEntry).toList();
        List<MembershipEntry> expiringMembers = subscriptions.stream()
            .filter(subscription -> isCurrentActive(subscription, today)
                && !subscription.getEndDate().isBefore(today)
                && !subscription.getEndDate().isAfter(today.plusDays(3)))
            .map(this::toMembershipEntry).toList();
        List<MembershipEntry> expiredMembers = subscriptions.stream()
            .filter(subscription -> subscription.getStatus() != SubscriptionStatus.CANCELLED
                && subscription.getStatus() != SubscriptionStatus.PENDING_PAYMENT
                && subscription.getEndDate().isBefore(today))
            .map(this::toMembershipEntry).toList();

        return new DashboardResponse(
                userRepository.countByGymIdAndRoleAndStatus(gymId, Role.MEMBER, AppUser.UserStatus.ACTIVE),
            activeMembers.size() + expiringMembers.size(),
            expiringMembers.size(),
            expiredMembers.size(),
                paymentRepository.sumCompletedBetween(gymId, today.withDayOfMonth(1), today.withDayOfMonth(today.lengthOfMonth())),
                attendanceRepository.countByGymIdAndCheckInAtBetween(gymId, dayStart, dayStart.plusSeconds(24 * 3600)),
                activeMembers,
                expiringMembers,
                expiredMembers
        );
    }

    private boolean isCurrentActive(Subscription subscription, LocalDate today) {
        return (subscription.getStatus() == SubscriptionStatus.ACTIVE || subscription.getStatus() == SubscriptionStatus.EXPIRING)
            && !subscription.getEndDate().isBefore(today);
        }

    private MembershipEntry toMembershipEntry(Subscription subscription) {
        AppUser member = userRepository.findByIdAndGymId(subscription.getMemberId(), subscription.getGymId()).orElse(null);
        MembershipPlan plan = planRepository.findByIdAndGymId(subscription.getPlanId(), subscription.getGymId()).orElse(null);
        if (member == null || plan == null) return new MembershipEntry(subscription.getMemberId(), "Unknown member", null, "Unknown plan", subscription.getEndDate());
        return new MembershipEntry(member.getId(), member.getName(), member.getPhone(), plan.getName(), subscription.getEndDate());
        }
}

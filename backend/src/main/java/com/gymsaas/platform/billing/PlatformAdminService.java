package com.gymsaas.platform.billing;

import com.gymsaas.platform.billing.GymPlatformFee.FeeStatus;
import com.gymsaas.platform.billing.PlatformAdminDtos.*;
import com.gymsaas.platform.attendance.AttendanceRepository;
import com.gymsaas.platform.auth.PasswordResetOtpRepository;
import com.gymsaas.platform.common.ResourceNotFoundException;
import com.gymsaas.platform.device.DeviceTokenRepository;
import com.gymsaas.platform.gym.Gym;
import com.gymsaas.platform.gym.GymRepository;
import com.gymsaas.platform.member.AppUser;
import com.gymsaas.platform.member.AppUserRepository;
import com.gymsaas.platform.member.MemberProfilePhotoRepository;
import com.gymsaas.platform.member.Role;
import com.gymsaas.platform.payment.PaymentRepository;
import com.gymsaas.platform.plan.MembershipPlanRepository;
import com.gymsaas.platform.reminder.ReminderRepository;
import com.gymsaas.platform.subscription.SubscriptionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Super-admin (PLATFORM_ADMIN) operations: review/approve/reject gym
 * registrations, create and manage gym admins (gyms + their GYM_OWNER
 * accounts) and configure and charge each gym's monthly platform fee.
 *
 * Self-registered gyms start PENDING (owner INACTIVE) and only become usable
 * after approve; gyms created directly here are APPROVED immediately.
 *
 * Runs outside any tenant scope: the caller is a PLATFORM_ADMIN (gymId null),
 * so TenantContext has no gym and the Hibernate tenant filter is disabled.
 */
@Service
public class PlatformAdminService {

    private final GymRepository gymRepository;
    private final AppUserRepository userRepository;
    private final GymPlatformFeeRepository feeRepository;
    private final PasswordEncoder passwordEncoder;
    private final BigDecimal monthlyFee;
    // Repositories needed only for the hard-delete cascade (FK-safe ordering).
    private final SubscriptionRepository subscriptionRepository;
    private final PaymentRepository paymentRepository;
    private final ReminderRepository reminderRepository;
    private final AttendanceRepository attendanceRepository;
    private final MemberProfilePhotoRepository profilePhotoRepository;
    private final DeviceTokenRepository deviceTokenRepository;
    private final MembershipPlanRepository planRepository;
    private final PasswordResetOtpRepository otpRepository;

    public PlatformAdminService(GymRepository gymRepository, AppUserRepository userRepository,
                                GymPlatformFeeRepository feeRepository, PasswordEncoder passwordEncoder,
                                @Value("${app.billing.monthly-fee:2500}") BigDecimal monthlyFee,
                                SubscriptionRepository subscriptionRepository,
                                PaymentRepository paymentRepository,
                                ReminderRepository reminderRepository,
                                AttendanceRepository attendanceRepository,
                                MemberProfilePhotoRepository profilePhotoRepository,
                                DeviceTokenRepository deviceTokenRepository,
                                MembershipPlanRepository planRepository,
                                PasswordResetOtpRepository otpRepository) {
        this.gymRepository = gymRepository;
        this.userRepository = userRepository;
        this.feeRepository = feeRepository;
        this.passwordEncoder = passwordEncoder;
        this.monthlyFee = monthlyFee;
        this.subscriptionRepository = subscriptionRepository;
        this.paymentRepository = paymentRepository;
        this.reminderRepository = reminderRepository;
        this.attendanceRepository = attendanceRepository;
        this.profilePhotoRepository = profilePhotoRepository;
        this.deviceTokenRepository = deviceTokenRepository;
        this.planRepository = planRepository;
        this.otpRepository = otpRepository;
    }

    /** GET /admin/gyms — approved gyms with their owner admin and fee status. */
    @Transactional(readOnly = true)
    public List<GymAdminResponse> listGyms() {
        return gymRepository.findAll().stream()
                .filter(gym -> gym.getApprovalStatus() == Gym.ApprovalStatus.APPROVED)
                .map(gym -> GymAdminResponse.from(gym,
                        ownerOf(gym).orElse(null),
                        feeRepository.findByGymId(gym.getId()).orElse(null)))
                .toList();
    }

    /** GET /admin/registrations — pending + rejected self-registration requests. */
    @Transactional(readOnly = true)
    public List<GymAdminResponse> listRegistrations() {
        return gymRepository.findAll().stream()
                .filter(gym -> gym.getApprovalStatus() != Gym.ApprovalStatus.APPROVED)
                .map(gym -> GymAdminResponse.from(gym,
                        ownerOf(gym).orElse(null),
                        feeRepository.findByGymId(gym.getId()).orElse(null)))
                .toList();
    }

    /** POST /admin/registrations/{id}/approve — let a self-registered admin sign in. */
    @Transactional
    public GymAdminResponse approveRegistration(Long gymId) {
        Gym gym = gymRepository.findById(gymId)
                .orElseThrow(() -> new ResourceNotFoundException("Gym not found"));
        if (gym.getApprovalStatus() == Gym.ApprovalStatus.APPROVED) {
            return responseFor(gym);
        }
        gym.setApprovalStatus(Gym.ApprovalStatus.APPROVED);
        gym.setApprovedAt(Instant.now());
        gym.setApprovalNote(null);
        gymRepository.save(gym);

        // Activating the gym also unblocks its owner account so login succeeds.
        ownerOf(gym).ifPresent(owner -> {
            if (owner.getStatus() != AppUser.UserStatus.ACTIVE) {
                owner.setStatus(AppUser.UserStatus.ACTIVE);
                userRepository.save(owner);
            }
        });
        return responseFor(gym);
    }

    /** POST /admin/registrations/{id}/reject — refuse a self-registration. */
    @Transactional
    public GymAdminResponse rejectRegistration(Long gymId, String note) {
        Gym gym = gymRepository.findById(gymId)
                .orElseThrow(() -> new ResourceNotFoundException("Gym not found"));
        gym.setApprovalStatus(Gym.ApprovalStatus.REJECTED);
        gym.setApprovalNote(note == null ? null : note.trim());
        gym.setApprovedAt(null);
        gymRepository.save(gym);

        // Keep the owner locked out; the login gate reads the gym's REJECTED state.
        ownerOf(gym).ifPresent(owner -> {
            if (owner.getStatus() != AppUser.UserStatus.INACTIVE) {
                owner.setStatus(AppUser.UserStatus.INACTIVE);
                userRepository.save(owner);
            }
        });
        return responseFor(gym);
    }

    /** PUT /admin/gyms/{id} — edit an existing gym and its owner's display name. */
    @Transactional
    public GymAdminResponse updateGym(Long gymId, UpdateGymRequest request) {
        Gym gym = gymRepository.findById(gymId)
                .orElseThrow(() -> new ResourceNotFoundException("Gym not found"));
        gym.setName(request.gymName());
        gym.setPhone(request.gymPhone());
        gymRepository.save(gym);

        ownerOf(gym).ifPresent(owner -> {
            owner.setName(request.ownerName());
            userRepository.save(owner);
        });
        return responseFor(gym);
    }

    /** DELETE /admin/gyms/{id} — hard-delete a gym and every row it owns. */
    @Transactional
    public void deleteGym(Long gymId) {
        Gym gym = gymRepository.findById(gymId)
                .orElseThrow(() -> new ResourceNotFoundException("Gym not found"));

        // FK-safe order (children before parents; each derived delete flushes
        // before the next query runs): remove rows that reference subscription
        // first, then subscription itself, then plans, then the member/photo/
        // device rows, then the gym's users (and their OTPs), then fee, gym.
        // audit_log has no writer yet so it never has rows to clean up.
        paymentRepository.deleteAllByGymId(gymId);
        reminderRepository.deleteAllByGymId(gymId);
        attendanceRepository.deleteAllByGymId(gymId);
        subscriptionRepository.deleteAllByGymId(gymId);
        planRepository.deleteAllByGymId(gymId);
        profilePhotoRepository.deleteAllByGymId(gymId);
        deviceTokenRepository.deleteAllByGymId(gymId);

        List<Long> userIds = userRepository.findAllByGymId(gymId).stream().map(AppUser::getId).toList();
        if (!userIds.isEmpty()) {
            otpRepository.deleteAllByUserIdIn(userIds);
        }
        userRepository.deleteAllByGymId(gymId);
        feeRepository.deleteAllByGymId(gymId);
        gymRepository.delete(gym);
    }

    /** POST /admin/gyms — create a gym AND its sole admin (gym owner) backend-side. */
    @Transactional
    public GymAdminResponse createGym(CreateGymRequest request) {
        if (gymRepository.existsByEmail(request.ownerEmail())) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }
        Gym gym = gymRepository.save(Gym.builder()
                .name(request.gymName())
                .phone(request.gymPhone())
                .email(request.ownerEmail())
                .status(Gym.GymStatus.ACTIVE)
                .planTier(Gym.PlanTier.BASIC)
                .approvalStatus(Gym.ApprovalStatus.APPROVED)
                .approvedAt(Instant.now())
                .build());

        AppUser owner = userRepository.save(AppUser.builder()
                .gymId(gym.getId())
                .name(request.ownerName())
                .email(request.ownerEmail())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(Role.GYM_OWNER)
                .status(AppUser.UserStatus.ACTIVE)
                .build());

        // Open the first, immediately active monthly period at the default fee.
        LocalDate today = LocalDate.now();
        feeRepository.save(GymPlatformFee.builder()
                .gymId(gym.getId())
                .amount(monthlyFee)
                .periodStart(today)
                .periodEnd(today.plusMonths(1))
                .status(FeeStatus.ACTIVE)
                .build());

        return GymAdminResponse.from(gym, owner, feeRepository.findByGymId(gym.getId()).orElse(null));
    }

    private GymAdminResponse responseFor(Gym gym) {
        return GymAdminResponse.from(gym, ownerOf(gym).orElse(null), feeRepository.findByGymId(gym.getId()).orElse(null));
    }

    private Optional<AppUser> ownerOf(Gym gym) {
        return userRepository.findByGymIdAndRole(gym.getId(), Role.GYM_OWNER);
    }

    /** PUT /admin/gyms/{id}/status — activate or suspend a gym. */
    @Transactional
    public GymAdminResponse setGymStatus(Long gymId, String status) {
        Gym gym = gymRepository.findById(gymId)
                .orElseThrow(() -> new ResourceNotFoundException("Gym not found"));
        Gym.GymStatus parsed;
        try {
            parsed = Gym.GymStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid gym status: " + status);
        }
        gym.setStatus(parsed);
        gymRepository.save(gym);

        // A suspended gym must not be counted as a paying ACTIVE gym.
        feeRepository.findByGymId(gymId).ifPresent(fee -> {
            fee.setStatus(parsed == Gym.GymStatus.SUSPENDED ? FeeStatus.SUSPENDED : FeeStatus.ACTIVE);
            feeRepository.save(fee);
        });
        return responseFor(gym);
    }

    /** PUT /admin/gyms/{id}/fee — set this gym's recurring monthly platform fee. */
    @Transactional
    public GymAdminResponse setGymFee(Long gymId, BigDecimal amount) {
        Gym gym = gymRepository.findById(gymId)
                .orElseThrow(() -> new ResourceNotFoundException("Gym not found"));
        LocalDate today = LocalDate.now();
        GymPlatformFee fee = feeRepository.findByGymId(gymId).orElseGet(() -> GymPlatformFee.builder()
                .gymId(gymId)
                .amount(monthlyFee)
                .periodStart(today.minusMonths(1))
                .periodEnd(today.minusDays(1))
                .status(FeeStatus.EXPIRED)
                .build());
        fee.setAmount(amount);
        feeRepository.save(fee);
        return responseFor(gym);
    }

    /** POST /admin/gyms/{id}/charge — extend the gym's paid period by one month. */
    @Transactional
    public GymAdminResponse chargeGym(Long gymId) {
        Gym gym = gymRepository.findById(gymId)
                .orElseThrow(() -> new ResourceNotFoundException("Gym not found"));
        LocalDate today = LocalDate.now();

        GymPlatformFee fee = feeRepository.findByGymId(gymId).orElseGet(() -> GymPlatformFee.builder()
                .gymId(gymId)
                .amount(monthlyFee)
                .periodStart(today)
                .periodEnd(today.plusMonths(1))
                .status(FeeStatus.ACTIVE)
                .build());

        // Extend from the current period end when still in the future, else from today.
        LocalDate from = fee.getPeriodEnd() != null && fee.getPeriodEnd().isAfter(today)
                ? fee.getPeriodEnd() : today;
        fee.setPeriodStart(today);
        fee.setPeriodEnd(from.plusMonths(1));
        fee.setStatus(FeeStatus.ACTIVE);
        feeRepository.save(fee);

        return responseFor(gym);
    }

    /** GET /admin/dashboard — platform-wide roll-up for the super admin. */
    @Transactional(readOnly = true)
    public PlatformDashboardResponse dashboard() {
        LocalDate today = LocalDate.now();
        long total = gymRepository.findAll().stream()
                .filter(g -> g.getApprovalStatus() == Gym.ApprovalStatus.APPROVED)
                .count();
        long active = 0, expiring = 0, expired = 0;
        BigDecimal monthly = BigDecimal.ZERO, collected = BigDecimal.ZERO;
        for (GymPlatformFee fee : feeRepository.findAll()) {
            Gym.GymStatus gymStatus = gymRepository.findById(fee.getGymId())
                    .map(Gym::getStatus).orElse(Gym.GymStatus.SUSPENDED);
            if (gymStatus == Gym.GymStatus.SUSPENDED) continue;
            FeeStatus status = displayStatus(fee, today);
            switch (status) {
                case ACTIVE -> active++;
                case EXPIRING -> expiring++;
                case EXPIRED -> expired++;
                default -> { /* suspended gyms skipped above */ }
            }
            monthly = monthly.add(fee.getAmount());
            if (status == FeeStatus.ACTIVE || status == FeeStatus.EXPIRING) {
                collected = collected.add(fee.getAmount());
            }
        }
        return new PlatformDashboardResponse(total, active, expiring, expired, monthly, collected);
    }

    private FeeStatus displayStatus(GymPlatformFee fee, LocalDate today) {
        if (fee.getStatus() == FeeStatus.SUSPENDED) return FeeStatus.SUSPENDED;
        if (fee.getPeriodEnd().isBefore(today)) return FeeStatus.EXPIRED;
        if (!fee.getPeriodEnd().isAfter(today.plusDays(3))) return FeeStatus.EXPIRING;
        return FeeStatus.ACTIVE;
    }
}
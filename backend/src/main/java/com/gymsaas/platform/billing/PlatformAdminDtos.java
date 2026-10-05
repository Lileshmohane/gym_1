package com.gymsaas.platform.billing;

import com.gymsaas.platform.gym.Gym;
import com.gymsaas.platform.member.AppUser;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request/response DTOs for the super-admin (PLATFORM_ADMIN) area under
 * /api/v1/admin/**. The existing SecurityConfig already locks this whole
 * prefix to PLATFORM_ADMIN, so these endpoints are backend / super-admin only.
 */
public class PlatformAdminDtos {

    public record CreateGymRequest(
            @NotBlank @Size(max = 150) String gymName,
            @NotBlank @Size(max = 20) String gymPhone,
            @NotBlank @Size(max = 150) String ownerName,
            @NotBlank @Email @Size(max = 150) String ownerEmail,
            @NotBlank @Size(min = 8, max = 72) String password) {}

    public record SetStatusRequest(
            @NotBlank String status) {}

    public record SetFeeRequest(
            @NotNull @DecimalMin("0.01") @Digits(integer = 8, fraction = 2) BigDecimal amount) {}

    // Super-admin edit of an existing gym + its owning admin account. Email is
    // the login identity and (gym_id, email) unique key, so it is intentionally
    // not editable here — only the human-facing name/phone fields.
    public record UpdateGymRequest(
            @NotBlank @Size(max = 150) String gymName,
            @NotBlank @Size(max = 20) String gymPhone,
            @NotBlank @Size(max = 150) String ownerName) {}

    // Optional reviewer note recorded when a registration is rejected. It is the
    // reason surfaced back to the admin if they try to sign in while rejected.
    public record RejectRequest(@Size(max = 255) String note) {}

    /** A gym plus its owning admin account and current platform-fee status. */
    public record GymAdminResponse(
            Long gymId, String gymName, String gymPhone, String ownerName, String ownerEmail,
            String gymStatus, BigDecimal feeAmount, String feeStatus, LocalDate periodEnd,
            String approvalStatus, String approvalNote, String ownerStatus) {
        public static GymAdminResponse from(Gym gym, AppUser owner, GymPlatformFee fee) {
            String ownerName = owner == null ? null : owner.getName();
            String ownerEmail = owner == null ? null : owner.getEmail();
            String ownerStatus = owner == null ? null : owner.getStatus().name();
            return new GymAdminResponse(gym.getId(), gym.getName(), gym.getPhone(), ownerName, ownerEmail,
                    gym.getStatus().name(), fee == null ? null : fee.getAmount(),
                    fee == null ? null : fee.getStatus().name(),
                    fee == null ? null : fee.getPeriodEnd(),
                    gym.getApprovalStatus().name(), gym.getApprovalNote(), ownerStatus);
        }
    }

    /** Platform-wide roll-up; the super-admin analogue of the gym dashboard. */
    public record PlatformDashboardResponse(
            long totalGyms, long activeGyms, long expiringGyms, long expiredGyms,
            BigDecimal monthlyRevenue, BigDecimal collectedRevenue) {}
}
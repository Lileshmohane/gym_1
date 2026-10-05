package com.gymsaas.platform.auth;

import com.gymsaas.platform.auth.AuthDtos.ForgotPasswordRequest;
import com.gymsaas.platform.auth.AuthDtos.ForgotPasswordResponse;
import com.gymsaas.platform.auth.AuthDtos.LoginAccountType;
import com.gymsaas.platform.auth.AuthDtos.ResetPasswordRequest;
import com.gymsaas.platform.member.AppUser;
import com.gymsaas.platform.member.AppUserRepository;
import com.gymsaas.platform.member.Role;
import com.gymsaas.platform.notification.WhatsAppService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Self-serve "forgot password" via a WhatsApp one-time password.
 *
 * Members are provisioned with a random one-time password that is shown only
 * once at creation, so they routinely forget it. This flow lets a member reset
 * their own password by proving possession of the phone on their account.
 *
 * Delivery reuses WhatsAppService, which requires a registered phone. Accounts
 * without a phone (gym owners / super admin, whose phone lives on the gym row,
 * not the user row) cannot use this flow — for them, reset stays an operator
 * action. The response is deliberately identical whether or not a matching
 * account exists, so this endpoint cannot be used to enumerate emails.
 */
@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final int OTP_LENGTH = 6;
    // Fixed generic text — never reveals whether the email exists or has a phone.
    private static final String GENERIC_MESSAGE =
            "If an account with a registered phone matches, a 6-digit code has been sent to it.";

    private final AppUserRepository userRepository;
    private final PasswordResetOtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final WhatsAppService whatsAppService;
    private final SecureRandom random = new SecureRandom();
    private final int otpTtlMinutes;

    public PasswordResetService(AppUserRepository userRepository,
                                PasswordResetOtpRepository otpRepository,
                                PasswordEncoder passwordEncoder,
                                WhatsAppService whatsAppService,
                                @Value("${app.auth.otp-ttl-minutes:10}") int otpTtlMinutes) {
        this.userRepository = userRepository;
        this.otpRepository = otpRepository;
        this.passwordEncoder = passwordEncoder;
        this.whatsAppService = whatsAppService;
        this.otpTtlMinutes = otpTtlMinutes;
    }

    @Transactional
    public ForgotPasswordResponse requestReset(ForgotPasswordRequest request) {
        for (AppUser user : candidates(request.email(), request.accountType())) {
            if (user.getPhone() == null || user.getPhone().isBlank()) {
                continue; // nothing to deliver to; stay silent to avoid enumeration
            }
            String otp = generateOtp();
            otpRepository.save(PasswordResetOtp.builder()
                    .userId(user.getId())
                    .otpHash(passwordEncoder.encode(otp))
                    .expiresAt(Instant.now().plus(otpTtlMinutes, ChronoUnit.MINUTES))
                    .build());

            boolean delivered = whatsAppService.sendPasswordResetOtp(user, otp);
            if (!delivered && !whatsAppService.isEnabled()) {
                // WhatsApp is off (local dev): surface the code so the flow is
                // testable without a live provider. In production WhatsApp is
                // enabled, so this branch — and any code disclosure — never runs.
                log.info("WhatsApp disabled — password reset OTP for {} is {}", user.getEmail(), otp);
            }
        }
        return new ForgotPasswordResponse(GENERIC_MESSAGE, otpTtlMinutes * 60);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        List<AppUser> users = candidates(request.email(), request.accountType());
        if (users.isEmpty()) {
            throw new BadOtpException();
        }
        // A shared email across gyms is disambiguated by which user the OTP was
        // actually issued to (and delivered to that user's phone).
        PasswordResetOtp matched = null;
        AppUser matchedUser = null;
        outer:
        for (AppUser user : users) {
            for (PasswordResetOtp otp : otpRepository.findByUserIdAndConsumedFalseOrderByCreatedAtDesc(user.getId())) {
                if (otp.isUsable() && passwordEncoder.matches(request.otp(), otp.getOtpHash())) {
                    matched = otp;
                    matchedUser = user;
                    break outer;
                }
            }
        }
        if (matched == null) {
            throw new BadOtpException();
        }

        matchedUser.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(matchedUser);
        matched.setConsumed(true);
        otpRepository.save(matched);
        log.info("Password reset completed for user id {}", matchedUser.getId());
    }

    // Cross-tenant, pre-auth lookup — same strategy AuthService.login uses
    // (email is only unique per gym, so accountType narrows the candidates).
    private List<AppUser> candidates(String email, LoginAccountType accountType) {
        return userRepository.findAllByEmail(email).stream()
                .filter(u -> u.getStatus() == AppUser.UserStatus.ACTIVE)
                .filter(u -> matchesAccountType(u, accountType))
                .toList();
    }

    private boolean matchesAccountType(AppUser user, LoginAccountType accountType) {
        if (accountType == null) return true;
        return switch (accountType) {
            case GYM_ADMIN -> user.getRole() == Role.GYM_OWNER || user.getRole() == Role.GYM_STAFF;
            case MEMBER -> user.getRole() == Role.MEMBER;
            case PLATFORM_ADMIN -> user.getRole() == Role.PLATFORM_ADMIN;
        };
    }

    private String generateOtp() {
        int bound = (int) Math.pow(10, OTP_LENGTH);
        return String.format("%0" + OTP_LENGTH + "d", random.nextInt(bound));
    }

    /** Signals an invalid/expired OTP or unknown account; mapped to 400 in the handler. */
    public static class BadOtpException extends RuntimeException {
        public BadOtpException() {
            super("The code is invalid or has expired. Please request a new one.");
        }
    }
}

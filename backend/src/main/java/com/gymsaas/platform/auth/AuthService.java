package com.gymsaas.platform.auth;

import com.gymsaas.platform.auth.AuthDtos.*;
import com.gymsaas.platform.common.AccountNotActiveException;
import com.gymsaas.platform.gym.Gym;
import com.gymsaas.platform.gym.GymRepository;
import com.gymsaas.platform.member.AppUser;
import com.gymsaas.platform.member.AppUserRepository;
import com.gymsaas.platform.member.Role;
import com.gymsaas.platform.security.JwtService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Authentication is done manually here rather than via Spring's
 * AuthenticationManager/DaoAuthenticationProvider/UserDetailsService chain.
 * That abstraction assumes a single global username → single user mapping;
 * ours doesn't hold, because email is only unique per-gym (see the schema
 * doc's (gym_id, email) composite unique constraint), so the same email can
 * legitimately belong to a different person at a different gym.
 *
 * Resolution strategy: look up ALL users with that email across every gym,
 * then let the password hash disambiguate — only one candidate's BCrypt hash
 * will match the given password. This needs no gym-selection step from the
 * user and needs no separate "which gym" input on the login form.
 */
@Service
public class AuthService {

    private final AppUserRepository userRepository;
    private final GymRepository gymRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(AppUserRepository userRepository, GymRepository gymRepository,
                        PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.gymRepository = gymRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        List<AppUser> candidates = userRepository.findAllByEmail(request.email());

        // Match on credential first (account-type + password), independent of the
        // account's status, so a user with the right password but a not-yet-active
        // account gets a specific "why" instead of a generic invalid-credentials.
        AppUser matched = candidates.stream()
                .filter(u -> matchesAccountType(u, request.accountType()))
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .findFirst()
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (matched.getStatus() != AppUser.UserStatus.ACTIVE) {
            throw new AccountNotActiveException(inactiveReason(matched));
        }

        return issueTokens(matched);
    }

    // Explains WHY a correct-password account can't sign in. For gym-owned
    // accounts the gym's approval status is the source of truth; a PENDING gym
    // means the owner is still waiting on the super admin, REJECTED carries the
    // reviewer's note when present.
    private String inactiveReason(AppUser user) {
        if (user.getGymId() != null) {
            Gym gym = gymRepository.findById(user.getGymId()).orElse(null);
            if (gym != null) {
                if (gym.getApprovalStatus() == Gym.ApprovalStatus.PENDING) {
                    return "Your gym registration is awaiting approval from the platform administrator. "
                            + "You'll be able to sign in once it is approved.";
                }
                if (gym.getApprovalStatus() == Gym.ApprovalStatus.REJECTED) {
                    String note = gym.getApprovalNote();
                    return "Your gym registration was rejected."
                            + (note == null || note.isBlank() ? "" : " Reason: " + note);
                }
            }
        }
        return "This account is not active. Please contact the platform administrator.";
    }

    private boolean matchesAccountType(AppUser user, LoginAccountType accountType) {
        if (accountType == null) return true;
        return switch (accountType) {
            case GYM_ADMIN -> user.getRole() == Role.GYM_OWNER || user.getRole() == Role.GYM_STAFF;
            case MEMBER -> user.getRole() == Role.MEMBER;
            case PLATFORM_ADMIN -> user.getRole() == Role.PLATFORM_ADMIN;
        };
    }

    @Transactional
    public RegisterGymResponse registerGym(RegisterGymRequest request) {
        if (gymRepository.existsByEmail(request.ownerEmail())) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }

        // The gym is created PENDING and its owner INACTIVE: no tokens are
        // issued and the owner cannot log in until the super admin approves it.
        Gym gym = gymRepository.save(Gym.builder()
                .name(request.gymName())
                .phone(request.gymPhone())
                .email(request.ownerEmail())
                .status(Gym.GymStatus.TRIAL)
                .planTier(Gym.PlanTier.BASIC)
                .approvalStatus(Gym.ApprovalStatus.PENDING)
                .build());

        userRepository.save(AppUser.builder()
                .gymId(gym.getId())
                .name(request.ownerName())
                .email(request.ownerEmail())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(Role.GYM_OWNER)
                .status(AppUser.UserStatus.INACTIVE)
                .build());

        return new RegisterGymResponse("PENDING",
                "Your gym registration was submitted. The platform administrator will review it, "
                        + "and you can sign in once it is approved.");
    }

    @Transactional(readOnly = true)
    public AuthResponse refresh(RefreshRequest request) {
        if (!jwtService.isValid(request.refreshToken()) || !jwtService.isRefreshToken(request.refreshToken())) {
            throw new BadCredentialsException("Invalid or expired refresh token");
        }
        Long userId = jwtService.extractUserId(request.refreshToken());
        AppUser user = userRepository.findById(userId)
                .filter(u -> u.getStatus() == AppUser.UserStatus.ACTIVE)
                .orElseThrow(() -> new BadCredentialsException("Invalid or expired refresh token"));

        return issueTokens(user);
    }

    private AuthResponse issueTokens(AppUser user) {
        String access = jwtService.generateAccessToken(user.getId(), user.getGymId(), user.getRole().name());
        String refresh = jwtService.generateRefreshToken(user.getId());
        return new AuthResponse(AuthUserDto.from(user), access, refresh);
    }
}

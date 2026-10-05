package com.gymsaas.platform.auth;

import com.gymsaas.platform.member.AppUser;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password,
            LoginAccountType accountType
    ) {}

        public enum LoginAccountType { GYM_ADMIN, MEMBER, PLATFORM_ADMIN }

    public record RefreshRequest(@NotBlank String refreshToken) {}

    public record RegisterGymRequest(
            @NotBlank @Size(max = 150) String gymName,
            @NotBlank String gymPhone,
            @NotBlank @Email String ownerEmail,
            @NotBlank @Size(min = 8, max = 100) String password,
            @NotBlank @Size(max = 150) String ownerName
    ) {}

    // Self-registration no longer logs the owner in immediately: the gym is
    // created PENDING and its owner stays INACTIVE until the super admin
    // approves. This response confirms the request was submitted for review —
    // it deliberately carries no tokens.
    public record RegisterGymResponse(String status, String message) {}

    // Forgot-password step 1: identify the account. Email alone is not globally
    // unique (unique per gym), so accountType disambiguates the same way login
    // does. The account's registered phone (i.e. members) is where the OTP goes.
    public record ForgotPasswordRequest(
            @NotBlank @Email String email,
            LoginAccountType accountType
    ) {}

    // Returned in every case — even when no matching account/phone exists — so
    // the response cannot be used to enumerate which emails are registered.
    public record ForgotPasswordResponse(String message, Integer expiresInSeconds) {}

    // Forgot-password step 2: prove possession of the phone by presenting the
    // OTP, then choose the new password.
    public record ResetPasswordRequest(
            @NotBlank @Email String email,
            LoginAccountType accountType,
            @NotBlank @Pattern(regexp = "\\d{6}") String otp,
            @NotBlank @Size(min = 8, max = 100) String newPassword
    ) {}

    public record AuthUserDto(Long id, Long gymId, String name, String email, String role) {
        public static AuthUserDto from(AppUser user) {
            return new AuthUserDto(user.getId(), user.getGymId(), user.getName(), user.getEmail(), user.getRole().name());
        }
    }

    public record AuthResponse(AuthUserDto user, String accessToken, String refreshToken) {}

    public record MessageResponse(String message) {}
}

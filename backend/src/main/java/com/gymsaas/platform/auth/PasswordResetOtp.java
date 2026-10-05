package com.gymsaas.platform.auth;

import com.gymsaas.platform.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * A single, short-lived one-time password issued for the "forgot password"
 * flow. Delivered over WhatsApp to the account's registered phone. Only the
 * BCrypt hash of the OTP is stored (never the clear-text digits). Not tenant-
 * scoped by design: this lookup happens before authentication, exactly like
 * login, so the row is keyed directly by the owning user id.
 */
@Entity
@Table(name = "password_reset_otp")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetOtp extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "otp_hash", nullable = false)
    private String otpHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    @Builder.Default
    private boolean consumed = false;

    public boolean isUsable() {
        return !consumed && Instant.now().isBefore(expiresAt);
    }
}

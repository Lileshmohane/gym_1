package com.gymsaas.platform.config;

import com.gymsaas.platform.member.AppUser;
import com.gymsaas.platform.member.AppUserRepository;
import com.gymsaas.platform.member.Role;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Bootstraps the single super admin (PLATFORM_ADMIN) account. Admins/gym owners
 * are created only on the backend side, so this is where the platform's own
 * operator account is provisioned on first startup.
 *
 * Credentials come from environment variables / config:
 *   PLATFORM_ADMIN_EMAIL, PLATFORM_ADMIN_PASSWORD, PLATFORM_ADMIN_NAME.
 * If none are configured (development), it provisions a DEVELOPMENT super admin
 * with a fixed default and logs it clearly. Either way the app always starts.
 * If a PLATFORM_ADMIN already exists, it does nothing (idempotent).
 */
@Component
public class PlatformAdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(PlatformAdminBootstrap.class);

    // Development-only fallback when PLATFORM_ADMIN_* are not configured.
    private static final String DEV_EMAIL = "admin@fittrack.local";
    private static final String DEV_PASSWORD = "Admin@12345";

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;
    private final String displayName;

    public PlatformAdminBootstrap(AppUserRepository userRepository, PasswordEncoder passwordEncoder,
                                  @Value("${app.platform-admin.email:}") String email,
                                  @Value("${app.platform-admin.password:}") String password,
                                  @Value("${app.platform-admin.name:Super Admin}") String displayName) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email == null ? "" : email.trim();
        this.password = password == null ? "" : password;
        this.displayName = displayName == null ? "Super Admin" : displayName;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        boolean alreadyExists = userRepository.findAllByRole(Role.PLATFORM_ADMIN)
                .stream().anyMatch(u -> u.getStatus() == AppUser.UserStatus.ACTIVE);
        if (alreadyExists) return;

        String adminEmail = email;
        String adminPassword = password;
        boolean usingDevFallback = false;
        if (adminEmail.isBlank() || adminPassword.length() < 8) {
            adminEmail = DEV_EMAIL;
            adminPassword = DEV_PASSWORD;
            usingDevFallback = true;
        }

        if (usingDevFallback) {
            log.warn("PLATFORM_ADMIN_EMAIL / PLATFORM_ADMIN_PASSWORD not configured — created a "
                    + "DEVELOPMENT super admin {} / {}. Set those variables in production.",
                    adminEmail, adminPassword);
        }

        AppUser admin = AppUser.builder()
                .gymId(null) // super admin lives outside any gym
                .name(displayName)
                .email(adminEmail)
                .passwordHash(passwordEncoder.encode(adminPassword))
                .role(Role.PLATFORM_ADMIN)
                .status(AppUser.UserStatus.ACTIVE)
                .build();
        userRepository.save(admin);
        log.info("Bootstrapped super admin account: {}", adminEmail);
    }
}
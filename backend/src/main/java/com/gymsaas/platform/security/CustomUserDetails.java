package com.gymsaas.platform.security;

import com.gymsaas.platform.member.AppUser;
import com.gymsaas.platform.member.Role;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * The authenticated principal for every request. Built two different ways:
 *
 *   - {@link #fromUser(AppUser)} — used once at login, after AuthService has
 *     verified the password directly (not via Spring's AuthenticationManager
 *     — see AuthService's javadoc for why: email is only unique per-gym, not
 *     globally, which doesn't fit UserDetailsService's single-username model).
 *   - {@link #fromClaims(Long, Long, Role)} — used on every subsequent
 *     request by JwtAuthenticationFilter, built directly from the validated,
 *     signed JWT's claims with NO database lookup. This matches the Technical
 *     Architecture Document, Section 8: gymId and role are trusted from the
 *     token for the token's lifetime (short-lived: 15 min access tokens), not
 *     re-fetched per request.
 */
public class CustomUserDetails implements UserDetails {

    private final Long userId;
    private final Long gymId;
    private final String email; // only populated via fromUser(); not needed after login
    private final String passwordHash; // only populated via fromUser(); never present on token-based principals
    private final Role role;

    private CustomUserDetails(Long userId, Long gymId, String email, String passwordHash, Role role) {
        this.userId = userId;
        this.gymId = gymId;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
    }

    public static CustomUserDetails fromUser(AppUser user) {
        return new CustomUserDetails(user.getId(), user.getGymId(), user.getEmail(), user.getPasswordHash(), user.getRole());
    }

    public static CustomUserDetails fromClaims(Long userId, Long gymId, Role role) {
        return new CustomUserDetails(userId, gymId, null, null, role);
    }

    public Long getUserId() { return userId; }
    public Long getGymId() { return gymId; }
    public Role getRole() { return role; }
    public boolean isPlatformAdmin() { return role == Role.PLATFORM_ADMIN; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override public String getPassword() { return passwordHash; }
    @Override public String getUsername() { return email != null ? email : String.valueOf(userId); }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}

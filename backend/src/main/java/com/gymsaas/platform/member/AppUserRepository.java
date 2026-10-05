package com.gymsaas.platform.member;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    // Login lookup must NOT rely on the tenant filter (a user isn't
    // authenticated yet, so there's no gymId to scope by) — this method is
    // only ever called from AuthService, before TenantContext exists for this
    // request. Email is not globally unique (unique per gym instead, per the
    // schema doc), so login additionally disambiguates by gym at the auth
    // layer if more than one match comes back across gyms sharing an email.
    java.util.List<AppUser> findAllByEmail(String email);

    List<AppUser> findAllByRole(Role role);

    Optional<AppUser> findByGymIdAndRole(Long gymId, Role role);

    long countByRoleAndStatus(Role role, AppUser.UserStatus status);

    Page<AppUser> findAllByGymIdAndRole(Long gymId, Role role, Pageable pageable);

    Optional<AppUser> findByIdAndGymId(Long id, Long gymId);

    long countByGymIdAndRoleAndStatus(Long gymId, Role role, AppUser.UserStatus status);

    // Super-admin hard-delete cascade (PlatformAdminService): cross-tenant by
    // design — the caller is a PLATFORM_ADMIN (no gymId), so the tenant filter
    // is not applied and these operate on every user belonging to the gym.
    List<AppUser> findAllByGymId(Long gymId);

    @Transactional
    void deleteAllByGymId(Long gymId);
}

package com.gymsaas.platform.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {

    // Called only from PasswordResetService during an unauthenticated (forgot /
    // reset) request, so TenantContext is empty and no tenant filter applies.
    List<PasswordResetOtp> findByUserIdAndConsumedFalseOrderByCreatedAtDesc(Long userId);

    // Used by the super-admin hard-delete cascade (PlatformAdminService).
    @org.springframework.transaction.annotation.Transactional
    void deleteAllByUserIdIn(java.util.Collection<Long> userIds);
}

package com.gymsaas.platform.device;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

public interface DeviceTokenRepository extends JpaRepository<DeviceToken, Long> {

    @Transactional
    void deleteAllByGymIdAndUserId(Long gymId, Long userId);

    // Used by the super-admin hard-delete cascade (PlatformAdminService).
    @Transactional
    void deleteAllByGymId(Long gymId);
}

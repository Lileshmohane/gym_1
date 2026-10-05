package com.gymsaas.platform.billing;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GymPlatformFeeRepository extends JpaRepository<GymPlatformFee, Long> {

    Optional<GymPlatformFee> findByGymId(Long gymId);

    List<GymPlatformFee> findAllByStatus(GymPlatformFee.FeeStatus status);

    // Used by the super-admin hard-delete cascade (PlatformAdminService).
    @org.springframework.transaction.annotation.Transactional
    void deleteAllByGymId(Long gymId);
}
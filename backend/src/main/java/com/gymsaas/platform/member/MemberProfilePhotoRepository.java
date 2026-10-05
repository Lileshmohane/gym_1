package com.gymsaas.platform.member;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MemberProfilePhotoRepository extends JpaRepository<MemberProfilePhoto, Long> {

    Optional<MemberProfilePhoto> findByMemberIdAndGymId(Long memberId, Long gymId);

    // Used by the super-admin hard-delete cascade (PlatformAdminService).
    @org.springframework.transaction.annotation.Transactional
    void deleteAllByGymId(Long gymId);
}
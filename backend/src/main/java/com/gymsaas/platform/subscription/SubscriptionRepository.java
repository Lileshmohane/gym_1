package com.gymsaas.platform.subscription;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    List<Subscription> findAllByGymIdAndMemberIdAndStatus(Long gymId, Long memberId, Subscription.SubscriptionStatus status);

       List<Subscription> findAllByGymIdAndMemberIdOrderByEndDateDesc(Long gymId, Long memberId);

       List<Subscription> findAllByGymIdAndMemberId(Long gymId, Long memberId);

       List<Subscription> findAllByGymIdOrderByEndDateAsc(Long gymId);

       Optional<Subscription> findByIdAndGymId(Long id, Long gymId);

    // Used by the super-admin hard-delete cascade (PlatformAdminService).
    @org.springframework.transaction.annotation.Transactional
    void deleteAllByGymId(Long gymId);

    // A member's "current" subscription = most recent non-cancelled one.
    Optional<Subscription> findFirstByGymIdAndMemberIdAndStatusNotOrderByEndDateDesc(
            Long gymId, Long memberId, Subscription.SubscriptionStatus excluded);

    // Expiring-soon widget + reminder scan: uses the (gym_id, end_date, status) index.
    @Query("select s from Subscription s where s.gymId = :gymId and s.endDate between :from and :to " +
           "and s.status in (com.gymsaas.platform.subscription.Subscription.SubscriptionStatus.ACTIVE, " +
           "com.gymsaas.platform.subscription.Subscription.SubscriptionStatus.EXPIRING) order by s.endDate asc")
    List<Subscription> findExpiringBetween(@Param("gymId") Long gymId,
                                            @Param("from") LocalDate from, @Param("to") LocalDate to);

    // Cross-tenant on purpose: used ONLY by the system-level nightly jobs
    // (ReminderScheduler), which run outside any request/tenant context.
    // Native query bypasses the tenantFilter; never expose via a controller.
    @Query(value = "select * from subscription where end_date between :from and :to and status in ('ACTIVE','EXPIRING')",
           nativeQuery = true)
    List<Subscription> findAllExpiringBetweenAcrossTenants(@Param("from") LocalDate from, @Param("to") LocalDate to);

    long countByGymIdAndStatus(Long gymId, Subscription.SubscriptionStatus status);

    // Date-based counts for the dashboard (persisted `status` can lag between
    // nightly runs, so live numbers are derived from end_date instead).
    long countByGymIdAndEndDateGreaterThanEqualAndStatusNot(Long gymId, LocalDate date, Subscription.SubscriptionStatus status);
    long countByGymIdAndEndDateBetweenAndStatusNot(Long gymId, LocalDate from, LocalDate to, Subscription.SubscriptionStatus status);
    long countByGymIdAndEndDateLessThanAndStatusNot(Long gymId, LocalDate date, Subscription.SubscriptionStatus status);
}

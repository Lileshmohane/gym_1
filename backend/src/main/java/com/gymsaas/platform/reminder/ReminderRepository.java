package com.gymsaas.platform.reminder;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReminderRepository extends JpaRepository<Reminder, Long> {

    Optional<Reminder> findBySubscriptionIdAndReminderType(Long subscriptionId, Reminder.ReminderType reminderType);

    // Used by the super-admin hard-delete cascade (PlatformAdminService).
    @org.springframework.transaction.annotation.Transactional
    void deleteAllByGymId(Long gymId);
}
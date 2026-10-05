package com.gymsaas.platform.reminder;

import com.gymsaas.platform.gym.GymRepository;
import com.gymsaas.platform.member.AppUserRepository;
import com.gymsaas.platform.notification.WhatsAppService;
import com.gymsaas.platform.plan.MembershipPlanRepository;
import com.gymsaas.platform.subscription.Subscription;
import com.gymsaas.platform.subscription.SubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
public class ExpiryReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(ExpiryReminderScheduler.class);
    private final SubscriptionRepository subscriptionRepository;
    private final ReminderRepository reminderRepository;
    private final AppUserRepository userRepository;
    private final MembershipPlanRepository planRepository;
    private final GymRepository gymRepository;
    private final WhatsAppService whatsAppService;

    public ExpiryReminderScheduler(SubscriptionRepository subscriptionRepository, ReminderRepository reminderRepository,
                                   AppUserRepository userRepository, MembershipPlanRepository planRepository,
                                   GymRepository gymRepository, WhatsAppService whatsAppService) {
        this.subscriptionRepository = subscriptionRepository;
        this.reminderRepository = reminderRepository;
        this.userRepository = userRepository;
        this.planRepository = planRepository;
        this.gymRepository = gymRepository;
        this.whatsAppService = whatsAppService;
    }

    @Scheduled(cron = "${app.whatsapp.expiry-reminder-cron:0 0 9 * * *}")
    @Transactional
    public void sendThreeDayReminders() {
        if (!whatsAppService.isEnabled()) return;
        LocalDate reminderDate = LocalDate.now().plusDays(3);
        for (Subscription subscription : subscriptionRepository.findAllExpiringBetweenAcrossTenants(reminderDate, reminderDate)) {
            Reminder reminder = reminderRepository.findBySubscriptionIdAndReminderType(
                    subscription.getId(), Reminder.ReminderType.EXPIRY_3_DAY).orElseGet(() -> newReminder(subscription));
            if (reminder.getStatus() == Reminder.ReminderStatus.SENT) continue;

            var member = userRepository.findByIdAndGymId(subscription.getMemberId(), subscription.getGymId()).orElse(null);
            var gym = gymRepository.findById(subscription.getGymId()).orElse(null);
            var plan = planRepository.findByIdAndGymId(subscription.getPlanId(), subscription.getGymId()).orElse(null);
            boolean delivered = member != null && gym != null && plan != null
                    && whatsAppService.sendExpiryReminder(member, gym, plan, subscription.getEndDate());
            reminder.setStatus(delivered ? Reminder.ReminderStatus.SENT : Reminder.ReminderStatus.FAILED);
            reminder.setSentAt(delivered ? LocalDateTime.now() : null);
            reminderRepository.save(reminder);
            if (!delivered) log.warn("Three-day reminder failed for subscription {}", subscription.getId());
        }
    }

    private Reminder newReminder(Subscription subscription) {
        Reminder reminder = new Reminder();
        reminder.setGymId(subscription.getGymId());
        reminder.setMemberId(subscription.getMemberId());
        reminder.setSubscriptionId(subscription.getId());
        reminder.setReminderType(Reminder.ReminderType.EXPIRY_3_DAY);
        reminder.setScheduledAt(LocalDateTime.now());
        reminder.setStatus(Reminder.ReminderStatus.PENDING);
        return reminder;
    }
}
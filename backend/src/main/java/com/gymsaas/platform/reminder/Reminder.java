package com.gymsaas.platform.reminder;

import com.gymsaas.platform.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "reminder")
@Getter
@Setter
@NoArgsConstructor
public class Reminder extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gym_id", nullable = false)
    private Long gymId;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "subscription_id", nullable = false)
    private Long subscriptionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "reminder_type", nullable = false, length = 20)
    private ReminderType reminderType;

    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReminderStatus status = ReminderStatus.PENDING;

    public enum ReminderType { EXPIRY_3_DAY, EXPIRY_TODAY, EXPIRED }
    public enum ReminderStatus { PENDING, SENT, FAILED }
}
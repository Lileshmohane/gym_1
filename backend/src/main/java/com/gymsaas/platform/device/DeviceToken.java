package com.gymsaas.platform.device;

import com.gymsaas.platform.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;

import java.time.Instant;

@Entity
@Table(name = "device_token", uniqueConstraints = @UniqueConstraint(columnNames = {"push_token"}))
@Filter(name = "tenantFilter", condition = "gym_id = :gymId")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceToken extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gym_id", nullable = false)
    private Long gymId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Platform platform;

    @Column(name = "push_token", nullable = false, length = 255)
    private String pushToken;

    @Column(name = "last_active_at", nullable = false)
    @Builder.Default
    private Instant lastActiveAt = Instant.now();

    public enum Platform {
        IOS, ANDROID
    }
}

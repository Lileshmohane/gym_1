package com.gymsaas.platform.attendance;

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
@Table(name = "attendance")
@Filter(name = "tenantFilter", condition = "gym_id = :gymId")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attendance extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gym_id", nullable = false)
    private Long gymId;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "check_in_at", nullable = false)
    private Instant checkInAt;

    @Column(name = "check_out_at")
    private Instant checkOutAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AttendanceSource source;

    @Column(name = "recorded_by_user_id")
    private Long recordedByUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AttendanceStatus status = AttendanceStatus.OPEN;

    public enum AttendanceSource {
        QR_SELF, STAFF_MANUAL, APP_BUTTON
    }

    public enum AttendanceStatus {
        OPEN, CLOSED, AUTO_CLOSED
    }
}

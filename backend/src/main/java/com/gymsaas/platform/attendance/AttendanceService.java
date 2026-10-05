package com.gymsaas.platform.attendance;

import com.gymsaas.platform.common.ResourceNotFoundException;
import com.gymsaas.platform.member.AppUser;
import com.gymsaas.platform.member.AppUserRepository;
import com.gymsaas.platform.member.Role;
import com.gymsaas.platform.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

/**
 * Member self-service attendance: punch in, punch out, and view own history.
 * Gym staff/owners can additionally see the gym's visits for the current day.
 *
 * Everything is explicitly scoped by gymId (via TenantContext) AND memberId so
 * a member can never touch another member's records, and a malformed request
 * can never reach across tenants.
 */
@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final AppUserRepository userRepository;

    public AttendanceService(AttendanceRepository attendanceRepository, AppUserRepository userRepository) {
        this.attendanceRepository = attendanceRepository;
        this.userRepository = userRepository;
    }

    public record AttendanceRecordResponse(Long id, Instant checkInAt, Instant checkOutAt, String status) {}

    public record TodayVisitResponse(Long memberId, String memberName, Instant checkInAt,
                                     Instant checkOutAt, String status) {}

    /** POST /attendance/check-in — used by the member PunchScreen. */
    @Transactional
    public AttendanceRecordResponse checkIn(Long memberId, Attendance.AttendanceSource source) {
        Long gymId = TenantContext.getGymId();
        AppUser member = findOwnedMember(memberId, gymId);
        if (member.getRole() != Role.MEMBER) {
            throw new IllegalArgumentException("Only members can check in.");
        }
        if (attendanceRepository.findAllByGymIdAndMemberIdAndStatus(
                gymId, memberId, Attendance.AttendanceStatus.OPEN).size() > 0) {
            throw new IllegalArgumentException("You already have an open session. Check out first.");
        }
        Attendance record = attendanceRepository.save(Attendance.builder()
                .gymId(gymId)
                .memberId(memberId)
                .checkInAt(Instant.now())
                .source(source)
                .recordedByUserId(memberId)
                .status(Attendance.AttendanceStatus.OPEN)
                .build());
        return toMemberResponse(record);
    }

    /** POST /attendance/{id}/check-out — closes the member's own open record. */
    @Transactional
    public AttendanceRecordResponse checkOut(Long memberId, Long attendanceId) {
        Long gymId = TenantContext.getGymId();
        Attendance record = attendanceRepository.findById(attendanceId)
                .filter(item -> item.getGymId().equals(gymId))
                .filter(item -> item.getMemberId().equals(memberId))
                .orElseThrow(() -> resourceNotFound(attendanceId));
        if (record.getStatus() != Attendance.AttendanceStatus.OPEN) {
            throw new IllegalArgumentException("This session is already closed.");
        }
        record.setCheckOutAt(Instant.now());
        record.setStatus(Attendance.AttendanceStatus.CLOSED);
        return toMemberResponse(attendanceRepository.save(record));
    }

    /** GET /attendance/me — member's own attendance history, newest first. */
    @Transactional(readOnly = true)
    public List<AttendanceRecordResponse> mine(Long memberId) {
        Long gymId = TenantContext.getGymId();
        return attendanceRepository.findAllByGymIdAndMemberIdOrderByCheckInAtDesc(gymId, memberId)
                .stream().map(this::toMemberResponse).toList();
    }

    /** GET /attendance/today — gym staff/owner view of today's visits. */
    @Transactional(readOnly = true)
    public List<TodayVisitResponse> todayForGym() {
        Long gymId = TenantContext.getGymId();
        ZoneId zone = ZoneId.systemDefault();
        LocalDate today = LocalDate.now();
        Instant dayStart = today.atStartOfDay(zone).toInstant();
        return attendanceRepository.findByGymIdAndCheckInAtBetween(gymId, dayStart, dayStart.plusSeconds(24 * 3600))
                .stream().map(this::toTodayResponse).toList();
    }

    private AttendanceRecordResponse toMemberResponse(Attendance record) {
        return new AttendanceRecordResponse(record.getId(), record.getCheckInAt(), record.getCheckOutAt(),
                record.getStatus().name());
    }

    private TodayVisitResponse toTodayResponse(Attendance record) {
        String memberName = "Unknown member";
        AppUser member = userRepository.findByIdAndGymId(record.getMemberId(), record.getGymId()).orElse(null);
        if (member != null) memberName = member.getName();
        return new TodayVisitResponse(record.getMemberId(), memberName, record.getCheckInAt(),
                record.getCheckOutAt(), record.getStatus().name());
    }

    private AppUser findOwnedMember(Long memberId, Long gymId) {
        return userRepository.findByIdAndGymId(memberId, gymId)
                .orElseThrow(() -> resourceNotFound(memberId));
    }

    private RuntimeException resourceNotFound(Long id) {
        return new ResourceNotFoundException("Attendance record " + id + " not found");
    }
}
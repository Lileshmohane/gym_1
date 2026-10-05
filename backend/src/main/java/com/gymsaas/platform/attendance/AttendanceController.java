package com.gymsaas.platform.attendance;

import com.gymsaas.platform.attendance.Attendance.AttendanceSource;
import com.gymsaas.platform.security.CustomUserDetails;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Member self-service check-in/check-out plus the staff "today" view.
 * These are exposed under /api/v1/attendance and mirror the PunchScreen
 * contract the React Native app already calls (hooks.ts: useCheckIn /
 * useCheckOut / useMyAttendance).
 */
@RestController
@RequestMapping("/api/v1/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/check-in")
    @PreAuthorize("hasRole('MEMBER')")
    public AttendanceService.AttendanceRecordResponse checkIn(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestBody(required = false) CheckInRequest request) {
        AttendanceSource source = request != null && request.source() != null
                ? request.source() : AttendanceSource.APP_BUTTON;
        return attendanceService.checkIn(principal.getUserId(), source);
    }

    @PostMapping("/{id}/check-out")
    @PreAuthorize("hasRole('MEMBER')")
    public AttendanceService.AttendanceRecordResponse checkOut(
            @AuthenticationPrincipal CustomUserDetails principal, @PathVariable Long id) {
        return attendanceService.checkOut(principal.getUserId(), id);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('MEMBER')")
    public List<AttendanceService.AttendanceRecordResponse> mine(
            @AuthenticationPrincipal CustomUserDetails principal) {
        return attendanceService.mine(principal.getUserId());
    }

    @GetMapping("/today")
    @PreAuthorize("hasAnyRole('GYM_OWNER','GYM_STAFF')")
    public List<AttendanceService.TodayVisitResponse> today() {
        return attendanceService.todayForGym();
    }

    public record CheckInRequest(AttendanceSource source) {}
}
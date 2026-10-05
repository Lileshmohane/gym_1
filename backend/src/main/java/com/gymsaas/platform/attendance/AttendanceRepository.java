package com.gymsaas.platform.attendance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.gymId = :gymId AND a.checkInAt BETWEEN :start AND :end")
    long countByGymIdAndCheckInAtBetween(@Param("gymId") Long gymId, @Param("start") Instant start, @Param("end") Instant end);

    @Query("SELECT a FROM Attendance a WHERE a.gymId = :gymId AND a.checkInAt BETWEEN :start AND :end ORDER BY a.checkInAt DESC")
    List<Attendance> findByGymIdAndCheckInAtBetween(@Param("gymId") Long gymId, @Param("start") Instant start, @Param("end") Instant end);

    List<Attendance> findAllByGymIdAndMemberIdOrderByCheckInAtDesc(Long gymId, Long memberId);

    List<Attendance> findAllByGymIdAndMemberIdAndStatus(Long gymId, Long memberId, Attendance.AttendanceStatus status);

    // Used by the super-admin hard-delete cascade (PlatformAdminService).
    @org.springframework.transaction.annotation.Transactional
    void deleteAllByGymId(Long gymId);
}

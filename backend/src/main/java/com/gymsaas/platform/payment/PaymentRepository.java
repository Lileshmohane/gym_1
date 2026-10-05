package com.gymsaas.platform.payment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.gymId = :gymId AND p.paymentDate BETWEEN :startDate AND :endDate AND p.status = 'COMPLETED'")
    BigDecimal sumCompletedBetween(@Param("gymId") Long gymId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    List<Payment> findAllByGymIdAndMemberIdOrderByPaymentDateDesc(Long gymId, Long memberId);

    List<Payment> findAllByGymIdAndStatusOrderByPaymentDateAsc(Long gymId, Payment.PaymentStatus status);

    Optional<Payment> findByIdAndGymId(Long id, Long gymId);

    // Used by the super-admin hard-delete cascade (PlatformAdminService).
    @org.springframework.transaction.annotation.Transactional
    void deleteAllByGymId(Long gymId);
}

package com.gymsaas.platform.gym;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GymRepository extends JpaRepository<Gym, Long> {
    Optional<Gym> findByEmail(String email);
    boolean existsByEmail(String email);
}

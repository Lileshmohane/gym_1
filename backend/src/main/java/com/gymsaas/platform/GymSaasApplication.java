package com.gymsaas.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // required for the nightly reminder scan + attendance auto-close jobs
@EnableJpaAuditing // populates BaseEntity.createdAt / updatedAt automatically
public class GymSaasApplication {
    public static void main(String[] args) {
        SpringApplication.run(GymSaasApplication.class, args);
    }
}

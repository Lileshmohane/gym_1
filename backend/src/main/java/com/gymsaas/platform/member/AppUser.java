package com.gymsaas.platform.member;

import com.gymsaas.platform.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;

// Maps to the `user` table (Database Schema Design Document, Section 3.2).
// Named AppUser to avoid clashing with Spring Security's own User type.
// gym_id is nullable ONLY for PLATFORM_ADMIN rows — enforced in AuthService,
// not at the DB column level, since a NOT NULL FK would block admin accounts.
@Entity
@Table(name = "\"user\"", uniqueConstraints = @UniqueConstraint(columnNames = {"gym_id", "email"}))
@Filter(name = "tenantFilter", condition = "gym_id = :gymId")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppUser extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gym_id")
    private Long gymId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(name = "has_photo", nullable = false)
    @Builder.Default
    private boolean hasPhoto = false;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    public enum UserStatus { ACTIVE, INACTIVE }
}

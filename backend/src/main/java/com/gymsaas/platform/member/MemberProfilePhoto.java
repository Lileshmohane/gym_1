package com.gymsaas.platform.member;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "member_profile_photo")
@Getter
@NoArgsConstructor
public class MemberProfilePhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false, unique = true)
    private Long memberId;

    @Column(name = "gym_id", nullable = false)
    private Long gymId;

    @Column(name = "photo_data", nullable = false, columnDefinition = "bytea")
    private byte[] data;

    @Column(name = "photo_content_type", nullable = false, length = 50)
    private String contentType;

    public MemberProfilePhoto(Long memberId, Long gymId, byte[] data, String contentType) {
        this.memberId = memberId;
        this.gymId = gymId;
        this.data = data;
        this.contentType = contentType;
    }

    // Replace the photo in place. Updating the existing row (rather than
    // delete-then-insert) avoids Hibernate's insert-before-delete flush order
    // tripping the unique constraint on member_id when a member re-uploads.
    public void update(byte[] data, String contentType) {
        this.data = data;
        this.contentType = contentType;
    }
}
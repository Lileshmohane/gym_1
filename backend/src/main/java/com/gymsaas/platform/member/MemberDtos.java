package com.gymsaas.platform.member;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class MemberDtos {

    public record CreateMemberRequest(
            @NotBlank String name,
            @NotBlank @Email String email,
            String phone
    ) {}

    public record UpdateMemberRequest(
            @NotBlank String name,
            String phone,
            AppUser.UserStatus status
    ) {}

    // Member self-service profile edit (PUT /members/me). Deliberately limited
    // to display fields: email is the login identifier and status is
    // admin-controlled, so neither is editable by the member themselves.
    public record SelfUpdateMemberRequest(
            @NotBlank String name,
            String phone
    ) {}

    public record MemberResponse(Long id, String name, String email, String phone, String status, boolean hasPhoto) {
        public static MemberResponse from(AppUser user) {
            return new MemberResponse(user.getId(), user.getName(), user.getEmail(), user.getPhone(), user.getStatus().name(), user.isHasPhoto());
        }
    }

    public record MemberPhotoContent(byte[] data, String contentType) {}

    // Returned ONLY from the create endpoint, once. There is no invite/email
    // flow implemented yet (not specified in the product docs either) — staff
    // currently has to relay this temporary password to the member directly.
    // Flagged in the README as a gap to close before real onboarding.
    public record CreateMemberResponse(MemberResponse member, String temporaryPassword) {}
}

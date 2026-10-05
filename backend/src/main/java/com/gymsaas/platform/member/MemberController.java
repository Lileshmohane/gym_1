package com.gymsaas.platform.member;

import com.gymsaas.platform.member.MemberDtos.*;
import com.gymsaas.platform.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/members")
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('GYM_OWNER','GYM_STAFF')")
    @ResponseStatus(HttpStatus.CREATED)
    public CreateMemberResponse create(@Valid @RequestBody CreateMemberRequest request) {
        return memberService.create(request);
    }

    // The photo is OPTIONAL here: owner/staff capture only the basics, and the
    // member fills in their own profile + photo afterwards (see /members/me/**).
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('GYM_OWNER','GYM_STAFF')")
    @ResponseStatus(HttpStatus.CREATED)
    public CreateMemberResponse createWithPhoto(
            @Valid @ModelAttribute CreateMemberRequest request,
            @RequestPart(value = "photo", required = false) MultipartFile photo) throws IOException {
        return memberService.createWithPhoto(request, photo == null ? null : photo.getBytes());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('GYM_OWNER','GYM_STAFF')")
    public Page<MemberResponse> list(Pageable pageable) {
        return memberService.list(pageable);
    }

    // ---- Member self-service (the member maintains their own profile) ----
    // The member id always comes from the JWT principal, never the path/body,
    // so a member can only ever read/edit their own record.

    // GET /api/v1/members/me — the signed-in member's own profile.
    @GetMapping("/me")
    @PreAuthorize("hasRole('MEMBER')")
    public MemberResponse me(@AuthenticationPrincipal CustomUserDetails principal) {
        return memberService.getSelf(principal.getUserId());
    }

    // PUT /api/v1/members/me — the member edits their own name/phone.
    @PutMapping("/me")
    @PreAuthorize("hasRole('MEMBER')")
    public MemberResponse updateMe(@AuthenticationPrincipal CustomUserDetails principal,
                                   @Valid @RequestBody SelfUpdateMemberRequest request) {
        return memberService.updateSelf(principal.getUserId(), request);
    }

    // GET /api/v1/members/me/photo — the member views their own photo.
    @GetMapping("/me/photo")
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<byte[]> myPhoto(@AuthenticationPrincipal CustomUserDetails principal) {
        MemberPhotoContent photo = memberService.getSelfPhoto(principal.getUserId());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(photo.contentType()))
                .header("Cache-Control", "private, no-cache")
                .body(photo.data());
    }

    // POST /api/v1/members/me/photo — upload/replace own photo (multipart).
    @PostMapping(value = "/me/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('MEMBER')")
    public MemberResponse uploadMyPhoto(@AuthenticationPrincipal CustomUserDetails principal,
                                        @RequestPart("photo") MultipartFile photo) throws IOException {
        return memberService.setSelfPhoto(principal.getUserId(), photo.getBytes());
    }

    // DELETE /api/v1/members/me/photo — remove own photo.
    @DeleteMapping("/me/photo")
    @PreAuthorize("hasRole('MEMBER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMyPhoto(@AuthenticationPrincipal CustomUserDetails principal) {
        memberService.removeSelfPhoto(principal.getUserId());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('GYM_OWNER','GYM_STAFF','MEMBER')")
    public MemberResponse get(@PathVariable Long id) {
        return memberService.get(id);
    }

    @GetMapping(value = "/{id}/photo")
    @PreAuthorize("hasAnyRole('GYM_OWNER','GYM_STAFF')")
    public ResponseEntity<byte[]> photo(@PathVariable Long id) {
        MemberPhotoContent photo = memberService.getPhoto(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(photo.contentType()))
                .header("Cache-Control", "private, no-cache")
                .body(photo.data());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('GYM_OWNER','GYM_STAFF')")
    public MemberResponse update(@PathVariable Long id, @Valid @RequestBody UpdateMemberRequest request) {
        return memberService.update(id, request);
    }

    // PUT /api/v1/members/{id}/status — "Mark member as Left" (see the
    // Technical Architecture Document's Member Offboarding & Deletion Flow).
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('GYM_OWNER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAsLeft(@PathVariable Long id) {
        memberService.markAsLeft(id);
    }

    // POST /api/v1/members/{id}/erase-data — the separate, explicitly
    // confirmed data-erasure action. Deliberately Owner-only (not Staff).
    @PostMapping("/{id}/erase-data")
    @PreAuthorize("hasAnyRole('GYM_OWNER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eraseData(@PathVariable Long id) {
        memberService.eraseMemberData(id);
    }
}

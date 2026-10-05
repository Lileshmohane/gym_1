package com.gymsaas.platform.member;

import com.gymsaas.platform.common.CrossTenantAccessException;
import com.gymsaas.platform.common.ResourceNotFoundException;
import com.gymsaas.platform.device.DeviceTokenRepository;
import com.gymsaas.platform.member.MemberDtos.*;
import com.gymsaas.platform.subscription.SubscriptionRepository;
import com.gymsaas.platform.subscription.Subscription;
import com.gymsaas.platform.tenant.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;

@Service
public class MemberService {

    private static final int MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024;

    private final AppUserRepository userRepository;
    private final MemberProfilePhotoRepository photoRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final DeviceTokenRepository deviceTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom random = new SecureRandom();

    public MemberService(AppUserRepository userRepository, MemberProfilePhotoRepository photoRepository,
                          SubscriptionRepository subscriptionRepository,
                          DeviceTokenRepository deviceTokenRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.photoRepository = photoRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.deviceTokenRepository = deviceTokenRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public CreateMemberResponse create(CreateMemberRequest request) {
        return createMember(request, null, null);
    }

    @Transactional
    public CreateMemberResponse createWithPhoto(CreateMemberRequest request, byte[] photoData) {
        // A photo is optional at creation: owner/staff capture only the basic
        // details, and the member uploads their own profile photo afterwards
        // (see setSelfPhoto / POST /members/me/photo). Only validate when one
        // was actually sent.
        if (photoData == null || photoData.length == 0) {
            return createMember(request, null, null);
        }
        ValidatedPhoto photo = validatePhoto(photoData);
        return createMember(request, photo.data(), photo.contentType());
    }

    private CreateMemberResponse createMember(CreateMemberRequest request, byte[] photoData, String photoContentType) {
        Long gymId = TenantContext.getGymId();
        String tempPassword = generateTempPassword();

        AppUser member = userRepository.save(AppUser.builder()
                .gymId(gymId)
                .name(request.name())
                .email(request.email())
                .phone(request.phone())
                .hasPhoto(photoData != null)
                .passwordHash(passwordEncoder.encode(tempPassword))
                .role(Role.MEMBER)
                .status(AppUser.UserStatus.ACTIVE)
                .build());

        if (photoData != null) {
            photoRepository.save(new MemberProfilePhoto(member.getId(), gymId, photoData, photoContentType));
        }

        return new CreateMemberResponse(MemberResponse.from(member), tempPassword);
    }

    // Hibernate's tenantFilter (enabled per-request by TenantFilter) already
    // restricts this to the caller's gym — findAllByGymIdAndRole is doubly
    // explicit about it for readability and defense-in-depth.
    @Transactional(readOnly = true)
    public Page<MemberResponse> list(Pageable pageable) {
        return userRepository.findAllByGymIdAndRole(TenantContext.getGymId(), Role.MEMBER, pageable)
                .map(MemberResponse::from);
    }

    @Transactional(readOnly = true)
    public MemberResponse get(Long memberId) {
        AppUser member = findOwnedMember(memberId);
        return MemberResponse.from(member);
    }

    @Transactional(readOnly = true)
    public MemberPhotoContent getPhoto(Long memberId) {
        AppUser member = findOwnedMember(memberId);
        if (member.getRole() != Role.MEMBER) {
            throw new ResourceNotFoundException("Member photo not found");
        }
        MemberProfilePhoto photo = photoRepository.findByMemberIdAndGymId(memberId, TenantContext.getGymId())
                .orElseThrow(() -> new ResourceNotFoundException("Member photo not found"));
        return new MemberPhotoContent(photo.getData(), photo.getContentType());
    }

    @Transactional
    public MemberResponse update(Long memberId, UpdateMemberRequest request) {
        AppUser member = findOwnedMember(memberId);
        member.setName(request.name());
        member.setPhone(request.phone());
        if (request.status() != null) member.setStatus(request.status());
        return MemberResponse.from(userRepository.save(member));
    }

    // ---- Member self-service profile ----
    // The authenticated caller is always acting on their own account, so the
    // member id comes from the JWT (principal.getUserId()) — never from a
    // path/body. findSelfMember still enforces tenant ownership + MEMBER role.

    @Transactional(readOnly = true)
    public MemberResponse getSelf(Long memberId) {
        return MemberResponse.from(findSelfMember(memberId));
    }

    @Transactional
    public MemberResponse updateSelf(Long memberId, SelfUpdateMemberRequest request) {
        AppUser member = findSelfMember(memberId);
        member.setName(request.name());
        member.setPhone(request.phone());
        return MemberResponse.from(userRepository.save(member));
    }

    @Transactional
    public MemberResponse setSelfPhoto(Long memberId, byte[] photoData) {
        AppUser member = findSelfMember(memberId);
        ValidatedPhoto photo = validatePhoto(photoData);
        Long gymId = TenantContext.getGymId();
        // Replace any existing photo in place (member_id is unique) — see
        // MemberProfilePhoto#update for why this isn't delete-then-insert.
        photoRepository.findByMemberIdAndGymId(memberId, gymId).ifPresentOrElse(
                existing -> {
                    existing.update(photo.data(), photo.contentType());
                    photoRepository.save(existing);
                },
                () -> photoRepository.save(new MemberProfilePhoto(memberId, gymId, photo.data(), photo.contentType())));
        member.setHasPhoto(true);
        return MemberResponse.from(userRepository.save(member));
    }

    @Transactional(readOnly = true)
    public MemberPhotoContent getSelfPhoto(Long memberId) {
        findSelfMember(memberId);
        return photoRepository.findByMemberIdAndGymId(memberId, TenantContext.getGymId())
                .map(photo -> new MemberPhotoContent(photo.getData(), photo.getContentType()))
                .orElseThrow(() -> new ResourceNotFoundException("Member photo not found"));
    }

    @Transactional
    public void removeSelfPhoto(Long memberId) {
        AppUser member = findSelfMember(memberId);
        photoRepository.findByMemberIdAndGymId(memberId, TenantContext.getGymId())
                .ifPresent(photoRepository::delete);
        member.setHasPhoto(false);
        userRepository.save(member);
    }

    private AppUser findSelfMember(Long memberId) {
        AppUser member = findOwnedMember(memberId);
        if (member.getRole() != Role.MEMBER) {
            throw new ResourceNotFoundException("Member not found");
        }
        return member;
    }

    /**
     * "Mark as Left" — the fast, default offboarding path (Technical
     * Architecture Document, Section 9). Deactivates login, cancels any
     * active subscription, and removes push tokens immediately. Does NOT
     * touch attendance/payment/audit history — see eraseMemberData() for the
     * separate, explicit action that does.
     */
    @Transactional
    public void markAsLeft(Long memberId) {
        AppUser member = findOwnedMember(memberId);
        member.setStatus(AppUser.UserStatus.INACTIVE);
        userRepository.save(member);

        subscriptionRepository.findAllByGymIdAndMemberIdAndStatus(
                TenantContext.getGymId(), memberId, Subscription.SubscriptionStatus.ACTIVE
        ).forEach(sub -> {
            sub.setStatus(Subscription.SubscriptionStatus.CANCELLED);
            subscriptionRepository.save(sub);
        });

        deviceTokenRepository.deleteAllByGymIdAndUserId(TenantContext.getGymId(), memberId);
    }

    /**
     * The separate, explicitly-confirmed "erase personal data" action —
     * anonymizes the member row but deliberately leaves payment/attendance
     * history intact and still linked by id, so gym financial reports stay
     * consistent (Technical Architecture Document, Section 9).
     */
    @Transactional
    public void eraseMemberData(Long memberId) {
        AppUser member = findOwnedMember(memberId);
        member.setName("Deleted Member");
        member.setEmail("deleted-" + member.getId() + "@erased.invalid");
        member.setPhone(null);
        member.setPasswordHash(passwordEncoder.encode(generateTempPassword())); // invalidate credentials
        member.setStatus(AppUser.UserStatus.INACTIVE);
        userRepository.save(member);
    }

    private AppUser findOwnedMember(Long memberId) {
        // findByIdAndGymId double-checks tenant ownership explicitly, on top
        // of the Hibernate filter, so a bug that accidentally used
        // findById(id) elsewhere in this class would still be caught here —
        // this is the "automated cross-tenant tests as a release gate" pattern
        // from the Technical Architecture Document, Section 4.1.
        return userRepository.findByIdAndGymId(memberId, TenantContext.getGymId())
                .orElseThrow(() -> {
                    boolean existsAtAll = userRepository.findById(memberId).isPresent();
                    if (existsAtAll) {
                        // Exists, but in a different gym — this is the exact
                        // condition the isolation test suite checks for.
                        return new CrossTenantAccessException("Member " + memberId + " does not belong to this gym");
                    }
                    return new ResourceNotFoundException("Member not found");
                });
    }

    private String generateTempPassword() {
        byte[] bytes = new byte[12];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private ValidatedPhoto validatePhoto(byte[] photoData) {
        if (photoData == null || photoData.length == 0) {
            throw new IllegalArgumentException("A profile photo is required.");
        }
        if (photoData.length > MAX_PHOTO_SIZE_BYTES) {
            throw new IllegalArgumentException("Profile photos must be 2 MB or smaller.");
        }
        boolean jpeg = photoData.length >= 3
                && (photoData[0] & 0xff) == 0xff
                && (photoData[1] & 0xff) == 0xd8
                && (photoData[2] & 0xff) == 0xff;
        boolean png = photoData.length >= 8
                && (photoData[0] & 0xff) == 0x89
                && photoData[1] == 0x50 && photoData[2] == 0x4e && photoData[3] == 0x47
                && photoData[4] == 0x0d && photoData[5] == 0x0a
                && photoData[6] == 0x1a && photoData[7] == 0x0a;
        boolean webp = photoData.length >= 12
                && photoData[0] == 'R' && photoData[1] == 'I' && photoData[2] == 'F' && photoData[3] == 'F'
                && photoData[8] == 'W' && photoData[9] == 'E' && photoData[10] == 'B' && photoData[11] == 'P';
        if (!jpeg && !png && !webp) {
            throw new IllegalArgumentException("Profile photo must be a JPEG, PNG, or WebP image.");
        }
        String contentType = jpeg ? "image/jpeg" : png ? "image/png" : "image/webp";
        return new ValidatedPhoto(photoData, contentType);
    }

    private record ValidatedPhoto(byte[] data, String contentType) {}
}

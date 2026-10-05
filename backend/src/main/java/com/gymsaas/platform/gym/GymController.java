package com.gymsaas.platform.gym;

import com.gymsaas.platform.common.ResourceNotFoundException;
import com.gymsaas.platform.security.CustomUserDetails;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/gym")
public class GymController {

    private final GymRepository gymRepository;

    public GymController(GymRepository gymRepository) {
        this.gymRepository = gymRepository;
    }

    // GET /api/v1/gym/profile — Owner/Admin only, per the API Design table.
    @GetMapping("/profile")
    @PreAuthorize("hasAnyRole('GYM_OWNER','GYM_STAFF','MEMBER')")
    public GymDtos.GymProfileResponse getProfile(@AuthenticationPrincipal CustomUserDetails principal) {
        Gym gym = gymRepository.findById(principal.getGymId())
                .orElseThrow(() -> new ResourceNotFoundException("Gym not found"));
        return GymDtos.GymProfileResponse.from(gym);
    }
}

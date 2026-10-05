package com.gymsaas.platform.billing;

import com.gymsaas.platform.billing.PlatformAdminDtos.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Super-admin endpoints. The SecurityConfig already locks the whole
 * /api/v1/admin/** prefix to PLATFORM_ADMIN, so only the single super admin
 * (created backend-side by PlatformAdminBootstrap) can reach these.
 */
@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('PLATFORM_ADMIN')")
public class PlatformAdminController {

    private final PlatformAdminService platformAdminService;

    public PlatformAdminController(PlatformAdminService platformAdminService) {
        this.platformAdminService = platformAdminService;
    }

    @GetMapping("/gyms")
    public List<GymAdminResponse> listGyms() {
        return platformAdminService.listGyms();
    }

    // Self-registration requests awaiting (or denied) super-admin review.
    @GetMapping("/registrations")
    public List<GymAdminResponse> listRegistrations() {
        return platformAdminService.listRegistrations();
    }

    @PostMapping("/registrations/{id}/approve")
    public GymAdminResponse approveRegistration(@PathVariable Long id) {
        return platformAdminService.approveRegistration(id);
    }

    @PostMapping("/registrations/{id}/reject")
    public GymAdminResponse rejectRegistration(@PathVariable Long id,
                                               @RequestBody(required = false) RejectRequest request) {
        return platformAdminService.rejectRegistration(id, request == null ? null : request.note());
    }

    @PostMapping("/gyms")
    @ResponseStatus(HttpStatus.CREATED)
    public GymAdminResponse createGym(@Valid @RequestBody CreateGymRequest request) {
        return platformAdminService.createGym(request);
    }

    @PutMapping("/gyms/{id}")
    public GymAdminResponse updateGym(@PathVariable Long id, @Valid @RequestBody UpdateGymRequest request) {
        return platformAdminService.updateGym(id, request);
    }

    @DeleteMapping("/gyms/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteGym(@PathVariable Long id) {
        platformAdminService.deleteGym(id);
    }

    @PutMapping("/gyms/{id}/status")
    public GymAdminResponse setStatus(@PathVariable Long id, @Valid @RequestBody SetStatusRequest request) {
        return platformAdminService.setGymStatus(id, request.status());
    }

    @PutMapping("/gyms/{id}/fee")
    public GymAdminResponse setFee(@PathVariable Long id, @Valid @RequestBody SetFeeRequest request) {
        return platformAdminService.setGymFee(id, request.amount());
    }

    @PostMapping("/gyms/{id}/charge")
    public GymAdminResponse charge(@PathVariable Long id) {
        return platformAdminService.chargeGym(id);
    }

    @GetMapping("/dashboard")
    public PlatformDashboardResponse dashboard() {
        return platformAdminService.dashboard();
    }
}
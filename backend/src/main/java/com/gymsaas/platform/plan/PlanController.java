package com.gymsaas.platform.plan;

import com.gymsaas.platform.plan.PlanDtos.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/plans")
public class PlanController {

    private final PlanService planService;

    public PlanController(PlanService planService) {
        this.planService = planService;
    }

    @PostMapping
    @PreAuthorize("hasRole('GYM_OWNER')")
    @ResponseStatus(HttpStatus.CREATED)
    public PlanResponse create(@Valid @RequestBody CreatePlanRequest request) {
        return planService.create(request);
    }

    @GetMapping
    public List<PlanResponse> list() {
        return planService.listActive();
    }
}

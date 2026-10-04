package com.volunteerportal.controller;

import com.volunteerportal.dto.OpportunityRequest;
import com.volunteerportal.dto.OpportunityResponse;
import com.volunteerportal.entity.Category;
import com.volunteerportal.entity.Opportunity;
import com.volunteerportal.entity.OrganizationProfile;
import com.volunteerportal.service.CategoryService;
import com.volunteerportal.service.OpportunityService;
import com.volunteerportal.service.OrganizationProfileService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/opportunities")
public class OpportunityController {

    private final OpportunityService opportunityService;
    private final OrganizationProfileService organizationProfileService;
    private final CategoryService categoryService;

    public OpportunityController(
            OpportunityService opportunityService,
            OrganizationProfileService organizationProfileService,
            CategoryService categoryService) {

        this.opportunityService = opportunityService;
        this.organizationProfileService = organizationProfileService;
        this.categoryService = categoryService;
    }

    // ---------------------------------------------------------
    // GET ALL OPPORTUNITIES
    // ---------------------------------------------------------

    // Volunteers, Organizations and Admins can view opportunities.
    @GetMapping
    public ResponseEntity<List<OpportunityResponse>> getAll() {

        List<OpportunityResponse> responses =
                opportunityService.findAll()
                        .stream()
                        .map(this::toResponse)
                        .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    // ---------------------------------------------------------
    // GET OPPORTUNITY BY ID
    // ---------------------------------------------------------

    // Volunteers, Organizations and Admins can view an opportunity.
    @GetMapping("/{id}")
    public ResponseEntity<OpportunityResponse> getById(
            @PathVariable Long id) {

        Opportunity opportunity =
                opportunityService.findById(id);

        return ResponseEntity.ok(toResponse(opportunity));
    }

    // ---------------------------------------------------------
    // CREATE OPPORTUNITY
    // ---------------------------------------------------------

    // Only ORGANIZATION and ADMIN can create opportunities.
    @PostMapping
    @PreAuthorize("hasAnyRole('ORGANIZATION', 'ADMIN')")
    public ResponseEntity<OpportunityResponse> create(
            @RequestBody OpportunityRequest request,
            Authentication authentication) {

        OrganizationProfile organization =
                organizationProfileService.findById(
                        request.getOrganizationId()
                );

        // ADMIN can create an opportunity for any organization.
        if (!isAdmin(authentication)) {

            // ORGANIZATION can create an opportunity only
            // for its own organization profile.
            verifyOrganizationOwnership(
                    organization,
                    authentication
            );
        }

        Opportunity opportunity =
                toEntity(request, organization);

        Opportunity saved =
                opportunityService.save(opportunity);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(toResponse(saved));
    }

    // ---------------------------------------------------------
    // UPDATE OPPORTUNITY
    // ---------------------------------------------------------

    // Only ORGANIZATION and ADMIN can update opportunities.
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORGANIZATION', 'ADMIN')")
    public ResponseEntity<OpportunityResponse> update(
            @PathVariable Long id,
            @RequestBody OpportunityRequest request,
            Authentication authentication) {

        // First find the existing opportunity.
        Opportunity existing =
                opportunityService.findById(id);

        // ADMIN can update any opportunity.
        if (!isAdmin(authentication)) {

            // ORGANIZATION can update only its own opportunity.
            verifyOrganizationOwnership(
                    existing.getOrganization(),
                    authentication
            );
        }

        // Resolve the organization supplied in the request.
        OrganizationProfile organization =
                organizationProfileService.findById(
                        request.getOrganizationId()
                );

        // Prevent an organization from changing the
        // opportunity ownership to another organization.
        if (!isAdmin(authentication)) {

            verifyOrganizationOwnership(
                    organization,
                    authentication
            );
        }

        Opportunity opportunity =
                toEntity(request, organization);

        Opportunity updated =
                opportunityService.update(id, opportunity);

        return ResponseEntity.ok(toResponse(updated));
    }

    // ---------------------------------------------------------
    // DELETE OPPORTUNITY
    // ---------------------------------------------------------

    // Only ORGANIZATION and ADMIN can delete opportunities.
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORGANIZATION', 'ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            Authentication authentication) {

        Opportunity opportunity =
                opportunityService.findById(id);

        // ADMIN can delete any opportunity.
        if (!isAdmin(authentication)) {

            // ORGANIZATION can delete only its own opportunity.
            verifyOrganizationOwnership(
                    opportunity.getOrganization(),
                    authentication
            );
        }

        opportunityService.deleteById(id);

        return ResponseEntity.noContent().build();
    }

    // ---------------------------------------------------------
    // AUTHORIZATION HELPERS
    // ---------------------------------------------------------

    /**
     * Checks whether the currently authenticated user
     * has the ADMIN role.
     */
    private boolean isAdmin(Authentication authentication) {

        return authentication.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);
    }

    /**
     * Verifies that an organization profile belongs
     * to the currently authenticated organization user.
     */
    private void verifyOrganizationOwnership(
            OrganizationProfile organization,
            Authentication authentication) {

        if (organization == null
                || organization.getUser() == null
                || organization.getUser().getEmail() == null) {

            throw new AccessDeniedException(
                    "Organization ownership could not be verified"
            );
        }

        String loggedInEmail =
                authentication.getName();

        String organizationOwnerEmail =
                organization.getUser().getEmail();

        if (!loggedInEmail.equalsIgnoreCase(
                organizationOwnerEmail)) {

            throw new AccessDeniedException(
                    "You are not allowed to manage this organization's opportunity"
            );
        }
    }

    // ---------------------------------------------------------
    // DTO -> ENTITY
    // ---------------------------------------------------------

    private Opportunity toEntity(
            OpportunityRequest request,
            OrganizationProfile organization) {

        Category category = null;

        // category_id is nullable.
        if (request.getCategoryId() != null) {

            category =
                    categoryService.findById(
                            request.getCategoryId()
                    );
        }

        Opportunity opportunity =
                new Opportunity();

        opportunity.setOrganization(organization);
        opportunity.setCategory(category);
        opportunity.setTitle(request.getTitle());
        opportunity.setDescription(request.getDescription());
        opportunity.setLocation(request.getLocation());
        opportunity.setStartDate(request.getStartDate());
        opportunity.setEndDate(request.getEndDate());
        opportunity.setRequiredVolunteers(
                request.getRequiredVolunteers()
        );
        opportunity.setStatus(request.getStatus());

        return opportunity;
    }

    // ---------------------------------------------------------
    // ENTITY -> DTO
    // ---------------------------------------------------------

    private OpportunityResponse toResponse(
            Opportunity opportunity) {

        Long organizationId =
                opportunity.getOrganization() != null
                        ? opportunity.getOrganization().getId()
                        : null;

        Long categoryId =
                opportunity.getCategory() != null
                        ? opportunity.getCategory().getId()
                        : null;

        return new OpportunityResponse(
                opportunity.getId(),
                organizationId,
                categoryId,
                opportunity.getTitle(),
                opportunity.getDescription(),
                opportunity.getLocation(),
                opportunity.getStartDate(),
                opportunity.getEndDate(),
                opportunity.getRequiredVolunteers(),
                opportunity.getStatus(),
                opportunity.getCreatedAt()
        );
    }
}
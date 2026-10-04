package com.volunteerportal.controller;

import com.volunteerportal.dto.ApplicationRequest;
import com.volunteerportal.dto.ApplicationResponse;
import com.volunteerportal.entity.Application;
import com.volunteerportal.entity.Opportunity;
import com.volunteerportal.entity.OrganizationProfile;
import com.volunteerportal.entity.VolunteerProfile;
import com.volunteerportal.service.ApplicationService;
import com.volunteerportal.service.OpportunityService;
import com.volunteerportal.service.VolunteerProfileService;

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
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;
    private final VolunteerProfileService volunteerProfileService;
    private final OpportunityService opportunityService;

    public ApplicationController(
            ApplicationService applicationService,
            VolunteerProfileService volunteerProfileService,
            OpportunityService opportunityService) {

        this.applicationService = applicationService;
        this.volunteerProfileService = volunteerProfileService;
        this.opportunityService = opportunityService;
    }

    // ---------------------------------------------------------
    // GET ALL APPLICATIONS
    // ---------------------------------------------------------

    /**
     * ADMIN can see all applications.
     * ORGANIZATION can see applications for its own opportunities.
     * VOLUNTEER can see only their own applications.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('VOLUNTEER', 'ORGANIZATION', 'ADMIN')")
    public ResponseEntity<List<ApplicationResponse>> getAll(
            Authentication authentication) {

        List<Application> applications =
                applicationService.findAll();

        // ADMIN can see everything.
        if (isAdmin(authentication)) {

            return ResponseEntity.ok(
                    applications.stream()
                            .map(this::toResponse)
                            .collect(Collectors.toList())
            );
        }

        // VOLUNTEER can see only their own applications.
        if (hasRole(authentication, "ROLE_VOLUNTEER")) {

            List<ApplicationResponse> responses =
                    applications.stream()
                            .filter(application ->
                                    isOwnedByVolunteer(
                                            application,
                                            authentication
                                    )
                            )
                            .map(this::toResponse)
                            .collect(Collectors.toList());

            return ResponseEntity.ok(responses);
        }

        // ORGANIZATION can see applications belonging
        // to opportunities owned by that organization.
        List<ApplicationResponse> responses =
                applications.stream()
                        .filter(application ->
                                isOwnedByOrganization(
                                        application,
                                        authentication
                                )
                        )
                        .map(this::toResponse)
                        .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    // ---------------------------------------------------------
    // GET APPLICATION BY ID
    // ---------------------------------------------------------

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('VOLUNTEER', 'ORGANIZATION', 'ADMIN')")
    public ResponseEntity<ApplicationResponse> getById(
            @PathVariable Long id,
            Authentication authentication) {

        Application application =
                applicationService.findById(id);

        verifyApplicationAccess(
                application,
                authentication
        );

        return ResponseEntity.ok(
                toResponse(application)
        );
    }

    // ---------------------------------------------------------
    // CREATE APPLICATION
    // ---------------------------------------------------------

    /**
     * Only VOLUNTEER can create an application.
     *
     * The volunteerId must belong to the logged-in volunteer.
     */
    @PostMapping
    @PreAuthorize("hasRole('VOLUNTEER')")
    public ResponseEntity<ApplicationResponse> create(
            @RequestBody ApplicationRequest request,
            Authentication authentication) {

        VolunteerProfile volunteer =
                volunteerProfileService.findById(
                        request.getVolunteerId()
                );

        // Prevent one volunteer from applying
        // on behalf of another volunteer.
        verifyVolunteerOwnership(
                volunteer,
                authentication
        );

        Opportunity opportunity =
                opportunityService.findById(
                        request.getOpportunityId()
                );

        Application application =
                new Application();

        application.setVolunteer(volunteer);
        application.setOpportunity(opportunity);

        // New applications should start as PENDING.
        // We intentionally don't trust the client to
        // choose an arbitrary status.
        application.setStatus(
                com.volunteerportal.entity.ApplicationStatus.PENDING
        );

        Application saved =
                applicationService.save(application);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(toResponse(saved));
    }

    // ---------------------------------------------------------
    // UPDATE APPLICATION
    // ---------------------------------------------------------

    /**
     * VOLUNTEER can modify their own application.
     * ORGANIZATION can modify applications for
     * opportunities owned by that organization.
     * ADMIN can modify any application.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('VOLUNTEER', 'ORGANIZATION', 'ADMIN')")
    public ResponseEntity<ApplicationResponse> update(
            @PathVariable Long id,
            @RequestBody ApplicationRequest request,
            Authentication authentication) {

        Application existing =
                applicationService.findById(id);

        verifyApplicationAccess(
                existing,
                authentication
        );

        VolunteerProfile volunteer =
                volunteerProfileService.findById(
                        request.getVolunteerId()
                );

        Opportunity opportunity =
                opportunityService.findById(
                        request.getOpportunityId()
                );

        // A volunteer cannot move an application
        // to another volunteer.
        if (hasRole(authentication, "ROLE_VOLUNTEER")) {

            verifyVolunteerOwnership(
                    volunteer,
                    authentication
            );

            // A volunteer should also not be able
            // to change the opportunity through update.
            if (!existing.getOpportunity()
                    .getId()
                    .equals(opportunity.getId())) {

                throw new AccessDeniedException(
                        "Volunteers cannot change the opportunity of an application"
                );
            }
        }

        // Organization must only manage applications
        // for its own opportunities.
        if (hasRole(authentication, "ROLE_ORGANIZATION")) {

            verifyOrganizationOwnership(
                    opportunity,
                    authentication
            );
        }

        Application application =
                new Application();

        application.setVolunteer(volunteer);
        application.setOpportunity(opportunity);

        // ADMIN/ORGANIZATION can update the status.
        // Volunteer status changes are handled separately.
        if (hasRole(authentication, "ROLE_VOLUNTEER")) {

            /*
             * Volunteers cannot approve/reject/complete their own
             * application. They may only cancel an application
             * that is currently pending or approved.
             */
            if (request.getStatus()
                    == com.volunteerportal.entity.ApplicationStatus.CANCELLED) {

                application.setStatus(
                        com.volunteerportal.entity.ApplicationStatus.CANCELLED
                );

            } else {

                application.setStatus(
                        existing.getStatus()
                );
            }

        } else {

            application.setStatus(
                    request.getStatus()
            );
        }

        Application updated =
                applicationService.update(
                        id,
                        application
                );

        return ResponseEntity.ok(
                toResponse(updated)
        );
    }

    // ---------------------------------------------------------
    // DELETE APPLICATION
    // ---------------------------------------------------------

    /**
     * VOLUNTEER can delete their own application.
     * ORGANIZATION can delete applications for
     * their own opportunities.
     * ADMIN can delete any application.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('VOLUNTEER', 'ORGANIZATION', 'ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            Authentication authentication) {

        Application application =
                applicationService.findById(id);

        verifyApplicationAccess(
                application,
                authentication
        );

        applicationService.deleteById(id);

        return ResponseEntity.noContent().build();
    }

    // ---------------------------------------------------------
    // ACCESS CONTROL HELPERS
    // ---------------------------------------------------------

    /**
     * Verifies that the current user is allowed
     * to access the application.
     */
    private void verifyApplicationAccess(
            Application application,
            Authentication authentication) {

        // ADMIN has complete access.
        if (isAdmin(authentication)) {
            return;
        }

        // VOLUNTEER owns the application.
        if (hasRole(authentication, "ROLE_VOLUNTEER")) {

            if (!isOwnedByVolunteer(
                    application,
                    authentication)) {

                throw new AccessDeniedException(
                        "You are not allowed to access this application"
                );
            }

            return;
        }

        // ORGANIZATION owns the opportunity.
        if (hasRole(authentication, "ROLE_ORGANIZATION")) {

            if (!isOwnedByOrganization(
                    application,
                    authentication)) {

                throw new AccessDeniedException(
                        "You are not allowed to access this application"
                );
            }

            return;
        }

        throw new AccessDeniedException(
                "You are not allowed to access this application"
        );
    }

    /**
     * Checks whether an application belongs
     * to the logged-in volunteer.
     */
    private boolean isOwnedByVolunteer(
            Application application,
            Authentication authentication) {

        if (application.getVolunteer() == null
                || application.getVolunteer().getUser() == null) {

            return false;
        }

        String ownerEmail =
                application.getVolunteer()
                        .getUser()
                        .getEmail();

        return ownerEmail != null
                && ownerEmail.equalsIgnoreCase(
                        authentication.getName()
                );
    }

    /**
     * Checks whether the opportunity associated
     * with the application belongs to the logged-in organization.
     */
    private boolean isOwnedByOrganization(
            Application application,
            Authentication authentication) {

        if (application.getOpportunity() == null
                || application.getOpportunity()
                        .getOrganization() == null
                || application.getOpportunity()
                        .getOrganization()
                        .getUser() == null) {

            return false;
        }

        String ownerEmail =
                application.getOpportunity()
                        .getOrganization()
                        .getUser()
                        .getEmail();

        return ownerEmail != null
                && ownerEmail.equalsIgnoreCase(
                        authentication.getName()
                );
    }

    /**
     * Verifies that the volunteer profile belongs
     * to the currently logged-in user.
     */
    private void verifyVolunteerOwnership(
            VolunteerProfile volunteer,
            Authentication authentication) {

        if (volunteer == null
                || volunteer.getUser() == null
                || volunteer.getUser().getEmail() == null) {

            throw new AccessDeniedException(
                    "Volunteer ownership could not be verified"
            );
        }

        String ownerEmail =
                volunteer.getUser().getEmail();

        if (!ownerEmail.equalsIgnoreCase(
                authentication.getName())) {

            throw new AccessDeniedException(
                    "You cannot create or manage an application for another volunteer"
            );
        }
    }

    /**
     * Verifies that the opportunity belongs
     * to the currently logged-in organization.
     */
    private void verifyOrganizationOwnership(
            Opportunity opportunity,
            Authentication authentication) {

        if (opportunity == null
                || opportunity.getOrganization() == null
                || opportunity.getOrganization().getUser() == null
                || opportunity.getOrganization().getUser().getEmail() == null) {

            throw new AccessDeniedException(
                    "Organization ownership could not be verified"
            );
        }

        String ownerEmail =
                opportunity.getOrganization()
                        .getUser()
                        .getEmail();

        if (!ownerEmail.equalsIgnoreCase(
                authentication.getName())) {

            throw new AccessDeniedException(
                    "You cannot manage applications for another organization's opportunity"
            );
        }
    }

    /**
     * Checks whether the authenticated user has a specific role.
     */
    private boolean hasRole(
            Authentication authentication,
            String role) {

        return authentication.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role::equals);
    }

    /**
     * Checks whether the authenticated user is ADMIN.
     */
    private boolean isAdmin(
            Authentication authentication) {

        return hasRole(
                authentication,
                "ROLE_ADMIN"
        );
    }

    // ---------------------------------------------------------
    // ENTITY -> DTO
    // ---------------------------------------------------------

    private ApplicationResponse toResponse(
            Application application) {

        Long volunteerId =
                application.getVolunteer() != null
                        ? application.getVolunteer().getId()
                        : null;

        Long opportunityId =
                application.getOpportunity() != null
                        ? application.getOpportunity().getId()
                        : null;

        return new ApplicationResponse(
                application.getId(),
                volunteerId,
                opportunityId,
                application.getStatus(),
                application.getAppliedAt()
        );
    }
}
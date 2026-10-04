package com.volunteerportal.controller;

import com.volunteerportal.dto.OrganizationProfileRequest;
import com.volunteerportal.dto.OrganizationProfileResponse;
import com.volunteerportal.entity.OrganizationProfile;
import com.volunteerportal.entity.User;
import com.volunteerportal.entity.VerificationStatus;
import com.volunteerportal.service.OrganizationProfileService;
import com.volunteerportal.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/organization-profiles")
public class OrganizationProfileController {

    private final OrganizationProfileService organizationProfileService;
    private final UserService userService;

    public OrganizationProfileController(
            OrganizationProfileService organizationProfileService,
            UserService userService) {

        this.organizationProfileService = organizationProfileService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<OrganizationProfileResponse>> getAll(
            Authentication authentication) {

        if (!isAdmin(authentication)
                && !hasRole(authentication, "ORGANIZATION")
                && !hasRole(authentication, "VOLUNTEER")) {

            throw new AccessDeniedException(
                    "You are not allowed to access organization profiles"
            );
        }

        List<OrganizationProfileResponse> responses =
                organizationProfileService.findAll()
                        .stream()
                        .map(this::toResponse)
                        .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrganizationProfileResponse> getById(
            @PathVariable Long id,
            Authentication authentication) {

        if (!isAdmin(authentication)
                && !hasRole(authentication, "ORGANIZATION")
                && !hasRole(authentication, "VOLUNTEER")) {

            throw new AccessDeniedException(
                    "You are not allowed to access organization profiles"
            );
        }

        OrganizationProfile profile =
                organizationProfileService.findById(id);

        return ResponseEntity.ok(toResponse(profile));
    }

    @PostMapping
    @PreAuthorize("hasRole('ORGANIZATION')")
    public ResponseEntity<OrganizationProfileResponse> create(
            @RequestBody OrganizationProfileRequest request,
            Authentication authentication) {

        User user =
                userService.findById(request.getUserId());

        verifyUserOwnership(
                user,
                authentication
        );

        OrganizationProfile profile =
                toEntity(
                        request,
                        user
                );

        OrganizationProfile saved =
                organizationProfileService.save(
                        profile
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(toResponse(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORGANIZATION', 'ADMIN')")
    public ResponseEntity<OrganizationProfileResponse> update(
            @PathVariable Long id,
            @RequestBody OrganizationProfileRequest request,
            Authentication authentication) {

        OrganizationProfile existing =
                organizationProfileService.findById(id);

        if (!isAdmin(authentication)) {
            verifyProfileOwnership(
                    existing,
                    authentication
            );
        }

        User user =
                userService.findById(
                        request.getUserId()
                );

        if (!isAdmin(authentication)) {
            verifyUserOwnership(
                    user,
                    authentication
            );
        }

        OrganizationProfile profile =
                toEntity(
                        request,
                        user
                );

        OrganizationProfile updated =
                organizationProfileService.update(
                        id,
                        profile
                );

        return ResponseEntity.ok(
                toResponse(updated)
        );
    }

    /**
     * Allows an administrator to verify or reject
     * an organization profile.
     *
     * Normal organizations cannot access this endpoint.
     */
    @PutMapping("/{id}/verification-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OrganizationProfileResponse>
    updateVerificationStatus(
            @PathVariable Long id,
            @RequestParam VerificationStatus status) {

        OrganizationProfile updated =
                organizationProfileService
                        .updateVerificationStatus(
                                id,
                                status
                        );

        return ResponseEntity.ok(
                toResponse(updated)
        );
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORGANIZATION', 'ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            Authentication authentication) {

        OrganizationProfile profile =
                organizationProfileService.findById(id);

        if (!isAdmin(authentication)) {
            verifyProfileOwnership(
                    profile,
                    authentication
            );
        }

        organizationProfileService.deleteById(id);

        return ResponseEntity
                .noContent()
                .build();
    }

    // ---------------------------------------------------------
    // Security / ownership helpers
    // ---------------------------------------------------------

    private void verifyProfileOwnership(
            OrganizationProfile profile,
            Authentication authentication) {

        if (!isOwnedByOrganization(
                profile,
                authentication)) {

            throw new AccessDeniedException(
                    "You are not allowed to manage this organization profile"
            );
        }
    }

    private boolean isOwnedByOrganization(
            OrganizationProfile profile,
            Authentication authentication) {

        if (profile == null
                || profile.getUser() == null
                || profile.getUser().getEmail() == null) {

            return false;
        }

        String loggedInEmail =
                authentication.getName();

        String profileOwnerEmail =
                profile.getUser().getEmail();

        return loggedInEmail.equalsIgnoreCase(
                profileOwnerEmail
        );
    }

    private void verifyUserOwnership(
            User user,
            Authentication authentication) {

        if (user == null
                || user.getEmail() == null
                || !authentication.getName()
                        .equalsIgnoreCase(
                                user.getEmail())) {

            throw new AccessDeniedException(
                    "You can only manage your own organization profile"
            );
        }
    }

    private boolean isAdmin(
            Authentication authentication) {

        return hasRole(
                authentication,
                "ADMIN"
        );
    }

    private boolean hasRole(
            Authentication authentication,
            String role) {

        return authentication.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(
                        ("ROLE_" + role)::equals
                );
    }

    // ---------------------------------------------------------
    // DTO -> Entity
    // ---------------------------------------------------------

    private OrganizationProfile toEntity(
            OrganizationProfileRequest request,
            User user) {

        OrganizationProfile profile =
                new OrganizationProfile();

        profile.setUser(user);

        profile.setOrganizationName(
                request.getOrganizationName()
        );

        profile.setDescription(
                request.getDescription()
        );

        profile.setAddress(
                request.getAddress()
        );

        profile.setWebsite(
                request.getWebsite()
        );

        profile.setContactEmail(
                request.getContactEmail()
        );

        return profile;
    }

    // ---------------------------------------------------------
    // Entity -> DTO
    // ---------------------------------------------------------

    private OrganizationProfileResponse toResponse(
            OrganizationProfile profile) {

        Long userId =
                profile.getUser() != null
                        ? profile.getUser().getId()
                        : null;

        return new OrganizationProfileResponse(
                profile.getId(),
                userId,
                profile.getOrganizationName(),
                profile.getDescription(),
                profile.getAddress(),
                profile.getWebsite(),
                profile.getContactEmail(),
                profile.getVerificationStatus()
        );
    }
}
package com.volunteerportal.controller;

import com.volunteerportal.dto.VolunteerProfileRequest;
import com.volunteerportal.dto.VolunteerProfileResponse;
import com.volunteerportal.entity.User;
import com.volunteerportal.entity.VolunteerProfile;
import com.volunteerportal.service.UserService;
import com.volunteerportal.service.VolunteerProfileService;
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
@RequestMapping("/api/volunteer-profiles")
public class VolunteerProfileController {

    private final VolunteerProfileService volunteerProfileService;
    private final UserService userService;

    public VolunteerProfileController(
            VolunteerProfileService volunteerProfileService,
            UserService userService) {

        this.volunteerProfileService = volunteerProfileService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<VolunteerProfileResponse>> getAll(
            Authentication authentication) {

        List<VolunteerProfile> profiles =
                volunteerProfileService.findAll();

        List<VolunteerProfileResponse> responses;

        if (isAdmin(authentication)
                || hasRole(authentication, "ORGANIZATION")) {

            responses = profiles.stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());

        } else if (hasRole(authentication, "VOLUNTEER")) {

            responses = profiles.stream()
                    .filter(profile ->
                            isOwnedByVolunteer(profile, authentication))
                    .map(this::toResponse)
                    .collect(Collectors.toList());

        } else {
            throw new AccessDeniedException(
                    "You are not allowed to access volunteer profiles"
            );
        }

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<VolunteerProfileResponse> getById(
            @PathVariable Long id,
            Authentication authentication) {

        VolunteerProfile profile =
                volunteerProfileService.findById(id);

        if (!isAdmin(authentication)
                && hasRole(authentication, "VOLUNTEER")
                && !isOwnedByVolunteer(profile, authentication)) {

            throw new AccessDeniedException(
                    "You are not allowed to access this volunteer profile"
            );
        }

        if (!isAdmin(authentication)
                && !hasRole(authentication, "VOLUNTEER")
                && !hasRole(authentication, "ORGANIZATION")) {

            throw new AccessDeniedException(
                    "You are not allowed to access this volunteer profile"
            );
        }

        return ResponseEntity.ok(toResponse(profile));
    }

    @PostMapping
    @PreAuthorize("hasRole('VOLUNTEER')")
    public ResponseEntity<VolunteerProfileResponse> create(
            @RequestBody VolunteerProfileRequest request,
            Authentication authentication) {

        User user = userService.findById(request.getUserId());

        verifyUserOwnership(user, authentication);

        VolunteerProfile profile = toEntity(request, user);

        VolunteerProfile saved =
                volunteerProfileService.save(profile);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(toResponse(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('VOLUNTEER', 'ADMIN')")
    public ResponseEntity<VolunteerProfileResponse> update(
            @PathVariable Long id,
            @RequestBody VolunteerProfileRequest request,
            Authentication authentication) {

        VolunteerProfile existing =
                volunteerProfileService.findById(id);

        if (!isAdmin(authentication)) {
            verifyProfileOwnership(existing, authentication);
        }

        User user = userService.findById(request.getUserId());

        if (!isAdmin(authentication)) {
            verifyUserOwnership(user, authentication);
        }

        VolunteerProfile profile =
                toEntity(request, user);

        VolunteerProfile updated =
                volunteerProfileService.update(id, profile);

        return ResponseEntity.ok(toResponse(updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('VOLUNTEER', 'ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            Authentication authentication) {

        VolunteerProfile profile =
                volunteerProfileService.findById(id);

        if (!isAdmin(authentication)) {
            verifyProfileOwnership(profile, authentication);
        }

        volunteerProfileService.deleteById(id);

        return ResponseEntity.noContent().build();
    }

    // ---------------------------------------------------------
    // Security / ownership helpers
    // ---------------------------------------------------------

    private void verifyProfileOwnership(
            VolunteerProfile profile,
            Authentication authentication) {

        if (!isOwnedByVolunteer(profile, authentication)) {
            throw new AccessDeniedException(
                    "You are not allowed to manage this volunteer profile"
            );
        }
    }

    private boolean isOwnedByVolunteer(
            VolunteerProfile profile,
            Authentication authentication) {

        if (profile == null
                || profile.getUser() == null
                || profile.getUser().getEmail() == null) {

            return false;
        }

        String loggedInEmail = authentication.getName();

        String profileOwnerEmail =
                profile.getUser().getEmail();

        return loggedInEmail.equalsIgnoreCase(profileOwnerEmail);
    }

    private void verifyUserOwnership(
            User user,
            Authentication authentication) {

        if (user == null
                || user.getEmail() == null
                || !authentication.getName()
                        .equalsIgnoreCase(user.getEmail())) {

            throw new AccessDeniedException(
                    "You can only manage your own volunteer profile"
            );
        }
    }

    private boolean isAdmin(Authentication authentication) {
        return hasRole(authentication, "ADMIN");
    }

    private boolean hasRole(
            Authentication authentication,
            String role) {

        return authentication.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(("ROLE_" + role)::equals);
    }

    // ---------------------------------------------------------
    // DTO -> Entity
    // ---------------------------------------------------------

    private VolunteerProfile toEntity(
            VolunteerProfileRequest request,
            User user) {

        VolunteerProfile profile =
                new VolunteerProfile();

        profile.setUser(user);
        profile.setSkills(request.getSkills());
        profile.setInterests(request.getInterests());
        profile.setLocation(request.getLocation());
        profile.setBio(request.getBio());
        profile.setAvailability(request.getAvailability());
        profile.setProfileImage(request.getProfileImage());

        return profile;
    }

    // ---------------------------------------------------------
    // Entity -> DTO
    // ---------------------------------------------------------

    private VolunteerProfileResponse toResponse(
            VolunteerProfile profile) {

        Long userId =
                profile.getUser() != null
                        ? profile.getUser().getId()
                        : null;

        return new VolunteerProfileResponse(
                profile.getId(),
                userId,
                profile.getSkills(),
                profile.getInterests(),
                profile.getLocation(),
                profile.getBio(),
                profile.getAvailability(),
                profile.getProfileImage()
        );
    }
}
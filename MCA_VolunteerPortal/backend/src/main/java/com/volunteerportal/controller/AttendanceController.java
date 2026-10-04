package com.volunteerportal.controller;

import com.volunteerportal.dto.AttendanceRequest;
import com.volunteerportal.dto.AttendanceResponse;
import com.volunteerportal.entity.Application;
import com.volunteerportal.entity.Attendance;
import com.volunteerportal.entity.OrganizationProfile;
import com.volunteerportal.service.ApplicationService;
import com.volunteerportal.service.AttendanceService;
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
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final ApplicationService applicationService;

    public AttendanceController(AttendanceService attendanceService,
                                ApplicationService applicationService) {
        this.attendanceService = attendanceService;
        this.applicationService = applicationService;
    }

    @GetMapping
    public ResponseEntity<List<AttendanceResponse>> getAll(Authentication authentication) {

        List<Attendance> attendanceList = attendanceService.findAll();

        List<AttendanceResponse> responses;

        if (isAdmin(authentication)) {
            responses = attendanceList.stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());

        } else if (hasRole(authentication, "ORGANIZATION")) {
            responses = attendanceList.stream()
                    .filter(attendance -> isOwnedByOrganization(attendance, authentication))
                    .map(this::toResponse)
                    .collect(Collectors.toList());

        } else {
            responses = attendanceList.stream()
                    .filter(attendance -> isOwnedByVolunteer(attendance, authentication))
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AttendanceResponse> getById(@PathVariable Long id,
                                                      Authentication authentication) {

        Attendance attendance = attendanceService.findById(id);

        verifyAttendanceAccess(attendance, authentication);

        return ResponseEntity.ok(toResponse(attendance));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ORGANIZATION', 'ADMIN')")
    public ResponseEntity<AttendanceResponse> create(
            @RequestBody AttendanceRequest request,
            Authentication authentication) {

        Application application =
                applicationService.findById(request.getApplicationId());

        if (!isAdmin(authentication)) {
            verifyOrganizationOwnership(application, authentication);
        }

        Attendance attendance = toEntity(request, application);

        Attendance saved = attendanceService.save(attendance);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(toResponse(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORGANIZATION', 'ADMIN')")
    public ResponseEntity<AttendanceResponse> update(
            @PathVariable Long id,
            @RequestBody AttendanceRequest request,
            Authentication authentication) {

        Attendance existing = attendanceService.findById(id);

        if (!isAdmin(authentication)) {
            verifyOrganizationOwnership(existing.getApplication(), authentication);
        }

        Application application =
                applicationService.findById(request.getApplicationId());

        if (!isAdmin(authentication)) {
            verifyOrganizationOwnership(application, authentication);
        }

        Attendance attendance = toEntity(request, application);

        Attendance updated = attendanceService.update(id, attendance);

        return ResponseEntity.ok(toResponse(updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORGANIZATION', 'ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            Authentication authentication) {

        Attendance attendance = attendanceService.findById(id);

        if (!isAdmin(authentication)) {
            verifyOrganizationOwnership(
                    attendance.getApplication(),
                    authentication
            );
        }

        attendanceService.deleteById(id);

        return ResponseEntity.noContent().build();
    }

    // ---------------------------------------------------------
    // Security / ownership helpers
    // ---------------------------------------------------------

    private void verifyAttendanceAccess(
            Attendance attendance,
            Authentication authentication) {

        if (isAdmin(authentication)) {
            return;
        }

        if (hasRole(authentication, "ORGANIZATION")) {
            verifyOrganizationOwnership(
                    attendance.getApplication(),
                    authentication
            );
            return;
        }

        if (hasRole(authentication, "VOLUNTEER")) {
            if (!isOwnedByVolunteer(attendance, authentication)) {
                throw new AccessDeniedException(
                        "You are not allowed to access this attendance record"
                );
            }
            return;
        }

        throw new AccessDeniedException(
                "You are not allowed to access this attendance record"
        );
    }

    private boolean isOwnedByVolunteer(
            Attendance attendance,
            Authentication authentication) {

        if (attendance == null
                || attendance.getApplication() == null
                || attendance.getApplication().getVolunteer() == null
                || attendance.getApplication().getVolunteer().getUser() == null) {
            return false;
        }

        String loggedInEmail = authentication.getName();

        String volunteerEmail =
                attendance.getApplication()
                        .getVolunteer()
                        .getUser()
                        .getEmail();

        return volunteerEmail != null
                && loggedInEmail.equalsIgnoreCase(volunteerEmail);
    }

    private boolean isOwnedByOrganization(
            Attendance attendance,
            Authentication authentication) {

        if (attendance == null
                || attendance.getApplication() == null) {
            return false;
        }

        try {
            OrganizationProfile organization =
                    attendance.getApplication()
                            .getOpportunity()
                            .getOrganization();

            if (organization == null
                    || organization.getUser() == null
                    || organization.getUser().getEmail() == null) {
                return false;
            }

            return authentication.getName()
                    .equalsIgnoreCase(organization.getUser().getEmail());

        } catch (NullPointerException exception) {
            return false;
        }
    }

    private void verifyOrganizationOwnership(
            Application application,
            Authentication authentication) {

        if (application == null
                || application.getOpportunity() == null
                || application.getOpportunity().getOrganization() == null
                || application.getOpportunity().getOrganization().getUser() == null
                || application.getOpportunity().getOrganization().getUser().getEmail() == null) {

            throw new AccessDeniedException(
                    "Organization ownership could not be verified"
            );
        }

        String loggedInEmail = authentication.getName();

        String organizationOwnerEmail =
                application.getOpportunity()
                        .getOrganization()
                        .getUser()
                        .getEmail();

        if (!loggedInEmail.equalsIgnoreCase(organizationOwnerEmail)) {
            throw new AccessDeniedException(
                    "You are not allowed to manage attendance for this opportunity"
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
    // DTO <-> Entity mapping
    // ---------------------------------------------------------

    private Attendance toEntity(
            AttendanceRequest request,
            Application application) {

        Attendance attendance = new Attendance();

        attendance.setApplication(application);
        attendance.setAttendanceDate(request.getAttendanceDate());
        attendance.setStatus(request.getStatus());
        attendance.setCheckInTime(request.getCheckInTime());
        attendance.setCheckOutTime(request.getCheckOutTime());

        return attendance;
    }

    private AttendanceResponse toResponse(Attendance attendance) {

        Long applicationId =
                attendance.getApplication() != null
                        ? attendance.getApplication().getId()
                        : null;

        return new AttendanceResponse(
                attendance.getId(),
                applicationId,
                attendance.getAttendanceDate(),
                attendance.getStatus(),
                attendance.getCheckInTime(),
                attendance.getCheckOutTime()
        );
    }
}
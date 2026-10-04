package com.volunteerportal.controller;

import com.volunteerportal.dto.CertificateRequest;
import com.volunteerportal.dto.CertificateResponse;
import com.volunteerportal.entity.Certificate;
import com.volunteerportal.entity.Opportunity;
import com.volunteerportal.entity.OrganizationProfile;
import com.volunteerportal.entity.VolunteerProfile;
import com.volunteerportal.service.CertificatePdfService;
import com.volunteerportal.service.CertificateService;
import com.volunteerportal.service.OpportunityService;
import com.volunteerportal.service.VolunteerProfileService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/certificates")
public class CertificateController {

    private final CertificateService certificateService;
    private final VolunteerProfileService volunteerProfileService;
    private final OpportunityService opportunityService;
    private final CertificatePdfService certificatePdfService;

    public CertificateController(
            CertificateService certificateService,
            VolunteerProfileService volunteerProfileService,
            OpportunityService opportunityService,
            CertificatePdfService certificatePdfService) {

        this.certificateService = certificateService;
        this.volunteerProfileService = volunteerProfileService;
        this.opportunityService = opportunityService;
        this.certificatePdfService = certificatePdfService;
    }

    // ---------------------------------------------------------
    // GET ALL
    // ---------------------------------------------------------

    @GetMapping
    public ResponseEntity<List<CertificateResponse>> getAll(
            Authentication authentication) {

        List<Certificate> certificates =
                certificateService.findAll();

        List<CertificateResponse> responses;

        if (isAdmin(authentication)) {

            responses = certificates.stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());

        } else if (hasRole(authentication, "ORGANIZATION")) {

            responses = certificates.stream()
                    .filter(certificate ->
                            isOwnedByOrganization(
                                    certificate,
                                    authentication
                            ))
                    .map(this::toResponse)
                    .collect(Collectors.toList());

        } else if (hasRole(authentication, "VOLUNTEER")) {

            responses = certificates.stream()
                    .filter(certificate ->
                            isOwnedByVolunteer(
                                    certificate,
                                    authentication
                            ))
                    .map(this::toResponse)
                    .collect(Collectors.toList());

        } else {

            throw new AccessDeniedException(
                    "You are not allowed to access certificates"
            );
        }

        return ResponseEntity.ok(responses);
    }

    // ---------------------------------------------------------
    // GET PDF
    // ---------------------------------------------------------

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> getCertificatePdf(
            @PathVariable Long id,
            Authentication authentication) {

        Certificate certificate =
                certificateService.findById(id);

        /*
         * Reuse the same certificate access rules used by
         * the normal GET /api/certificates/{id} endpoint.
         *
         * Volunteer -> own certificate only
         * Organization -> certificates for its opportunities
         * Admin -> all certificates
         */
        verifyCertificateAccess(
                certificate,
                authentication
        );

        byte[] pdf =
                certificatePdfService.generateCertificatePdf(
                        certificate
                );

        String certificateNumber =
                certificate.getCertificateNumber();

        String safeCertificateNumber =
                certificateNumber == null
                        ? "certificate"
                        : certificateNumber
                                .replaceAll(
                                        "[^a-zA-Z0-9-_]",
                                        "_"
                                );

        String fileName =
                "VolunteerCertificate-"
                        + safeCertificateNumber
                        + ".pdf";

        HttpHeaders headers =
                new HttpHeaders();

        headers.setContentType(
                MediaType.APPLICATION_PDF
        );

        /*
         * INLINE means the browser can open the PDF directly.
         *
         * The frontend can also use the same endpoint for
         * downloading the certificate.
         */
        headers.set(
                HttpHeaders.CONTENT_DISPOSITION,
                "inline; filename=\"" + fileName + "\""
        );

        headers.setContentLength(
                pdf.length
        );

        return new ResponseEntity<>(
                pdf,
                headers,
                HttpStatus.OK
        );
    }

    // ---------------------------------------------------------
    // GET BY ID
    // ---------------------------------------------------------

    @GetMapping("/{id}")
    public ResponseEntity<CertificateResponse> getById(
            @PathVariable Long id,
            Authentication authentication) {

        Certificate certificate =
                certificateService.findById(id);

        verifyCertificateAccess(
                certificate,
                authentication
        );

        return ResponseEntity.ok(
                toResponse(certificate)
        );
    }

    // ---------------------------------------------------------
    // CREATE
    // ---------------------------------------------------------

    @PostMapping
    @PreAuthorize("hasAnyRole('ORGANIZATION', 'ADMIN')")
    public ResponseEntity<CertificateResponse> create(
            @RequestBody CertificateRequest request,
            Authentication authentication) {

        validateRequest(request);

        VolunteerProfile volunteer =
                volunteerProfileService.findById(
                        request.getVolunteerId()
                );

        Opportunity opportunity =
                opportunityService.findById(
                        request.getOpportunityId()
                );

        /*
         * An organization can create certificates only
         * for opportunities that belong to that organization.
         */
        if (!isAdmin(authentication)) {

            verifyOrganizationOwnership(
                    opportunity,
                    authentication
            );
        }

        Certificate certificate =
                toEntity(
                        request,
                        volunteer,
                        opportunity
                );

        Certificate saved =
                certificateService.save(certificate);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(toResponse(saved));
    }

    // ---------------------------------------------------------
    // UPDATE
    // ---------------------------------------------------------

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORGANIZATION', 'ADMIN')")
    public ResponseEntity<CertificateResponse> update(
            @PathVariable Long id,
            @RequestBody CertificateRequest request,
            Authentication authentication) {

        validateRequest(request);

        Certificate existing =
                certificateService.findById(id);

        /*
         * Only the organization that owns the original
         * opportunity can update the certificate.
         */
        if (!isAdmin(authentication)) {

            verifyOrganizationOwnership(
                    existing.getOpportunity(),
                    authentication
            );
        }

        VolunteerProfile volunteer =
                volunteerProfileService.findById(
                        request.getVolunteerId()
                );

        Opportunity opportunity =
                opportunityService.findById(
                        request.getOpportunityId()
                );

        /*
         * Do not allow a certificate to be transferred
         * to another volunteer.
         */
        if (existing.getVolunteer() == null
                || existing.getVolunteer().getId() == null
                || volunteer.getId() == null
                || !existing.getVolunteer()
                        .getId()
                        .equals(volunteer.getId())) {

            throw new IllegalArgumentException(
                    "Certificate cannot be transferred to another volunteer"
            );
        }

        /*
         * Do not allow a certificate to be transferred
         * to another opportunity.
         */
        if (existing.getOpportunity() == null
                || existing.getOpportunity().getId() == null
                || opportunity.getId() == null
                || !existing.getOpportunity()
                        .getId()
                        .equals(opportunity.getId())) {

            throw new IllegalArgumentException(
                    "Certificate cannot be transferred to another opportunity"
            );
        }

        /*
         * For non-admin users, also verify that the supplied
         * opportunity belongs to the logged-in organization.
         */
        if (!isAdmin(authentication)) {

            verifyOrganizationOwnership(
                    opportunity,
                    authentication
            );
        }

        Certificate certificate =
                toEntity(
                        request,
                        volunteer,
                        opportunity
                );

        Certificate updated =
                certificateService.update(
                        id,
                        certificate
                );

        return ResponseEntity.ok(
                toResponse(updated)
        );
    }

    // ---------------------------------------------------------
    // DELETE
    // ---------------------------------------------------------

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORGANIZATION', 'ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            Authentication authentication) {

        Certificate certificate =
                certificateService.findById(id);

        if (!isAdmin(authentication)) {

            verifyOrganizationOwnership(
                    certificate.getOpportunity(),
                    authentication
            );
        }

        certificateService.deleteById(id);

        return ResponseEntity.noContent().build();
    }

    // ---------------------------------------------------------
    // SECURITY / ACCESS HELPERS
    // ---------------------------------------------------------

    private void verifyCertificateAccess(
            Certificate certificate,
            Authentication authentication) {

        if (isAdmin(authentication)) {
            return;
        }

        if (hasRole(authentication, "VOLUNTEER")) {

            if (!isOwnedByVolunteer(
                    certificate,
                    authentication)) {

                throw new AccessDeniedException(
                        "You are not allowed to access this certificate"
                );
            }

            return;
        }

        if (hasRole(authentication, "ORGANIZATION")) {

            verifyOrganizationOwnership(
                    certificate.getOpportunity(),
                    authentication
            );

            return;
        }

        throw new AccessDeniedException(
                "You are not allowed to access this certificate"
        );
    }

    private boolean isOwnedByVolunteer(
            Certificate certificate,
            Authentication authentication) {

        if (certificate == null
                || certificate.getVolunteer() == null
                || certificate.getVolunteer().getUser() == null) {

            return false;
        }

        String loggedInEmail =
                authentication.getName();

        String volunteerEmail =
                certificate.getVolunteer()
                        .getUser()
                        .getEmail();

        return volunteerEmail != null
                && loggedInEmail.equalsIgnoreCase(
                        volunteerEmail
                );
    }

    private boolean isOwnedByOrganization(
            Certificate certificate,
            Authentication authentication) {

        if (certificate == null
                || certificate.getOpportunity() == null) {

            return false;
        }

        try {

            OrganizationProfile organization =
                    certificate.getOpportunity()
                            .getOrganization();

            if (organization == null
                    || organization.getUser() == null
                    || organization.getUser().getEmail() == null) {

                return false;
            }

            return authentication.getName()
                    .equalsIgnoreCase(
                            organization.getUser().getEmail()
                    );

        } catch (NullPointerException exception) {

            return false;
        }
    }

    private void verifyOrganizationOwnership(
            Opportunity opportunity,
            Authentication authentication) {

        if (opportunity == null
                || opportunity.getOrganization() == null
                || opportunity.getOrganization().getUser() == null
                || opportunity.getOrganization()
                        .getUser()
                        .getEmail() == null) {

            throw new AccessDeniedException(
                    "Organization ownership could not be verified"
            );
        }

        String loggedInEmail =
                authentication.getName();

        String organizationOwnerEmail =
                opportunity.getOrganization()
                        .getUser()
                        .getEmail();

        if (!loggedInEmail.equalsIgnoreCase(
                organizationOwnerEmail)) {

            throw new AccessDeniedException(
                    "You are not allowed to manage certificates for this opportunity"
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
    // REQUEST VALIDATION
    // ---------------------------------------------------------

    private void validateRequest(
            CertificateRequest request) {

        if (request == null) {

            throw new IllegalArgumentException(
                    "Certificate request is required"
            );
        }

        if (request.getVolunteerId() == null) {

            throw new IllegalArgumentException(
                    "Volunteer ID is required"
            );
        }

        if (request.getOpportunityId() == null) {

            throw new IllegalArgumentException(
                    "Opportunity ID is required"
            );
        }

        if (request.getCertificateNumber() == null
                || request.getCertificateNumber()
                        .trim()
                        .isEmpty()) {

            throw new IllegalArgumentException(
                    "Certificate number is required"
            );
        }

        if (request.getIssueDate() == null) {

            throw new IllegalArgumentException(
                    "Issue date is required"
            );
        }
    }

    // ---------------------------------------------------------
    // DTO -> ENTITY
    // ---------------------------------------------------------

    private Certificate toEntity(
            CertificateRequest request,
            VolunteerProfile volunteer,
            Opportunity opportunity) {

        Certificate certificate =
                new Certificate();

        certificate.setVolunteer(
                volunteer
        );

        certificate.setOpportunity(
                opportunity
        );

        certificate.setCertificateNumber(
                request.getCertificateNumber()
        );

        certificate.setIssueDate(
                request.getIssueDate()
        );

        certificate.setCertificateUrl(
                request.getCertificateUrl()
        );

        return certificate;
    }

    // ---------------------------------------------------------
    // ENTITY -> DTO
    // ---------------------------------------------------------

    private CertificateResponse toResponse(
            Certificate certificate) {

        Long volunteerId =
                certificate.getVolunteer() != null
                        ? certificate.getVolunteer().getId()
                        : null;

        Long opportunityId =
                certificate.getOpportunity() != null
                        ? certificate.getOpportunity().getId()
                        : null;

        return new CertificateResponse(
                certificate.getId(),
                volunteerId,
                opportunityId,
                certificate.getCertificateNumber(),
                certificate.getIssueDate(),
                certificate.getCertificateUrl()
        );
    }
}
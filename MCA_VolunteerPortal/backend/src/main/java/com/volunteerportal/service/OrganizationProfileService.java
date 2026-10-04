package com.volunteerportal.service;

import com.volunteerportal.entity.OrganizationProfile;
import com.volunteerportal.entity.VerificationStatus;
import com.volunteerportal.repository.OrganizationProfileRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OrganizationProfileService {

    private final OrganizationProfileRepository organizationProfileRepository;

    public OrganizationProfileService(
            OrganizationProfileRepository organizationProfileRepository) {
        this.organizationProfileRepository = organizationProfileRepository;
    }

    public List<OrganizationProfile> findAll() {
        return organizationProfileRepository.findAll();
    }

    public OrganizationProfile findById(Long id) {
        return organizationProfileRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "OrganizationProfile not found with id: " + id));
    }

    public OrganizationProfile save(
            OrganizationProfile organizationProfile) {

        if (organizationProfile.getUser() == null) {
            throw new IllegalArgumentException("User is required");
        }

        if (organizationProfile.getOrganizationName() == null
                || organizationProfile.getOrganizationName()
                        .trim()
                        .isEmpty()) {

            throw new IllegalArgumentException(
                    "Organization name is required");
        }

        // Prevent more than one organization profile for the same user
        boolean profileExists =
                organizationProfileRepository.findAll()
                        .stream()
                        .anyMatch(existing ->
                                existing.getUser() != null
                                        && existing.getUser()
                                                .getId()
                                                .equals(
                                                        organizationProfile
                                                                .getUser()
                                                                .getId()
                                                ));

        if (profileExists) {
            throw new IllegalArgumentException(
                    "An organization profile already exists for this user");
        }

        /*
         * Every newly created organization starts as PENDING.
         * An organization cannot verify itself.
         * Verification is controlled by an administrator.
         */
        organizationProfile.setVerificationStatus(
                VerificationStatus.PENDING);

        return organizationProfileRepository.save(
                organizationProfile);
    }

    public OrganizationProfile update(
            Long id,
            OrganizationProfile organizationProfile) {

        OrganizationProfile existing = findById(id);

        if (organizationProfile.getUser() == null) {
            throw new IllegalArgumentException("User is required");
        }

        if (organizationProfile.getOrganizationName() == null
                || organizationProfile.getOrganizationName()
                        .trim()
                        .isEmpty()) {

            throw new IllegalArgumentException(
                    "Organization name is required");
        }

        // Do not allow the profile to be transferred to another user
        if (existing.getUser() == null
                || existing.getUser().getId() == null
                || !existing.getUser()
                        .getId()
                        .equals(
                                organizationProfile
                                        .getUser()
                                        .getId()
                        )) {

            throw new IllegalArgumentException(
                    "Organization profile cannot be transferred to another user");
        }

        existing.setOrganizationName(
                organizationProfile.getOrganizationName());

        existing.setDescription(
                organizationProfile.getDescription());

        existing.setAddress(
                organizationProfile.getAddress());

        existing.setWebsite(
                organizationProfile.getWebsite());

        existing.setContactEmail(
                organizationProfile.getContactEmail());

        /*
         * Verification status is intentionally NOT changed here.
         *
         * Normal organization profile updates must not be able
         * to change verification status.
         *
         * Administrators use updateVerificationStatus()
         * for that operation.
         */

        return organizationProfileRepository.save(existing);
    }

    /**
     * Updates the verification status of an organization profile.
     *
     * This method is intended to be called only by an
     * administrator-controlled controller endpoint.
     */
    public OrganizationProfile updateVerificationStatus(
            Long id,
            VerificationStatus verificationStatus) {

        if (verificationStatus == null) {
            throw new IllegalArgumentException(
                    "Verification status is required");
        }

        OrganizationProfile existing = findById(id);

        existing.setVerificationStatus(
                verificationStatus);

        return organizationProfileRepository.save(
                existing);
    }

    public void deleteById(Long id) {
        OrganizationProfile existing = findById(id);
        organizationProfileRepository.delete(existing);
    }
}
package com.volunteerportal.service;

import com.volunteerportal.entity.Opportunity;
import com.volunteerportal.entity.OpportunityStatus;
import com.volunteerportal.entity.OrganizationProfile;
import com.volunteerportal.entity.VerificationStatus;
import com.volunteerportal.repository.OpportunityRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OpportunityService {

    private final OpportunityRepository opportunityRepository;

    public OpportunityService(
            OpportunityRepository opportunityRepository) {

        this.opportunityRepository =
                opportunityRepository;
    }

    public List<Opportunity> findAll() {

        return opportunityRepository.findAll();
    }

    public Opportunity findById(Long id) {

        if (id == null) {
            throw new IllegalArgumentException(
                    "Opportunity ID is required"
            );
        }

        return opportunityRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Opportunity not found with id: "
                                        + id
                        )
                );
    }

    public Opportunity save(
            Opportunity opportunity) {

        validateOpportunity(opportunity);

        validateOrganization(opportunity);

        validateOpportunityDates(opportunity);

        if (opportunity.getStatus() == null) {
            opportunity.setStatus(
                    OpportunityStatus.OPEN
            );
        }

        return opportunityRepository.save(
                opportunity
        );
    }

    /*
     * Update an opportunity.
     *
     * An opportunity can only be modified before
     * its event has ended.
     */
    public Opportunity update(
            Long id,
            Opportunity opportunity) {

        Opportunity existing =
                findById(id);

        validateOpportunity(opportunity);

        validateOrganization(opportunity);

        /*
         * Prevent modification after the event has ended.
         */
        if (existing.getEndDate() != null
                && !LocalDateTime.now()
                        .isBefore(existing.getEndDate())) {

            throw new IllegalStateException(
                    "This opportunity cannot be modified because the event has ended"
            );
        }

        /*
         * Prevent changing the organization that owns
         * an existing opportunity.
         */
        if (existing.getOrganization() == null
                || existing.getOrganization().getId() == null
                || opportunity.getOrganization() == null
                || opportunity.getOrganization().getId() == null
                || !existing.getOrganization()
                        .getId()
                        .equals(
                                opportunity
                                        .getOrganization()
                                        .getId()
                        )) {

            throw new IllegalArgumentException(
                    "Opportunity cannot be transferred to another organization"
            );
        }

        validateOpportunityDates(opportunity);

        /*
         * Preserve the existing status if the update does
         * not explicitly provide one.
         */
        OpportunityStatus newStatus =
                opportunity.getStatus();

        if (newStatus == null) {
            newStatus =
                    existing.getStatus();
        }

        validateStatusTransition(
                existing.getStatus(),
                newStatus
        );

        existing.setCategory(
                opportunity.getCategory()
        );

        existing.setTitle(
                opportunity.getTitle()
        );

        existing.setDescription(
                opportunity.getDescription()
        );

        existing.setLocation(
                opportunity.getLocation()
        );

        existing.setStartDate(
                opportunity.getStartDate()
        );

        existing.setEndDate(
                opportunity.getEndDate()
        );

        existing.setRequiredVolunteers(
                opportunity.getRequiredVolunteers()
        );

        existing.setStatus(
                newStatus
        );

        return opportunityRepository.save(
                existing
        );
    }

    /*
     * Delete an opportunity.
     *
     * An opportunity can only be deleted before
     * its event has ended.
     */
    public void deleteById(Long id) {

        Opportunity existing =
                findById(id);

        if (existing.getEndDate() != null
                && !LocalDateTime.now()
                        .isBefore(existing.getEndDate())) {

            throw new IllegalStateException(
                    "This opportunity cannot be deleted because the event has ended"
            );
        }

        opportunityRepository.delete(existing);
    }

    /*
     * Validate basic opportunity data.
     */
    private void validateOpportunity(
            Opportunity opportunity) {

        if (opportunity == null) {
            throw new IllegalArgumentException(
                    "Opportunity data is required"
            );
        }

        if (opportunity.getOrganization() == null) {
            throw new IllegalArgumentException(
                    "Organization is required"
            );
        }

        if (opportunity.getOrganization().getId() == null) {
            throw new IllegalArgumentException(
                    "Organization ID is required"
            );
        }

        if (opportunity.getTitle() == null
                || opportunity.getTitle()
                        .trim()
                        .isEmpty()) {

            throw new IllegalArgumentException(
                    "Opportunity title is required"
            );
        }

        if (opportunity.getCategory() == null) {
            throw new IllegalArgumentException(
                    "Category is required"
            );
        }

        if (opportunity.getRequiredVolunteers() < 1) {
            throw new IllegalArgumentException(
                    "Required volunteers must be at least 1"
            );
        }
    }

    /*
     * Only verified organizations should be allowed
     * to create or modify opportunities.
     */
    private void validateOrganization(
            Opportunity opportunity) {

        OrganizationProfile organization =
                opportunity.getOrganization();

        if (organization.getVerificationStatus()
                != VerificationStatus.VERIFIED) {

            throw new IllegalArgumentException(
                    "Only verified organizations can create or manage opportunities"
            );
        }
    }

    /*
     * Validate opportunity dates.
     */
    private void validateOpportunityDates(
            Opportunity opportunity) {

        if (opportunity.getStartDate() == null) {
            throw new IllegalArgumentException(
                    "Event start date/time is required"
            );
        }

        if (opportunity.getEndDate() == null) {
            throw new IllegalArgumentException(
                    "Event end date/time is required"
            );
        }

        if (!opportunity.getEndDate()
                .isAfter(opportunity.getStartDate())) {

            throw new IllegalArgumentException(
                    "Event end date/time must be after the start date/time"
            );
        }

        if (!opportunity.getEndDate()
                .isAfter(LocalDateTime.now())) {

            throw new IllegalArgumentException(
                    "Event end date/time must be in the future"
            );
        }
    }

    /*
     * Validate status transitions.
     */
    private void validateStatusTransition(
            OpportunityStatus currentStatus,
            OpportunityStatus newStatus) {

        if (newStatus == null) {
            throw new IllegalArgumentException(
                    "Opportunity status is required"
            );
        }

        if (currentStatus == null
                || currentStatus == newStatus) {
            return;
        }

        if (currentStatus == OpportunityStatus.DRAFT) {

            if (newStatus == OpportunityStatus.OPEN
                    || newStatus == OpportunityStatus.CANCELLED) {

                return;
            }
        }

        if (currentStatus == OpportunityStatus.OPEN) {

            if (newStatus == OpportunityStatus.CLOSED
                    || newStatus == OpportunityStatus.COMPLETED
                    || newStatus == OpportunityStatus.CANCELLED) {

                return;
            }
        }

        if (currentStatus == OpportunityStatus.CLOSED) {

            if (newStatus == OpportunityStatus.COMPLETED
                    || newStatus == OpportunityStatus.CANCELLED) {

                return;
            }
        }

        throw new IllegalArgumentException(
                "Invalid opportunity status transition: "
                        + currentStatus
                        + " -> "
                        + newStatus
        );
    }
}
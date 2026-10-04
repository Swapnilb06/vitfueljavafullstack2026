package com.volunteerportal.service;

import com.volunteerportal.entity.Application;
import com.volunteerportal.entity.ApplicationStatus;
import com.volunteerportal.entity.Opportunity;
import com.volunteerportal.entity.OpportunityStatus;
import com.volunteerportal.repository.ApplicationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;

    public ApplicationService(
            ApplicationRepository applicationRepository) {

        this.applicationRepository =
                applicationRepository;
    }

    public List<Application> findAll() {

        return applicationRepository.findAll();
    }

    public Application findById(Long id) {

        if (id == null) {
            throw new IllegalArgumentException(
                    "Application ID is required"
            );
        }

        return applicationRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Application not found with id: "
                                        + id
                        )
                );
    }

    public Application save(
            Application application) {

        validateApplication(application);

        Opportunity opportunity =
                application.getOpportunity();

        if (opportunity.getStatus()
                != OpportunityStatus.OPEN) {

            throw new IllegalArgumentException(
                    "Applications can only be submitted for open opportunities"
            );
        }

        boolean alreadyApplied =
                applicationRepository.findAll()
                        .stream()
                        .anyMatch(existing ->
                                existing.getVolunteer() != null
                                        && existing.getOpportunity() != null
                                        && existing.getVolunteer().getId() != null
                                        && existing.getOpportunity().getId() != null
                                        && existing.getVolunteer().getId()
                                                .equals(
                                                        application
                                                                .getVolunteer()
                                                                .getId()
                                                )
                                        && existing.getOpportunity().getId()
                                                .equals(
                                                        application
                                                                .getOpportunity()
                                                                .getId()
                                                )
                        );

        if (alreadyApplied) {

            throw new IllegalArgumentException(
                    "You have already applied for this opportunity"
            );
        }

        /*
         * Every new application starts as PENDING.
         * The client cannot choose the initial status.
         */
        application.setStatus(
                ApplicationStatus.PENDING
        );

        return applicationRepository.save(
                application
        );
    }

    public Application update(
            Long id,
            Application application) {

        Application existing =
                findById(id);

        validateApplication(application);

        /*
         * An application cannot be transferred
         * to another volunteer.
         */
        if (existing.getVolunteer() == null
                || existing.getVolunteer().getId() == null
                || application.getVolunteer().getId() == null
                || !existing.getVolunteer()
                        .getId()
                        .equals(
                                application
                                        .getVolunteer()
                                        .getId()
                        )) {

            throw new IllegalArgumentException(
                    "Application cannot be transferred to another volunteer"
            );
        }

        /*
         * An application cannot be transferred
         * to another opportunity.
         */
        if (existing.getOpportunity() == null
                || existing.getOpportunity().getId() == null
                || application.getOpportunity().getId() == null
                || !existing.getOpportunity()
                        .getId()
                        .equals(
                                application
                                        .getOpportunity()
                                        .getId()
                        )) {

            throw new IllegalArgumentException(
                    "Application cannot be transferred to another opportunity"
            );
        }

        if (application.getStatus() == null) {

            throw new IllegalArgumentException(
                    "Application status is required"
            );
        }

        ApplicationStatus currentStatus =
                existing.getStatus();

        ApplicationStatus newStatus =
                application.getStatus();

        validateStatusTransition(
                currentStatus,
                newStatus
        );

        existing.setStatus(newStatus);

        return applicationRepository.save(
                existing
        );
    }

    public void deleteById(Long id) {

        Application existing =
                findById(id);

        applicationRepository.delete(existing);
    }

    private void validateApplication(
            Application application) {

        if (application == null) {

            throw new IllegalArgumentException(
                    "Application data is required"
            );
        }

        if (application.getVolunteer() == null) {

            throw new IllegalArgumentException(
                    "Volunteer is required"
            );
        }

        if (application.getVolunteer().getId() == null) {

            throw new IllegalArgumentException(
                    "Volunteer ID is required"
            );
        }

        if (application.getOpportunity() == null) {

            throw new IllegalArgumentException(
                    "Opportunity is required"
            );
        }

        if (application.getOpportunity().getId() == null) {

            throw new IllegalArgumentException(
                    "Opportunity ID is required"
            );
        }
    }

    private void validateStatusTransition(
            ApplicationStatus currentStatus,
            ApplicationStatus newStatus) {

        if (currentStatus == null) {

            throw new IllegalArgumentException(
                    "Current application status is invalid"
            );
        }

        if (newStatus == null) {

            throw new IllegalArgumentException(
                    "New application status is required"
            );
        }

        /*
         * Keeping the same status is allowed.
         */
        if (currentStatus == newStatus) {
            return;
        }

        /*
         * PENDING applications can be:
         * APPROVED, REJECTED, or CANCELLED.
         */
        if (currentStatus == ApplicationStatus.PENDING) {

            if (newStatus == ApplicationStatus.APPROVED
                    || newStatus == ApplicationStatus.REJECTED
                    || newStatus == ApplicationStatus.CANCELLED) {

                return;
            }
        }

        /*
         * APPROVED applications can be:
         * COMPLETED or CANCELLED.
         */
        if (currentStatus == ApplicationStatus.APPROVED) {

            if (newStatus == ApplicationStatus.COMPLETED
                    || newStatus == ApplicationStatus.CANCELLED) {

                return;
            }
        }

        throw new IllegalArgumentException(
                "Invalid application status transition: "
                        + currentStatus
                        + " -> "
                        + newStatus
        );
    }
}
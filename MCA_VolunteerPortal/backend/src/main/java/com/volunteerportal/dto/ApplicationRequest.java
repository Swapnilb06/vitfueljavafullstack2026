package com.volunteerportal.dto;

import com.volunteerportal.entity.ApplicationStatus;

public class ApplicationRequest {

    private Long volunteerId;
    private Long opportunityId;
    private ApplicationStatus status;

    public ApplicationRequest() {
    }

    public ApplicationRequest(Long volunteerId, Long opportunityId, ApplicationStatus status) {
        this.volunteerId = volunteerId;
        this.opportunityId = opportunityId;
        this.status = status;
    }

    public Long getVolunteerId() { return volunteerId; }
    public void setVolunteerId(Long volunteerId) { this.volunteerId = volunteerId; }

    public Long getOpportunityId() { return opportunityId; }
    public void setOpportunityId(Long opportunityId) { this.opportunityId = opportunityId; }

    public ApplicationStatus getStatus() { return status; }
    public void setStatus(ApplicationStatus status) { this.status = status; }
}
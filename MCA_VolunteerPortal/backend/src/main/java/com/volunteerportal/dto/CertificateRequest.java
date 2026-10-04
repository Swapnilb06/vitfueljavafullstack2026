package com.volunteerportal.dto;

import java.time.LocalDate;

public class CertificateRequest {

    private Long volunteerId;
    private Long opportunityId;
    private String certificateNumber;
    private LocalDate issueDate;
    private String certificateUrl;

    public CertificateRequest() {
    }

    public CertificateRequest(Long volunteerId, Long opportunityId, String certificateNumber,
                               LocalDate issueDate, String certificateUrl) {
        this.volunteerId = volunteerId;
        this.opportunityId = opportunityId;
        this.certificateNumber = certificateNumber;
        this.issueDate = issueDate;
        this.certificateUrl = certificateUrl;
    }

    public Long getVolunteerId() { return volunteerId; }
    public void setVolunteerId(Long volunteerId) { this.volunteerId = volunteerId; }

    public Long getOpportunityId() { return opportunityId; }
    public void setOpportunityId(Long opportunityId) { this.opportunityId = opportunityId; }

    public String getCertificateNumber() { return certificateNumber; }
    public void setCertificateNumber(String certificateNumber) { this.certificateNumber = certificateNumber; }

    public LocalDate getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDate issueDate) { this.issueDate = issueDate; }

    public String getCertificateUrl() { return certificateUrl; }
    public void setCertificateUrl(String certificateUrl) { this.certificateUrl = certificateUrl; }
}
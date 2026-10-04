package com.volunteerportal.dto;

import com.volunteerportal.entity.OpportunityStatus;

import java.time.LocalDateTime;

public class OpportunityResponse {

    private Long id;
    private Long organizationId;
    private Long categoryId;
    private String title;
    private String description;
    private String location;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private int requiredVolunteers;
    private OpportunityStatus status;
    private LocalDateTime createdAt;

    public OpportunityResponse() {
    }

    public OpportunityResponse(Long id, Long organizationId, Long categoryId, String title, String description,
                                String location, LocalDateTime startDate, LocalDateTime endDate,
                                int requiredVolunteers, OpportunityStatus status, LocalDateTime createdAt) {
        this.id = id;
        this.organizationId = organizationId;
        this.categoryId = categoryId;
        this.title = title;
        this.description = description;
        this.location = location;
        this.startDate = startDate;
        this.endDate = endDate;
        this.requiredVolunteers = requiredVolunteers;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getOrganizationId() { return organizationId; }
    public void setOrganizationId(Long organizationId) { this.organizationId = organizationId; }

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }

    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }

    public int getRequiredVolunteers() { return requiredVolunteers; }
    public void setRequiredVolunteers(int requiredVolunteers) { this.requiredVolunteers = requiredVolunteers; }

    public OpportunityStatus getStatus() { return status; }
    public void setStatus(OpportunityStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
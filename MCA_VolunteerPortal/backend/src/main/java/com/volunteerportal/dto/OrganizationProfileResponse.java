package com.volunteerportal.dto;

import com.volunteerportal.entity.VerificationStatus;

public class OrganizationProfileResponse {

    private Long id;
    private Long userId;
    private String organizationName;
    private String description;
    private String address;
    private String website;
    private String contactEmail;
    private VerificationStatus verificationStatus;

    public OrganizationProfileResponse() {
    }

    public OrganizationProfileResponse(Long id, Long userId, String organizationName, String description,
                                        String address, String website, String contactEmail,
                                        VerificationStatus verificationStatus) {
        this.id = id;
        this.userId = userId;
        this.organizationName = organizationName;
        this.description = description;
        this.address = address;
        this.website = website;
        this.contactEmail = contactEmail;
        this.verificationStatus = verificationStatus;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getOrganizationName() { return organizationName; }
    public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public VerificationStatus getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(VerificationStatus verificationStatus) { this.verificationStatus = verificationStatus; }
}
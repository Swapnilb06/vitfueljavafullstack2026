package com.volunteerportal.dto;

public class VolunteerProfileResponse {

    private Long id;
    private Long userId;
    private String skills;
    private String interests;
    private String location;
    private String bio;
    private String availability;
    private String profileImage;

    public VolunteerProfileResponse() {
    }

    public VolunteerProfileResponse(Long id, Long userId, String skills, String interests, String location,
                                     String bio, String availability, String profileImage) {
        this.id = id;
        this.userId = userId;
        this.skills = skills;
        this.interests = interests;
        this.location = location;
        this.bio = bio;
        this.availability = availability;
        this.profileImage = profileImage;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }

    public String getInterests() { return interests; }
    public void setInterests(String interests) { this.interests = interests; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getAvailability() { return availability; }
    public void setAvailability(String availability) { this.availability = availability; }

    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }
}
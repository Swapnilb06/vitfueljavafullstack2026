package com.volunteerportal.dto;

public class NotificationRequest {

    private Long userId;
    private String title;
    private String message;
    private String type;
    private boolean read;

    public NotificationRequest() {
    }

    public NotificationRequest(Long userId, String title, String message, String type, boolean read) {
        this.userId = userId;
        this.title = title;
        this.message = message;
        this.type = type;
        this.read = read;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }
}
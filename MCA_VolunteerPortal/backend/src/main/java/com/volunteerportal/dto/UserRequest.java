package com.volunteerportal.dto;

import com.volunteerportal.entity.UserRole;

public class UserRequest {

    private String name;
    private String email;
    private String password;
    private UserRole role;
    private String phone;
    private boolean active;

    public UserRequest() {
    }

    public UserRequest(String name, String email, String password, UserRole role,
                        String phone, boolean active) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.phone = phone;
        this.active = active;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
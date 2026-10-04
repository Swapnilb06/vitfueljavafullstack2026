package com.volunteerportal.dto;

import com.volunteerportal.entity.AttendanceStatus;

import java.time.LocalDate;
import java.time.LocalTime;

public class AttendanceResponse {

    private Long id;
    private Long applicationId;
    private LocalDate attendanceDate;
    private AttendanceStatus status;
    private LocalTime checkInTime;
    private LocalTime checkOutTime;

    public AttendanceResponse() {
    }

    public AttendanceResponse(Long id, Long applicationId, LocalDate attendanceDate, AttendanceStatus status,
                               LocalTime checkInTime, LocalTime checkOutTime) {
        this.id = id;
        this.applicationId = applicationId;
        this.attendanceDate = attendanceDate;
        this.status = status;
        this.checkInTime = checkInTime;
        this.checkOutTime = checkOutTime;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getApplicationId() { return applicationId; }
    public void setApplicationId(Long applicationId) { this.applicationId = applicationId; }

    public LocalDate getAttendanceDate() { return attendanceDate; }
    public void setAttendanceDate(LocalDate attendanceDate) { this.attendanceDate = attendanceDate; }

    public AttendanceStatus getStatus() { return status; }
    public void setStatus(AttendanceStatus status) { this.status = status; }

    public LocalTime getCheckInTime() { return checkInTime; }
    public void setCheckInTime(LocalTime checkInTime) { this.checkInTime = checkInTime; }

    public LocalTime getCheckOutTime() { return checkOutTime; }
    public void setCheckOutTime(LocalTime checkOutTime) { this.checkOutTime = checkOutTime; }
}
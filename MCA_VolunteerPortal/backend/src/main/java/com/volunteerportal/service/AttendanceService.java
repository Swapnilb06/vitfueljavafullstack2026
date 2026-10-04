package com.volunteerportal.service;

import com.volunteerportal.entity.Application;
import com.volunteerportal.entity.ApplicationStatus;
import com.volunteerportal.entity.Attendance;
import com.volunteerportal.repository.AttendanceRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;

    public AttendanceService(
            AttendanceRepository attendanceRepository) {

        this.attendanceRepository = attendanceRepository;
    }

    public List<Attendance> findAll() {

        return attendanceRepository.findAll();
    }

    public Attendance findById(Long id) {

        if (id == null) {
            throw new IllegalArgumentException(
                    "Attendance ID is required"
            );
        }

        return attendanceRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Attendance not found with id: " + id
                        )
                );
    }

    public Attendance save(Attendance attendance) {

        validateAttendance(attendance);

        Application application =
                attendance.getApplication();

        /*
         * Attendance can only be recorded for an
         * approved application.
         */
        if (application.getStatus() != ApplicationStatus.APPROVED) {

            throw new IllegalArgumentException(
                    "Attendance can only be recorded for an approved application"
            );
        }

        /*
         * One attendance record is allowed per application.
         */
        boolean attendanceExists =
                attendanceRepository.findAll()
                        .stream()
                        .anyMatch(existing ->
                                existing.getApplication() != null
                                        && existing.getApplication().getId() != null
                                        && existing.getApplication().getId()
                                        .equals(application.getId())
                        );

        if (attendanceExists) {

            throw new IllegalArgumentException(
                    "Attendance already exists for this application"
            );
        }

        return attendanceRepository.save(attendance);
    }

    public Attendance update(
            Long id,
            Attendance attendance) {

        Attendance existing =
                findById(id);

        validateAttendance(attendance);

        Application newApplication =
                attendance.getApplication();

        /*
         * Attendance must remain associated with
         * an approved application.
         */
        if (newApplication.getStatus()
                != ApplicationStatus.APPROVED) {

            throw new IllegalArgumentException(
                    "Attendance can only be associated with an approved application"
            );
        }

        /*
         * Do not allow an attendance record to be
         * transferred to another application.
         *
         * This keeps the one-attendance-per-application
         * relationship safe.
         */
        if (existing.getApplication() == null
                || existing.getApplication().getId() == null
                || newApplication.getId() == null
                || !existing.getApplication().getId()
                        .equals(newApplication.getId())) {

            throw new IllegalArgumentException(
                    "Attendance cannot be transferred to another application"
            );
        }

        existing.setAttendanceDate(
                attendance.getAttendanceDate()
        );

        existing.setStatus(
                attendance.getStatus()
        );

        existing.setCheckInTime(
                attendance.getCheckInTime()
        );

        existing.setCheckOutTime(
                attendance.getCheckOutTime()
        );

        /*
         * Application is intentionally not changed.
         */
        return attendanceRepository.save(existing);
    }

    public void deleteById(Long id) {

        Attendance existing =
                findById(id);

        attendanceRepository.delete(existing);
    }

    private void validateAttendance(
            Attendance attendance) {

        if (attendance == null) {

            throw new IllegalArgumentException(
                    "Attendance data is required"
            );
        }

        if (attendance.getApplication() == null) {

            throw new IllegalArgumentException(
                    "Application is required"
            );
        }

        if (attendance.getApplication().getId() == null) {

            throw new IllegalArgumentException(
                    "Application ID is required"
            );
        }

        if (attendance.getAttendanceDate() == null) {

            throw new IllegalArgumentException(
                    "Attendance date is required"
            );
        }

        if (attendance.getStatus() == null) {

            throw new IllegalArgumentException(
                    "Attendance status is required"
            );
        }

        /*
         * If both times are supplied, check-out cannot
         * be earlier than check-in.
         */
        if (attendance.getCheckInTime() != null
                && attendance.getCheckOutTime() != null
                && attendance.getCheckOutTime()
                        .isBefore(attendance.getCheckInTime())) {

            throw new IllegalArgumentException(
                    "Check-out time cannot be before check-in time"
            );
        }
    }
}
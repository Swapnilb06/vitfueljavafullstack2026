package com.volunteerportal.repository;

import com.volunteerportal.entity.VolunteerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VolunteerProfileRepository extends JpaRepository<VolunteerProfile, Long> {
}
package com.volunteerportal.service;

import com.volunteerportal.entity.VolunteerProfile;
import com.volunteerportal.repository.VolunteerProfileRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VolunteerProfileService {

    private final VolunteerProfileRepository volunteerProfileRepository;

    public VolunteerProfileService(
            VolunteerProfileRepository volunteerProfileRepository) {

        this.volunteerProfileRepository =
                volunteerProfileRepository;
    }

    public List<VolunteerProfile> findAll() {

        return volunteerProfileRepository.findAll();
    }

    public VolunteerProfile findById(Long id) {

        if (id == null) {
            throw new IllegalArgumentException(
                    "Volunteer profile ID is required"
            );
        }

        return volunteerProfileRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "VolunteerProfile not found with id: "
                                        + id
                        )
                );
    }

    public VolunteerProfile save(
            VolunteerProfile volunteerProfile) {

        validateProfile(volunteerProfile);

        /*
         * A user can have only one volunteer profile.
         */
        boolean profileExists =
                volunteerProfileRepository.findAll()
                        .stream()
                        .anyMatch(existing ->
                                existing.getUser() != null
                                        && existing.getUser().getId() != null
                                        && existing.getUser().getId()
                                                .equals(
                                                        volunteerProfile
                                                                .getUser()
                                                                .getId()
                                                )
                        );

        if (profileExists) {
            throw new IllegalArgumentException(
                    "A volunteer profile already exists for this user"
            );
        }

        return volunteerProfileRepository.save(
                volunteerProfile
        );
    }

    public VolunteerProfile update(
            Long id,
            VolunteerProfile volunteerProfile) {

        VolunteerProfile existing =
                findById(id);

        validateProfile(volunteerProfile);

        /*
         * A volunteer profile cannot be transferred
         * to another user.
         */
        if (existing.getUser() == null
                || existing.getUser().getId() == null
                || volunteerProfile.getUser() == null
                || volunteerProfile.getUser().getId() == null
                || !existing.getUser()
                        .getId()
                        .equals(
                                volunteerProfile
                                        .getUser()
                                        .getId()
                        )) {

            throw new IllegalArgumentException(
                    "Volunteer profile cannot be transferred to another user"
            );
        }

        /*
         * The User relationship is intentionally preserved.
         */
        existing.setSkills(
                volunteerProfile.getSkills()
        );

        existing.setInterests(
                volunteerProfile.getInterests()
        );

        existing.setLocation(
                volunteerProfile.getLocation()
        );

        existing.setBio(
                volunteerProfile.getBio()
        );

        existing.setAvailability(
                volunteerProfile.getAvailability()
        );

        existing.setProfileImage(
                volunteerProfile.getProfileImage()
        );

        return volunteerProfileRepository.save(
                existing
        );
    }

    public void deleteById(Long id) {

        VolunteerProfile existing =
                findById(id);

        volunteerProfileRepository.delete(existing);
    }

    private void validateProfile(
            VolunteerProfile volunteerProfile) {

        if (volunteerProfile == null) {

            throw new IllegalArgumentException(
                    "Volunteer profile data is required"
            );
        }

        if (volunteerProfile.getUser() == null) {

            throw new IllegalArgumentException(
                    "User is required"
            );
        }

        if (volunteerProfile.getUser().getId() == null) {

            throw new IllegalArgumentException(
                    "User ID is required"
            );
        }
    }
}
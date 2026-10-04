package com.volunteerportal.service;

import com.volunteerportal.entity.User;
import com.volunteerportal.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> findAll() {

        return userRepository.findAll();
    }

    public User findById(Long id) {

        if (id == null) {
            throw new IllegalArgumentException(
                    "User ID is required"
            );
        }

        return userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found with id: " + id
                        )
                );
    }

    public User save(User user) {

        validateUserForCreate(user);

        String name =
                user.getName().trim();

        String email =
                user.getEmail().trim().toLowerCase();

        /*
         * Prevent duplicate email addresses.
         */
        boolean emailExists =
                userRepository.findByEmail(email)
                        .isPresent();

        if (emailExists) {
            throw new IllegalArgumentException(
                    "A user with this email already exists"
            );
        }

        user.setName(name);
        user.setEmail(email);

        /*
         * Always store passwords as BCrypt hashes.
         */
        user.setPassword(
                passwordEncoder.encode(
                        user.getPassword()
                )
        );

        return userRepository.save(user);
    }

    public User update(
            Long id,
            User user) {

        User existing =
                findById(id);

        validateUserForUpdate(user);

        String name =
                user.getName().trim();

        String email =
                user.getEmail().trim().toLowerCase();

        /*
         * Check whether the new email belongs
         * to another user.
         */
        userRepository.findByEmail(email)
                .ifPresent(foundUser -> {

                    if (!foundUser.getId().equals(id)) {

                        throw new IllegalArgumentException(
                                "A user with this email already exists"
                        );
                    }
                });

        existing.setName(name);
        existing.setEmail(email);
        existing.setRole(user.getRole());
        existing.setPhone(user.getPhone());
        existing.setActive(user.isActive());

        /*
         * Password is updated only when a new password
         * is explicitly supplied.
         */
        if (user.getPassword() != null
                && !user.getPassword()
                        .trim()
                        .isEmpty()) {

            existing.setPassword(
                    passwordEncoder.encode(
                            user.getPassword()
                    )
            );
        }

        return userRepository.save(existing);
    }

    public void deleteById(Long id) {

        User existing =
                findById(id);

        userRepository.delete(existing);
    }

    private void validateUserForCreate(
            User user) {

        if (user == null) {
            throw new IllegalArgumentException(
                    "User data is required"
            );
        }

        validateCommonFields(user);

        if (user.getPassword() == null
                || user.getPassword()
                        .trim()
                        .isEmpty()) {

            throw new IllegalArgumentException(
                    "Password is required"
            );
        }
    }

    private void validateUserForUpdate(
            User user) {

        if (user == null) {
            throw new IllegalArgumentException(
                    "User data is required"
            );
        }

        validateCommonFields(user);
    }

    private void validateCommonFields(
            User user) {

        if (user.getName() == null
                || user.getName()
                        .trim()
                        .isEmpty()) {

            throw new IllegalArgumentException(
                    "Name is required"
            );
        }

        if (user.getEmail() == null
                || user.getEmail()
                        .trim()
                        .isEmpty()) {

            throw new IllegalArgumentException(
                    "Email is required"
            );
        }

        if (user.getRole() == null) {

            throw new IllegalArgumentException(
                    "User role is required"
            );
        }
    }
}
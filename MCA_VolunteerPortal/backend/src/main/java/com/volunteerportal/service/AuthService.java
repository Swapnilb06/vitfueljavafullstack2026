package com.volunteerportal.service;

import com.volunteerportal.dto.AuthRequest;
import com.volunteerportal.dto.AuthResponse;
import com.volunteerportal.entity.User;
import com.volunteerportal.entity.UserRole;
import com.volunteerportal.repository.UserRepository;
import com.volunteerportal.security.JwtService;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public AuthResponse register(
            String name,
            String email,
            String password,
            UserRole role,
            String phone) {

        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Name is required");
        }

        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }

        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }

        if (role == null) {
            throw new IllegalArgumentException("Role is required");
        }

        String normalizedName = name.trim();
        String normalizedEmail = email.trim().toLowerCase();

        if (role == UserRole.ADMIN) {
            throw new IllegalArgumentException(
                    "Admin accounts cannot be created through public registration"
            );
        }

        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new IllegalArgumentException(
                    "A user with this email already exists"
            );
        }

        User user = new User();

        user.setName(normalizedName);
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setPhone(
                phone == null || phone.trim().isEmpty()
                        ? null
                        : phone.trim()
        );
        user.setActive(true);

        User savedUser = userRepository.save(user);

        String token = jwtService.generateToken(savedUser.getEmail());

        return new AuthResponse(
                token,
                "Bearer",
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getRole().name()
        );
    }

    public AuthResponse login(AuthRequest request) {

        if (request == null
                || request.getEmail() == null
                || request.getEmail().trim().isEmpty()) {

            throw new IllegalArgumentException("Email is required");
        }

        if (request.getPassword() == null
                || request.getPassword().trim().isEmpty()) {

            throw new IllegalArgumentException("Password is required");
        }

        String normalizedEmail =
                request.getEmail().trim().toLowerCase();

        Authentication authentication =
                authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                normalizedEmail,
                                request.getPassword()
                        )
                );

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found"
                        )
                );

        String token = jwtService.generateToken(email);

        return new AuthResponse(
                token,
                "Bearer",
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name()
        );
    }
}

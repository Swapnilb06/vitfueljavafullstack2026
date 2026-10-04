package com.volunteerportal.controller;

import com.volunteerportal.dto.NotificationRequest;
import com.volunteerportal.dto.NotificationResponse;
import com.volunteerportal.entity.Notification;
import com.volunteerportal.entity.User;
import com.volunteerportal.service.NotificationService;
import com.volunteerportal.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    public NotificationController(NotificationService notificationService,
                                  UserService userService) {
        this.notificationService = notificationService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getAll(
            Authentication authentication) {

        List<Notification> notifications =
                notificationService.findAll();

        List<NotificationResponse> responses;

        if (isAdmin(authentication)) {

            responses = notifications.stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());

        } else {

            responses = notifications.stream()
                    .filter(notification ->
                            isOwnedByUser(notification, authentication))
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<NotificationResponse> getById(
            @PathVariable Long id,
            Authentication authentication) {

        Notification notification =
                notificationService.findById(id);

        verifyNotificationOwnership(
                notification,
                authentication
        );

        return ResponseEntity.ok(toResponse(notification));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NotificationResponse> create(
            @RequestBody NotificationRequest request,
            Authentication authentication) {

        User user =
                userService.findById(request.getUserId());

        Notification notification =
                toEntity(request, user);

        Notification saved =
                notificationService.save(notification);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(toResponse(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<NotificationResponse> update(
            @PathVariable Long id,
            @RequestBody NotificationRequest request,
            Authentication authentication) {

        Notification existing =
                notificationService.findById(id);

        verifyNotificationOwnership(
                existing,
                authentication
        );

        User user =
                userService.findById(request.getUserId());

        if (!isAdmin(authentication)) {
            verifyUserOwnership(user, authentication);
        }

        Notification notification =
                toEntity(request, user);

        Notification updated =
                notificationService.update(id, notification);

        return ResponseEntity.ok(toResponse(updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            Authentication authentication) {

        Notification notification =
                notificationService.findById(id);

        verifyNotificationOwnership(
                notification,
                authentication
        );

        notificationService.deleteById(id);

        return ResponseEntity.noContent().build();
    }

    // ---------------------------------------------------------
    // Security / ownership helpers
    // ---------------------------------------------------------

    private void verifyNotificationOwnership(
            Notification notification,
            Authentication authentication) {

        if (isAdmin(authentication)) {
            return;
        }

        if (!isOwnedByUser(notification, authentication)) {
            throw new AccessDeniedException(
                    "You are not allowed to access this notification"
            );
        }
    }

    private boolean isOwnedByUser(
            Notification notification,
            Authentication authentication) {

        if (notification == null
                || notification.getUser() == null
                || notification.getUser().getEmail() == null) {

            return false;
        }

        String loggedInEmail =
                authentication.getName();

        String notificationOwnerEmail =
                notification.getUser().getEmail();

        return loggedInEmail.equalsIgnoreCase(
                notificationOwnerEmail
        );
    }

    private void verifyUserOwnership(
            User user,
            Authentication authentication) {

        if (user == null
                || user.getEmail() == null
                || !authentication.getName()
                        .equalsIgnoreCase(user.getEmail())) {

            throw new AccessDeniedException(
                    "You can only modify your own notification"
            );
        }
    }

    private boolean isAdmin(
            Authentication authentication) {

        return hasRole(authentication, "ADMIN");
    }

    private boolean hasRole(
            Authentication authentication,
            String role) {

        return authentication.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(("ROLE_" + role)::equals);
    }

    // ---------------------------------------------------------
    // DTO -> Entity
    // ---------------------------------------------------------

    private Notification toEntity(
            NotificationRequest request,
            User user) {

        Notification notification =
                new Notification();

        notification.setUser(user);
        notification.setTitle(request.getTitle());
        notification.setMessage(request.getMessage());
        notification.setType(request.getType());
        notification.setRead(request.isRead());

        return notification;
    }

    // ---------------------------------------------------------
    // Entity -> DTO
    // ---------------------------------------------------------

    private NotificationResponse toResponse(
            Notification notification) {

        Long userId =
                notification.getUser() != null
                        ? notification.getUser().getId()
                        : null;

        return new NotificationResponse(
                notification.getId(),
                userId,
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
package com.volunteerportal.service;

import com.volunteerportal.entity.Notification;
import com.volunteerportal.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(
            NotificationRepository notificationRepository) {

        this.notificationRepository =
                notificationRepository;
    }

    public List<Notification> findAll() {

        return notificationRepository.findAll();
    }

    public Notification findById(Long id) {

        if (id == null) {
            throw new IllegalArgumentException(
                    "Notification ID is required"
            );
        }

        return notificationRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Notification not found with id: "
                                        + id
                        )
                );
    }

    public Notification save(
            Notification notification) {

        validateNotification(notification);

        notification.setTitle(
                notification.getTitle().trim()
        );

        notification.setMessage(
                notification.getMessage().trim()
        );

        return notificationRepository.save(
                notification
        );
    }

    public Notification update(
            Long id,
            Notification notification) {

        Notification existing =
                findById(id);

        validateNotification(notification);

        if (existing.getUser() == null
                || existing.getUser().getId() == null
                || notification.getUser() == null
                || notification.getUser().getId() == null
                || !existing.getUser()
                        .getId()
                        .equals(
                                notification
                                        .getUser()
                                        .getId()
                        )) {

            throw new IllegalArgumentException(
                    "Notification cannot be transferred to another user"
            );
        }

        existing.setTitle(
                notification.getTitle().trim()
        );

        existing.setMessage(
                notification.getMessage().trim()
        );

        existing.setType(
                notification.getType()
        );

        existing.setRead(
                notification.isRead()
        );

        return notificationRepository.save(
                existing
        );
    }

    public void deleteById(Long id) {

        Notification existing =
                findById(id);

        notificationRepository.delete(existing);
    }

    private void validateNotification(
            Notification notification) {

        if (notification == null) {
            throw new IllegalArgumentException(
                    "Notification data is required"
            );
        }

        if (notification.getUser() == null) {
            throw new IllegalArgumentException(
                    "User is required"
            );
        }

        if (notification.getUser().getId() == null) {
            throw new IllegalArgumentException(
                    "User ID is required"
            );
        }

        if (notification.getTitle() == null
                || notification.getTitle()
                        .trim()
                        .isEmpty()) {

            throw new IllegalArgumentException(
                    "Notification title is required"
            );
        }

        if (notification.getMessage() == null
                || notification.getMessage()
                        .trim()
                        .isEmpty()) {

            throw new IllegalArgumentException(
                    "Notification message is required"
            );
        }
    }
}
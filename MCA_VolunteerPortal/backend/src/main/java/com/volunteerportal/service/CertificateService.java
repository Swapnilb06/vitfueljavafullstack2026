package com.volunteerportal.service;

import com.volunteerportal.entity.Certificate;
import com.volunteerportal.repository.CertificateRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CertificateService {

    private final CertificateRepository certificateRepository;

    public CertificateService(
            CertificateRepository certificateRepository) {

        this.certificateRepository = certificateRepository;
    }

    public List<Certificate> findAll() {

        return certificateRepository.findAll();
    }

    public Certificate findById(Long id) {

        if (id == null) {
            throw new IllegalArgumentException(
                    "Certificate ID is required"
            );
        }

        return certificateRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Certificate not found with id: " + id
                        )
                );
    }

    public Certificate save(Certificate certificate) {

        validateCertificate(certificate);

        String certificateNumber =
                certificate.getCertificateNumber().trim();

        // Prevent duplicate certificate numbers
        boolean alreadyExists =
                certificateRepository.findAll()
                        .stream()
                        .anyMatch(existing ->
                                existing.getCertificateNumber() != null
                                        && existing.getCertificateNumber()
                                                .trim()
                                                .equalsIgnoreCase(
                                                        certificateNumber
                                                )
                        );

        if (alreadyExists) {

            throw new IllegalArgumentException(
                    "A certificate with this certificate number already exists"
            );
        }

        certificate.setCertificateNumber(certificateNumber);

        return certificateRepository.save(certificate);
    }

    public Certificate update(
            Long id,
            Certificate certificate) {

        Certificate existing =
                findById(id);

        validateCertificate(certificate);

        String certificateNumber =
                certificate.getCertificateNumber().trim();

        // Prevent using another certificate's number
        boolean duplicateNumber =
                certificateRepository.findAll()
                        .stream()
                        .anyMatch(other ->
                                !other.getId().equals(id)
                                        && other.getCertificateNumber() != null
                                        && other.getCertificateNumber()
                                                .trim()
                                                .equalsIgnoreCase(
                                                        certificateNumber
                                                )
                        );

        if (duplicateNumber) {

            throw new IllegalArgumentException(
                    "A certificate with this certificate number already exists"
            );
        }

        /*
         * Keep the certificate associated with the supplied
         * volunteer and opportunity.
         */
        existing.setVolunteer(
                certificate.getVolunteer()
        );

        existing.setOpportunity(
                certificate.getOpportunity()
        );

        existing.setCertificateNumber(
                certificateNumber
        );

        existing.setIssueDate(
                certificate.getIssueDate()
        );

        existing.setCertificateUrl(
                certificate.getCertificateUrl()
        );

        return certificateRepository.save(existing);
    }

    public void deleteById(Long id) {

        Certificate existing =
                findById(id);

        certificateRepository.delete(existing);
    }

    private void validateCertificate(
            Certificate certificate) {

        if (certificate == null) {

            throw new IllegalArgumentException(
                    "Certificate data is required"
            );
        }

        if (certificate.getVolunteer() == null) {

            throw new IllegalArgumentException(
                    "Volunteer is required"
            );
        }

        if (certificate.getVolunteer().getId() == null) {

            throw new IllegalArgumentException(
                    "Volunteer ID is required"
            );
        }

        if (certificate.getOpportunity() == null) {

            throw new IllegalArgumentException(
                    "Opportunity is required"
            );
        }

        if (certificate.getOpportunity().getId() == null) {

            throw new IllegalArgumentException(
                    "Opportunity ID is required"
            );
        }

        if (certificate.getCertificateNumber() == null
                || certificate.getCertificateNumber()
                        .trim()
                        .isEmpty()) {

            throw new IllegalArgumentException(
                    "Certificate number is required"
            );
        }

        if (certificate.getIssueDate() == null) {

            throw new IllegalArgumentException(
                    "Issue date is required"
            );
        }
    }
}
package com.volunteerportal.service;

import com.volunteerportal.entity.Certificate;
import com.volunteerportal.entity.Opportunity;
import com.volunteerportal.entity.OrganizationProfile;
import com.volunteerportal.entity.User;
import com.volunteerportal.entity.VolunteerProfile;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;

@Service
public class CertificatePdfService {

    private static final String TEMPLATE_PATH =
            "certificates/certificate-template.pdf";

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("dd MMMM yyyy");

    private static final PDType1Font HELVETICA =
            new PDType1Font(
                    Standard14Fonts.FontName.HELVETICA
            );

    private static final PDType1Font HELVETICA_BOLD =
            new PDType1Font(
                    Standard14Fonts.FontName.HELVETICA_BOLD
            );

    private static final Color TEXT_COLOR =
            new Color(17, 17, 17);

    private static final Color SECONDARY_TEXT_COLOR =
            new Color(70, 70, 70);

    private static final Color COVER_COLOR =
            Color.WHITE;


    /* =========================================================
       Generate Certificate PDF
       ========================================================= */

    public byte[] generateCertificatePdf(
            Certificate certificate) {

        if (certificate == null) {
            throw new IllegalArgumentException(
                    "Certificate is required"
            );
        }

        if (certificate.getVolunteer() == null) {
            throw new IllegalArgumentException(
                    "Certificate volunteer is required"
            );
        }

        if (certificate.getOpportunity() == null) {
            throw new IllegalArgumentException(
                    "Certificate opportunity is required"
            );
        }

        try (
                InputStream templateStream =
                        new ClassPathResource(
                                TEMPLATE_PATH
                        ).getInputStream();

                PDDocument document =
                        Loader.loadPDF(
                                templateStream.readAllBytes()
                        );

                ByteArrayOutputStream outputStream =
                        new ByteArrayOutputStream()
        ) {

            if (document.getNumberOfPages() == 0) {
                throw new IllegalStateException(
                        "Certificate template does not contain any pages"
                );
            }

            PDPage page =
                    document.getPage(0);


            /* -------------------------------------------------
               Dynamic certificate information
               ------------------------------------------------- */

            String volunteerName =
                    getVolunteerName(
                            certificate.getVolunteer()
                    );

            String opportunityTitle =
                    getOpportunityTitle(
                            certificate.getOpportunity()
                    );

            String organizationName =
                    getOrganizationName(
                            certificate.getOpportunity()
                    );

            String issueDate =
                    certificate.getIssueDate() != null
                            ? certificate
                                    .getIssueDate()
                                    .format(
                                            DATE_FORMATTER
                                    )
                            : "";

            String certificateNumber =
                    certificate.getCertificateNumber() != null
                            ? certificate
                                    .getCertificateNumber()
                                    .trim()
                            : "";


            /* -------------------------------------------------
               Write dynamic content
               ------------------------------------------------- */

            try (
                    PDPageContentStream contentStream =
                            new PDPageContentStream(
                                    document,
                                    page,
                                    PDPageContentStream.AppendMode.APPEND,
                                    true,
                                    true
                            )
            ) {

                /*
                 * =================================================
                 * VOLUNTEER NAME
                 * =================================================
                 *
                 * The template contains a gold horizontal line.
                 * The volunteer's name is placed directly above
                 * that line.
                 */
                drawCenteredText(
                        contentStream,
                        volunteerName,
                        HELVETICA_BOLD,
                        24,
                        278,
                        300,
                        703
                );


                /*
                 * =================================================
                 * ORIGINAL RECOGNITION TEXT
                 * =================================================
                 *
                 * Cover only the original sentence.
                 * The gold name line and surrounding design remain
                 * untouched.
                 */
                coverArea(
                        contentStream,
                        270,
                        238,
                        745,
                        270
                );


                /*
                 * =================================================
                 * CUSTOM RECOGNITION TEXT
                 * =================================================
                 */
                String recognitionText =
                        "In recognition of outstanding performance "
                                + "and support to "
                                + opportunityTitle
                                + ".";

                drawCenteredText(
                        contentStream,
                        recognitionText,
                        HELVETICA,
                        13,
                        275,
                        252,
                        735
                );


                /*
                 * =================================================
                 * ORGANIZATION NAME
                 * =================================================
                 *
                 * The template has an organizer line near the
                 * bottom. The organization name appears directly
                 * above that line while the original ORGANIZER
                 * label remains below it.
                 */
                if (!organizationName.isBlank()) {

                    drawCenteredText(
                            contentStream,
                            organizationName,
                            HELVETICA_BOLD,
                            11,
                            275,
                            108,
                            475
                    );
                }


                /*
                 * =================================================
                 * ISSUE DATE
                 * =================================================
                 *
                 * Placed in the lower-right metadata area.
                 */
                if (!issueDate.isBlank()) {

                    drawRightAlignedText(
                            contentStream,
                            "Issued on " + issueDate,
                            HELVETICA,
                            9,
                            785,
                            48
                    );
                }


                /*
                 * =================================================
                 * CERTIFICATE NUMBER
                 * =================================================
                 *
                 * Placed below the issue date.
                 */
                if (!certificateNumber.isBlank()) {

                    drawRightAlignedText(
                            contentStream,
                            "Certificate No. "
                                    + certificateNumber,
                            HELVETICA,
                            9,
                            785,
                            30
                    );
                }
            }


            document.save(
                    outputStream
            );

            return outputStream.toByteArray();

        } catch (IOException exception) {

            throw new RuntimeException(
                    "Unable to generate certificate PDF",
                    exception
            );
        }
    }


    /* =========================================================
       Volunteer Name
       ========================================================= */

    private String getVolunteerName(
            VolunteerProfile volunteerProfile) {

        if (volunteerProfile == null) {
            return "Volunteer";
        }

        User user =
                volunteerProfile.getUser();

        if (user == null) {
            return "Volunteer";
        }

        if (
                user.getName() != null
                        && !user.getName()
                                .trim()
                                .isEmpty()
        ) {

            return user.getName()
                    .trim();
        }

        return "Volunteer";
    }


    /* =========================================================
       Opportunity Title
       ========================================================= */

    private String getOpportunityTitle(
            Opportunity opportunity) {

        if (opportunity == null) {
            return "the event";
        }

        if (
                opportunity.getTitle() != null
                        && !opportunity.getTitle()
                                .trim()
                                .isEmpty()
        ) {

            return opportunity.getTitle()
                    .trim();
        }

        return "the event";
    }


    /* =========================================================
       Organization Name
       ========================================================= */

    private String getOrganizationName(
            Opportunity opportunity) {

        if (opportunity == null) {
            return "";
        }

        OrganizationProfile organization =
                opportunity.getOrganization();

        if (organization == null) {
            return "";
        }

        if (
                organization.getOrganizationName() != null
                        && !organization
                                .getOrganizationName()
                                .trim()
                                .isEmpty()
        ) {

            return organization
                    .getOrganizationName()
                    .trim();
        }

        return "";
    }


    /* =========================================================
       Centered Text
       ========================================================= */

    private void drawCenteredText(
            PDPageContentStream contentStream,
            String text,
            PDType1Font font,
            float fontSize,
            float minX,
            float baselineY,
            float maxX) throws IOException {

        if (
                text == null
                        || text.isBlank()
        ) {
            return;
        }

        float textWidth =
                font.getStringWidth(text)
                        / 1000
                        * fontSize;

        float availableWidth =
                maxX - minX;

        float actualFontSize =
                fontSize;

        /*
         * Reduce font size automatically if the text is
         * wider than the available certificate area.
         */
        if (textWidth > availableWidth) {

            actualFontSize =
                    Math.max(
                            9,
                            fontSize
                                    * availableWidth
                                    / textWidth
                    );

            textWidth =
                    font.getStringWidth(text)
                            / 1000
                            * actualFontSize;
        }

        float x =
                minX
                        + (
                                availableWidth
                                        - textWidth
                        )
                        / 2;

        contentStream.beginText();

        contentStream.setFont(
                font,
                actualFontSize
        );

        contentStream.setNonStrokingColor(
                TEXT_COLOR
        );

        contentStream.newLineAtOffset(
                x,
                baselineY
        );

        contentStream.showText(
                text
        );

        contentStream.endText();
    }


    /* =========================================================
       Right Aligned Text
       ========================================================= */

    private void drawRightAlignedText(
            PDPageContentStream contentStream,
            String text,
            PDType1Font font,
            float fontSize,
            float rightX,
            float baselineY) throws IOException {

        if (
                text == null
                        || text.isBlank()
        ) {
            return;
        }

        float textWidth =
                font.getStringWidth(text)
                        / 1000
                        * fontSize;

        float x =
                rightX - textWidth;

        contentStream.beginText();

        contentStream.setFont(
                font,
                fontSize
        );

        contentStream.setNonStrokingColor(
                SECONDARY_TEXT_COLOR
        );

        contentStream.newLineAtOffset(
                x,
                baselineY
        );

        contentStream.showText(
                text
        );

        contentStream.endText();
    }


    /* =========================================================
       Cover Original Template Text
       ========================================================= */

    private void coverArea(
            PDPageContentStream contentStream,
            float x1,
            float y1,
            float x2,
            float y2) throws IOException {

        contentStream.saveGraphicsState();

        contentStream.setNonStrokingColor(
                COVER_COLOR
        );

        contentStream.addRect(
                x1,
                y1,
                x2 - x1,
                y2 - y1
        );

        contentStream.fill();

        contentStream.restoreGraphicsState();
    }
}
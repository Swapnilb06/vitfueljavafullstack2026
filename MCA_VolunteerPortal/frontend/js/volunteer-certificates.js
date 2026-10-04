/* =========================================================
   Volunteer Certificates
   ========================================================= */

let certificates = [];


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const certificateCount =
    document.getElementById(
        "certificate-count"
    );

const certificatesLoading =
    document.getElementById(
        "certificates-loading"
    );

const certificatesError =
    document.getElementById(
        "certificates-error"
    );

const certificatesErrorMessage =
    document.getElementById(
        "certificates-error-message"
    );

const certificatesEmpty =
    document.getElementById(
        "certificates-empty"
    );

const certificatesList =
    document.getElementById(
        "certificates-list"
    );

const certificatesRetry =
    document.getElementById(
        "certificates-retry"
    );


/* =========================================================
   ACCESS CONTROL
   ========================================================= */

function verifyCertificatePageAccess() {

    if (!isAuthenticated()) {

        window.location.href =
            "login.html";

        return false;
    }

    if (!isVolunteer()) {

        redirectToRoleDashboard();

        return false;
    }

    return true;
}


/* =========================================================
   LOAD CERTIFICATES
   ========================================================= */

async function loadCertificates() {

    showLoading();

    try {

        /*
         * The backend already filters this response
         * according to the authenticated user.
         *
         * Therefore we do NOT compare:
         *
         * User ID
         * with
         * VolunteerProfile ID
         *
         * Those are different database IDs.
         */
        const response =
            await apiGet(
                "/certificates"
            );


        certificates =
            Array.isArray(response)
                ? response
                : [];


        renderCertificates();

    } catch (error) {

        console.error(
            "Unable to load certificates:",
            error
        );

        showError(
            error.message ||
            "Unable to load certificates."
        );
    }
}


/* =========================================================
   RENDER CERTIFICATES
   ========================================================= */

function renderCertificates() {

    hideLoading();

    const count =
        certificates.length;


    if (certificateCount) {

        certificateCount.textContent =
            count === 1
                ? "1 certificate"
                : `${count} certificates`;
    }


    if (count === 0) {

        if (certificatesEmpty) {
            certificatesEmpty.hidden = false;
        }

        if (certificatesList) {
            certificatesList.innerHTML = "";
        }

        return;
    }


    if (certificatesEmpty) {
        certificatesEmpty.hidden = true;
    }


    if (!certificatesList) {
        return;
    }


    certificatesList.innerHTML =
        certificates
            .map(
                createCertificateCard
            )
            .join("");
}


/* =========================================================
   CERTIFICATE CARD
   ========================================================= */

function createCertificateCard(
    certificate
) {

    const certificateNumber =
        certificate.certificateNumber ||
        "Not specified";


    const issueDate =
        certificate.issueDate
            ? formatDate(
                certificate.issueDate
            )
            : "Not specified";


    const opportunityTitle =
        certificate.opportunityTitle ||
        certificate.opportunity?.title ||
        `Opportunity #${
            certificate.opportunityId ||
            "—"
        }`;


    const certificateId =
        certificate.id;


    return `
        <article
            class="certificate-card"
            data-certificate-id="${certificateId}"
        >

            <div class="certificate-card-content">

                <p class="eyebrow">
                    CERTIFICATE
                </p>

                <h3>
                    ${escapeHtml(
                        opportunityTitle
                    )}
                </h3>

                <div class="certificate-meta">

                    <div>
                        <span>
                            Certificate number
                        </span>

                        <strong>
                            ${escapeHtml(
                                certificateNumber
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Issue date
                        </span>

                        <strong>
                            ${escapeHtml(
                                issueDate
                            )}
                        </strong>
                    </div>

                </div>

            </div>


            <div class="certificate-card-actions">

                <button
                    type="button"
                    class="button button-primary"
                    data-certificate-view="${certificateId}"
                >
                    View Certificate
                </button>

                <button
                    type="button"
                    class="button button-secondary"
                    data-certificate-download="${certificateId}"
                >
                    Download PDF
                </button>

            </div>

        </article>
    `;
}


/* =========================================================
   VIEW CERTIFICATE
   ========================================================= */

async function viewCertificate(
    certificateId
) {

    if (!certificateId) {
        return;
    }


    try {

        showNotification(
            "Preparing certificate...",
            "info"
        );


        const blob =
            await apiGetBlob(
                `/certificates/${certificateId}/pdf`
            );


        const pdfUrl =
            URL.createObjectURL(blob);


        /*
         * Open the generated PDF in a new browser tab.
         */
        const newWindow =
            window.open(
                pdfUrl,
                "_blank"
            );


        if (!newWindow) {

            /*
             * Browser popup blocker fallback.
             */
            const link =
                document.createElement(
                    "a"
                );

            link.href =
                pdfUrl;

            link.target =
                "_blank";

            link.rel =
                "noopener";

            link.click();
        }


        /*
         * Give the browser time to load the
         * object URL before releasing it.
         */
        setTimeout(
            () => {
                URL.revokeObjectURL(
                    pdfUrl
                );
            },
            60000
        );


    } catch (error) {

        console.error(
            "Unable to view certificate:",
            error
        );

        showNotification(
            error.message ||
            "Unable to open certificate.",
            "error"
        );
    }
}


/* =========================================================
   DOWNLOAD CERTIFICATE
   ========================================================= */

async function downloadCertificate(
    certificateId
) {

    if (!certificateId) {
        return;
    }


    try {

        showNotification(
            "Preparing certificate PDF...",
            "info"
        );


        const blob =
            await apiGetBlob(
                `/certificates/${certificateId}/pdf`
            );


        const certificate =
            certificates.find(
                item =>
                    Number(item.id) ===
                    Number(certificateId)
            );


        const certificateNumber =
            certificate?.certificateNumber ||
            `certificate-${certificateId}`;


        const safeFileName =
            String(
                certificateNumber
            )
                .replace(
                    /[^a-zA-Z0-9-_]/g,
                    "_"
                );


        const fileName =
            `VolunteerCertificate-${safeFileName}.pdf`;


        const pdfUrl =
            URL.createObjectURL(blob);


        const link =
            document.createElement(
                "a"
            );


        link.href =
            pdfUrl;

        link.download =
            fileName;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        setTimeout(
            () => {
                URL.revokeObjectURL(
                    pdfUrl
                );
            },
            60000
        );


        showNotification(
            "Certificate downloaded successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Unable to download certificate:",
            error
        );

        showNotification(
            error.message ||
            "Unable to download certificate.",
            "error"
        );
    }
}


/* =========================================================
   BUTTON EVENTS
   ========================================================= */

function handleCertificateAction(
    event
) {

    const viewButton =
        event.target.closest(
            "[data-certificate-view]"
        );


    if (viewButton) {

        viewCertificate(
            viewButton.dataset
                .certificateView
        );

        return;
    }


    const downloadButton =
        event.target.closest(
            "[data-certificate-download]"
        );


    if (downloadButton) {

        downloadCertificate(
            downloadButton.dataset
                .certificateDownload
        );
    }
}


/* =========================================================
   STATES
   ========================================================= */

function showLoading() {

    if (certificatesLoading) {
        certificatesLoading.hidden =
            false;
    }

    if (certificatesError) {
        certificatesError.hidden =
            true;
    }

    if (certificatesEmpty) {
        certificatesEmpty.hidden =
            true;
    }

    if (certificatesList) {
        certificatesList.innerHTML =
            "";
    }
}


function hideLoading() {

    if (certificatesLoading) {
        certificatesLoading.hidden =
            true;
    }
}


function showError(message) {

    if (certificatesLoading) {
        certificatesLoading.hidden =
            true;
    }

    if (certificatesEmpty) {
        certificatesEmpty.hidden =
            true;
    }

    if (certificatesErrorMessage) {

        certificatesErrorMessage.textContent =
            message ||
            "Unable to load certificates.";
    }

    if (certificatesError) {
        certificatesError.hidden =
            false;
    }
}


/* =========================================================
   HTML ESCAPING
   ========================================================= */

function escapeHtml(value) {

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeVolunteerCertificates() {

    if (
        !verifyCertificatePageAccess()
    ) {
        return;
    }


    if (certificatesList) {

        certificatesList.addEventListener(
            "click",
            handleCertificateAction
        );
    }


    if (certificatesRetry) {

        certificatesRetry.addEventListener(
            "click",
            loadCertificates
        );
    }


    await loadCertificates();
}


document.addEventListener(
    "DOMContentLoaded",
    initializeVolunteerCertificates
);
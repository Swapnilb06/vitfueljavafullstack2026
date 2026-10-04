/* =========================================================
   Organization Certificates
   ========================================================= */

let certificates = [];


/* =========================================================
   DOM
   ========================================================= */

const certificateForm =
    document.getElementById(
        "certificate-form"
    );

const certificateFormError =
    document.getElementById(
        "certificate-form-error"
    );

const certificateFormSuccess =
    document.getElementById(
        "certificate-form-success"
    );

const createCertificateButton =
    document.getElementById(
        "create-certificate-button"
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

const certificateCount =
    document.getElementById(
        "certificate-count"
    );

const certificatesRetry =
    document.getElementById(
        "certificates-retry"
    );


/* =========================================================
   Access
   ========================================================= */

function verifyCertificateAccess() {

    if (!isAuthenticated()) {

        window.location.href =
            "login.html";

        return false;
    }


    if (!isOrganization()) {

        redirectToRoleDashboard();

        return false;
    }


    return true;
}


/* =========================================================
   Form Messages
   ========================================================= */

function clearCertificateMessages() {

    if (certificateFormError) {

        certificateFormError.hidden = true;

        certificateFormError.textContent = "";
    }


    if (certificateFormSuccess) {

        certificateFormSuccess.hidden = true;

        certificateFormSuccess.textContent = "";
    }
}


function showCertificateFormError(
    message
) {

    if (certificateFormError) {

        certificateFormError.textContent =
            message;

        certificateFormError.hidden = false;
    }


    if (certificateFormSuccess) {

        certificateFormSuccess.hidden = true;
    }
}


function showCertificateFormSuccess(
    message
) {

    if (certificateFormSuccess) {

        certificateFormSuccess.textContent =
            message;

        certificateFormSuccess.hidden = false;
    }


    if (certificateFormError) {

        certificateFormError.hidden = true;
    }
}


/* =========================================================
   Load Certificates
   ========================================================= */

async function loadCertificates() {

    showLoading();

    try {

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
   Render
   ========================================================= */

function renderCertificates() {

    hideLoading();


    if (certificateCount) {

        certificateCount.textContent =
            certificates.length === 1
                ? "1 certificate"
                : `${certificates.length} certificates`;
    }


    if (
        certificates.length === 0
    ) {

        if (certificatesEmpty) {

            certificatesEmpty.hidden =
                false;
        }


        if (certificatesList) {

            certificatesList.innerHTML =
                "";
        }


        return;
    }


    if (certificatesEmpty) {

        certificatesEmpty.hidden =
            true;
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
   Certificate Card
   ========================================================= */

function createCertificateCard(
    certificate
) {

    const issueDate =
        certificate.issueDate
            ? formatDate(
                certificate.issueDate
            )
            : "Date not specified";


    const certificateNumber =
        certificate.certificateNumber ||
        "No certificate number";


    const volunteerId =
        certificate.volunteerId ||
        certificate.volunteer?.id ||
        "—";


    const opportunityId =
        certificate.opportunityId ||
        certificate.opportunity?.id ||
        "—";


    const certificateId =
        certificate.id;


    return `

        <article
            class="certificate-card"
            data-certificate-id="${certificateId}"
        >

            <div class="certificate-card-header">

                <span class="eyebrow">
                    Certificate
                </span>

                <span class="status-badge status-success">
                    Issued
                </span>

            </div>


            <div class="certificate-card-body">

                <h3>
                    ${escapeHtml(
                        certificateNumber
                    )}
                </h3>


                <dl class="certificate-details">

                    <div>

                        <dt>
                            Volunteer
                        </dt>

                        <dd>
                            ${escapeHtml(
                                String(volunteerId)
                            )}
                        </dd>

                    </div>


                    <div>

                        <dt>
                            Opportunity
                        </dt>

                        <dd>
                            ${escapeHtml(
                                String(opportunityId)
                            )}
                        </dd>

                    </div>


                    <div>

                        <dt>
                            Issued
                        </dt>

                        <dd>
                            ${escapeHtml(
                                issueDate
                            )}
                        </dd>

                    </div>

                </dl>


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


                ${
                    certificate.certificateUrl
                        ? `
                            <a
                                href="${escapeHtml(
                                    certificate.certificateUrl
                                )}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="text-link"
                            >
                                Open external certificate link
                            </a>
                        `
                        : ""
                }

            </div>

        </article>

    `;
}


/* =========================================================
   Create Certificate
   ========================================================= */

async function createCertificate(
    event
) {

    event.preventDefault();

    clearCertificateMessages();


    const volunteerId =
        Number(
            document.getElementById(
                "volunteerId"
            ).value
        );


    const opportunityId =
        Number(
            document.getElementById(
                "opportunityId"
            ).value
        );


    const certificateNumber =
        document.getElementById(
            "certificateNumber"
        ).value.trim();


    const issueDate =
        document.getElementById(
            "issueDate"
        ).value;


    const certificateUrl =
        document.getElementById(
            "certificateUrl"
        ).value.trim();


    /* ---------------------------------------------------------
       Validation
       --------------------------------------------------------- */

    if (
        !volunteerId ||
        volunteerId < 1
    ) {

        showCertificateFormError(
            "A valid volunteer ID is required."
        );

        return;
    }


    if (
        !opportunityId ||
        opportunityId < 1
    ) {

        showCertificateFormError(
            "A valid opportunity ID is required."
        );

        return;
    }


    if (!certificateNumber) {

        showCertificateFormError(
            "Certificate number is required."
        );

        return;
    }


    /*
     * The backend now requires an issue date because
     * the generated PDF displays the date.
     */
    if (!issueDate) {

        showCertificateFormError(
            "Issue date is required."
        );

        return;
    }


    /* ---------------------------------------------------------
       Payload
       --------------------------------------------------------- */

    const payload = {

        volunteerId,

        opportunityId,

        certificateNumber,

        issueDate
    };


    if (certificateUrl) {

        payload.certificateUrl =
            certificateUrl;
    }


    /* ---------------------------------------------------------
       Create
       --------------------------------------------------------- */

    try {

        setButtonLoading(
            createCertificateButton,
            true,
            "Issuing..."
        );


        await apiPost(
            "/certificates",
            payload
        );


        showCertificateFormSuccess(
            "Certificate issued successfully. The PDF is ready for the volunteer."
        );


        certificateForm.reset();


        await loadCertificates();


    } catch (error) {

        console.error(
            "Unable to issue certificate:",
            error
        );


        showCertificateFormError(
            error.message ||
            "Unable to issue certificate."
        );


    } finally {

        setButtonLoading(
            createCertificateButton,
            false
        );
    }
}


/* =========================================================
   View Certificate PDF
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
            URL.createObjectURL(
                blob
            );


        const newWindow =
            window.open(
                pdfUrl,
                "_blank"
            );


        /*
         * Popup-blocker fallback.
         */
        if (!newWindow) {

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
   Download Certificate PDF
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
            URL.createObjectURL(
                blob
            );


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
   Certificate Actions
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
   States
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
   Initialize
   ========================================================= */

async function initializeCertificates() {

    if (!verifyCertificateAccess()) {
        return;
    }


    if (certificateForm) {

        certificateForm.addEventListener(
            "submit",
            createCertificate
        );
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


/* =========================================================
   Start
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeCertificates
);
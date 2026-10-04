/* =========================================================
   VolunteerPortalJava
   Volunteer Applications Page
   ========================================================= */


/* =========================================================
   DOM Elements
   ========================================================= */

const applicationsLoading =
    document.getElementById(
        "applications-loading"
    );

const applicationsError =
    document.getElementById(
        "applications-error"
    );

const applicationsErrorMessage =
    document.getElementById(
        "applications-error-message"
    );

const applicationsEmpty =
    document.getElementById(
        "applications-empty"
    );

const applicationsList =
    document.getElementById(
        "applications-list"
    );

const applicationsRetry =
    document.getElementById(
        "applications-retry"
    );

const applicationCount =
    document.getElementById(
        "application-count"
    );


/* =========================================================
   State
   ========================================================= */

let applications = [];

let opportunities = [];


/* =========================================================
   Require Volunteer
   ========================================================= */

function verifyVolunteerAccess() {

    if (!isAuthenticated()) {

        window.location.href =
            "login.html";

        return false;
    }


    if (!isVolunteer()) {

        /*
         * Organization/admin users should not use
         * the volunteer application page.
         */

        redirectToRoleDashboard();

        return false;
    }


    return true;
}


/* =========================================================
   Loading State
   ========================================================= */

function showApplicationsLoading() {

    if (applicationsLoading) {
        applicationsLoading.hidden = false;
    }

    if (applicationsError) {
        applicationsError.hidden = true;
    }

    if (applicationsEmpty) {
        applicationsEmpty.hidden = true;
    }

    if (applicationsList) {
        applicationsList.innerHTML = "";
    }
}


/* =========================================================
   Error State
   ========================================================= */

function showApplicationsError(message) {

    if (applicationsLoading) {
        applicationsLoading.hidden = true;
    }

    if (applicationsEmpty) {
        applicationsEmpty.hidden = true;
    }

    if (applicationsList) {
        applicationsList.innerHTML = "";
    }

    if (applicationsErrorMessage) {

        applicationsErrorMessage.textContent =
            message ||
            "Unable to load your applications.";
    }

    if (applicationsError) {
        applicationsError.hidden = false;
    }
}


/* =========================================================
   Empty State
   ========================================================= */

function showApplicationsEmpty() {

    if (applicationsLoading) {
        applicationsLoading.hidden = true;
    }

    if (applicationsError) {
        applicationsError.hidden = true;
    }

    if (applicationsEmpty) {
        applicationsEmpty.hidden = false;
    }

    if (applicationsList) {
        applicationsList.innerHTML = "";
    }
}


/* =========================================================
   Load Applications
   ========================================================= */

async function loadApplications() {

    showApplicationsLoading();


    try {

        /*
         * Backend automatically filters this response
         * to the currently authenticated volunteer.
         */

        const applicationResponse =
            await apiGet(
                "/applications"
            );


        if (!Array.isArray(applicationResponse)) {

            throw new Error(
                "Unexpected applications response."
            );
        }


        applications =
            applicationResponse;


        /*
         * Load opportunities so we can display
         * opportunity titles and information.
         */

        const opportunityResponse =
            await apiGet(
                "/opportunities"
            );


        if (Array.isArray(opportunityResponse)) {

            opportunities =
                opportunityResponse;

        } else {

            opportunities = [];
        }


        renderApplications();


    } catch (error) {

        console.error(
            "Failed to load applications:",
            error
        );

        showApplicationsError(
            error.message ||
            "Unable to load your applications."
        );
    }
}


/* =========================================================
   Find Opportunity
   ========================================================= */

function findOpportunity(
    opportunityId
) {

    return opportunities.find(
        (opportunity) =>
            Number(opportunity.id) ===
            Number(opportunityId)
    );
}


/* =========================================================
   Render Applications
   ========================================================= */

function renderApplications() {

    if (applicationCount) {

        applicationCount.textContent =
            applications.length === 1
                ? "1 application"
                : `${applications.length} applications`;
    }


    if (
        !applications ||
        applications.length === 0
    ) {

        showApplicationsEmpty();

        return;
    }


    if (applicationsLoading) {
        applicationsLoading.hidden = true;
    }

    if (applicationsError) {
        applicationsError.hidden = true;
    }

    if (applicationsEmpty) {
        applicationsEmpty.hidden = true;
    }


    if (!applicationsList) {
        return;
    }


    applicationsList.innerHTML =
        applications
            .map(
                createApplicationCard
            )
            .join("");
}


/* =========================================================
   Create Application Card
   ========================================================= */

function createApplicationCard(
    application
) {

    const opportunity =
        findOpportunity(
            application.opportunityId
        );


    const title =
        opportunity?.title ||
        `Opportunity #${application.opportunityId}`;


    const location =
        opportunity?.location ||
        "Location not specified";


    const startDate =
        opportunity?.startDate
            ? formatDate(
                opportunity.startDate
            )
            : "Date not specified";


    const status =
        String(
            application.status ||
            "UNKNOWN"
        ).toUpperCase();


    const statusClass =
        getStatusBadgeClass(
            status
        );


    const appliedDate =
        application.appliedAt
            ? formatDateTime(
                application.appliedAt
            )
            : "Not available";


    const opportunityId =
        Number(
            application.opportunityId
        );


    return `

        <article
            class="application-card"
            data-application-id="${application.id}"
        >

            <div class="application-card-main">

                <div class="application-card-header">

                    <div>

                        <p class="eyebrow">
                            Application #${application.id}
                        </p>

                        <h3>
                            ${escapeHtml(title)}
                        </h3>

                    </div>

                    <span
                        class="status-badge ${statusClass}"
                    >
                        ${escapeHtml(
                            formatStatus(status)
                        )}
                    </span>

                </div>


                <div class="application-card-meta">

                    <div class="application-meta-item">

                        <span class="meta-label">
                            Location
                        </span>

                        <span class="meta-value">
                            ${escapeHtml(location)}
                        </span>

                    </div>


                    <div class="application-meta-item">

                        <span class="meta-label">
                            Opportunity date
                        </span>

                        <span class="meta-value">
                            ${escapeHtml(startDate)}
                        </span>

                    </div>


                    <div class="application-meta-item">

                        <span class="meta-label">
                            Applied
                        </span>

                        <span class="meta-value">
                            ${escapeHtml(appliedDate)}
                        </span>

                    </div>

                </div>

            </div>


            <div class="application-card-footer">

                <a
                    href="opportunity-details.html?id=${encodeURIComponent(opportunityId)}"
                    class="text-link"
                >
                    View opportunity
                    <span aria-hidden="true">
                        →
                    </span>
                </a>


                ${
                    status === "PENDING"
                        ? `
                            <button
                                type="button"
                                class="text-button text-button-danger"
                                data-action="cancel"
                                data-application-id="${application.id}"
                            >
                                Withdraw application
                            </button>
                          `
                        : ""
                }

            </div>

        </article>

    `;
}


/* =========================================================
   Withdraw Application
   ========================================================= */

async function withdrawApplication(
    applicationId
) {

    const application =
        applications.find(
            (item) =>
                Number(item.id) ===
                Number(applicationId)
        );


    if (!application) {

        showNotification(
            "Application could not be found.",
            "error"
        );

        return;
    }


    /*
     * Only pending applications are offered
     * a withdrawal button in this UI.
     */

    if (
        String(application.status)
            .toUpperCase() !==
        "PENDING"
    ) {

        showNotification(
            "Only pending applications can be withdrawn.",
            "error"
        );

        return;
    }


    const confirmed =
        await showConfirmation(
            "Withdraw this application?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiDelete(
            `/applications/${applicationId}`
        );


        showNotification(
            "Application withdrawn successfully.",
            "success"
        );


        await loadApplications();


    } catch (error) {

        console.error(
            "Failed to withdraw application:",
            error
        );


        showNotification(
            error.message ||
            "Unable to withdraw the application.",
            "error"
        );
    }
}


/* =========================================================
   Application List Click Handler
   ========================================================= */

function handleApplicationListClick(
    event
) {

    const actionButton =
        event.target.closest(
            "[data-action]"
        );


    if (!actionButton) {
        return;
    }


    const action =
        actionButton.dataset.action;


    const applicationId =
        actionButton.dataset.applicationId;


    if (
        action === "cancel" &&
        applicationId
    ) {

        withdrawApplication(
            applicationId
        );
    }
}


/* =========================================================
   Initialize
   ========================================================= */

function initializeApplicationsPage() {

    if (!verifyVolunteerAccess()) {
        return;
    }


    if (applicationsRetry) {

        applicationsRetry.addEventListener(
            "click",
            loadApplications
        );

    }


    if (applicationsList) {

        applicationsList.addEventListener(
            "click",
            handleApplicationListClick
        );

    }


    loadApplications();
}


/* =========================================================
   Start
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeApplicationsPage
);
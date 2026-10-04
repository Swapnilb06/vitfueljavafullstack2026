/* =========================================================
   VolunteerPortalJava
   Organization Applications
   ========================================================= */


/* =========================================================
   State
   ========================================================= */

let applications = [];

let opportunities = [];

let volunteerProfiles = [];

let organizationProfile = null;


/* =========================================================
   DOM
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
        "organization-applications-list"
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
   Access
   ========================================================= */

function verifyOrganizationAccess() {

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
   Loading
   ========================================================= */

function showLoading() {

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
   Error
   ========================================================= */

function showError(message) {

    if (applicationsLoading) {
        applicationsLoading.hidden = true;
    }

    if (applicationsEmpty) {
        applicationsEmpty.hidden = true;
    }

    if (applicationsErrorMessage) {

        applicationsErrorMessage.textContent =
            message ||
            "Unable to load applications.";
    }

    if (applicationsError) {
        applicationsError.hidden = false;
    }
}


/* =========================================================
   Empty
   ========================================================= */

function showEmpty() {

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
   Load Organization Profile
   ========================================================= */

async function loadOrganizationProfile() {

    const response =
        await apiGet(
            "/organization-profiles"
        );


    if (!Array.isArray(response)) {
        return null;
    }


    const currentUserId =
        Number(getCurrentUserId());


    return response.find(
        profile =>
            Number(profile.userId) === currentUserId ||
            Number(profile.user?.id) === currentUserId
    ) || response[0] || null;
}


/* =========================================================
   Load Data
   ========================================================= */

async function loadApplications() {

    showLoading();


    try {

        organizationProfile =
            await loadOrganizationProfile();


        /*
         * The backend already restricts this endpoint
         * to applications belonging to the authenticated
         * organization.
         */

        const applicationResponse =
            await apiGet(
                "/applications"
            );


        applications =
            Array.isArray(applicationResponse)
                ? applicationResponse
                : [];


        /*
         * Load opportunities so we can display
         * their titles.
         */

        const opportunityResponse =
            await apiGet(
                "/opportunities"
            );


        opportunities =
            Array.isArray(opportunityResponse)
                ? opportunityResponse
                : [];


        /*
         * Load volunteer profiles.
         *
         * If this endpoint is unavailable, applications
         * still remain usable.
         */

        try {

            const volunteerResponse =
                await apiGet(
                    "/volunteer-profiles"
                );


            volunteerProfiles =
                Array.isArray(volunteerResponse)
                    ? volunteerResponse
                    : [];

        } catch (error) {

            console.warn(
                "Volunteer profiles could not be loaded:",
                error
            );

            volunteerProfiles = [];
        }


        renderApplications();


    } catch (error) {

        console.error(
            "Failed to load organization applications:",
            error
        );


        showError(
            error.message ||
            "Unable to load applications."
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
        opportunity =>
            Number(opportunity.id) ===
            Number(opportunityId)
    );
}


/* =========================================================
   Find Volunteer
   ========================================================= */

function findVolunteer(
    volunteerId
) {

    return volunteerProfiles.find(
        volunteer =>
            Number(volunteer.id) ===
            Number(volunteerId)
    );
}


/* =========================================================
   Volunteer Name
   ========================================================= */

function getVolunteerName(
    volunteer
) {

    if (!volunteer) {

        return "Volunteer #" +
            volunteer?.id;
    }


    if (
        volunteer.name &&
        String(volunteer.name).trim()
    ) {

        return volunteer.name;
    }


    if (
        volunteer.user &&
        volunteer.user.name
    ) {

        return volunteer.user.name;
    }


    if (
        volunteer.fullName
    ) {

        return volunteer.fullName;
    }


    if (
        volunteer.user &&
        volunteer.user.email
    ) {

        return volunteer.user.email;
    }


    return `Volunteer #${volunteer.id}`;
}


/* =========================================================
   Organization Opportunity Check
   ========================================================= */

function isOrganizationOpportunity(
    opportunity
) {

    if (!organizationProfile) {
        return true;
    }


    const organizationId =
        Number(organizationProfile.id);


    if (
        Number(
            opportunity.organizationId
        ) === organizationId
    ) {

        return true;
    }


    if (
        opportunity.organization &&
        Number(
            opportunity.organization.id
        ) === organizationId
    ) {

        return true;
    }


    /*
     * If opportunity data does not expose organization
     * information, don't incorrectly hide it.
     */

    if (
        opportunity.organizationId == null &&
        !opportunity.organization
    ) {

        return true;
    }


    return false;
}


/* =========================================================
   Filter Organization Applications
   ========================================================= */

function getOrganizationApplications() {

    const ownedOpportunityIds =
        opportunities
            .filter(
                isOrganizationOpportunity
            )
            .map(
                opportunity =>
                    Number(opportunity.id)
            );


    /*
     * If we cannot determine opportunity ownership,
     * trust the backend's organization-level filtering.
     */

    if (
        ownedOpportunityIds.length === 0 &&
        applications.length > 0
    ) {

        return applications;
    }


    return applications.filter(
        application =>
            ownedOpportunityIds.includes(
                Number(application.opportunityId)
            )
    );
}


/* =========================================================
   Render
   ========================================================= */

function renderApplications() {

    const organizationApplications =
        getOrganizationApplications();


    if (applicationCount) {

        applicationCount.textContent =
            organizationApplications.length === 1
                ? "1 application"
                : `${organizationApplications.length} applications`;
    }


    if (
        organizationApplications.length === 0
    ) {

        showEmpty();

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
        organizationApplications
            .map(
                createApplicationCard
            )
            .join("");
}


/* =========================================================
   Create Card
   ========================================================= */

function createApplicationCard(
    application
) {

    const opportunity =
        findOpportunity(
            application.opportunityId
        );


    const volunteer =
        findVolunteer(
            application.volunteerId
        );


    const opportunityTitle =
        opportunity?.title ||
        `Opportunity #${application.opportunityId}`;


    const volunteerName =
        getVolunteerName(
            volunteer
        );


    const volunteerEmail =
        volunteer?.user?.email ||
        volunteer?.email ||
        "Email not available";


    const location =
        opportunity?.location ||
        "Location not specified";


    const appliedAt =
        application.appliedAt
            ? formatDateTime(
                application.appliedAt
            )
            : "Not available";


    const status =
        String(
            application.status ||
            "UNKNOWN"
        ).toUpperCase();


    const statusClass =
        getStatusBadgeClass(
            status
        );


    const applicationId =
        Number(application.id);


    return `

        <article
            class="application-card"
            data-application-id="${applicationId}"
        >

            <div class="application-card-main">


                <div class="application-card-header">

                    <div>

                        <p class="eyebrow">
                            Application #${applicationId}
                        </p>

                        <h3>
                            ${escapeHtml(
                                opportunityTitle
                            )}
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
                            Volunteer
                        </span>

                        <span class="meta-value">
                            ${escapeHtml(
                                volunteerName
                            )}
                        </span>

                    </div>


                    <div class="application-meta-item">

                        <span class="meta-label">
                            Email
                        </span>

                        <span class="meta-value">
                            ${escapeHtml(
                                volunteerEmail
                            )}
                        </span>

                    </div>


                    <div class="application-meta-item">

                        <span class="meta-label">
                            Location
                        </span>

                        <span class="meta-value">
                            ${escapeHtml(
                                location
                            )}
                        </span>

                    </div>


                    <div class="application-meta-item">

                        <span class="meta-label">
                            Applied
                        </span>

                        <span class="meta-value">
                            ${escapeHtml(
                                appliedAt
                            )}
                        </span>

                    </div>


                </div>

            </div>


            <div class="application-card-footer">


                <a
                    href="opportunity-details.html?id=${encodeURIComponent(
                        application.opportunityId
                    )}"
                    class="text-link"
                >
                    View opportunity →
                </a>


                <div class="application-actions">

                    ${
                        status === "PENDING"
                            ? `

                                <button
                                    type="button"
                                    class="button button-primary"
                                    data-action="approve"
                                    data-application-id="${applicationId}"
                                >
                                    Approve
                                </button>

                                <button
                                    type="button"
                                    class="button button-secondary"
                                    data-action="reject"
                                    data-application-id="${applicationId}"
                                >
                                    Reject
                                </button>

                              `
                            : ""
                    }


                    ${
                        status === "APPROVED"
                            ? `

                                <button
                                    type="button"
                                    class="button button-primary"
                                    data-action="complete"
                                    data-application-id="${applicationId}"
                                >
                                    Mark completed
                                </button>

                              `
                            : ""
                    }


                    ${
                        status === "REJECTED"
                            ? `

                                <span class="text-muted">
                                    Application rejected
                                </span>

                              `
                            : ""
                    }


                    ${
                        status === "COMPLETED"
                            ? `

                                <span class="text-muted">
                                    Participation completed
                                </span>

                              `
                            : ""
                    }

                </div>


            </div>

        </article>

    `;
}


/* =========================================================
   Update Application Status
   ========================================================= */

async function updateApplicationStatus(
    applicationId,
    newStatus
) {

    const application =
        applications.find(
            item =>
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


    const confirmed =
        await showConfirmation(
            `Change this application to ${formatStatus(newStatus)}?`
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiPut(
            `/applications/${applicationId}`,
            {
                volunteerId:
                    Number(application.volunteerId),

                opportunityId:
                    Number(application.opportunityId),

                status:
                    newStatus
            }
        );


        showNotification(
            `Application ${formatStatus(newStatus).toLowerCase()} successfully.`,
            "success"
        );


        await loadApplications();


    } catch (error) {

        console.error(
            "Failed to update application:",
            error
        );


        showNotification(
            error.message ||
            "Unable to update application.",
            "error"
        );
    }
}


/* =========================================================
   Click Handler
   ========================================================= */

function handleApplicationClick(
    event
) {

    const button =
        event.target.closest(
            "[data-action]"
        );


    if (!button) {
        return;
    }


    const action =
        button.dataset.action;


    const applicationId =
        button.dataset.applicationId;


    if (!applicationId) {
        return;
    }


    if (action === "approve") {

        updateApplicationStatus(
            applicationId,
            "APPROVED"
        );

        return;
    }


    if (action === "reject") {

        updateApplicationStatus(
            applicationId,
            "REJECTED"
        );

        return;
    }


    if (action === "complete") {

        updateApplicationStatus(
            applicationId,
            "COMPLETED"
        );
    }
}


/* =========================================================
   Initialize
   ========================================================= */

function initializeOrganizationApplications() {

    if (!verifyOrganizationAccess()) {
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
            handleApplicationClick
        );
    }


    loadApplications();
}


document.addEventListener(
    "DOMContentLoaded",
    initializeOrganizationApplications
);
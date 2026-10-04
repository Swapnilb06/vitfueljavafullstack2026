

let applications = [];
let certificates = [];
let opportunities = [];


/* =========================================================
   DOM
   ========================================================= */

const volunteerName =
    document.getElementById(
        "volunteer-name"
    );

const applicationCount =
    document.getElementById(
        "application-count"
    );

const approvedCount =
    document.getElementById(
        "approved-count"
    );

const completedCount =
    document.getElementById(
        "completed-count"
    );

const certificateCount =
    document.getElementById(
        "certificate-count"
    );

const dashboardLoading =
    document.getElementById(
        "dashboard-loading"
    );

const dashboardError =
    document.getElementById(
        "dashboard-error"
    );

const dashboardErrorMessage =
    document.getElementById(
        "dashboard-error-message"
    );

const dashboardRetry =
    document.getElementById(
        "dashboard-retry"
    );

const recentApplications =
    document.getElementById(
        "recent-applications"
    );


/* =========================================================
   Access
   ========================================================= */

function verifyVolunteerAccess() {

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
   Status Helpers
   ========================================================= */

/*
 * Returns the CSS class used by the status badge.
 *
 * These classes are compatible with the existing
 * status-badge styling used throughout the frontend.
 */

function getStatusBadgeClass(status) {

    const normalizedStatus =
        String(
            status || "PENDING"
        ).toUpperCase();


    switch (normalizedStatus) {

        case "APPROVED":
            return "status-approved";

        case "COMPLETED":
            return "status-completed";

        case "REJECTED":
            return "status-rejected";

        case "CANCELLED":
            return "status-cancelled";

        case "PENDING":
        default:
            return "status-pending";
    }
}


/*
 * Converts the backend enum value into
 * readable text for the user.
 */

function formatStatus(status) {

    const normalizedStatus =
        String(
            status || "PENDING"
        ).toUpperCase();


    switch (normalizedStatus) {

        case "APPROVED":
            return "Approved";

        case "COMPLETED":
            return "Completed";

        case "REJECTED":
            return "Rejected";

        case "CANCELLED":
            return "Cancelled";

        case "PENDING":
        default:
            return "Pending";
    }
}


/* =========================================================
   Load Dashboard
   ========================================================= */

async function loadVolunteerDashboard() {

    showLoading();

    try {

        applications =
            await apiGet(
                "/applications"
            );


        if (!Array.isArray(applications)) {

            applications = [];
        }


        try {

            certificates =
                await apiGet(
                    "/certificates"
                );

            if (!Array.isArray(certificates)) {

                certificates = [];
            }

        } catch (error) {

            console.warn(
                "Certificates unavailable:",
                error
            );

            certificates = [];
        }


        try {

            opportunities =
                await apiGet(
                    "/opportunities"
                );

            if (!Array.isArray(opportunities)) {

                opportunities = [];
            }

        } catch (error) {

            console.warn(
                "Opportunities unavailable:",
                error
            );

            opportunities = [];
        }


        renderDashboard();


    } catch (error) {

        console.error(
            "Volunteer dashboard error:",
            error
        );

        showError(
            error.message ||
            "Unable to load your dashboard."
        );
    }
}


/* =========================================================
   Render Dashboard
   ========================================================= */

function renderDashboard() {

    dashboardLoading.hidden = true;

    dashboardError.hidden = true;


    if (volunteerName) {

        volunteerName.textContent =
            getCurrentUserName() ||
            "Volunteer";
    }


    const approved =
        applications.filter(
            application =>
                String(
                    application.status
                ).toUpperCase() ===
                "APPROVED"
        );


    const completed =
        applications.filter(
            application =>
                String(
                    application.status
                ).toUpperCase() ===
                "COMPLETED"
        );


    if (applicationCount) {

        applicationCount.textContent =
            applications.length;
    }


    if (approvedCount) {

        approvedCount.textContent =
            approved.length;
    }


    if (completedCount) {

        completedCount.textContent =
            completed.length;
    }


    if (certificateCount) {

        certificateCount.textContent =
            certificates.length;
    }


    renderRecentApplications();
}


/* =========================================================
   Recent Applications
   ========================================================= */

function renderRecentApplications() {

    if (!recentApplications) {
        return;
    }


    if (applications.length === 0) {

        recentApplications.innerHTML = `

            <div class="ui-state ui-state-empty">

                <h3>
                    No applications yet.
                </h3>

                <p>
                    Explore opportunities and submit
                    your first application.
                </p>

                <a
                    href="opportunities.html"
                    class="button button-primary"
                >
                    Explore opportunities
                </a>

            </div>

        `;

        return;
    }


    const recent =
        [...applications]
            .sort(
                (a, b) =>
                    new Date(
                        b.appliedAt || 0
                    ) -
                    new Date(
                        a.appliedAt || 0
                    )
            )
            .slice(0, 5);


    recentApplications.innerHTML =
        recent
            .map(
                createApplicationCard
            )
            .join("");
}


/* =========================================================
   Application Card
   ========================================================= */

function createApplicationCard(
    application
) {

    const opportunity =
        opportunities.find(
            item =>
                Number(item.id) ===
                Number(
                    application.opportunityId
                )
        );


    const title =
        opportunity?.title ||
        application.opportunityTitle ||
        `Opportunity #${application.opportunityId}`;


    const status =
        String(
            application.status ||
            "PENDING"
        ).toUpperCase();


    const appliedDate =
        application.appliedAt
            ? formatDate(
                application.appliedAt
            )
            : "Date not available";


    return `

        <article class="dashboard-list-item">

            <div class="dashboard-list-item-main">

                <p class="eyebrow">
                    Application
                </p>

                <h3>
                    ${escapeHtml(title)}
                </h3>

                <p>
                    Applied ${escapeHtml(appliedDate)}
                </p>

            </div>


            <div class="dashboard-list-item-actions">

                <span
                    class="status-badge ${getStatusBadgeClass(status)}"
                >
                    ${escapeHtml(
                        formatStatus(status)
                    )}
                </span>

            </div>

        </article>

    `;
}


/* =========================================================
   States
   ========================================================= */

function showLoading() {

    if (dashboardLoading) {

        dashboardLoading.hidden = false;
    }


    if (dashboardError) {

        dashboardError.hidden = true;
    }


    if (recentApplications) {

        recentApplications.innerHTML = "";
    }
}


function showError(message) {

    if (dashboardLoading) {

        dashboardLoading.hidden = true;
    }


    if (dashboardErrorMessage) {

        dashboardErrorMessage.textContent =
            message;
    }


    if (dashboardError) {

        dashboardError.hidden = false;
    }
}


/* =========================================================
   Initialize
   ========================================================= */

async function initializeVolunteerDashboard() {

    if (!verifyVolunteerAccess()) {

        return;
    }


    if (dashboardRetry) {

        dashboardRetry.addEventListener(
            "click",
            loadVolunteerDashboard
        );
    }


    await loadVolunteerDashboard();
}


/* =========================================================
   Start
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeVolunteerDashboard
);
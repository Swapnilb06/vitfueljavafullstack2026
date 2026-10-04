/* =========================================================
   Organization Dashboard
   ========================================================= */

let organizationProfile = null;
let organizationOpportunities = [];
let organizationApplications = [];
let organizationAttendance = [];


/* =========================================================
   DOM
   ========================================================= */

const dashboardError =
    document.getElementById("dashboard-error");

const dashboardErrorMessage =
    document.getElementById("dashboard-error-message");

const dashboardRetry =
    document.getElementById("dashboard-retry");


/* =========================================================
   Access
   ========================================================= */

function verifyOrganizationAccess() {

    if (!isAuthenticated()) {
        window.location.href = "login.html";
        return false;
    }

    if (!isOrganization()) {
        redirectToRoleDashboard();
        return false;
    }

    return true;
}


/* =========================================================
   Error
   ========================================================= */

function showDashboardError(message) {

    if (dashboardErrorMessage) {
        dashboardErrorMessage.textContent =
            message || "Unable to load dashboard.";
    }

    if (dashboardError) {
        dashboardError.hidden = false;
    }
}


/* =========================================================
   Load Organization Profile
   ========================================================= */

async function loadOrganizationProfile() {

    const response =
        await apiGet("/organization-profiles");

    if (!Array.isArray(response)) {
        return null;
    }

    const userId =
        Number(getCurrentUserId());

    return response.find(
        profile =>
            Number(profile.userId) === userId ||
            Number(profile.user?.id) === userId
    ) || response[0] || null;
}


/* =========================================================
   Load Dashboard
   ========================================================= */

async function loadOrganizationDashboard() {

    if (dashboardError) {
        dashboardError.hidden = true;
    }

    try {

        organizationProfile =
            await loadOrganizationProfile();


        organizationOpportunities =
            await apiGet("/opportunities");


        organizationApplications =
            await apiGet("/applications");


        /*
         * Attendance is loaded separately.
         * If this endpoint is temporarily unavailable,
         * the rest of the dashboard still works.
         */

        try {

            organizationAttendance =
                await apiGet("/attendance");

        } catch (attendanceError) {

            console.warn(
                "Attendance could not be loaded:",
                attendanceError
            );

            organizationAttendance = [];
        }


        renderDashboard();

    } catch (error) {

        console.error(
            "Organization dashboard error:",
            error
        );

        showDashboardError(
            error.message ||
            "Unable to load organization dashboard."
        );
    }
}


/* =========================================================
   Render
   ========================================================= */

function renderDashboard() {

    const opportunityList =
        Array.isArray(organizationOpportunities)
            ? organizationOpportunities
            : [];


    const applicationList =
        Array.isArray(organizationApplications)
            ? organizationApplications
            : [];


    const attendanceList =
        Array.isArray(organizationAttendance)
            ? organizationAttendance
            : [];


    const organizationId =
        organizationProfile?.id;


    /*
     * The backend opportunity GET may return all
     * opportunities depending on the current controller.
     * Filter locally when organization information
     * is available.
     */

    let ownedOpportunities =
        opportunityList;


    if (organizationId) {

        const filtered =
            opportunityList.filter(
                opportunity =>
                    Number(
                        opportunity.organizationId
                    ) === Number(organizationId) ||
                    Number(
                        opportunity.organization?.id
                    ) === Number(organizationId)
            );


        if (filtered.length > 0) {
            ownedOpportunities = filtered;
        }
    }


    document.getElementById(
        "stat-opportunities"
    ).textContent =
        ownedOpportunities.length;


    document.getElementById(
        "stat-open"
    ).textContent =
        ownedOpportunities.filter(
            opportunity =>
                String(opportunity.status)
                    .toUpperCase() === "OPEN"
        ).length;


    document.getElementById(
        "stat-applications"
    ).textContent =
        applicationList.length;


    document.getElementById(
        "stat-attendance"
    ).textContent =
        attendanceList.length;


    const organizationName =
        organizationProfile?.organizationName ||
        organizationProfile?.name ||
        "Your organization";


    document.getElementById(
        "organization-heading"
    ).textContent =
        `${organizationName}.`;


    document.getElementById(
        "profile-name"
    ).textContent =
        organizationName;


    document.getElementById(
        "profile-description"
    ).textContent =
        organizationProfile?.description ||
        "Complete your organization profile to introduce your organization to volunteers.";


    const verificationBadge =
        document.getElementById("profile-verification-status");

    if (verificationBadge) {
        const verification =
            organizationProfile?.verificationStatus || "PENDING";

        verificationBadge.textContent =
            formatStatusLabel(verification);

        verificationBadge.className =
            `status-badge ${statusBadgeClass(verification)}`;
    }

    const profileMeta =
        document.getElementById("profile-meta");


    if (profileMeta) {

        const location =
            organizationProfile?.address ||
            "Address not provided";


        const email =
            organizationProfile?.contactEmail ||
            "Contact email not provided";


        profileMeta.innerHTML = `

            <div class="application-meta-item">

                <span class="meta-label">
                    Address
                </span>

                <span class="meta-value">
                    ${escapeHtml(location)}
                </span>

            </div>


            <div class="application-meta-item">

                <span class="meta-label">
                    Contact
                </span>

                <span class="meta-value">
                    ${escapeHtml(email)}
                </span>

            </div>

        `;
    }
}


/* =========================================================
   Initialize
   ========================================================= */

function initializeOrganizationDashboard() {

    if (!verifyOrganizationAccess()) {
        return;
    }


    if (dashboardRetry) {

        dashboardRetry.addEventListener(
            "click",
            loadOrganizationDashboard
        );
    }


    loadOrganizationDashboard();
}


document.addEventListener(
    "DOMContentLoaded",
    initializeOrganizationDashboard
);
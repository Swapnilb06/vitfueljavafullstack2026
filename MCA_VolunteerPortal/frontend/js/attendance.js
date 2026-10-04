/* =========================================================
   Attendance Management
   ========================================================= */

let organizationProfile = null;
let applications = [];
let opportunities = [];
let attendanceRecords = [];


/* =========================================================
   DOM
   ========================================================= */

const attendanceLoading =
    document.getElementById("attendance-loading");

const attendanceError =
    document.getElementById("attendance-error");

const attendanceErrorMessage =
    document.getElementById("attendance-error-message");

const attendanceEmpty =
    document.getElementById("attendance-empty");

const attendanceList =
    document.getElementById("attendance-list");

const attendanceCount =
    document.getElementById("attendance-count");

const attendanceRetry =
    document.getElementById("attendance-retry");


/* =========================================================
   Access
   ========================================================= */

function verifyAttendanceAccess() {

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
   Organization Profile
   ========================================================= */

async function loadOrganizationProfile() {

    const response =
        await apiGet("/organization-profiles");

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

async function loadAttendancePage() {

    showLoading();

    try {

        organizationProfile =
            await loadOrganizationProfile();

        opportunities =
            await apiGet("/opportunities");

        applications =
            await apiGet("/applications");

        try {

            attendanceRecords =
                await apiGet("/attendance");

        } catch (error) {

            console.warn(
                "Attendance records could not be loaded:",
                error
            );

            attendanceRecords = [];
        }

        renderAttendance();

    } catch (error) {

        console.error(error);

        showError(
            error.message ||
            "Unable to load attendance."
        );
    }
}


/* =========================================================
   Organization Opportunities
   ========================================================= */

function getOrganizationOpportunityIds() {

    if (!organizationProfile) {
        return [];
    }

    const organizationId =
        Number(organizationProfile.id);

    return opportunities
        .filter(
            opportunity =>
                Number(opportunity.organizationId) === organizationId ||
                Number(opportunity.organization?.id) === organizationId
        )
        .map(
            opportunity =>
                Number(opportunity.id)
        );
}


/* =========================================================
   Approved Applications
   ========================================================= */

function getApprovedApplications() {

    const organizationOpportunityIds =
        getOrganizationOpportunityIds();

    return applications.filter(
        application => {

            const approved =
                String(
                    application.status || ""
                ).toUpperCase() === "APPROVED";

            if (!approved) {
                return false;
            }

            /*
             * If we have organization opportunity IDs,
             * restrict records to this organization.
             */

            if (
                organizationOpportunityIds.length > 0
            ) {

                return organizationOpportunityIds.includes(
                    Number(application.opportunityId)
                );
            }

            /*
             * Backend already filters organization
             * applications, so allow them through.
             */

            return true;
        }
    );
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
   Find Attendance
   ========================================================= */

function findAttendanceForApplication(
    applicationId
) {

    return attendanceRecords.find(
        attendance =>
            Number(
                attendance.applicationId
            ) === Number(applicationId)
    );
}


/* =========================================================
   Render
   ========================================================= */

function renderAttendance() {

    hideLoading();

    const approvedApplications =
        getApprovedApplications();


    if (attendanceCount) {

        attendanceCount.textContent =
            approvedApplications.length === 1
                ? "1 approved volunteer"
                : `${approvedApplications.length} approved volunteers`;
    }


    if (
        approvedApplications.length === 0
    ) {

        attendanceEmpty.hidden = false;

        attendanceList.innerHTML = "";

        return;
    }


    attendanceEmpty.hidden = true;


    attendanceList.innerHTML =
        approvedApplications
            .map(
                createAttendanceCard
            )
            .join("");
}


/* =========================================================
   Card
   ========================================================= */

function createAttendanceCard(
    application
) {

    const opportunity =
        findOpportunity(
            application.opportunityId
        );


    const attendance =
        findAttendanceForApplication(
            application.id
        );


    const volunteerName =
        application.volunteerName ||
        application.volunteer?.name ||
        `Volunteer #${application.volunteerId}`;


    const opportunityTitle =
        opportunity?.title ||
        application.opportunityTitle ||
        `Opportunity #${application.opportunityId}`;


    const attendanceStatus =
        attendance?.status ||
        "NOT_MARKED";


    return `

        <article class="dashboard-list-item">

            <div class="dashboard-list-item-main">

                <p class="eyebrow">
                    Volunteer
                </p>

                <h3>
                    ${escapeHtml(
                        volunteerName
                    )}
                </h3>

                <p>
                    ${escapeHtml(
                        opportunityTitle
                    )}
                </p>

                <span class="status-badge ${getStatusBadgeClass(attendanceStatus)}">
                    ${escapeHtml(
                        formatStatus(
                            attendanceStatus
                        )
                    )}
                </span>

            </div>


            <div class="dashboard-list-item-actions">

                <button
                    type="button"
                    class="button button-secondary"
                    data-attendance-action="PRESENT"
                    data-application-id="${application.id}"
                >
                    Present
                </button>

                <button
                    type="button"
                    class="button button-secondary"
                    data-attendance-action="ABSENT"
                    data-application-id="${application.id}"
                >
                    Absent
                </button>

            </div>

        </article>

    `;
}


/* =========================================================
   Save Attendance
   ========================================================= */

async function saveAttendance(
    applicationId,
    status
) {

    const application =
        applications.find(
            item =>
                Number(item.id) ===
                Number(applicationId)
        );


    if (!application) {

        showNotification(
            "Application not found.",
            "error"
        );

        return;
    }


    try {

        const existingAttendance =
            findAttendanceForApplication(
                applicationId
            );


        const payload = {

            applicationId:
                Number(applicationId),

            status

        };


        if (existingAttendance) {

            await apiPut(
                `/attendance/${existingAttendance.id}`,
                payload
            );

        } else {

            await apiPost(
                "/attendance",
                payload
            );
        }


        showNotification(
            `Attendance marked as ${formatStatus(status)}.`,
            "success"
        );


        await loadAttendancePage();


    } catch (error) {

        console.error(error);

        showNotification(
            error.message ||
            "Unable to save attendance.",
            "error"
        );
    }
}


/* =========================================================
   Actions
   ========================================================= */

function handleAttendanceAction(
    event
) {

    const button =
        event.target.closest(
            "[data-attendance-action]"
        );

    if (!button) {
        return;
    }


    const status =
        button.dataset.attendanceAction;


    const applicationId =
        button.dataset.applicationId;


    saveAttendance(
        applicationId,
        status
    );
}


/* =========================================================
   States
   ========================================================= */

function showLoading() {

    attendanceLoading.hidden = false;

    attendanceError.hidden = true;

    attendanceEmpty.hidden = true;

    attendanceList.innerHTML = "";
}


function hideLoading() {

    attendanceLoading.hidden = true;
}


function showError(message) {

    attendanceLoading.hidden = true;

    attendanceEmpty.hidden = true;

    attendanceErrorMessage.textContent =
        message ||
        "Unable to load attendance.";

    attendanceError.hidden = false;
}


/* =========================================================
   Initialize
   ========================================================= */

async function initializeAttendance() {

    if (!verifyAttendanceAccess()) {
        return;
    }


    attendanceList.addEventListener(
        "click",
        handleAttendanceAction
    );


    attendanceRetry.addEventListener(
        "click",
        loadAttendancePage
    );


    await loadAttendancePage();
}


/* =========================================================
   Start
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeAttendance
);
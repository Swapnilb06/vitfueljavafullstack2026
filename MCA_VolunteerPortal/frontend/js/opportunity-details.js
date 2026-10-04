/* =========================================================
   VolunteerPortalJava
   Opportunity Details Page JavaScript
   ========================================================= */


/* =========================================================
   DOM Elements
   ========================================================= */

const opportunityLoading =
    document.getElementById(
        "opportunity-loading"
    );

const opportunityError =
    document.getElementById(
        "opportunity-error"
    );

const opportunityErrorMessage =
    document.getElementById(
        "opportunity-error-message"
    );

const opportunityContent =
    document.getElementById(
        "opportunity-content"
    );

const opportunityStatus =
    document.getElementById(
        "opportunity-status"
    );

const opportunityOrganization =
    document.getElementById(
        "opportunity-organization"
    );

const opportunityTitle =
    document.getElementById(
        "opportunity-title"
    );

const opportunityDescriptionShort =
    document.getElementById(
        "opportunity-description-short"
    );

const opportunityLocation =
    document.getElementById(
        "opportunity-location"
    );

const opportunityStartDate =
    document.getElementById(
        "opportunity-start-date"
    );

const opportunityEndDate =
    document.getElementById(
        "opportunity-end-date"
    );

const opportunityVolunteers =
    document.getElementById(
        "opportunity-volunteers"
    );

const opportunityDescription =
    document.getElementById(
        "opportunity-description"
    );

const organizationName =
    document.getElementById(
        "organization-name"
    );

const organizationDescription =
    document.getElementById(
        "organization-description"
    );

const applyOpportunityButton =
    document.getElementById(
        "apply-opportunity-button"
    );

const loginToApplyLink =
    document.getElementById(
        "login-to-apply-link"
    );

const alreadyAppliedMessage =
    document.getElementById(
        "already-applied-message"
    );

const opportunityApplyMessage =
    document.getElementById(
        "opportunity-apply-message"
    );


/* =========================================================
   State
   ========================================================= */

let currentOpportunity = null;


/* =========================================================
   Get Opportunity ID
   ========================================================= */

function getOpportunityIdFromUrl() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const id =
        params.get("id");


    if (!id) {
        return null;
    }


    const numericId =
        Number(id);


    if (
        !Number.isInteger(numericId) ||
        numericId <= 0
    ) {
        return null;
    }


    return numericId;
}


/* =========================================================
   Loading State
   ========================================================= */

function showOpportunityLoading() {

    if (opportunityLoading) {
        opportunityLoading.hidden = false;
    }

    if (opportunityError) {
        opportunityError.hidden = true;
    }

    if (opportunityContent) {
        opportunityContent.hidden = true;
    }
}


/* =========================================================
   Error State
   ========================================================= */

function showOpportunityError(message) {

    if (opportunityLoading) {
        opportunityLoading.hidden = true;
    }

    if (opportunityContent) {
        opportunityContent.hidden = true;
    }

    if (opportunityErrorMessage) {

        opportunityErrorMessage.textContent =
            message ||
            "We could not load this opportunity.";
    }

    if (opportunityError) {
        opportunityError.hidden = false;
    }
}


/* =========================================================
   Content State
   ========================================================= */

function showOpportunityContent() {

    if (opportunityLoading) {
        opportunityLoading.hidden = true;
    }

    if (opportunityError) {
        opportunityError.hidden = true;
    }

    if (opportunityContent) {
        opportunityContent.hidden = false;
    }
}


/* =========================================================
   Load Opportunity
   ========================================================= */

async function loadOpportunity() {

    const opportunityId =
        getOpportunityIdFromUrl();


    if (!opportunityId) {

        showOpportunityError(
            "No valid opportunity was specified."
        );

        return;
    }


    showOpportunityLoading();


    try {

        const response =
            await apiGet(
                `/opportunities/${opportunityId}`
            );


        if (!response) {

            throw new Error(
                "Opportunity was not found."
            );
        }


        currentOpportunity =
            response;


        renderOpportunity(
            response
        );


        showOpportunityContent();


        /*
         * If the user is authenticated as a volunteer,
         * check whether they already applied.
         */

        if (isVolunteer()) {

            await checkExistingApplication(
                opportunityId
            );

        } else {

            updateApplyControls();

        }


    } catch (error) {

        console.error(
            "Failed to load opportunity:",
            error
        );

        showOpportunityError(
            error.message ||
            "Unable to load opportunity."
        );

    }
}


/* =========================================================
   Render Opportunity
   ========================================================= */

function renderOpportunity(
    opportunity
) {

    const status =
        String(
            opportunity.status ||
            "UNKNOWN"
        ).toUpperCase();


    const title =
        opportunity.title ||
        "Untitled opportunity";


    const description =
        opportunity.description ||
        "No description has been provided.";


    const organization =
        opportunity.organizationName ||
        opportunity.organization?.organizationName ||
        "Organization";


    const location =
        opportunity.location ||
        "Location not specified";


    const startDate =
        opportunity.startDate
            ? formatDate(
                opportunity.startDate
            )
            : "Not specified";


    const endDate =
        opportunity.endDate
            ? formatDate(
                opportunity.endDate
            )
            : "Not specified";


    const volunteers =
        opportunity.requiredVolunteers ??
        opportunity.maxVolunteers ??
        "Not specified";


    /*
     * Main information
     */

    if (opportunityTitle) {

        opportunityTitle.textContent =
            title;
    }


    if (opportunityOrganization) {

        opportunityOrganization.textContent =
            organization;
    }


    if (opportunityDescriptionShort) {

        opportunityDescriptionShort.textContent =
            truncateText(
                description,
                220
            );
    }


    if (opportunityLocation) {

        opportunityLocation.textContent =
            location;
    }


    if (opportunityStartDate) {

        opportunityStartDate.textContent =
            startDate;
    }


    if (opportunityEndDate) {

        opportunityEndDate.textContent =
            endDate;
    }


    if (opportunityVolunteers) {

        opportunityVolunteers.textContent =
            volunteers;
    }


    if (opportunityDescription) {

        /*
         * textContent is intentional.
         * It prevents arbitrary HTML from the API
         * from being inserted into the page.
         */

        opportunityDescription.textContent =
            description;
    }


    /*
     * Organization
     */

    if (organizationName) {

        organizationName.textContent =
            organization;
    }


    const organizationDescriptionText =
        opportunity.organizationDescription ||
        opportunity.organization?.description ||
        "";


    if (organizationDescription) {

        organizationDescription.textContent =
            organizationDescriptionText;
    }


    /*
     * Status
     */

    if (opportunityStatus) {

        opportunityStatus.textContent =
            formatStatus(status);


        opportunityStatus.className =
            `status-badge ${getStatusBadgeClass(status)}`;
    }


    /*
     * Page title
     */

    document.title =
        `${title} | VolunteerPortal`;


    updateApplyControls();
}


/* =========================================================
   Update Apply Controls
   ========================================================= */

function updateApplyControls() {

    if (!currentOpportunity) {
        return;
    }


    const status =
        String(
            currentOpportunity.status ||
            ""
        ).toUpperCase();


    const canApply =
        status === "OPEN";


    /*
     * Not authenticated
     */

    if (!isAuthenticated()) {

        if (applyOpportunityButton) {
            applyOpportunityButton.hidden = true;
        }

        if (loginToApplyLink) {
            loginToApplyLink.hidden = !canApply;
        }

        if (opportunityApplyMessage) {

            opportunityApplyMessage.textContent =
                canApply
                    ? "Sign in to apply for this opportunity."
                    : "This opportunity is not currently open.";
        }

        return;
    }


    /*
     * Volunteer
     */

    if (isVolunteer()) {

        if (loginToApplyLink) {
            loginToApplyLink.hidden = true;
        }

        if (!canApply) {

            if (applyOpportunityButton) {
                applyOpportunityButton.hidden = true;
            }

            if (opportunityApplyMessage) {

                opportunityApplyMessage.textContent =
                    "This opportunity is not currently open for applications.";
            }

            return;
        }


        if (applyOpportunityButton) {

            applyOpportunityButton.hidden = false;

            applyOpportunityButton.disabled =
                false;

            applyOpportunityButton.textContent =
                "Apply now";
        }


        if (opportunityApplyMessage) {

            opportunityApplyMessage.textContent =
                "Apply for this opportunity and start your participation.";
        }

        return;
    }


    /*
     * Organization / Admin
     */

    if (applyOpportunityButton) {
        applyOpportunityButton.hidden = true;
    }

    if (loginToApplyLink) {
        loginToApplyLink.hidden = true;
    }

    if (opportunityApplyMessage) {

        opportunityApplyMessage.textContent =
            "Only volunteer accounts can apply for opportunities.";
    }
}


/* =========================================================
   Check Existing Application
   ========================================================= */

async function checkExistingApplication(
    opportunityId
) {

    try {

        const applications =
            await apiGet(
                "/applications"
            );


        if (!Array.isArray(applications)) {

            updateApplyControls();

            return;
        }


        const currentUserId =
            Number(
                getCurrentUserId()
            );


        const alreadyApplied =
            applications.some(
                (application) => {

                    const applicationOpportunityId =
                        Number(
                            application.opportunityId ??
                            application.opportunity?.id
                        );


                    const volunteerId =
                        Number(
                            application.volunteerId ??
                            application.volunteer?.id
                        );


                    return (
                        applicationOpportunityId ===
                            Number(opportunityId)
                        &&
                        volunteerId ===
                            currentUserId
                    );
                }
            );


        if (alreadyApplied) {

            if (applyOpportunityButton) {
                applyOpportunityButton.hidden = true;
            }

            if (alreadyAppliedMessage) {
                alreadyAppliedMessage.hidden = false;
            }

            if (opportunityApplyMessage) {

                opportunityApplyMessage.textContent =
                    "You have already submitted an application for this opportunity.";
            }

        } else {

            updateApplyControls();
        }


    } catch (error) {

        /*
         * If checking applications fails,
         * don't prevent the user from viewing
         * the opportunity.
         */

        console.warn(
            "Could not check existing application:",
            error
        );

        updateApplyControls();
    }
}


/* =========================================================
   Apply
   ========================================================= */

async function applyForOpportunity() {

    if (!currentOpportunity) {
        return;
    }


    if (!isAuthenticated()) {

        window.location.href =
            "login.html";

        return;
    }


    if (!isVolunteer()) {

        showNotification(
            "Only volunteer accounts can apply for opportunities.",
            "error"
        );

        return;
    }


    const opportunityId =
        Number(
            currentOpportunity.id
        );


    const volunteerId =
        Number(
            getCurrentUserId()
        );


    if (
        !Number.isInteger(opportunityId) ||
        opportunityId <= 0
    ) {

        showNotification(
            "Invalid opportunity.",
            "error"
        );

        return;
    }


    if (
        !Number.isInteger(volunteerId) ||
        volunteerId <= 0
    ) {

        showNotification(
            "Unable to identify your account. Please log in again.",
            "error"
        );

        return;
    }


    const confirmed =
        await showConfirmation(
            "Apply for this opportunity?"
        );


    if (!confirmed) {
        return;
    }


    try {

        setButtonLoading(
            applyOpportunityButton,
            true,
            "Applying..."
        );


        /*
         * The current Java controller expects
         * volunteerId and opportunityId.
         */

        const applicationData = {

            volunteerId:
                volunteerId,

            opportunityId:
                opportunityId,

            status:
                "PENDING"
        };


        await apiPost(
            "/applications",
            applicationData
        );


        if (applyOpportunityButton) {
            applyOpportunityButton.hidden = true;
        }

        if (alreadyAppliedMessage) {
            alreadyAppliedMessage.hidden = false;
        }

        if (opportunityApplyMessage) {

            opportunityApplyMessage.textContent =
                "Your application has been submitted and is awaiting review.";
        }


        showNotification(
            "Application submitted successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Application failed:",
            error
        );


        showNotification(
            error.message ||
            "Unable to submit your application.",
            "error"
        );


    } finally {

        setButtonLoading(
            applyOpportunityButton,
            false
        );

    }
}


/* =========================================================
   Initialize
   ========================================================= */

function initializeOpportunityDetailsPage() {

    if (applyOpportunityButton) {

        applyOpportunityButton.addEventListener(
            "click",
            applyForOpportunity
        );

    }


    loadOpportunity();
}


/* =========================================================
   Start
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeOpportunityDetailsPage
);
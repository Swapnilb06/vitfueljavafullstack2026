/* =========================================================
   Organization Opportunities
   ========================================================= */

let allOpportunities = [];

let organizationProfile = null;


/* =========================================================
   DOM
   ========================================================= */

const opportunityForm =
    document.getElementById(
        "opportunity-form"
    );

const formError =
    document.getElementById(
        "form-error"
    );

const formSuccess =
    document.getElementById(
        "form-success"
    );

const createOpportunityButton =
    document.getElementById(
        "create-opportunity-button"
    );

const opportunitiesLoading =
    document.getElementById(
        "opportunities-loading"
    );

const opportunitiesError =
    document.getElementById(
        "opportunities-error"
    );

const opportunitiesErrorMessage =
    document.getElementById(
        "opportunities-error-message"
    );

const opportunitiesEmpty =
    document.getElementById(
        "opportunities-empty"
    );

const opportunitiesGrid =
    document.getElementById(
        "organization-opportunities-grid"
    );

const opportunityCount =
    document.getElementById(
        "opportunity-count"
    );

const opportunitiesRetry =
    document.getElementById(
        "opportunities-retry"
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
   Form Messages
   ========================================================= */

function clearFormMessages() {

    if (formError) {
        formError.hidden = true;
        formError.textContent = "";
    }

    if (formSuccess) {
        formSuccess.hidden = true;
        formSuccess.textContent = "";
    }
}


function showFormError(message) {

    if (!formError) {
        return;
    }

    formError.textContent =
        message || "Unable to create opportunity.";

    formError.hidden = false;

    if (formSuccess) {
        formSuccess.hidden = true;
    }
}


function showFormSuccess(message) {

    if (!formSuccess) {
        return;
    }

    formSuccess.textContent =
        message || "Opportunity created successfully.";

    formSuccess.hidden = false;

    if (formError) {
        formError.hidden = true;
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
   Load Opportunities
   ========================================================= */

async function loadOpportunities() {

    showOpportunitiesLoading();


    try {

        allOpportunities =
            await apiGet(
                "/opportunities"
            );


        if (!Array.isArray(allOpportunities)) {

            allOpportunities = [];
        }


        renderOpportunities();


    } catch (error) {

        console.error(
            "Failed to load opportunities:",
            error
        );


        showOpportunitiesError(
            error.message ||
            "Unable to load opportunities."
        );
    }
}


/* =========================================================
   Loading
   ========================================================= */

function showOpportunitiesLoading() {

    if (opportunitiesLoading) {
        opportunitiesLoading.hidden = false;
    }

    if (opportunitiesError) {
        opportunitiesError.hidden = true;
    }

    if (opportunitiesEmpty) {
        opportunitiesEmpty.hidden = true;
    }

    if (opportunitiesGrid) {
        opportunitiesGrid.innerHTML = "";
    }
}


/* =========================================================
   Error
   ========================================================= */

function showOpportunitiesError(message) {

    if (opportunitiesLoading) {
        opportunitiesLoading.hidden = true;
    }

    if (opportunitiesEmpty) {
        opportunitiesEmpty.hidden = true;
    }

    if (opportunitiesErrorMessage) {

        opportunitiesErrorMessage.textContent =
            message ||
            "Unable to load opportunities.";
    }

    if (opportunitiesError) {
        opportunitiesError.hidden = false;
    }
}


/* =========================================================
   Find Organization Opportunities
   ========================================================= */

function getOwnedOpportunities() {

    if (!organizationProfile) {

        /*
         * If the profile cannot be loaded, return the
         * backend response instead of hiding everything.
         */

        return allOpportunities;
    }


    const organizationId =
        Number(organizationProfile.id);


    const filtered =
        allOpportunities.filter(
            opportunity =>
                Number(
                    opportunity.organizationId
                ) === organizationId ||
                Number(
                    opportunity.organization?.id
                ) === organizationId
        );


    /*
     * Some backend responses may expose only the
     * opportunity data without organization information.
     */

    if (
        filtered.length === 0 &&
        allOpportunities.length > 0
    ) {

        const hasOrganizationData =
            allOpportunities.some(
                opportunity =>
                    opportunity.organizationId != null ||
                    opportunity.organization != null
            );


        if (!hasOrganizationData) {
            return allOpportunities;
        }
    }


    return filtered;
}


/* =========================================================
   Render
   ========================================================= */

function renderOpportunities() {

    const ownedOpportunities =
        getOwnedOpportunities();


    if (opportunityCount) {

        opportunityCount.textContent =
            ownedOpportunities.length === 1
                ? "1 opportunity"
                : `${ownedOpportunities.length} opportunities`;
    }


    if (opportunitiesLoading) {
        opportunitiesLoading.hidden = true;
    }

    if (opportunitiesError) {
        opportunitiesError.hidden = true;
    }


    if (
        ownedOpportunities.length === 0
    ) {

        if (opportunitiesEmpty) {
            opportunitiesEmpty.hidden = false;
        }

        if (opportunitiesGrid) {
            opportunitiesGrid.innerHTML = "";
        }

        return;
    }


    if (opportunitiesEmpty) {
        opportunitiesEmpty.hidden = true;
    }


    if (!opportunitiesGrid) {
        return;
    }


    opportunitiesGrid.innerHTML =
        ownedOpportunities
            .map(
                createOpportunityCard
            )
            .join("");
}


/* =========================================================
   Opportunity Card
   ========================================================= */

function createOpportunityCard(
    opportunity
) {

    const status =
        String(
            opportunity.status ||
            "UNKNOWN"
        ).toUpperCase();


    const statusClass =
        getStatusBadgeClass(
            status
        );


    const description =
        opportunity.description ||
        "No description provided.";


    const location =
        opportunity.location ||
        "Location not specified";


    const startDate =
        opportunity.startDate
            ? formatDate(
                opportunity.startDate
            )
            : "Date not specified";


    const requiredVolunteers =
        opportunity.requiredVolunteers ??
        opportunity.maxVolunteers ??
        "Not specified";


    return `

        <article
            class="opportunity-card"
            data-opportunity-id="${opportunity.id}"
        >

            <div class="opportunity-card-top">

                <span
                    class="status-badge ${statusClass}"
                >
                    ${escapeHtml(
                        formatStatus(status)
                    )}
                </span>

            </div>


            <div class="opportunity-card-body">

                <p class="eyebrow">
                    Opportunity
                </p>

                <h3>
                    ${escapeHtml(
                        opportunity.title ||
                        "Untitled opportunity"
                    )}
                </h3>

                <p>
                    ${escapeHtml(
                        truncateText(
                            description,
                            150
                        )
                    )}
                </p>


                <div class="opportunity-card-meta">

                    <span>
                        ${escapeHtml(location)}
                    </span>

                    <span>
                        ${escapeHtml(startDate)}
                    </span>

                    <span>
                        ${escapeHtml(
                            String(requiredVolunteers)
                        )}
                        volunteers
                    </span>

                </div>

            </div>


            <div class="opportunity-card-footer">

                <a
                    href="opportunity-details.html?id=${encodeURIComponent(
                        opportunity.id
                    )}"
                    class="text-link"
                >
                    View →
                </a>


                <button
                    type="button"
                    class="text-button text-button-danger"
                    data-action="delete"
                    data-opportunity-id="${opportunity.id}"
                >
                    Delete
                </button>

            </div>

        </article>

    `;
}


/* =========================================================
   Create Opportunity
   ========================================================= */

async function createOpportunity(
    event
) {

    event.preventDefault();

    clearFormMessages();


    if (!organizationProfile) {

        showFormError(
            "Organization profile not found. Please create your organization profile first."
        );

        return;
    }


    const title =
        document.getElementById(
            "title"
        ).value.trim();


    const description =
        document.getElementById(
            "description"
        ).value.trim();


    const location =
        document.getElementById(
            "location"
        ).value.trim();


    const requiredVolunteers =
        Number(
            document.getElementById(
                "requiredVolunteers"
            ).value
        );


    const startDate =
        document.getElementById(
            "startDate"
        ).value;


    const endDate =
        document.getElementById(
            "endDate"
        ).value;


    const status =
        document.getElementById(
            "status"
        ).value;


    if (!title) {

        showFormError(
            "Opportunity title is required."
        );

        return;
    }


    if (!description) {

        showFormError(
            "Opportunity description is required."
        );

        return;
    }


    if (
        !Number.isInteger(
            requiredVolunteers
        ) ||
        requiredVolunteers < 1
    ) {

        showFormError(
            "Required volunteers must be at least 1."
        );

        return;
    }


    if (
        startDate &&
        endDate &&
        endDate < startDate
    ) {

        showFormError(
            "End date cannot be before start date."
        );

        return;
    }


    const payload = {

        title,

        description,

        location,

        status,

        organizationId:
            Number(
                organizationProfile.id
            ),

        requiredVolunteers

    };


    if (startDate) {
        payload.startDate = startDate;
    }


    if (endDate) {
        payload.endDate = endDate;
    }


    try {

        setButtonLoading(
            createOpportunityButton,
            true,
            "Creating..."
        );


        await apiPost(
            "/opportunities",
            payload
        );


        showFormSuccess(
            "Opportunity created successfully."
        );


        opportunityForm.reset();


        document.getElementById(
            "requiredVolunteers"
        ).value = "10";


        document.getElementById(
            "status"
        ).value = "OPEN";


        await loadOpportunities();


    } catch (error) {

        console.error(
            "Failed to create opportunity:",
            error
        );


        showFormError(
            error.message ||
            "Unable to create opportunity."
        );


    } finally {

        setButtonLoading(
            createOpportunityButton,
            false
        );
    }
}


/* =========================================================
   Delete Opportunity
   ========================================================= */

async function deleteOpportunity(
    opportunityId
) {

    const confirmed =
        await showConfirmation(
            "Delete this opportunity?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiDelete(
            `/opportunities/${opportunityId}`
        );


        showNotification(
            "Opportunity deleted successfully.",
            "success"
        );


        await loadOpportunities();


    } catch (error) {

        console.error(
            "Failed to delete opportunity:",
            error
        );


        showNotification(
            error.message ||
            "Unable to delete opportunity.",
            "error"
        );
    }
}


/* =========================================================
   Card Actions
   ========================================================= */

function handleOpportunityAction(
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


    const opportunityId =
        button.dataset.opportunityId;


    if (
        action === "delete" &&
        opportunityId
    ) {

        deleteOpportunity(
            opportunityId
        );
    }
}


/* =========================================================
   Initialize
   ========================================================= */

async function initializeOrganizationOpportunities() {

    if (!verifyOrganizationAccess()) {
        return;
    }


    try {

        organizationProfile =
            await loadOrganizationProfile();


        if (!organizationProfile) {

            showFormError(
                "Please create your organization profile before creating opportunities."
            );
        }


        await loadOpportunities();


    } catch (error) {

        showOpportunitiesError(
            error.message ||
            "Unable to initialize page."
        );
    }


    if (opportunityForm) {

        opportunityForm.addEventListener(
            "submit",
            createOpportunity
        );
    }


    if (opportunitiesGrid) {

        opportunitiesGrid.addEventListener(
            "click",
            handleOpportunityAction
        );
    }


    if (opportunitiesRetry) {

        opportunitiesRetry.addEventListener(
            "click",
            loadOpportunities
        );
    }
}


/* =========================================================
   Start
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeOrganizationOpportunities
);
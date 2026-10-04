/* =========================================================
   VolunteerPortalJava
   Opportunities Page JavaScript
   ========================================================= */


/* =========================================================
   DOM Elements
   ========================================================= */

const opportunitiesGrid =
    document.getElementById(
        "opportunities-grid"
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

const opportunitiesRetry =
    document.getElementById(
        "opportunities-retry"
    );

const opportunitySearch =
    document.getElementById(
        "opportunity-search"
    );

const opportunityStatus =
    document.getElementById(
        "opportunity-status"
    );

const opportunityCount =
    document.getElementById(
        "opportunity-count"
    );


/* =========================================================
   Page State
   ========================================================= */

let allOpportunities = [];


/* =========================================================
   Set Loading State
   ========================================================= */

function setOpportunitiesLoading(isLoading) {

    if (opportunitiesLoading) {
        opportunitiesLoading.hidden = !isLoading;
    }

    if (isLoading) {

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
}


/* =========================================================
   Set Error State
   ========================================================= */

function setOpportunitiesError(message) {

    if (opportunitiesLoading) {
        opportunitiesLoading.hidden = true;
    }

    if (opportunitiesEmpty) {
        opportunitiesEmpty.hidden = true;
    }

    if (opportunitiesGrid) {
        opportunitiesGrid.innerHTML = "";
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
   Set Empty State
   ========================================================= */

function setOpportunitiesEmpty() {

    if (opportunitiesLoading) {
        opportunitiesLoading.hidden = true;
    }

    if (opportunitiesError) {
        opportunitiesError.hidden = true;
    }

    if (opportunitiesEmpty) {
        opportunitiesEmpty.hidden = false;
    }

    if (opportunitiesGrid) {
        opportunitiesGrid.innerHTML = "";
    }
}


/* =========================================================
   Hide Empty/Error
   ========================================================= */

function clearOpportunityStates() {

    if (opportunitiesError) {
        opportunitiesError.hidden = true;
    }

    if (opportunitiesEmpty) {
        opportunitiesEmpty.hidden = true;
    }
}


/* =========================================================
   Load Opportunities
   ========================================================= */

async function loadOpportunities() {

    setOpportunitiesLoading(true);

    try {

        const response =
            await apiGet("/opportunities");


        if (!Array.isArray(response)) {

            throw new Error(
                "Unexpected response received from the server."
            );
        }


        allOpportunities =
            response;


        setOpportunitiesLoading(false);

        applyOpportunityFilters();


    } catch (error) {

        console.error(
            "Failed to load opportunities:",
            error
        );

        setOpportunitiesError(
            error.message ||
            "Unable to load opportunities."
        );

    }
}


/* =========================================================
   Apply Filters
   ========================================================= */

function applyOpportunityFilters() {

    const search =
        opportunitySearch
            ? opportunitySearch.value
                .trim()
                .toLowerCase()
            : "";


    const selectedStatus =
        opportunityStatus
            ? opportunityStatus.value
            : "OPEN";


    const filtered =
        allOpportunities.filter(
            (opportunity) => {

                /*
                 * Status filter
                 */

                const status =
                    String(
                        opportunity.status || ""
                    ).toUpperCase();


                if (
                    selectedStatus !== "ALL" &&
                    status !== selectedStatus
                ) {
                    return false;
                }


                /*
                 * Search filter
                 */

                if (!search) {
                    return true;
                }


                const searchableText = [

                    opportunity.title,

                    opportunity.description,

                    opportunity.location,

                    opportunity.categoryName,

                    opportunity.organizationName

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                return searchableText.includes(
                    search
                );
            }
        );


    renderOpportunities(
        filtered
    );
}


/* =========================================================
   Render Opportunities
   ========================================================= */

function renderOpportunities(
    opportunities
) {

    clearOpportunityStates();


    if (
        !opportunities ||
        opportunities.length === 0
    ) {

        updateOpportunityCount(0);

        setOpportunitiesEmpty();

        return;
    }


    updateOpportunityCount(
        opportunities.length
    );


    if (!opportunitiesGrid) {
        return;
    }


    opportunitiesGrid.innerHTML =
        opportunities
            .map(
                createOpportunityCard
            )
            .join("");
}


/* =========================================================
   Create Opportunity Card
   ========================================================= */

function createOpportunityCard(
    opportunity
) {

    const id =
        opportunity.id;


    const title =
        escapeHtml(
            opportunity.title ||
            "Untitled opportunity"
        );


    const description =
        escapeHtml(
            truncateText(
                opportunity.description ||
                "No description available.",
                150
            )
        );


    const location =
        escapeHtml(
            opportunity.location ||
            "Location not specified"
        );


    const organization =
        escapeHtml(
            opportunity.organizationName ||
            opportunity.organization?.organizationName ||
            "Organization"
        );


    const status =
        String(
            opportunity.status ||
            "UNKNOWN"
        ).toUpperCase();


    const startDate =
        opportunity.startDate
            ? formatDate(
                opportunity.startDate
            )
            : "Date to be announced";


    const endDate =
        opportunity.endDate
            ? formatDate(
                opportunity.endDate
            )
            : "";


    const requiredVolunteers =
        opportunity.requiredVolunteers ??
        opportunity.maxVolunteers ??
        null;


    const statusClass =
        getStatusBadgeClass(
            status
        );


    const dateText =
        endDate
            ? `${startDate} — ${endDate}`
            : startDate;


    return `

        <article
            class="opportunity-card"
            data-opportunity-id="${id}"
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

                <p class="opportunity-card-label">
                    ${organization}
                </p>


                <h3 class="opportunity-card-title">

                    <a
                        href="opportunity-details.html?id=${encodeURIComponent(id)}"
                    >
                        ${title}
                    </a>

                </h3>


                <p class="opportunity-card-description">
                    ${description}
                </p>


                <div class="opportunity-card-meta">

                    <div class="opportunity-card-meta-item">

                        <span class="meta-label">
                            Location
                        </span>

                        <span class="meta-value">
                            ${location}
                        </span>

                    </div>


                    <div class="opportunity-card-meta-item">

                        <span class="meta-label">
                            Date
                        </span>

                        <span class="meta-value">
                            ${escapeHtml(dateText)}
                        </span>

                    </div>


                    ${
                        requiredVolunteers !== null
                            ? `
                                <div class="opportunity-card-meta-item">

                                    <span class="meta-label">
                                        Volunteers needed
                                    </span>

                                    <span class="meta-value">
                                        ${escapeHtml(
                                            String(
                                                requiredVolunteers
                                            )
                                        )}
                                    </span>

                                </div>
                              `
                            : ""
                    }

                </div>

            </div>


            <div class="opportunity-card-footer">

                <a
                    href="opportunity-details.html?id=${encodeURIComponent(id)}"
                    class="text-link"
                >
                    View opportunity
                    <span aria-hidden="true">
                        →
                    </span>
                </a>

            </div>

        </article>

    `;
}


/* =========================================================
   Update Count
   ========================================================= */

function updateOpportunityCount(
    count
) {

    if (!opportunityCount) {
        return;
    }


    opportunityCount.textContent =
        count === 1
            ? "1 opportunity"
            : `${count} opportunities`;
}


/* =========================================================
   Search Handler
   ========================================================= */

function handleOpportunitySearch() {

    applyOpportunityFilters();
}


/* =========================================================
   Status Handler
   ========================================================= */

function handleOpportunityStatusChange() {

    applyOpportunityFilters();
}


/* =========================================================
   Initialize
   ========================================================= */

function initializeOpportunitiesPage() {

    if (opportunitySearch) {

        opportunitySearch.addEventListener(
            "input",
            handleOpportunitySearch
        );

    }


    if (opportunityStatus) {

        opportunityStatus.addEventListener(
            "change",
            handleOpportunityStatusChange
        );

    }


    if (opportunitiesRetry) {

        opportunitiesRetry.addEventListener(
            "click",
            loadOpportunities
        );

    }


    loadOpportunities();

}


/* =========================================================
   Start
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeOpportunitiesPage
);

/* Clear filters button (search + status) */
document.addEventListener("DOMContentLoaded", () => {

    const clearButton = document.getElementById("clear-filters");

    if (!clearButton) {
        return;
    }

    clearButton.addEventListener("click", () => {

        const search = document.getElementById("opportunity-search");
        const status = document.getElementById("opportunity-status");

        if (search) {
            search.value = "";
            search.dispatchEvent(new Event("input", { bubbles: true }));
        }

        if (status) {
            status.value = "";
            status.dispatchEvent(new Event("change", { bubbles: true }));
        }
    });
});

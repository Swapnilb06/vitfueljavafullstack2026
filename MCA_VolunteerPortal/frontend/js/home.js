/* =========================================================
   VolunteerPortalJava
   Home Page JavaScript
   ========================================================= */


/* =========================================================
   Configuration
   ========================================================= */

const HOME_OPPORTUNITY_LIMIT = 3;


/* =========================================================
   Load Opportunities
   ========================================================= */

async function loadHomeOpportunities() {

    const container = document.getElementById(
        "home-opportunity-grid"
    );

    if (!container) {
        return;
    }

    try {

        const opportunities = await apiGet(
            "/opportunities"
        );

        renderHomeOpportunities(
            Array.isArray(opportunities)
                ? opportunities
                : []
        );

    } catch (error) {

        console.error(
            "Unable to load homepage opportunities:",
            error
        );

        renderHomeOpportunityError(
            container,
            error.message
        );
    }
}


/* =========================================================
   Render Opportunities
   ========================================================= */

function renderHomeOpportunities(opportunities) {

    const container = document.getElementById(
        "home-opportunity-grid"
    );

    if (!container) {
        return;
    }

    const openOpportunities = opportunities
        .filter(isOpenOpportunity)
        .slice(0, HOME_OPPORTUNITY_LIMIT);


    if (openOpportunities.length === 0) {

        container.innerHTML = `
            <div class="ui-state ui-state-empty opportunities-empty">
                <div class="ui-state-icon">
                    —
                </div>

                <h3 class="ui-state-title">
                    No opportunities available
                </h3>

                <p class="ui-state-description">
                    New volunteer opportunities will appear here
                    when organizations publish them.
                </p>

                <a
                    href="opportunities.html"
                    class="button button-secondary"
                >
                    Explore Opportunities
                </a>
            </div>
        `;

        return;
    }


    container.innerHTML = openOpportunities
        .map(createHomeOpportunityCard)
        .join("");
}


/* =========================================================
   Check Opportunity Status
   ========================================================= */

function isOpenOpportunity(opportunity) {

    if (!opportunity) {
        return false;
    }

    return String(
        opportunity.status || ""
    ).toUpperCase() === "OPEN";
}


/* =========================================================
   Create Opportunity Card
   ========================================================= */

function createHomeOpportunityCard(opportunity) {

    const id =
        opportunity.id ?? "";

    const title =
        opportunity.title ||
        "Volunteer Opportunity";

    const description =
        opportunity.description ||
        "Join this volunteer opportunity and make a meaningful contribution.";

    const location =
        opportunity.location ||
        "Location to be announced";

    const organizationName =
        opportunity.organizationName ||
        opportunity.organization?.organizationName ||
        "Organization";

    const requiredVolunteers =
        opportunity.requiredVolunteers ??
        opportunity.maxVolunteers ??
        null;

    const startDate =
        opportunity.startDate ||
        null;


    return `
        <article class="opportunity-card">

            <div class="opportunity-card-media">

                <div class="opportunity-card-category">
                    Volunteer Opportunity
                </div>

            </div>


            <div class="opportunity-card-content">

                <div class="opportunity-card-top">

                    <span class="status-badge status-open">
                        Open
                    </span>

                </div>


                <h3 class="opportunity-card-title">
                    ${escapeHtml(title)}
                </h3>


                <p class="opportunity-card-description">
                    ${escapeHtml(
                        truncateText(description, 130)
                    )}
                </p>


                <div class="opportunity-card-meta">

                    <div class="opportunity-card-meta-item">

                        <span class="opportunity-card-meta-label">
                            Organization
                        </span>

                        <span>
                            ${escapeHtml(organizationName)}
                        </span>

                    </div>


                    <div class="opportunity-card-meta-item">

                        <span class="opportunity-card-meta-label">
                            Location
                        </span>

                        <span>
                            ${escapeHtml(location)}
                        </span>

                    </div>


                    ${
                        startDate
                            ? `
                                <div class="opportunity-card-meta-item">

                                    <span class="opportunity-card-meta-label">
                                        Starts
                                    </span>

                                    <span>
                                        ${escapeHtml(
                                            formatDate(startDate)
                                        )}
                                    </span>

                                </div>
                              `
                            : ""
                    }


                    ${
                        requiredVolunteers !== null
                            ? `
                                <div class="opportunity-card-meta-item">

                                    <span class="opportunity-card-meta-label">
                                        Volunteers
                                    </span>

                                    <span>
                                        ${escapeHtml(
                                            String(requiredVolunteers)
                                        )}
                                    </span>

                                </div>
                              `
                            : ""
                    }

                </div>


                <div class="opportunity-card-footer">

                    <a
                        href="opportunity-details.html?id=${encodeURIComponent(id)}"
                        class="text-link"
                    >
                        View opportunity
                    </a>

                </div>

            </div>

        </article>
    `;
}


/* =========================================================
   Error State
   ========================================================= */

function renderHomeOpportunityError(
    container,
    message
) {

    container.innerHTML = `
        <div class="ui-state ui-state-error opportunities-empty">

            <div class="ui-state-icon">
                !
            </div>

            <h3 class="ui-state-title">
                Opportunities could not be loaded
            </h3>

            <p class="ui-state-description">
                ${
                    escapeHtml(
                        message ||
                        "Please try again later."
                    )
                }
            </p>

            <button
                type="button"
                class="button button-secondary"
                id="retry-home-opportunities"
            >
                Try Again
            </button>

        </div>
    `;


    const retryButton = document.getElementById(
        "retry-home-opportunities"
    );

    if (retryButton) {

        retryButton.addEventListener(
            "click",
            loadHomeOpportunities
        );
    }
}


/* =========================================================
   Text Utility
   ========================================================= */

function truncateText(text, maxLength) {

    const value = String(text || "");

    if (value.length <= maxLength) {
        return value;
    }

    return value.substring(
        0,
        maxLength
    ).trimEnd() + "...";
}


/* =========================================================
   Initialize
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadHomeOpportunities();

    }
);
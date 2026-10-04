document.addEventListener("DOMContentLoaded", function () {

    requireAdmin();

    const searchInput = document.getElementById(
        "organization-search"
    );

    const statusFilter = document.getElementById(
        "organization-status-filter"
    );

    const clearFiltersButton = document.getElementById(
        "clear-organization-filters"
    );

    const retryButton = document.getElementById(
        "retry-admin-organizations"
    );

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            applyOrganizationFilters
        );
    }

    if (statusFilter) {
        statusFilter.addEventListener(
            "change",
            applyOrganizationFilters
        );
    }

    if (clearFiltersButton) {
        clearFiltersButton.addEventListener(
            "click",
            clearOrganizationFilters
        );
    }

    if (retryButton) {
        retryButton.addEventListener(
            "click",
            loadAdminOrganizations
        );
    }

    loadAdminOrganizations();
});


let allOrganizations = [];


/* =========================================================
   LOAD ORGANIZATIONS
========================================================= */

async function loadAdminOrganizations() {

    const loadingElement = document.getElementById(
        "admin-organizations-loading"
    );

    const errorElement = document.getElementById(
        "admin-organizations-error"
    );

    const errorMessageElement = document.getElementById(
        "admin-organizations-error-message"
    );

    if (loadingElement) {
        loadingElement.hidden = false;
    }

    if (errorElement) {
        errorElement.hidden = true;
    }

    try {

        const organizations =
            await apiGet("/organization-profiles");

        allOrganizations =
            Array.isArray(organizations)
                ? organizations
                : [];

        updateOrganizationStats(
            allOrganizations
        );

        applyOrganizationFilters();

        if (loadingElement) {
            loadingElement.hidden = true;
        }

    } catch (error) {

        console.error(
            "Unable to load organizations:",
            error
        );

        if (loadingElement) {
            loadingElement.hidden = true;
        }

        if (errorMessageElement) {
            errorMessageElement.textContent =
                error.message ||
                "Unable to load organizations.";
        }

        if (errorElement) {
            errorElement.hidden = false;
        }
    }
}


/* =========================================================
   UPDATE STATISTICS
========================================================= */

function updateOrganizationStats(
    organizations
) {

    let pending = 0;
    let verified = 0;
    let rejected = 0;

    organizations.forEach(function (organization) {

        const status =
            getOrganizationStatus(
                organization
            );

        if (status === "PENDING") {
            pending++;
        }

        if (status === "VERIFIED") {
            verified++;
        }

        if (status === "REJECTED") {
            rejected++;
        }
    });

    updateText(
        "admin-organizations-total",
        organizations.length
    );

    updateText(
        "admin-organizations-pending",
        pending
    );

    updateText(
        "admin-organizations-verified",
        verified
    );

    updateText(
        "admin-organizations-rejected",
        rejected
    );
}


/* =========================================================
   FILTER ORGANIZATIONS
========================================================= */

function applyOrganizationFilters() {

    const searchInput =
        document.getElementById(
            "organization-search"
        );

    const statusFilter =
        document.getElementById(
            "organization-status-filter"
        );

    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";

    const selectedStatus =
        statusFilter
            ? statusFilter.value
                .trim()
                .toUpperCase()
            : "";

    const filteredOrganizations =
        allOrganizations.filter(
            function (organization) {

                const name =
                    organization.organizationName ||
                    "";

                const email =
                    organization.contactEmail ||
                    getOrganizationEmail(
                        organization
                    ) ||
                    "";

                const address =
                    organization.address ||
                    "";

                const website =
                    organization.website ||
                    "";

                const status =
                    getOrganizationStatus(
                        organization
                    );

                const searchableText = (
                    name +
                    " " +
                    email +
                    " " +
                    address +
                    " " +
                    website
                ).toLowerCase();

                const matchesSearch =
                    !searchTerm ||
                    searchableText.includes(
                        searchTerm
                    );

                const matchesStatus =
                    !selectedStatus ||
                    status === selectedStatus;

                return (
                    matchesSearch &&
                    matchesStatus
                );
            }
        );

    renderOrganizations(
        filteredOrganizations
    );
}


/* =========================================================
   CLEAR FILTERS
========================================================= */

function clearOrganizationFilters() {

    const searchInput =
        document.getElementById(
            "organization-search"
        );

    const statusFilter =
        document.getElementById(
            "organization-status-filter"
        );

    if (searchInput) {
        searchInput.value = "";
    }

    if (statusFilter) {
        statusFilter.value = "";
    }

    applyOrganizationFilters();
}


/* =========================================================
   RENDER ORGANIZATIONS
========================================================= */

function renderOrganizations(
    organizations
) {

    const container =
        document.getElementById(
            "admin-organizations-list"
        );

    const emptyElement =
        document.getElementById(
            "admin-organizations-empty"
        );

    const resultCount =
        document.getElementById(
            "organization-result-count"
        );

    if (!container) {
        return;
    }

    if (resultCount) {
        resultCount.textContent =
            organizations.length +
            (
                organizations.length === 1
                    ? " organization"
                    : " organizations"
            );
    }

    if (organizations.length === 0) {

        container.innerHTML = "";

        if (emptyElement) {
            emptyElement.hidden = false;
        }

        return;
    }

    if (emptyElement) {
        emptyElement.hidden = true;
    }

    container.innerHTML =
        organizations
            .map(function (organization) {

                return createOrganizationCard(
                    organization
                );

            })
            .join("");

    attachOrganizationActions();
}


/* =========================================================
   ORGANIZATION CARD
========================================================= */

function createOrganizationCard(
    organization
) {

    const id =
        organization.id || "—";

    const name =
        organization.organizationName ||
        "Unnamed organization";

    const description =
        organization.description ||
        "No description provided.";

    const email =
        organization.contactEmail ||
        getOrganizationEmail(
            organization
        ) ||
        "No contact email";

    const address =
        organization.address ||
        "No address provided";

    const website =
        organization.website ||
        "";

    const status =
        getOrganizationStatus(
            organization
        );

    let actions = "";

    if (status === "PENDING") {

        actions = `
            <div class="admin-card-actions">

                <button
                    type="button"
                    class="btn btn-dark admin-verify-button"
                    data-id="${escapeHtml(String(id))}"
                    data-status="VERIFIED"
                >
                    Verify
                    <span
                        class="btn-arrow"
                        aria-hidden="true"
                    >
                        →
                    </span>
                </button>

                <button
                    type="button"
                    class="btn btn-outline admin-verify-button"
                    data-id="${escapeHtml(String(id))}"
                    data-status="REJECTED"
                >
                    Reject
                </button>

            </div>
        `;

    } else if (status === "VERIFIED") {

        actions = `
            <div class="admin-card-actions">

                <button
                    type="button"
                    class="btn btn-outline admin-verify-button"
                    data-id="${escapeHtml(String(id))}"
                    data-status="REJECTED"
                >
                    Mark rejected
                </button>

            </div>
        `;

    } else if (status === "REJECTED") {

        actions = `
            <div class="admin-card-actions">

                <button
                    type="button"
                    class="btn btn-dark admin-verify-button"
                    data-id="${escapeHtml(String(id))}"
                    data-status="VERIFIED"
                >
                    Verify
                    <span
                        class="btn-arrow"
                        aria-hidden="true"
                    >
                        →
                    </span>
                </button>

            </div>
        `;
    }

    return `
        <article class="admin-organization-card">

            <div class="admin-organization-card-top">

                <div class="admin-organization-index">
                    #${escapeHtml(String(id))}
                </div>

                <div>
                    ${createStatusBadge(status)}
                </div>

            </div>

            <div class="admin-organization-card-content">

                <h3>
                    ${escapeHtml(name)}
                </h3>

                <p class="admin-organization-description">
                    ${escapeHtml(description)}
                </p>

                <div class="admin-organization-meta">

                    <div>
                        <span class="section-label">
                            CONTACT
                        </span>

                        <span>
                            ${escapeHtml(email)}
                        </span>
                    </div>

                    <div>
                        <span class="section-label">
                            ADDRESS
                        </span>

                        <span>
                            ${escapeHtml(address)}
                        </span>
                    </div>

                    ${
                        website
                            ? `
                                <div>
                                    <span class="section-label">
                                        WEBSITE
                                    </span>

                                    <span>
                                        ${escapeHtml(
                                            website
                                        )}
                                    </span>
                                </div>
                            `
                            : ""
                    }

                </div>

            </div>

            ${actions}

        </article>
    `;
}


/* =========================================================
   ATTACH VERIFICATION ACTIONS
========================================================= */

function attachOrganizationActions() {

    const buttons =
        document.querySelectorAll(
            ".admin-verify-button"
        );

    buttons.forEach(function (button) {

        button.addEventListener(
            "click",
            async function () {

                const id =
                    button.dataset.id;

                const status =
                    button.dataset.status;

                if (!id || !status) {
                    return;
                }

                const organization =
                    allOrganizations.find(
                        function (item) {

                            return String(
                                item.id
                            ) === String(id);

                        }
                    );

                if (!organization) {
                    return;
                }

                const organizationName =
                    organization.organizationName ||
                    "this organization";

                const confirmed =
                    window.confirm(
                        "Are you sure you want to mark " +
                        organizationName +
                        " as " +
                        status.toLowerCase() +
                        "?"
                    );

                if (!confirmed) {
                    return;
                }

                button.disabled = true;

                try {

                    await updateOrganizationStatus(
                        organization,
                        status
                    );

                    organization.verificationStatus =
                        status;

                    updateOrganizationStats(
                        allOrganizations
                    );

                    applyOrganizationFilters();

                } catch (error) {

                    console.error(
                        "Unable to update organization status:",
                        error
                    );

                    window.alert(
                        error.message ||
                        "Unable to update organization status."
                    );

                    button.disabled = false;
                }
            }
        );
    });
}


/* =========================================================
   UPDATE ORGANIZATION VERIFICATION STATUS
========================================================= */

async function updateOrganizationStatus(
    organization,
    status
) {

    const id =
        organization.id;

    if (!id) {
        throw new Error(
            "Organization ID is missing."
        );
    }

    if (
        status !== "PENDING" &&
        status !== "VERIFIED" &&
        status !== "REJECTED"
    ) {
        throw new Error(
            "Invalid organization verification status."
        );
    }

    await apiPut(
        "/organization-profiles/" +
        id +
        "/verification-status?status=" +
        encodeURIComponent(status)
    );
}


/* =========================================================
   STATUS
========================================================= */

function getOrganizationStatus(
    organization
) {

    return String(
        organization.verificationStatus ||
        "PENDING"
    ).toUpperCase();
}


/* =========================================================
   ORGANIZATION EMAIL
========================================================= */

function getOrganizationEmail(
    organization
) {

    if (
        organization.user &&
        organization.user.email
    ) {
        return organization.user.email;
    }

    return "";
}


/* =========================================================
   UPDATE TEXT
========================================================= */

function updateText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            String(value);
    }
}
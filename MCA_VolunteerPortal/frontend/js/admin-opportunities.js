document.addEventListener("DOMContentLoaded", () => {
    if (!requireAdmin()) {
        return;
    }

    const searchInput = document.getElementById("admin-opportunity-search");
    const statusFilter = document.getElementById("admin-opportunity-status-filter");
    const clearFiltersButton = document.getElementById("clear-opportunity-filters");

    const loadingState = document.getElementById("admin-opportunities-loading");
    const errorState = document.getElementById("admin-opportunities-error");
    const errorMessage = document.getElementById("admin-opportunities-error-message");
    const retryButton = document.getElementById("retry-admin-opportunities");
    const emptyState = document.getElementById("admin-opportunities-empty");

    const listContainer = document.getElementById("admin-opportunities-list");
    const resultCount = document.getElementById("admin-opportunity-result-count");

    const totalCount = document.getElementById("admin-opportunities-total");
    const openCount = document.getElementById("admin-open-opportunities");
    const closedCount = document.getElementById("admin-closed-opportunities");
    const cancelledCount = document.getElementById("admin-cancelled-opportunities");

    let allOpportunities = [];

    if (searchInput) {
        searchInput.addEventListener("input", applyFilters);
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", applyFilters);
    }

    if (clearFiltersButton) {
        clearFiltersButton.addEventListener("click", () => {
            if (searchInput) {
                searchInput.value = "";
            }

            if (statusFilter) {
                statusFilter.value = "";
            }

            applyFilters();
        });
    }

    if (retryButton) {
        retryButton.addEventListener("click", loadOpportunities);
    }

    loadOpportunities();

    async function loadOpportunities() {
        showLoadingState();

        try {
            const opportunities = await apiGet("/opportunities");

            allOpportunities = Array.isArray(opportunities)
                ? opportunities
                : [];

            updateStatistics(allOpportunities);
            applyFilters();

            hideLoadingState();
        } catch (error) {
            console.error("Admin opportunities error:", error);

            hideLoadingState();
            showErrorState(
                error.message || "Unable to load opportunities."
            );
        }
    }

    function updateStatistics(opportunities) {
        const open = opportunities.filter(
            opportunity => opportunity.status === "OPEN"
        ).length;

        const closed = opportunities.filter(
            opportunity => opportunity.status === "CLOSED"
        ).length;

        const cancelled = opportunities.filter(
            opportunity => opportunity.status === "CANCELLED"
        ).length;

        if (totalCount) {
            totalCount.textContent = opportunities.length;
        }

        if (openCount) {
            openCount.textContent = open;
        }

        if (closedCount) {
            closedCount.textContent = closed;
        }

        if (cancelledCount) {
            cancelledCount.textContent = cancelled;
        }
    }

    function applyFilters() {
        const searchTerm = searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

        const selectedStatus = statusFilter
            ? statusFilter.value
            : "";

        const filtered = allOpportunities.filter(opportunity => {
            const title = String(opportunity.title || "").toLowerCase();

            const description = String(
                opportunity.description || ""
            ).toLowerCase();

            const location = String(
                opportunity.location || ""
            ).toLowerCase();

            const organizationName = String(
                opportunity.organizationName ||
                opportunity.organization?.organizationName ||
                ""
            ).toLowerCase();

            const categoryName = String(
                opportunity.categoryName ||
                opportunity.category?.name ||
                ""
            ).toLowerCase();

            const matchesSearch =
                !searchTerm ||
                title.includes(searchTerm) ||
                description.includes(searchTerm) ||
                location.includes(searchTerm) ||
                organizationName.includes(searchTerm) ||
                categoryName.includes(searchTerm);

            const matchesStatus =
                !selectedStatus ||
                opportunity.status === selectedStatus;

            return matchesSearch && matchesStatus;
        });

        renderOpportunities(filtered);
    }

    function renderOpportunities(opportunities) {
        if (resultCount) {
            resultCount.textContent =
                `${opportunities.length} opportunit${opportunities.length === 1 ? "y" : "ies"}`;
        }

        if (!listContainer) {
            return;
        }

        listContainer.innerHTML = "";

        if (opportunities.length === 0) {
            if (emptyState) {
                emptyState.hidden = false;
            }

            return;
        }

        if (emptyState) {
            emptyState.hidden = true;
        }

        opportunities.forEach(opportunity => {
            listContainer.insertAdjacentHTML(
                "beforeend",
                createOpportunityCard(opportunity)
            );
        });
    }

    function createOpportunityCard(opportunity) {
        const id = opportunity.id;

        const title = escapeHtml(
            opportunity.title || "Untitled Opportunity"
        );

        const description = escapeHtml(
            truncateText(
                opportunity.description || "No description available.",
                180
            )
        );

        const location = escapeHtml(
            opportunity.location || "Location not specified"
        );

        const organizationName = escapeHtml(
            opportunity.organizationName ||
            opportunity.organization?.organizationName ||
            "Organization not specified"
        );

        const categoryName = escapeHtml(
            opportunity.categoryName ||
            opportunity.category?.name ||
            "General"
        );

        const status = opportunity.status || "UNKNOWN";

        const requiredVolunteers =
            opportunity.requiredVolunteers ??
            opportunity.maxVolunteers ??
            null;

        const startDate = opportunity.startDate
            ? formatDate(opportunity.startDate)
            : "Not specified";

        const endDate = opportunity.endDate
            ? formatDate(opportunity.endDate)
            : "Not specified";

        return `
            <article class="admin-opportunity-card dashboard-list-card">

                <div class="dashboard-list-card-main">

                    <div class="dashboard-list-card-header">

                        <div>
                            <p class="eyebrow">${categoryName}</p>

                            <h3>${title}</h3>
                        </div>

                        ${createStatusBadge(status)}
                    </div>

                    <p class="dashboard-list-card-description">
                        ${description}
                    </p>

                    <div class="dashboard-list-card-meta">

                        <span>
                            <strong>Organization</strong>
                            ${organizationName}
                        </span>

                        <span>
                            <strong>Location</strong>
                            ${location}
                        </span>

                        <span>
                            <strong>Start</strong>
                            ${startDate}
                        </span>

                        <span>
                            <strong>End</strong>
                            ${endDate}
                        </span>

                        ${
                            requiredVolunteers !== null
                                ? `
                                    <span>
                                        <strong>Volunteers</strong>
                                        ${formatNumber(requiredVolunteers)}
                                    </span>
                                `
                                : ""
                        }

                    </div>

                </div>

                <div class="dashboard-list-card-actions">

                    <a
                        class="button button-secondary button-small"
                        href="opportunity-details.html?id=${encodeURIComponent(id)}"
                    >
                        View Details
                    </a>

                    ${
                        status === "OPEN"
                            ? `
                                <button
                                    type="button"
                                    class="button button-secondary button-small"
                                    data-action="close"
                                    data-id="${id}"
                                >
                                    Close
                                </button>

                                <button
                                    type="button"
                                    class="button button-danger button-small"
                                    data-action="cancel"
                                    data-id="${id}"
                                >
                                    Cancel
                                </button>
                            `
                            : ""
                    }

                    ${
                        status === "CLOSED" || status === "CANCELLED"
                            ? `
                                <button
                                    type="button"
                                    class="button button-secondary button-small"
                                    data-action="reopen"
                                    data-id="${id}"
                                >
                                    Reopen
                                </button>
                            `
                            : ""
                    }

                </div>

            </article>
        `;
    }

    listContainer?.addEventListener("click", async event => {
        const button = event.target.closest("button[data-action]");

        if (!button) {
            return;
        }

        const opportunityId = Number(button.dataset.id);
        const action = button.dataset.action;

        if (!opportunityId || !action) {
            return;
        }

        let newStatus = null;

        if (action === "close") {
            newStatus = "CLOSED";
        } else if (action === "cancel") {
            newStatus = "CANCELLED";
        } else if (action === "reopen") {
            newStatus = "OPEN";
        }

        if (!newStatus) {
            return;
        }

        const confirmed = await showConfirmation(
            `Are you sure you want to change this opportunity to ${formatStatus(newStatus)}?`
        );

        if (!confirmed) {
            return;
        }

        await updateOpportunityStatus(
            opportunityId,
            newStatus,
            button
        );
    });

    async function updateOpportunityStatus(
        opportunityId,
        newStatus,
        button
    ) {
        setButtonLoading(button, true);

        try {
            const opportunity = allOpportunities.find(
                item => Number(item.id) === opportunityId
            );

            if (!opportunity) {
                throw new Error("Opportunity not found.");
            }

            const payload = {
                title: opportunity.title,
                description: opportunity.description,
                location: opportunity.location,
                status: newStatus,
                organizationId:
                    opportunity.organizationId ||
                    opportunity.organization?.id ||
                    null,
                categoryId:
                    opportunity.categoryId ||
                    opportunity.category?.id ||
                    null,
                requiredVolunteers:
                    opportunity.requiredVolunteers ??
                    opportunity.maxVolunteers ??
                    null,
                startDate: opportunity.startDate || null,
                endDate: opportunity.endDate || null
            };

            await apiPut(
                `/opportunities/${opportunityId}`,
                payload
            );

            await loadOpportunities();

            showNotification(
                `Opportunity status changed to ${formatStatus(newStatus)}.`,
                "success"
            );
        } catch (error) {
            console.error(
                "Opportunity status update error:",
                error
            );

            showNotification(
                error.message ||
                "Unable to update opportunity status.",
                "error"
            );

            setButtonLoading(button, false);
        }
    }

    function showLoadingState() {
        if (loadingState) {
            loadingState.hidden = false;
        }

        if (errorState) {
            errorState.hidden = true;
        }

        if (emptyState) {
            emptyState.hidden = true;
        }

        if (listContainer) {
            listContainer.innerHTML = "";
        }
    }

    function hideLoadingState() {
        if (loadingState) {
            loadingState.hidden = true;
        }
    }

    function showErrorState(message) {
        if (errorState) {
            errorState.hidden = false;
        }

        if (errorMessage) {
            errorMessage.textContent = message;
        }

        if (listContainer) {
            listContainer.innerHTML = "";
        }
    }

    function truncateText(text, maxLength) {
        const value = String(text);

        if (value.length <= maxLength) {
            return value;
        }

        return `${value.substring(0, maxLength).trim()}...`;
    }
});
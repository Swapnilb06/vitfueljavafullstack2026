document.addEventListener("DOMContentLoaded", () => {
    if (!requireAdmin()) {
        return;
    }

    const searchInput = document.getElementById("admin-application-search");
    const statusFilter = document.getElementById("admin-application-status-filter");
    const clearFiltersButton = document.getElementById("clear-application-filters");

    const loadingState = document.getElementById("admin-applications-loading");
    const errorState = document.getElementById("admin-applications-error");
    const errorMessage = document.getElementById("admin-applications-error-message");
    const retryButton = document.getElementById("retry-admin-applications");
    const emptyState = document.getElementById("admin-applications-empty");

    const listContainer = document.getElementById("admin-applications-list");
    const resultCount = document.getElementById("admin-application-result-count");

    const totalCount = document.getElementById("admin-applications-total");
    const pendingCount = document.getElementById("admin-pending-applications");
    const approvedCount = document.getElementById("admin-approved-applications");
    const completedCount = document.getElementById("admin-completed-applications");

    let allApplications = [];
    let opportunityMap = new Map();
    let volunteerMap = new Map();

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
        retryButton.addEventListener("click", loadApplications);
    }

    loadApplications();

    async function loadApplications() {
        showLoadingState();

        try {
            const [
                applications,
                opportunities,
                volunteerProfiles,
                users
            ] = await Promise.all([
                apiGet("/applications"),
                apiGet("/opportunities"),
                loadVolunteerProfiles(),
                loadUsers()
            ]);

            allApplications = Array.isArray(applications)
                ? applications
                : [];

            buildOpportunityMap(
                Array.isArray(opportunities)
                    ? opportunities
                    : []
            );

            buildVolunteerMap(
                Array.isArray(volunteerProfiles)
                    ? volunteerProfiles
                    : [],
                Array.isArray(users)
                    ? users
                    : []
            );

            updateStatistics(allApplications);
            applyFilters();

            hideLoadingState();
        } catch (error) {
            console.error(
                "Admin applications error:",
                error
            );

            hideLoadingState();

            showErrorState(
                error.message ||
                "Unable to load applications."
            );
        }
    }

    async function loadVolunteerProfiles() {
        try {
            return await apiGet("/volunteer-profiles");
        } catch (error) {
            console.warn(
                "Unable to load volunteer profiles:",
                error
            );

            return [];
        }
    }

    async function loadUsers() {
        try {
            return await apiGet("/users");
        } catch (error) {
            console.warn(
                "Unable to load users:",
                error
            );

            return [];
        }
    }

    function buildOpportunityMap(opportunities) {
        opportunityMap = new Map();

        opportunities.forEach(opportunity => {
            if (opportunity && opportunity.id != null) {
                opportunityMap.set(
                    Number(opportunity.id),
                    opportunity
                );
            }
        });
    }

    function buildVolunteerMap(profiles, users) {
        volunteerMap = new Map();

        const userMap = new Map();

        users.forEach(user => {
            if (user && user.id != null) {
                userMap.set(
                    Number(user.id),
                    user
                );
            }
        });

        profiles.forEach(profile => {
            if (!profile || profile.id == null) {
                return;
            }

            const userId =
                profile.userId ||
                profile.user?.id ||
                null;

            const user =
                userId != null
                    ? userMap.get(Number(userId))
                    : null;

            volunteerMap.set(
                Number(profile.id),
                {
                    ...profile,
                    user
                }
            );
        });
    }

    function updateStatistics(applications) {
        const pending = applications.filter(
            application =>
                application.status === "PENDING"
        ).length;

        const approved = applications.filter(
            application =>
                application.status === "APPROVED"
        ).length;

        const completed = applications.filter(
            application =>
                application.status === "COMPLETED"
        ).length;

        if (totalCount) {
            totalCount.textContent = applications.length;
        }

        if (pendingCount) {
            pendingCount.textContent = pending;
        }

        if (approvedCount) {
            approvedCount.textContent = approved;
        }

        if (completedCount) {
            completedCount.textContent = completed;
        }
    }

    function applyFilters() {
        const searchTerm = searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

        const selectedStatus = statusFilter
            ? statusFilter.value
            : "";

        const filtered = allApplications.filter(application => {
            const opportunity =
                opportunityMap.get(
                    Number(application.opportunityId)
                ) ||
                application.opportunity ||
                {};

            const volunteer =
                volunteerMap.get(
                    Number(application.volunteerId)
                ) ||
                application.volunteer ||
                {};

            const volunteerName =
                getVolunteerName(volunteer).toLowerCase();

            const volunteerEmail =
                getVolunteerEmail(volunteer).toLowerCase();

            const opportunityTitle =
                String(
                    opportunity.title || ""
                ).toLowerCase();

            const location =
                String(
                    opportunity.location || ""
                ).toLowerCase();

            const status =
                String(
                    application.status || ""
                ).toLowerCase();

            const matchesSearch =
                !searchTerm ||
                volunteerName.includes(searchTerm) ||
                volunteerEmail.includes(searchTerm) ||
                opportunityTitle.includes(searchTerm) ||
                location.includes(searchTerm) ||
                status.includes(searchTerm);

            const matchesStatus =
                !selectedStatus ||
                application.status === selectedStatus;

            return matchesSearch && matchesStatus;
        });

        renderApplications(filtered);
    }

    function renderApplications(applications) {
        if (resultCount) {
            resultCount.textContent =
                `${applications.length} application${applications.length === 1 ? "" : "s"}`;
        }

        if (!listContainer) {
            return;
        }

        listContainer.innerHTML = "";

        if (applications.length === 0) {
            if (emptyState) {
                emptyState.hidden = false;
            }

            return;
        }

        if (emptyState) {
            emptyState.hidden = true;
        }

        applications.forEach(application => {
            listContainer.insertAdjacentHTML(
                "beforeend",
                createApplicationCard(application)
            );
        });
    }

    function createApplicationCard(application) {
        const applicationId = application.id;

        const opportunity =
            opportunityMap.get(
                Number(application.opportunityId)
            ) ||
            application.opportunity ||
            {};

        const volunteer =
            volunteerMap.get(
                Number(application.volunteerId)
            ) ||
            application.volunteer ||
            {};

        const volunteerName = escapeHtml(
            getVolunteerName(volunteer)
        );

        const volunteerEmail = escapeHtml(
            getVolunteerEmail(volunteer)
        );

        const opportunityTitle = escapeHtml(
            opportunity.title ||
            "Opportunity not available"
        );

        const location = escapeHtml(
            opportunity.location ||
            "Location not specified"
        );

        const status =
            application.status || "UNKNOWN";

        const appliedAt =
            application.appliedAt ||
            application.createdAt ||
            null;

        return `
            <article class="admin-application-card dashboard-list-card">

                <div class="dashboard-list-card-main">

                    <div class="dashboard-list-card-header">

                        <div>
                            <p class="eyebrow">
                                Application #${applicationId}
                            </p>

                            <h3>
                                ${opportunityTitle}
                            </h3>
                        </div>

                        ${createStatusBadge(status)}
                    </div>

                    <div class="dashboard-list-card-meta">

                        <span>
                            <strong>Volunteer</strong>
                            ${volunteerName}
                        </span>

                        ${
                            volunteerEmail
                                ? `
                                    <span>
                                        <strong>Email</strong>
                                        ${volunteerEmail}
                                    </span>
                                `
                                : ""
                        }

                        <span>
                            <strong>Location</strong>
                            ${location}
                        </span>

                        <span>
                            <strong>Applied</strong>
                            ${
                                appliedAt
                                    ? formatDateTime(appliedAt)
                                    : "Not available"
                            }
                        </span>

                    </div>

                </div>

                <div class="dashboard-list-card-actions">

                    ${
                        status === "PENDING"
                            ? `
                                <button
                                    type="button"
                                    class="button button-primary button-small"
                                    data-action="approve"
                                    data-id="${applicationId}"
                                >
                                    Approve
                                </button>

                                <button
                                    type="button"
                                    class="button button-danger button-small"
                                    data-action="reject"
                                    data-id="${applicationId}"
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
                                    class="button button-secondary button-small"
                                    data-action="complete"
                                    data-id="${applicationId}"
                                >
                                    Mark Completed
                                </button>
                            `
                            : ""
                    }

                    ${
                        status === "REJECTED" ||
                        status === "CANCELLED"
                            ? `
                                <button
                                    type="button"
                                    class="button button-secondary button-small"
                                    data-action="approve"
                                    data-id="${applicationId}"
                                >
                                    Approve
                                </button>
                            `
                            : ""
                    }

                </div>

            </article>
        `;
    }

    listContainer?.addEventListener("click", async event => {
        const button = event.target.closest(
            "button[data-action]"
        );

        if (!button) {
            return;
        }

        const applicationId =
            Number(button.dataset.id);

        const action =
            button.dataset.action;

        if (!applicationId || !action) {
            return;
        }

        let newStatus = null;

        if (action === "approve") {
            newStatus = "APPROVED";
        } else if (action === "reject") {
            newStatus = "REJECTED";
        } else if (action === "complete") {
            newStatus = "COMPLETED";
        }

        if (!newStatus) {
            return;
        }

        const confirmed = await showConfirmation(
            `Are you sure you want to change this application to ${formatStatus(newStatus)}?`
        );

        if (!confirmed) {
            return;
        }

        await updateApplicationStatus(
            applicationId,
            newStatus,
            button
        );
    });

    async function updateApplicationStatus(
        applicationId,
        newStatus,
        button
    ) {
        setButtonLoading(button, true);

        try {
            const application =
                allApplications.find(
                    item =>
                        Number(item.id) ===
                        applicationId
                );

            if (!application) {
                throw new Error(
                    "Application not found."
                );
            }

            const volunteerId =
                application.volunteerId ||
                application.volunteer?.id;

            const opportunityId =
                application.opportunityId ||
                application.opportunity?.id;

            if (!volunteerId || !opportunityId) {
                throw new Error(
                    "Application is missing volunteer or opportunity information."
                );
            }

            await apiPut(
                `/applications/${applicationId}`,
                {
                    volunteerId: Number(volunteerId),
                    opportunityId: Number(opportunityId),
                    status: newStatus
                }
            );

            await loadApplications();

            showNotification(
                `Application status changed to ${formatStatus(newStatus)}.`,
                "success"
            );
        } catch (error) {
            console.error(
                "Application status update error:",
                error
            );

            showNotification(
                error.message ||
                "Unable to update application status.",
                "error"
            );

            setButtonLoading(button, false);
        }
    }

    function getVolunteerName(volunteer) {
        return (
            volunteer?.name ||
            volunteer?.userName ||
            volunteer?.user?.name ||
            volunteer?.fullName ||
            `Volunteer #${volunteer?.id || "Unknown"}`
        );
    }

    function getVolunteerEmail(volunteer) {
        return (
            volunteer?.email ||
            volunteer?.user?.email ||
            ""
        );
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
});
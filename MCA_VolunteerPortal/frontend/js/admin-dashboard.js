document.addEventListener("DOMContentLoaded", function () {
    requireAdmin();

    const retryButton = document.getElementById("retry-admin-dashboard");

    if (retryButton) {
        retryButton.addEventListener("click", loadAdminDashboard);
    }

    loadAdminDashboard();
});


async function loadAdminDashboard() {
    const loadingElement = document.getElementById("admin-dashboard-loading");
    const errorElement = document.getElementById("admin-dashboard-error");
    const errorMessageElement = document.getElementById("admin-dashboard-error-message");

    if (loadingElement) {
        loadingElement.hidden = false;
    }

    if (errorElement) {
        errorElement.hidden = true;
    }

    try {
        const users = await apiGet("/users");
        const organizations = await apiGet("/organization-profiles");
        const opportunities = await apiGet("/opportunities");
        const applications = await apiGet("/applications");

        const userList = Array.isArray(users) ? users : [];
        const organizationList = Array.isArray(organizations)
            ? organizations
            : [];
        const opportunityList = Array.isArray(opportunities)
            ? opportunities
            : [];
        const applicationList = Array.isArray(applications)
            ? applications
            : [];

        updateDashboardStats(
            userList,
            organizationList,
            opportunityList,
            applicationList
        );

        renderPendingOrganizations(organizationList);

        renderRecentActivity(
            userList,
            opportunityList,
            applicationList
        );

        if (loadingElement) {
            loadingElement.hidden = true;
        }

    } catch (error) {
        console.error("Admin dashboard error:", error);

        if (loadingElement) {
            loadingElement.hidden = true;
        }

        if (errorMessageElement) {
            errorMessageElement.textContent =
                error.message ||
                "Unable to load administration data.";
        }

        if (errorElement) {
            errorElement.hidden = false;
        }
    }
}


/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

function updateDashboardStats(
    users,
    organizations,
    opportunities,
    applications
) {
    updateText("admin-users-count", users.length);

    updateText(
        "admin-organizations-count",
        organizations.length
    );

    updateText(
        "admin-opportunities-count",
        opportunities.length
    );

    updateText(
        "admin-applications-count",
        applications.length
    );
}


/* =========================================================
   PENDING ORGANIZATIONS
========================================================= */

function renderPendingOrganizations(organizations) {
    const container = document.getElementById(
        "admin-pending-organizations"
    );

    if (!container) {
        return;
    }

    const pendingOrganizations = organizations.filter(
        function (organization) {
            const status = String(
                organization.verificationStatus || ""
            ).toUpperCase();

            return status === "PENDING";
        }
    );

    if (pendingOrganizations.length === 0) {
        container.innerHTML = `
            <div class="empty-state compact">
                <span class="section-label">
                    CLEAR
                </span>

                <h3>
                    No pending organizations.
                </h3>

                <p>
                    There are currently no organization profiles
                    waiting for verification.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML = pendingOrganizations
        .slice(0, 5)
        .map(function (organization) {
            const organizationName =
                organization.organizationName ||
                "Unnamed organization";

            const email =
                organization.contactEmail ||
                getOrganizationEmail(organization) ||
                "No contact email";

            const id = organization.id || "—";

            return `
                <article class="admin-review-item">

                    <div class="admin-review-index">
                        ${escapeHtml(String(id))}
                    </div>

                    <div class="admin-review-content">

                        <div class="admin-review-heading">

                            <h4>
                                ${escapeHtml(organizationName)}
                            </h4>

                            ${createStatusBadge("PENDING")}

                        </div>

                        <p>
                            ${escapeHtml(email)}
                        </p>

                    </div>

                    <a
                        href="admin-organizations.html"
                        class="text-button"
                    >
                        Review
                        <span aria-hidden="true">→</span>
                    </a>

                </article>
            `;
        })
        .join("");
}


/* =========================================================
   RECENT ACTIVITY
========================================================= */

function renderRecentActivity(
    users,
    opportunities,
    applications
) {
    const container = document.getElementById(
        "admin-recent-activity"
    );

    if (!container) {
        return;
    }

    const activities = [];


    /* APPLICATION ACTIVITY */

    applications
        .slice()
        .sort(function (a, b) {
            return (
                getDateValue(
                    b.appliedAt || b.createdAt
                ) -
                getDateValue(
                    a.appliedAt || a.createdAt
                )
            );
        })
        .slice(0, 5)
        .forEach(function (application) {
            activities.push({
                type: "APPLICATION",

                title: "Application activity",

                description:
                    getApplicationDescription(
                        application
                    ),

                date:
                    application.appliedAt ||
                    application.createdAt ||
                    null
            });
        });


    /* OPPORTUNITY ACTIVITY */

    opportunities
        .slice()
        .sort(function (a, b) {
            return (
                getDateValue(b.createdAt) -
                getDateValue(a.createdAt)
            );
        })
        .slice(0, 3)
        .forEach(function (opportunity) {
            activities.push({
                type: "OPPORTUNITY",

                title: "Opportunity activity",

                description:
                    opportunity.title ||
                    "An opportunity was created.",

                date:
                    opportunity.createdAt ||
                    null
            });
        });


    /* USER ACTIVITY */

    users
        .slice()
        .sort(function (a, b) {
            return (
                getDateValue(b.createdAt) -
                getDateValue(a.createdAt)
            );
        })
        .slice(0, 3)
        .forEach(function (user) {
            activities.push({
                type: "USER",

                title: "New platform user",

                description:
                    user.name ||
                    user.email ||
                    "A new user joined the platform.",

                date:
                    user.createdAt ||
                    null
            });
        });


    if (activities.length === 0) {
        container.innerHTML = `
            <div class="empty-state compact">

                <span class="section-label">
                    ACTIVITY
                </span>

                <h3>
                    No recent activity.
                </h3>

                <p>
                    Platform activity will appear here as
                    the system is used.
                </p>

            </div>
        `;

        return;
    }


    activities.sort(function (a, b) {
        return (
            getDateValue(b.date) -
            getDateValue(a.date)
        );
    });


    container.innerHTML = activities
        .slice(0, 8)
        .map(function (activity, index) {
            return `
                <article class="admin-activity-item">

                    <div class="admin-activity-index">
                        ${String(index + 1).padStart(2, "0")}
                    </div>

                    <div class="admin-activity-content">

                        <div class="admin-activity-heading">

                            <span class="section-label">
                                ${escapeHtml(activity.type)}
                            </span>

                            <span class="admin-activity-date">
                                ${formatActivityDate(
                                    activity.date
                                )}
                            </span>

                        </div>

                        <h4>
                            ${escapeHtml(activity.title)}
                        </h4>

                        <p>
                            ${escapeHtml(
                                activity.description
                            )}
                        </p>

                    </div>

                </article>
            `;
        })
        .join("");
}


/* =========================================================
   APPLICATION DESCRIPTION
========================================================= */

function getApplicationDescription(application) {
    const volunteer =
        application.volunteerName ||
        getNestedName(application.volunteer) ||
        (
            application.volunteerId
                ? "Volunteer #" + application.volunteerId
                : "A volunteer"
        );

    const opportunity =
        application.opportunityTitle ||
        getNestedTitle(application.opportunity) ||
        (
            application.opportunityId
                ? "Opportunity #" + application.opportunityId
                : "an opportunity"
        );

    return (
        volunteer +
        " applied for " +
        opportunity +
        "."
    );
}


/* =========================================================
   ORGANIZATION EMAIL
========================================================= */

function getOrganizationEmail(organization) {
    if (
        organization.user &&
        organization.user.email
    ) {
        return organization.user.email;
    }

    return "";
}


/* =========================================================
   NESTED NAME
========================================================= */

function getNestedName(object) {
    if (
        object &&
        typeof object === "object"
    ) {
        return (
            object.name ||
            object.fullName ||
            object.userName ||
            ""
        );
    }

    return "";
}


/* =========================================================
   NESTED TITLE
========================================================= */

function getNestedTitle(object) {
    if (
        object &&
        typeof object === "object"
    ) {
        return object.title || "";
    }

    return "";
}


/* =========================================================
   UPDATE TEXT
========================================================= */

function updateText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = String(value);
    }
}


/* =========================================================
   DATE VALUE
========================================================= */

function getDateValue(value) {
    if (!value) {
        return 0;
    }

    const timestamp = new Date(value).getTime();

    return Number.isNaN(timestamp)
        ? 0
        : timestamp;
}


/* =========================================================
   ACTIVITY DATE
========================================================= */

function formatActivityDate(value) {
    if (!value) {
        return "Recent";
    }

    try {
        return formatDateTime(value);
    } catch (error) {
        return "Recent";
    }
}
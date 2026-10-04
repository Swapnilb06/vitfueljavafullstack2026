document.addEventListener("DOMContentLoaded", function () {

    requireAdmin();

    const searchInput = document.getElementById(
        "user-search"
    );

    const roleFilter = document.getElementById(
        "user-role-filter"
    );

    const clearFiltersButton = document.getElementById(
        "clear-user-filters"
    );

    const retryButton = document.getElementById(
        "retry-admin-users"
    );


    if (searchInput) {
        searchInput.addEventListener(
            "input",
            applyUserFilters
        );
    }


    if (roleFilter) {
        roleFilter.addEventListener(
            "change",
            applyUserFilters
        );
    }


    if (clearFiltersButton) {
        clearFiltersButton.addEventListener(
            "click",
            clearUserFilters
        );
    }


    if (retryButton) {
        retryButton.addEventListener(
            "click",
            loadAdminUsers
        );
    }


    loadAdminUsers();
});


let allUsers = [];


/* =========================================================
   LOAD USERS
========================================================= */

async function loadAdminUsers() {

    const loadingElement = document.getElementById(
        "admin-users-loading"
    );

    const errorElement = document.getElementById(
        "admin-users-error"
    );

    const errorMessageElement = document.getElementById(
        "admin-users-error-message"
    );


    if (loadingElement) {
        loadingElement.hidden = false;
    }


    if (errorElement) {
        errorElement.hidden = true;
    }


    try {

        const users =
            await apiGet("/users");


        allUsers =
            Array.isArray(users)
                ? users
                : [];


        updateUserStats(
            allUsers
        );


        applyUserFilters();


        if (loadingElement) {
            loadingElement.hidden = true;
        }

    } catch (error) {

        console.error(
            "Unable to load users:",
            error
        );


        if (loadingElement) {
            loadingElement.hidden = true;
        }


        if (errorMessageElement) {
            errorMessageElement.textContent =
                error.message ||
                "Unable to load users.";
        }


        if (errorElement) {
            errorElement.hidden = false;
        }
    }
}


/* =========================================================
   USER STATISTICS
========================================================= */

function updateUserStats(
    users
) {

    let volunteers = 0;
    let organizations = 0;
    let admins = 0;


    users.forEach(function (user) {

        const role =
            getUserRole(user);


        if (role === "VOLUNTEER") {
            volunteers++;
        }


        if (role === "ORGANIZATION") {
            organizations++;
        }


        if (role === "ADMIN") {
            admins++;
        }
    });


    updateText(
        "admin-users-total",
        users.length
    );


    updateText(
        "admin-volunteers-count",
        volunteers
    );


    updateText(
        "admin-organization-users-count",
        organizations
    );


    updateText(
        "admin-admins-count",
        admins
    );
}


/* =========================================================
   FILTER USERS
========================================================= */

function applyUserFilters() {

    const searchInput =
        document.getElementById(
            "user-search"
        );


    const roleFilter =
        document.getElementById(
            "user-role-filter"
        );


    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const selectedRole =
        roleFilter
            ? roleFilter.value
                .trim()
                .toUpperCase()
            : "";


    const filteredUsers =
        allUsers.filter(function (user) {

            const name =
                user.name ||
                "";


            const email =
                user.email ||
                "";


            const phone =
                user.phone ||
                "";


            const role =
                getUserRole(user);


            const searchableText =
                (
                    name +
                    " " +
                    email +
                    " " +
                    phone
                ).toLowerCase();


            const matchesSearch =
                !searchTerm ||
                searchableText.includes(
                    searchTerm
                );


            const matchesRole =
                !selectedRole ||
                role === selectedRole;


            return (
                matchesSearch &&
                matchesRole
            );
        });


    renderUsers(
        filteredUsers
    );
}


/* =========================================================
   CLEAR FILTERS
========================================================= */

function clearUserFilters() {

    const searchInput =
        document.getElementById(
            "user-search"
        );


    const roleFilter =
        document.getElementById(
            "user-role-filter"
        );


    if (searchInput) {
        searchInput.value = "";
    }


    if (roleFilter) {
        roleFilter.value = "";
    }


    applyUserFilters();
}


/* =========================================================
   RENDER USERS
========================================================= */

function renderUsers(
    users
) {

    const container =
        document.getElementById(
            "admin-users-list"
        );


    const emptyElement =
        document.getElementById(
            "admin-users-empty"
        );


    const resultCount =
        document.getElementById(
            "user-result-count"
        );


    if (!container) {
        return;
    }


    if (resultCount) {

        resultCount.textContent =
            users.length +
            (
                users.length === 1
                    ? " user"
                    : " users"
            );
    }


    if (users.length === 0) {

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
        users
            .map(function (user) {

                return createUserCard(
                    user
                );

            })
            .join("");
}


/* =========================================================
   USER CARD
========================================================= */

function createUserCard(
    user
) {

    const id =
        user.id || "—";


    const name =
        user.name ||
        "Unnamed user";


    const email =
        user.email ||
        "No email provided";


    const phone =
        user.phone ||
        "No phone provided";


    const role =
        getUserRole(user);


    const createdAt =
        user.createdAt ||
        null;


    const roleLabel =
        formatRoleLabel(
            role
        );


    return `
        <article class="admin-user-card">

            <div class="admin-user-card-top">

                <div class="admin-user-index">
                    #${escapeHtml(
                        String(id)
                    )}
                </div>

                <div>
                    ${createStatusBadge(
                        role
                    )}
                </div>

            </div>


            <div class="admin-user-card-content">

                <h3>
                    ${escapeHtml(name)}
                </h3>

                <p>
                    ${escapeHtml(email)}
                </p>


                <div class="admin-user-meta">

                    <div>

                        <span class="section-label">
                            ROLE
                        </span>

                        <span>
                            ${escapeHtml(
                                roleLabel
                            )}
                        </span>

                    </div>


                    <div>

                        <span class="section-label">
                            PHONE
                        </span>

                        <span>
                            ${escapeHtml(
                                phone
                            )}
                        </span>

                    </div>


                    ${
                        createdAt
                            ? `
                                <div>

                                    <span class="section-label">
                                        JOINED
                                    </span>

                                    <span>
                                        ${escapeHtml(
                                            formatUserDate(
                                                createdAt
                                            )
                                        )}
                                    </span>

                                </div>
                            `
                            : ""
                    }

                </div>

            </div>

        </article>
    `;
}


/* =========================================================
   USER ROLE
========================================================= */

function getUserRole(
    user
) {

    return String(
        user.role ||
        "UNKNOWN"
    ).toUpperCase();
}


/* =========================================================
   ROLE LABEL
========================================================= */

function formatRoleLabel(
    role
) {

    switch (role) {

        case "VOLUNTEER":
            return "Volunteer";

        case "ORGANIZATION":
            return "Organization";

        case "ADMIN":
            return "Administrator";

        default:
            return role || "Unknown";
    }
}


/* =========================================================
   USER DATE
========================================================= */

function formatUserDate(
    value
) {

    if (!value) {
        return "—";
    }


    try {

        return formatDate(
            value
        );

    } catch (error) {

        return "—";
    }
}


/* =========================================================
   UPDATE TEXT
========================================================= */

function updateText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {
        element.textContent =
            String(value);
    }
}
/**
 * =========================================================
 * VolunteerPortalJava - Navigation
 * =========================================================
 *
 * Creates and controls the shared site navigation.
 *
 * The navigation changes according to the user's
 * authentication state and role.
 */


/* =========================================================
   Navigation Configuration
   ========================================================= */

const NAVIGATION_CONFIG = {

    public: [
        {
            label: "Home",
            href: "index.html"
        },
        {
            label: "Opportunities",
            href: "opportunities.html"
        },
        {
            label: "Login",
            href: "login.html"
        },
        {
            label: "Register",
            href: "register.html"
        }
    ],

    volunteer: [
        {
            label: "Home",
            href: "index.html"
        },
        {
            label: "Opportunities",
            href: "opportunities.html"
        },
        {
            label: "My Applications",
            href: "applications.html"
        },
        {
            label: "Dashboard",
            href: "volunteer-dashboard.html"
        },
        {
            label: "Certificates",
            href: "volunteer-certificates.html"
        }
    ],

    organization: [
        {
            label: "Home",
            href: "index.html"
        },
        {
            label: "Dashboard",
            href: "organization-dashboard.html"
        },
        {
            label: "Opportunities",
            href: "organization-opportunities.html"
        },
        {
            label: "Applications",
            href: "organization-applications.html"
        },
        {
            label: "Attendance",
            href: "attendance.html"
        },
        {
            label: "Certificates",
            href: "organization-certificates.html"
        },
        {
            label: "Profile",
            href: "organization-profile.html"
        }
    ],

    admin: [
        {
            label: "Dashboard",
            href: "admin-dashboard.html"
        },
        {
            label: "Users",
            href: "admin-users.html"
        },
        {
            label: "Organizations",
            href: "admin-organizations.html"
        },
        {
            label: "Applications",
            href: "admin-applications.html"
        }
    ]
};


/* =========================================================
   Page Detection
   ========================================================= */

function getCurrentPageName() {

    const path = window.location.pathname;

    const fileName = path.split("/").pop();

    return fileName || "index.html";
}


/* =========================================================
   Navigation Selection
   ========================================================= */

function getNavigationItems() {

    if (!isAuthenticated()) {
        return NAVIGATION_CONFIG.public;
    }

    switch (getCurrentUserRole()) {

        case "VOLUNTEER":
            return NAVIGATION_CONFIG.volunteer;

        case "ORGANIZATION":
            return NAVIGATION_CONFIG.organization;

        case "ADMIN":
            return NAVIGATION_CONFIG.admin;

        default:
            return NAVIGATION_CONFIG.public;
    }
}


/* =========================================================
   Active Navigation
   ========================================================= */

function isNavigationItemActive(href) {

    const currentPage = getCurrentPageName();

    return currentPage === href;
}


/* =========================================================
   Navigation HTML
   ========================================================= */

function createNavigationMarkup() {

    const items = getNavigationItems();

    const authenticated = isAuthenticated();

    const currentUserName = getCurrentUserName();
    const currentRole = getCurrentUserRole();

    const navigationLinks = items
        .map((item) => {

            const activeClass =
                isNavigationItemActive(item.href)
                    ? "nav-link active"
                    : "nav-link";

            return `
                <a
                    class="${activeClass}"
                    href="${item.href}"
                >
                    ${item.label}
                </a>
            `;
        })
        .join("");

    const userSection = authenticated
        ? `
            <div class="nav-user">
                <span class="nav-user-name">
                    ${escapeNavigationText(currentUserName)}
                </span>

                <span class="nav-user-role">
                    ${formatRoleLabel(currentRole)}
                </span>

                <button
                    type="button"
                    class="nav-logout"
                    data-action="logout"
                >
                    Logout
                </button>
            </div>
        `
        : "";

    return `
        <header class="site-header">

            <div class="site-header-inner">

                <a
                    href="index.html"
                    class="site-logo"
                    aria-label="VolunteerPortalJava home"
                >
                    <span class="site-logo-mark">VP</span>

                    <span class="site-logo-text">
                        VolunteerPortal
                    </span>
                </a>


                <button
                    type="button"
                    class="mobile-menu-toggle"
                    aria-label="Open navigation menu"
                    aria-expanded="false"
                    data-action="toggle-menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>


                <div class="site-navigation-wrapper">

                    <nav
                        class="site-navigation"
                        aria-label="Main navigation"
                    >
                        ${navigationLinks}
                    </nav>

                    ${userSection}

                </div>

            </div>

        </header>
    `;
}


/* =========================================================
   Navigation Rendering
   ========================================================= */

function renderNavigation(containerSelector = "[data-navigation], #site-header") {

    const containers =
        document.querySelectorAll(containerSelector);

    if (!containers.length) {
        return;
    }

    containers.forEach((container) => {

        container.innerHTML =
            createNavigationMarkup();

    });

    initializeNavigationEvents();
}


/* =========================================================
   Navigation Events
   ========================================================= */

function initializeNavigationEvents() {

    document
        .querySelectorAll('[data-action="logout"]')
        .forEach((button) => {

            button.addEventListener("click", () => {

                logout();

            });

        });


    document
        .querySelectorAll('[data-action="toggle-menu"]')
        .forEach((button) => {

            button.addEventListener("click", () => {

                toggleMobileNavigation(button);

            });

        });


    /*
     * Close the mobile navigation after clicking a link.
     */
    document
        .querySelectorAll(".site-navigation .nav-link")
        .forEach((link) => {

            link.addEventListener("click", () => {

                closeMobileNavigation();

            });

        });

}


/* =========================================================
   Mobile Navigation
   ========================================================= */

function toggleMobileNavigation(toggleButton) {

    const header =
        toggleButton.closest(".site-header");

    if (!header) {
        return;
    }

    const navigationWrapper =
        header.querySelector(".site-navigation-wrapper");

    if (!navigationWrapper) {
        return;
    }

    const isOpen =
        navigationWrapper.classList.toggle("is-open");

    toggleButton.setAttribute(
        "aria-expanded",
        String(isOpen)
    );

    toggleButton.setAttribute(
        "aria-label",
        isOpen
            ? "Close navigation menu"
            : "Open navigation menu"
    );

}


function closeMobileNavigation() {

    document
        .querySelectorAll(".site-navigation-wrapper.is-open")
        .forEach((wrapper) => {

            wrapper.classList.remove("is-open");

        });


    document
        .querySelectorAll(".mobile-menu-toggle")
        .forEach((button) => {

            button.setAttribute(
                "aria-expanded",
                "false"
            );

            button.setAttribute(
                "aria-label",
                "Open navigation menu"
            );

        });

}


/* 
   Role Formatting
   */

function formatRoleLabel(role) {

    switch (role) {

        case "VOLUNTEER":
            return "Volunteer";

        case "ORGANIZATION":
            return "Organization";

        case "ADMIN":
            return "Administrator";

        default:
            return "";
    }
}


/* =========================================================
   Safe Text Handling
   ========================================================= */

function escapeNavigationText(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   Initialization
   ========================================================= */

function renderFooter() {
    const el = document.getElementById("site-footer");
    if (!el) { return; }
    el.innerHTML = `<footer class="vp-footer"><div class="container vp-footer-inner"><a class="vp-footer-brand" href="index.html">VolunteerPortal</a><nav class="vp-footer-links" aria-label="Footer"><a href="index.html">Home</a><a href="opportunities.html">Opportunities</a><a href="login.html">Login</a><a href="register.html">Register</a></nav><p class="vp-footer-note">&copy; ${new Date().getFullYear()} VolunteerPortal</p></div></footer>`;
}

document.addEventListener("DOMContentLoaded", () => {

    renderNavigation();
    renderFooter();

});
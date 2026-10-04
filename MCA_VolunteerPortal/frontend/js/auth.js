/**
 * =========================================================
 * VolunteerPortalJava - Authentication Utilities
 * =========================================================
 *
 * This file contains frontend authentication/session helpers.
 *
 * IMPORTANT:
 * The backend remains the final authority for authentication
 * and authorization. These functions only control the frontend
 * experience and page navigation.
 */


/* =========================================================
   Session Storage Keys
   ========================================================= */

const AUTH_KEYS = {
    token: "vp_token",
    tokenType: "vp_token_type",
    userId: "vp_user_id",
    name: "vp_name",
    email: "vp_email",
    role: "vp_role"
};


/* =========================================================
   Session Information
   ========================================================= */

/**
 * Return the stored authentication token.
 */
function getAuthToken() {
    return localStorage.getItem(AUTH_KEYS.token);
}


/**
 * Return the stored token type.
 */
function getAuthTokenType() {
    return localStorage.getItem(AUTH_KEYS.tokenType) || "Bearer";
}


/**
 * Return the logged-in user's ID.
 */
function getCurrentUserId() {
    const value = localStorage.getItem(AUTH_KEYS.userId);

    if (!value) {
        return null;
    }

    const id = Number(value);

    return Number.isNaN(id) ? null : id;
}


/**
 * Return the logged-in user's name.
 */
function getCurrentUserName() {
    return localStorage.getItem(AUTH_KEYS.name) || "";
}


/**
 * Return the logged-in user's email.
 */
function getCurrentUserEmail() {
    return localStorage.getItem(AUTH_KEYS.email) || "";
}


/**
 * Return the logged-in user's role.
 *
 * Possible values:
 * VOLUNTEER
 * ORGANIZATION
 * ADMIN
 */
function getCurrentUserRole() {
    return localStorage.getItem(AUTH_KEYS.role) || "";
}


/**
 * Return all currently stored user information.
 */
function getCurrentUser() {
    return {
        id: getCurrentUserId(),
        name: getCurrentUserName(),
        email: getCurrentUserEmail(),
        role: getCurrentUserRole()
    };
}


/**
 * Check whether a valid-looking login session exists.
 */
function isAuthenticated() {
    const token = getAuthToken();

    return Boolean(token);
}


/* =========================================================
   Role Helpers
   ========================================================= */

function isVolunteer() {
    return getCurrentUserRole() === "VOLUNTEER";
}


function isOrganization() {
    return getCurrentUserRole() === "ORGANIZATION";
}


function isAdmin() {
    return getCurrentUserRole() === "ADMIN";
}


/* =========================================================
   Login Session
   ========================================================= */

/**
 * Store authentication information returned by the backend.
 *
 * Expected AuthResponse fields from the existing backend:
 * token
 * tokenType
 * id
 * name
 * email
 * role
 */
function saveAuthSession(authResponse) {

    if (!authResponse || !authResponse.token) {
        throw new Error("Invalid authentication response.");
    }

    localStorage.setItem(
        AUTH_KEYS.token,
        authResponse.token
    );

    localStorage.setItem(
        AUTH_KEYS.tokenType,
        authResponse.tokenType || "Bearer"
    );

    if (authResponse.id !== undefined && authResponse.id !== null) {
        localStorage.setItem(
            AUTH_KEYS.userId,
            String(authResponse.id)
        );
    }

    if (authResponse.name !== undefined && authResponse.name !== null) {
        localStorage.setItem(
            AUTH_KEYS.name,
            authResponse.name
        );
    }

    if (authResponse.email !== undefined && authResponse.email !== null) {
        localStorage.setItem(
            AUTH_KEYS.email,
            authResponse.email
        );
    }

    if (authResponse.role !== undefined && authResponse.role !== null) {
        localStorage.setItem(
            AUTH_KEYS.role,
            authResponse.role
        );
    }
}


/* =========================================================
   Logout
   ========================================================= */

/**
 * Clear the complete frontend authentication session.
 */
function logout() {

    Object.values(AUTH_KEYS).forEach((key) => {
        localStorage.removeItem(key);
    });

    /*
     * Also remove any future page-specific temporary values
     * that may be introduced during the application flow.
     */
    localStorage.removeItem("vp_selected_opportunity");
    localStorage.removeItem("vp_selected_application");

    window.location.href = "login.html";
}


/* =========================================================
   Redirect Helpers
   ========================================================= */

/**
 * Return the correct dashboard for the current role.
 */
function getRoleDashboard() {

    const role = getCurrentUserRole();

    switch (role) {

        case "VOLUNTEER":
            return "volunteer-dashboard.html";

        case "ORGANIZATION":
            return "organization-dashboard.html";

        case "ADMIN":
            return "admin-dashboard.html";

        default:
            return "login.html";
    }
}


/**
 * Redirect an authenticated user to their role dashboard.
 */
function redirectToRoleDashboard() {

    if (!isAuthenticated()) {
        window.location.href = "login.html";
        return;
    }

    window.location.href = getRoleDashboard();
}


/**
 * Redirect the user according to their role after login.
 */
function redirectAfterLogin() {

    const role = getCurrentUserRole();

    switch (role) {

        case "VOLUNTEER":
            window.location.href = "volunteer-dashboard.html";
            break;

        case "ORGANIZATION":
            window.location.href = "organization-dashboard.html";
            break;

        case "ADMIN":
            window.location.href = "admin-dashboard.html";
            break;

        default:
            logout();
            break;
    }
}


/* =========================================================
   Page Protection
   ========================================================= */

/**
 * Protect a page that requires authentication.
 *
 * If the user is not logged in, redirect to login.
 */
function requireAuthentication() {

    if (!isAuthenticated()) {
        window.location.href = "login.html";
        return false;
    }

    return true;
}


/**
 * Protect a page for one or more roles.
 *
 * Example:
 *
 * requireRole("VOLUNTEER");
 *
 * or:
 *
 * requireRole("VOLUNTEER", "ADMIN");
 */
function requireRole(...allowedRoles) {

    if (!requireAuthentication()) {
        return false;
    }

    const currentRole = getCurrentUserRole();

    if (!allowedRoles.includes(currentRole)) {

        /*
         * If the user is authenticated but tries to access
         * another role's page, send them to their own dashboard.
         */
        redirectToRoleDashboard();

        return false;
    }

    return true;
}


/**
 * Protect a volunteer page.
 */
function requireVolunteer() {
    return requireRole("VOLUNTEER");
}


/**
 * Protect an organization page.
 */
function requireOrganization() {
    return requireRole("ORGANIZATION");
}


/**
 * Protect an admin page.
 */
function requireAdmin() {
    return requireRole("ADMIN");
}


/**
 * Protect a page available to volunteer and admin.
 */
function requireVolunteerOrAdmin() {
    return requireRole("VOLUNTEER", "ADMIN");
}


/**
 * Protect a page available to organization and admin.
 */
function requireOrganizationOrAdmin() {
    return requireRole("ORGANIZATION", "ADMIN");
}


/* =========================================================
   Public Page Helpers
   ========================================================= */

/**
 * If the user is already logged in and opens a public
 * authentication page, optionally redirect them to their
 * dashboard.
 *
 * We will use this on login/register pages.
 */
function redirectIfAuthenticated() {

    if (isAuthenticated()) {
        redirectToRoleDashboard();
        return true;
    }

    return false;
}


/* =========================================================
   Display Helpers
   ========================================================= */

/**
 * Put the current user's name into an element.
 *
 * Usage:
 *
 * setCurrentUserName("#user-name");
 */
function setCurrentUserName(selector) {

    const element = document.querySelector(selector);

    if (!element) {
        return;
    }

    element.textContent = getCurrentUserName();
}


/**
 * Put the current user's email into an element.
 */
function setCurrentUserEmail(selector) {

    const element = document.querySelector(selector);

    if (!element) {
        return;
    }

    element.textContent = getCurrentUserEmail();
}


/**
 * Put the current user's role into an element.
 */
function setCurrentUserRole(selector) {

    const element = document.querySelector(selector);

    if (!element) {
        return;
    }

    element.textContent = getCurrentUserRole();
}


/* =========================================================
   Authenticated User Information
   ========================================================= */

/**
 * Return a simple object containing the current session.
 *
 * Useful for page scripts.
 */
function getAuthState() {

    return {
        authenticated: isAuthenticated(),
        token: getAuthToken(),
        tokenType: getAuthTokenType(),
        user: getCurrentUser()
    };
}
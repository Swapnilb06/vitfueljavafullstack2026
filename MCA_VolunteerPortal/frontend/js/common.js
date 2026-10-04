/**
 * =========================================================
 * VolunteerPortalJava - Common UI Utilities
 * =========================================================
 *
 * Shared frontend helpers used across the application.
 */


/* =========================================================
   DOM Helpers
   ========================================================= */

/**
 * Safely find one element.
 */
function getElement(selector, parent = document) {
    return parent.querySelector(selector);
}


/**
 * Safely find multiple elements.
 */
function getElements(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
}


/**
 * Create an HTML element with optional class and content.
 */
function createElement(tagName, className = "", content = "") {

    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (content !== undefined && content !== null) {
        element.textContent = content;
    }

    return element;
}


/* =========================================================
   HTML Safety
   ========================================================= */

/**
 * Escape user/API-provided text before placing it into
 * an HTML template.
 */
function escapeHtml(value) {

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
   Loading States
   ========================================================= */

/**
 * Show a loading state inside an element.
 */
function showLoading(
    selector,
    message = "Loading..."
) {

    const container = getElement(selector);

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="ui-state ui-state-loading">
            <div class="ui-spinner" aria-hidden="true"></div>

            <p class="ui-state-message">
                ${escapeHtml(message)}
            </p>
        </div>
    `;
}


/**
 * Disable a button and show a temporary loading label.
 */
function setButtonLoading(
    button,
    loading = true,
    loadingText = "Please wait..."
) {

    if (!button) {
        return;
    }

    if (loading) {

        if (!button.dataset.originalText) {
            button.dataset.originalText =
                button.textContent;
        }

        button.disabled = true;

        button.classList.add("is-loading");

        button.textContent = loadingText;

    } else {

        button.disabled = false;

        button.classList.remove("is-loading");

        if (button.dataset.originalText) {
            button.textContent =
                button.dataset.originalText;
        }

    }
}


/* =========================================================
   Empty States
   ========================================================= */

/**
 * Show a reusable empty-state message.
 */
function showEmptyState(
    selector,
    title = "Nothing here yet",
    message = ""
) {

    const container = getElement(selector);

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="ui-state ui-state-empty">

            <div class="ui-state-icon" aria-hidden="true">
                —
            </div>

            <h3 class="ui-state-title">
                ${escapeHtml(title)}
            </h3>

            ${
                message
                    ? `
                        <p class="ui-state-message">
                            ${escapeHtml(message)}
                        </p>
                    `
                    : ""
            }

        </div>
    `;
}


/* =========================================================
   Error States
   ========================================================= */

/**
 * Show an error state inside a container.
 */
function showErrorState(
    selector,
    title = "Something went wrong",
    message = "Please try again."
) {

    const container = getElement(selector);

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="ui-state ui-state-error">

            <div class="ui-state-icon" aria-hidden="true">
                !
            </div>

            <h3 class="ui-state-title">
                ${escapeHtml(title)}
            </h3>

            <p class="ui-state-message">
                ${escapeHtml(message)}
            </p>

            <button
                type="button"
                class="button button-secondary"
                data-action="retry"
            >
                Try Again
            </button>

        </div>
    `;
}


/* =========================================================
   Inline Notifications
   ========================================================= */

/**
 * Show a temporary notification.
 *
 * Types:
 * success
 * error
 * info
 * warning
 */
function showNotification(
    message,
    type = "info",
    duration = 4000
) {

    let container =
        document.querySelector(".notification-container");

    if (!container) {

        container = document.createElement("div");

        container.className =
            "notification-container";

        container.setAttribute(
            "aria-live",
            "polite"
        );

        document.body.appendChild(container);
    }

    const notification =
        document.createElement("div");

    notification.className =
        `notification notification-${type}`;

    notification.setAttribute(
        "role",
        type === "error"
            ? "alert"
            : "status"
    );

    notification.innerHTML = `
        <span class="notification-message">
            ${escapeHtml(message)}
        </span>

        <button
            type="button"
            class="notification-close"
            aria-label="Close notification"
        >
            ×
        </button>
    `;

    container.appendChild(notification);

    const closeButton =
        notification.querySelector(
            ".notification-close"
        );

    closeButton.addEventListener(
        "click",
        () => {
            removeNotification(notification);
        }
    );

    if (duration > 0) {

        setTimeout(() => {

            removeNotification(notification);

        }, duration);
    }
}


/**
 * Remove a notification.
 */
function removeNotification(notification) {

    if (!notification) {
        return;
    }

    notification.classList.add("is-removing");

    setTimeout(() => {

        notification.remove();

    }, 200);
}


/* =========================================================
   Confirmation Dialog
   ========================================================= */

/**
 * Simple confirmation helper.
 *
 * This can later be replaced with a custom branded modal.
 */
function confirmAction(message) {
    return window.confirm(message);
}


/* =========================================================
   Date Utilities
   ========================================================= */

/**
 * Format an ISO date or date string.
 */
function formatDate(
    value,
    options = {}
) {

    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    const defaultOptions = {
        day: "2-digit",
        month: "short",
        year: "numeric"
    };

    try {

        return new Intl.DateTimeFormat(
            "en-IN",
            {
                ...defaultOptions,
                ...options
            }
        ).format(date);

    } catch (error) {

        return date.toLocaleDateString();
    }
}


/**
 * Format a date with time.
 */
function formatDateTime(value) {

    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    try {

        return new Intl.DateTimeFormat(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        ).format(date);

    } catch (error) {

        return date.toLocaleString();
    }
}


/* =========================================================
   Number Utilities
   ========================================================= */

function formatNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "0";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
        return "0";
    }

    return new Intl.NumberFormat("en-IN").format(number);
}


/* =========================================================
   Text Utilities
   ========================================================= */

/**
 * Convert a status such as:
 *
 * PENDING
 * APPROVED
 * IN_PROGRESS
 *
 * into readable text.
 */
function formatStatusLabel(status) {

    if (
        status === null ||
        status === undefined ||
        status === ""
    ) {
        return "Unknown";
    }

    return String(status)
        .toLowerCase()
        .split("_")
        .map(word => {

            if (!word) {
                return "";
            }

            return word.charAt(0).toUpperCase()
                + word.slice(1);

        })
        .join(" ");
}


/**
 * Convert a role into readable text.
 */
function formatRoleLabelCommon(role) {

    switch (role) {

        case "VOLUNTEER":
            return "Volunteer";

        case "ORGANIZATION":
            return "Organization";

        case "ADMIN":
            return "Administrator";

        default:
            return "User";
    }
}


/* =========================================================
   Status Classes
   ========================================================= */

/**
 * Return a CSS class for a backend status.
 *
 * Example:
 * statusBadgeClass("APPROVED")
 * -> "status-approved"
 */
function statusBadgeClass(status) {

    if (!status) {
        return "status-default";
    }

    const normalized =
        String(status)
            .toLowerCase()
            .replace(/_/g, "-");

    return `status-${normalized}`;
}


/**
 * Create a status badge.
 */
function createStatusBadge(status) {

    return `
        <span class="status-badge ${statusBadgeClass(status)}">
            ${escapeHtml(formatStatusLabel(status))}
        </span>
    `;
}


/* =========================================================
   Forms
   ========================================================= */

/**
 * Convert a FormData object into a plain object.
 */
function formDataToObject(form) {

    const formData = new FormData(form);

    const data = {};

    formData.forEach((value, key) => {
        data[key] = value;
    });

    return data;
}


/**
 * Clear all validation errors from a form.
 */
function clearFormErrors(form) {

    if (!form) {
        return;
    }

    form
        .querySelectorAll(".field-error")
        .forEach((element) => {

            element.textContent = "";

        });


    form
        .querySelectorAll(
            ".field-input.is-invalid, " +
            ".field-select.is-invalid, " +
            ".field-textarea.is-invalid"
        )
        .forEach((element) => {

            element.classList.remove(
                "is-invalid"
            );

        });
}


/**
 * Display a field-level error.
 */
function showFieldError(
    input,
    message
) {

    if (!input) {
        return;
    }

    input.classList.add("is-invalid");

    const field =
        input.closest(".form-group, .form-field");

    if (!field) {
        return;
    }

    const error =
        field.querySelector(".field-error");

    if (error) {
        error.textContent = message;
    }
}


/* =========================================================
   URL Utilities
   ========================================================= */

/**
 * Read a query-string parameter.
 */
function getQueryParameter(name) {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get(name);
}


/**
 * Navigate to another page.
 */
function navigateTo(url) {

    window.location.href = url;
}


/* =========================================================
   Local Storage Utilities
   ========================================================= */

function setStorageValue(key, value) {

    if (
        value === undefined ||
        value === null
    ) {
        localStorage.removeItem(key);
        return;
    }

    localStorage.setItem(
        key,
        String(value)
    );
}


function getStorageValue(key) {
    return localStorage.getItem(key);
}


function removeStorageValue(key) {
    localStorage.removeItem(key);
}


/* =========================================================
   Scroll Utilities
   ========================================================= */

function scrollToTop() {

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   Generic Page Initialization
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /*
         * Add a class to the document after the page has
         * finished loading. Useful for subtle page transitions
         * and CSS interactions later.
         */
        document.documentElement.classList.add(
            "page-ready"
        );

    }
);
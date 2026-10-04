/* =========================================================
   VolunteerPortalJava
   Registration Page JavaScript
   ========================================================= */


/* =========================================================
   DOM Elements
   ========================================================= */

const registerForm =
    document.getElementById("register-form");

const registerError =
    document.getElementById("register-error");

const registerSuccess =
    document.getElementById("register-success");

const registerSubmit =
    document.getElementById("register-submit");

const nameInput =
    document.getElementById("name");

const emailInput =
    document.getElementById("email");

const phoneInput =
    document.getElementById("phone");

const roleInput =
    document.getElementById("role");

const passwordInput =
    document.getElementById("password");

const confirmPasswordInput =
    document.getElementById("confirm-password");


/* =========================================================
   Show Error
   ========================================================= */

function showRegisterError(message) {

    if (!registerError) {
        return;
    }

    registerError.textContent =
        message || "Unable to create your account.";

    registerError.hidden = false;
}


/* =========================================================
   Hide Error
   ========================================================= */

function hideRegisterError() {

    if (!registerError) {
        return;
    }

    registerError.textContent = "";

    registerError.hidden = true;
}


/* =========================================================
   Show Success
   ========================================================= */

function showRegisterSuccess(message) {

    if (!registerSuccess) {
        return;
    }

    registerSuccess.textContent =
        message || "Account created successfully.";

    registerSuccess.hidden = false;
}


/* =========================================================
   Hide Success
   ========================================================= */

function hideRegisterSuccess() {

    if (!registerSuccess) {
        return;
    }

    registerSuccess.textContent = "";

    registerSuccess.hidden = true;
}


/* =========================================================
   Clear Field Errors
   ========================================================= */

function clearRegisterFieldErrors() {

    const errors =
        document.querySelectorAll(
            "#register-form .form-error"
        );

    errors.forEach((error) => {
        error.textContent = "";
    });

    const fields =
        [
            nameInput,
            emailInput,
            phoneInput,
            roleInput,
            passwordInput,
            confirmPasswordInput
        ];

    fields.forEach((field) => {

        if (field) {
            field.classList.remove(
                "input-error"
            );
        }

    });
}


/* =========================================================
   Set Field Error
   ========================================================= */

function setRegisterFieldError(
    field,
    errorId,
    message
) {

    const error =
        document.getElementById(errorId);

    if (error) {
        error.textContent = message;
    }

    if (field) {
        field.classList.add(
            "input-error"
        );
    }
}


/* =========================================================
   Validate Registration
   ========================================================= */

function validateRegisterForm() {

    clearRegisterFieldErrors();

    let isValid = true;


    const name =
        nameInput
            ? nameInput.value.trim()
            : "";


    const email =
        emailInput
            ? emailInput.value.trim()
            : "";


    const phone =
        phoneInput
            ? phoneInput.value.trim()
            : "";


    const role =
        roleInput
            ? roleInput.value
            : "";


    const password =
        passwordInput
            ? passwordInput.value
            : "";


    const confirmPassword =
        confirmPasswordInput
            ? confirmPasswordInput.value
            : "";


    /* -----------------------------------------
       Name
       ----------------------------------------- */

    if (!name) {

        setRegisterFieldError(
            nameInput,
            "name-error",
            "Full name is required."
        );

        isValid = false;

    } else if (name.length < 2) {

        setRegisterFieldError(
            nameInput,
            "name-error",
            "Name must contain at least 2 characters."
        );

        isValid = false;
    }


    /* -----------------------------------------
       Email
       ----------------------------------------- */

    if (!email) {

        setRegisterFieldError(
            emailInput,
            "email-error",
            "Email address is required."
        );

        isValid = false;

    } else if (!isValidRegisterEmail(email)) {

        setRegisterFieldError(
            emailInput,
            "email-error",
            "Enter a valid email address."
        );

        isValid = false;
    }


    /* -----------------------------------------
       Phone
       ----------------------------------------- */

    if (phone) {

        const phonePattern =
            /^[0-9+\-\s()]{7,20}$/;

        if (!phonePattern.test(phone)) {

            setRegisterFieldError(
                phoneInput,
                "phone-error",
                "Enter a valid phone number."
            );

            isValid = false;
        }
    }


    /* -----------------------------------------
       Role
       ----------------------------------------- */

    if (
        role !== "VOLUNTEER" &&
        role !== "ORGANIZATION"
    ) {

        setRegisterFieldError(
            roleInput,
            "role-error",
            "Select an account type."
        );

        isValid = false;
    }


    /* -----------------------------------------
       Password
       ----------------------------------------- */

    if (!password) {

        setRegisterFieldError(
            passwordInput,
            "password-error",
            "Password is required."
        );

        isValid = false;

    } else if (password.length < 6) {

        setRegisterFieldError(
            passwordInput,
            "password-error",
            "Password must contain at least 6 characters."
        );

        isValid = false;
    }


    /* -----------------------------------------
       Confirm Password
       ----------------------------------------- */

    if (!confirmPassword) {

        setRegisterFieldError(
            confirmPasswordInput,
            "confirm-password-error",
            "Please confirm your password."
        );

        isValid = false;

    } else if (password !== confirmPassword) {

        setRegisterFieldError(
            confirmPasswordInput,
            "confirm-password-error",
            "Passwords do not match."
        );

        isValid = false;
    }


    return isValid;
}


/* =========================================================
   Email Validation
   ========================================================= */

function isValidRegisterEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);
}


/* =========================================================
   Register
   ========================================================= */

async function handleRegister(event) {

    event.preventDefault();

    hideRegisterError();

    hideRegisterSuccess();

    if (!validateRegisterForm()) {
        return;
    }


    const requestData = {

        name:
            nameInput.value.trim(),

        email:
            emailInput.value.trim(),

        password:
            passwordInput.value,

        role:
            roleInput.value,

        phone:
            phoneInput.value.trim() || null

    };


    try {

        setButtonLoading(
            registerSubmit,
            true,
            "Creating Account..."
        );


        const response =
            await apiPost(
                "/auth/register",
                requestData
            );


        if (!response) {

            throw new Error(
                "The server returned an empty response."
            );
        }


        /*
         * Registration returns AuthResponse,
         * so the user is logged in immediately.
         */

        saveAuthSession(response);


        showRegisterSuccess(
            "Account created successfully. Redirecting..."
        );


        /*
         * Give the success message a short moment
         * to appear before redirecting.
         */

        setTimeout(
            () => {
                redirectAfterLogin();
            },
            500
        );


    } catch (error) {

        console.error(
            "Registration failed:",
            error
        );

        showRegisterError(
            error.message ||
            "Unable to create your account."
        );


    } finally {

        setButtonLoading(
            registerSubmit,
            false
        );

    }
}


/* =========================================================
   URL Role Selection
   ========================================================= */

function initializeRoleFromUrl() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const requestedRole =
        params.get("role");


    if (
        requestedRole === "VOLUNTEER" ||
        requestedRole === "ORGANIZATION"
    ) {

        roleInput.value =
            requestedRole;
    }
}


/* =========================================================
   Initialize
   ========================================================= */

function initializeRegisterPage() {

    /*
     * Authenticated users should not register
     * another account from this page.
     */

    if (isAuthenticated()) {

        redirectToRoleDashboard();

        return;
    }


    initializeRoleFromUrl();


    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            handleRegister
        );

    }


    /*
     * Clear field errors while the user edits.
     */

    const fields =
        [
            nameInput,
            emailInput,
            phoneInput,
            roleInput,
            passwordInput,
            confirmPasswordInput
        ];


    fields.forEach((field) => {

        if (!field) {
            return;
        }


        field.addEventListener(
            "input",
            () => {

                hideRegisterError();

                const error =
                    document.getElementById(
                        `${field.id}-error`
                    );

                if (error) {
                    error.textContent = "";
                }

                field.classList.remove(
                    "input-error"
                );

            }
        );


        field.addEventListener(
            "change",
            () => {

                hideRegisterError();

                const error =
                    document.getElementById(
                        `${field.id}-error`
                    );

                if (error) {
                    error.textContent = "";
                }

                field.classList.remove(
                    "input-error"
                );

            }
        );

    });

}


/* =========================================================
   Start
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeRegisterPage
);
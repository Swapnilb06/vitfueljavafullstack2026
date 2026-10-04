/* =========================================================
   VolunteerPortalJava
   Login Page JavaScript
   ========================================================= */


/* =========================================================
   DOM Elements
   ========================================================= */

const loginForm =
    document.getElementById("login-form");

const loginError =
    document.getElementById("login-error");

const loginSubmit =
    document.getElementById("login-submit");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");


/* =========================================================
   Show Login Error
   ========================================================= */

function showLoginError(message) {

    if (!loginError) {
        return;
    }

    loginError.textContent =
        message || "Unable to sign in.";

    loginError.hidden = false;
}


/* =========================================================
   Hide Login Error
   ========================================================= */

function hideLoginError() {

    if (!loginError) {
        return;
    }

    loginError.textContent = "";

    loginError.hidden = true;
}


/* =========================================================
   Clear Field Errors
   ========================================================= */

function clearLoginFieldErrors() {

    const errors =
        document.querySelectorAll(
            "#login-form .form-error"
        );

    errors.forEach((error) => {
        error.textContent = "";
    });

    if (emailInput) {
        emailInput.classList.remove(
            "input-error"
        );
    }

    if (passwordInput) {
        passwordInput.classList.remove(
            "input-error"
        );
    }
}


/* =========================================================
   Validate Login Form
   ========================================================= */

function validateLoginForm() {

    clearLoginFieldErrors();

    let isValid = true;


    const email =
        emailInput
            ? emailInput.value.trim()
            : "";


    const password =
        passwordInput
            ? passwordInput.value
            : "";


    if (!email) {

        const error =
            document.getElementById(
                "email-error"
            );

        if (error) {
            error.textContent =
                "Email address is required.";
        }

        if (emailInput) {
            emailInput.classList.add(
                "input-error"
            );
        }

        isValid = false;

    } else if (!isValidEmail(email)) {

        const error =
            document.getElementById(
                "email-error"
            );

        if (error) {
            error.textContent =
                "Enter a valid email address.";
        }

        if (emailInput) {
            emailInput.classList.add(
                "input-error"
            );
        }

        isValid = false;
    }


    if (!password) {

        const error =
            document.getElementById(
                "password-error"
            );

        if (error) {
            error.textContent =
                "Password is required.";
        }

        if (passwordInput) {
            passwordInput.classList.add(
                "input-error"
            );
        }

        isValid = false;
    }


    return isValid;
}


/* =========================================================
   Email Validation
   ========================================================= */

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);
}


/* =========================================================
   Login
   ========================================================= */

async function handleLogin(event) {

    event.preventDefault();

    hideLoginError();

    if (!validateLoginForm()) {
        return;
    }


    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;


    try {

        setButtonLoading(
            loginSubmit,
            true,
            "Signing In..."
        );


        const response =
            await apiPost(
                "/auth/login",
                {
                    email,
                    password
                }
            );


        if (!response) {
            throw new Error(
                "The server returned an empty response."
            );
        }


        saveAuthSession(response);


        /*
         * Redirect according to the role
         * returned by the Spring Boot backend.
         */

        redirectAfterLogin();


    } catch (error) {

        console.error(
            "Login failed:",
            error
        );

        showLoginError(
            error.message ||
            "Invalid email or password."
        );


    } finally {

        setButtonLoading(
            loginSubmit,
            false
        );

    }
}


/* =========================================================
   Initialize
   ========================================================= */

function initializeLoginPage() {

    /*
     * If a valid authenticated session already exists,
     * send the user directly to their dashboard.
     */

    if (isAuthenticated()) {

        redirectToRoleDashboard();

        return;
    }


    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            handleLogin
        );

    }


    /*
     * Remove the general error message as soon
     * as the user starts correcting the form.
     */

    if (emailInput) {

        emailInput.addEventListener(
            "input",
            () => {

                const error =
                    document.getElementById(
                        "email-error"
                    );

                if (error) {
                    error.textContent = "";
                }

                emailInput.classList.remove(
                    "input-error"
                );

                hideLoginError();

            }
        );
    }


    if (passwordInput) {

        passwordInput.addEventListener(
            "input",
            () => {

                const error =
                    document.getElementById(
                        "password-error"
                    );

                if (error) {
                    error.textContent = "";
                }

                passwordInput.classList.remove(
                    "input-error"
                );

                hideLoginError();

            }
        );
    }

}


/* =========================================================
   Start
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeLoginPage
);
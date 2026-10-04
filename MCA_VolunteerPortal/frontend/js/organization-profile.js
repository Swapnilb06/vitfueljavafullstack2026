document.addEventListener("DOMContentLoaded", () => {

    requireOrganization();

    const loading = document.getElementById("profile-loading");
    const errorState = document.getElementById("profile-error");
    const errorMessage = document.getElementById("profile-error-message");
    const content = document.getElementById("profile-content");

    const form = document.getElementById("organization-profile-form");
    const saveButton = document.getElementById("save-profile");
    const retryButton = document.getElementById("retry-profile");

    const organizationName = document.getElementById("organization-name");
    const description = document.getElementById("description");
    const address = document.getElementById("address");
    const website = document.getElementById("website");
    const contactEmail = document.getElementById("contact-email");

    const summaryName = document.getElementById("summary-name");
    const summaryEmail = document.getElementById("summary-email");

    const verificationStatus =
        document.getElementById("verification-status");

    const summaryVerification =
        document.getElementById("summary-verification");

    const verificationNoteStatus =
        document.getElementById("verification-note-status");

    const formMessage =
        document.getElementById("form-message");

    let currentProfile = null;

    function showLoading() {
        loading.style.display = "block";
        errorState.style.display = "none";
        content.style.display = "none";
    }

    function showError(message) {
        loading.style.display = "none";
        errorState.style.display = "block";
        content.style.display = "none";

        errorMessage.textContent =
            message || "Unable to load organization profile.";
    }

    function showContent() {
        loading.style.display = "none";
        errorState.style.display = "none";
        content.style.display = "block";
    }

    function getProfileUserId(profile) {

        if (profile.userId !== undefined && profile.userId !== null) {
            return Number(profile.userId);
        }

        if (profile.user && profile.user.id !== undefined) {
            return Number(profile.user.id);
        }

        return null;
    }

    async function loadProfile() {

        showLoading();

        try {

            const profiles = await apiGet("/organization-profiles");

            if (!Array.isArray(profiles)) {
                throw new Error("Invalid organization profile response.");
            }

            const currentUserId = Number(getCurrentUserId());

            currentProfile = profiles.find(profile => {
                return getProfileUserId(profile) === currentUserId;
            });

            if (!currentProfile) {
                throw new Error(
                    "Organization profile was not found for your account."
                );
            }

            populateProfile(currentProfile);

            showContent();

        } catch (error) {

            console.error("Organization profile error:", error);

            showError(
                error.message ||
                "Unable to load organization profile."
            );
        }
    }

    function populateProfile(profile) {

        organizationName.value =
            profile.organizationName || "";

        description.value =
            profile.description || "";

        address.value =
            profile.address || "";

        website.value =
            profile.website || "";

        contactEmail.value =
            profile.contactEmail || "";

        summaryName.textContent =
            profile.organizationName || "Organization";

        const currentEmail =
            getCurrentUserEmail();

        summaryEmail.textContent =
            profile.contactEmail ||
            currentEmail ||
            "No contact email";

        const status =
            profile.verificationStatus ||
            "PENDING";

        const formattedStatus =
            formatStatus(status);

        verificationStatus.textContent =
            formattedStatus;

        verificationStatus.className =
            `status-badge status-${String(status).toLowerCase()}`;

        summaryVerification.textContent =
            formattedStatus;

        verificationNoteStatus.textContent =
            formattedStatus;
    }

    function showFormMessage(message, type = "success") {

        formMessage.textContent = message;

        formMessage.className =
            `form-message ${type}`;

        formMessage.style.display = "block";
    }

    function clearFormMessage() {

        formMessage.textContent = "";

        formMessage.style.display = "none";

        formMessage.className =
            "form-message";
    }

    async function saveProfile(event) {

        event.preventDefault();

        clearFormMessage();

        if (!currentProfile || !currentProfile.id) {

            showFormMessage(
                "Organization profile information is unavailable.",
                "error"
            );

            return;
        }

        const name =
            organizationName.value.trim();

        if (!name) {

            showFormMessage(
                "Organization name is required.",
                "error"
            );

            organizationName.focus();

            return;
        }

        const payload = {
            organizationName: name,
            description: description.value.trim(),
            address: address.value.trim(),
            website: website.value.trim(),
            contactEmail: contactEmail.value.trim()
        };

        try {

            setButtonLoading(
                saveButton,
                true,
                "Saving..."
            );

            const updatedProfile =
                await apiPut(
                    `/organization-profiles/${currentProfile.id}`,
                    payload
                );

            currentProfile =
                updatedProfile || {
                    ...currentProfile,
                    ...payload
                };

            populateProfile(currentProfile);

            showFormMessage(
                "Organization profile updated successfully.",
                "success"
            );

        } catch (error) {

            console.error("Profile update error:", error);

            showFormMessage(
                error.message ||
                "Unable to update organization profile.",
                "error"
            );

        } finally {

            setButtonLoading(
                saveButton,
                false,
                "Save changes"
            );
        }
    }

    form.addEventListener(
        "submit",
        saveProfile
    );

    retryButton.addEventListener(
        "click",
        loadProfile
    );

    loadProfile();
});
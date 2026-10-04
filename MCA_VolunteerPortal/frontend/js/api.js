const API_BASE_URL = "http://localhost:8080/api";


/* =========================================================
   Main API Request
   ========================================================= */

async function apiRequest(endpoint, options = {}) {

    const token =
        localStorage.getItem("vp_token");

    const tokenType =
        localStorage.getItem("vp_token_type") || "Bearer";


    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };


    if (token) {
        headers["Authorization"] =
            `${tokenType} ${token}`;
    }


    const requestOptions = {
        ...options,
        headers
    };


    let response;


    try {

        response =
            await fetch(
                `${API_BASE_URL}${endpoint}`,
                requestOptions
            );

    } catch (error) {

        throw new Error(
            "Unable to connect to the server. Make sure the Spring Boot backend is running."
        );
    }


    if (response.status === 401) {

        localStorage.removeItem("vp_token");
        localStorage.removeItem("vp_token_type");
        localStorage.removeItem("vp_user_id");
        localStorage.removeItem("vp_name");
        localStorage.removeItem("vp_email");
        localStorage.removeItem("vp_role");


        if (
            !window.location.pathname
                .endsWith("/login.html")
        ) {

            window.location.href =
                "login.html";
        }


        throw new Error(
            "Your session has expired. Please log in again."
        );
    }


    if (response.status === 403) {

        throw new Error(
            "You do not have permission to perform this action."
        );
    }


    if (response.status === 204) {

        return null;
    }


    const contentType =
        response.headers.get(
            "content-type"
        ) || "";


    let responseData = null;


    if (
        contentType.includes(
            "application/json"
        )
    ) {

        try {

            responseData =
                await response.json();

        } catch (error) {

            responseData = null;
        }

    } else {

        try {

            responseData =
                await response.text();

        } catch (error) {

            responseData = null;
        }
    }


    if (!response.ok) {

        let message =
            `Request failed with status ${response.status}.`;


        if (responseData) {

            if (
                typeof responseData === "string"
                && responseData.trim()
            ) {

                message =
                    responseData;

            } else if (
                typeof responseData === "object"
            ) {

                message =
                    responseData.message ||
                    responseData.error ||
                    responseData.detail ||
                    message;
            }
        }


        throw new Error(message);
    }


    return responseData;
}


/* =========================================================
   GET
   ========================================================= */

async function apiGet(endpoint) {

    return apiRequest(
        endpoint,
        {
            method: "GET"
        }
    );
}


/* =========================================================
   GET BLOB
   =========================================================
   
   Used for authenticated files such as generated PDFs.
   The JWT is attached before fetching the file.
   ========================================================= */

async function apiGetBlob(endpoint) {

    const token =
        localStorage.getItem("vp_token");

    const tokenType =
        localStorage.getItem("vp_token_type")
        || "Bearer";


    const headers = {};


    if (token) {

        headers["Authorization"] =
            `${tokenType} ${token}`;
    }


    let response;


    try {

        response =
            await fetch(
                `${API_BASE_URL}${endpoint}`,
                {
                    method: "GET",
                    headers
                }
            );

    } catch (error) {

        throw new Error(
            "Unable to connect to the server. Make sure the Spring Boot backend is running."
        );
    }


    if (response.status === 401) {

        localStorage.removeItem("vp_token");
        localStorage.removeItem("vp_token_type");
        localStorage.removeItem("vp_user_id");
        localStorage.removeItem("vp_name");
        localStorage.removeItem("vp_email");
        localStorage.removeItem("vp_role");


        if (
            !window.location.pathname
                .endsWith("/login.html")
        ) {

            window.location.href =
                "login.html";
        }


        throw new Error(
            "Your session has expired. Please log in again."
        );
    }


    if (response.status === 403) {

        throw new Error(
            "You do not have permission to access this file."
        );
    }


    if (!response.ok) {

        let message =
            `Unable to retrieve the file. Status ${response.status}.`;


        try {

            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";


            if (
                contentType.includes(
                    "application/json"
                )
            ) {

                const errorData =
                    await response.json();


                message =
                    errorData.message ||
                    errorData.error ||
                    errorData.detail ||
                    message;

            } else {

                const text =
                    await response.text();


                if (text.trim()) {
                    message = text;
                }
            }

        } catch (error) {
            // Keep the default message.
        }


        throw new Error(message);
    }


    return response.blob();
}


/* =========================================================
   POST
   ========================================================= */

async function apiPost(
    endpoint,
    data = null
) {

    return apiRequest(
        endpoint,
        {
            method: "POST",
            body:
                data !== null
                    ? JSON.stringify(data)
                    : null
        }
    );
}


/* =========================================================
   PUT
   ========================================================= */

async function apiPut(
    endpoint,
    data = null
) {

    return apiRequest(
        endpoint,
        {
            method: "PUT",
            body:
                data !== null
                    ? JSON.stringify(data)
                    : null
        }
    );
}


/* =========================================================
   DELETE
   ========================================================= */

async function apiDelete(endpoint) {

    return apiRequest(
        endpoint,
        {
            method: "DELETE"
        }
    );
}
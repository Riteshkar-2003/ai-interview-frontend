export const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://ai-interview-preparation-platform-6bjy.onrender.com";
    

function formatErrorMessage(detail, fallback) {
    if (!detail) return fallback;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
        return detail
            .map((err) => (typeof err === "string" ? err : err.msg || JSON.stringify(err)))
            .join(", ");
    }
    if (typeof detail === "object") {
        return detail.message || JSON.stringify(detail);
    }
    return String(detail);
}

async function apiFetch(url, options) {
    try {
        return await fetch(url, options);
    } catch (err) {
        if (
            err instanceof TypeError ||
            err.message?.toLowerCase().includes("fetch") ||
            err.message?.toLowerCase().includes("network")
        ) {
            throw new Error(
                `Unable to connect to server (${API_URL}). Please ensure the backend is running.`
            );
        }
        throw err;
    }
}

async function handleResponse(response) {
    let data;
    try {
        data = await response.json();
    } catch {
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        return null;
    }
    if (!response.ok) {
        const errorMsg = formatErrorMessage(
            data?.detail || data?.message,
            `Request failed with status ${response.status}`
        );
        throw new Error(errorMsg);
    }
    return data;
}

export async function signupUser(name, email, password) {
    const response = await apiFetch(
        `${API_URL}/auth/signup`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name,
                email,
                password,
            }),
        }
    );
    return handleResponse(response);
}

export async function loginUser(email, password) {
    const response = await apiFetch(
        `${API_URL}/auth/login`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                password,
            }),
        }
    );
    return handleResponse(response);
}

export async function uploadResume(resumeFile, userId = null) {
    if (!resumeFile) {
        throw new Error("Resume file is required");
    }
    const formData = new FormData();
    formData.append("file", resumeFile);

    let url = `${API_URL}/resume/upload`;
    if (userId) {
        url += `?user_id=${encodeURIComponent(userId)}`;
    }

    const response = await apiFetch(
        url,
        {
            method: "POST",
            body: formData,
        }
    );
    return handleResponse(response);
}

export async function getFirstQuestion(
    resumeData,
    difficulty
) {
    const response = await apiFetch(
        `${API_URL}/interview/first-question`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                resume_data: resumeData,
                difficulty: difficulty,
            }),
        }
    );
    return handleResponse(response);
}

export async function analyzeAnswer(
    question,
    candidateAnswer,
    currentDifficulty,
    userId = null,
    questionNumber = 1
) {
    let finalUserId = userId;
    if (!finalUserId && typeof window !== "undefined") {
        try {
            const stored = localStorage.getItem("user");
            if (stored) {
                const u = JSON.parse(stored);
                finalUserId = u.id;
            }
        } catch (e) { }
        if (!finalUserId) {
            finalUserId = localStorage.getItem("user_id") || sessionStorage.getItem("user_id") || 1;
        }
    }
    const response = await apiFetch(
        `${API_URL}/interview/answer`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                question: question,
                candidate_answer: candidateAnswer,
                current_difficulty: currentDifficulty,
                user_id: finalUserId || 1,
                question_number: questionNumber || 1,
            }),
        }
    );
    return handleResponse(response);
}

export async function getNextQuestion(
    resumeData,
    chatHistory,
    currentDifficulty,
    evaluation,
    askedSections = []
) {
    const response = await apiFetch(
        `${API_URL}/interview/next-question`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                resume_data: resumeData,
                chat_history: chatHistory,
                current_difficulty: currentDifficulty,
                evaluation: evaluation,
                asked_sections: askedSections,
            }),
        }
    );
    return handleResponse(response);
}

export async function getFinalFeedback(
    resumeData,
    interviewHistory
) {
    const response = await apiFetch(
        `${API_URL}/interview/report`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                resume_data: resumeData,
                interview_history: interviewHistory,
            }),
        }
    );
    return handleResponse(response);
}

export async function saveReport(userId, report) {
    const response = await apiFetch(
        `${API_URL}/reports/save`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: Number(userId),
                report,
            }),
        }
    );
    return handleResponse(response);
}

export async function getInterviewHistory(userId) {
    const response = await apiFetch(
        `${API_URL}/reports/${userId}`
    );
    return handleResponse(response);
}

export async function getInterviewHistoryAll(userId) {
    const response = await apiFetch(
        `${API_URL}/interview/history/${userId}`
    );
    return handleResponse(response);
}

export async function checkResumeEligibility(resumeData, resumeText = "") {
    const response = await apiFetch(`${API_URL}/resume/check-eligibility`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            resume_data: resumeData,
            resume_text: resumeText,
        }),
    });
    return handleResponse(response);
}

export async function getProfilePage(userId) {
    const response = await apiFetch(
        `${API_URL}/home-dashboard/${userId}`
    );
    return handleResponse(response);
}

export async function googleLogin(credential) {
    console.log("googleLogin called");

    if (!credential) {
        throw new Error("Google credential is missing");
    }

    const response = await apiFetch(
        `${API_URL}/auth/google`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                credential: credential,
            }),
        }
    );

    return handleResponse(response);
}

/* =========================================================
   CODING INTERVIEW ENDPOINTS
   ========================================================= */

export async function startCodingInterview(
    userId,
    resumeText,
    language = "python",
    difficulty = "Easy"
) {
    const response = await apiFetch(`${API_URL}/coding/start`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            user_id: userId,
            resume_text: resumeText || "",
            language,
            difficulty,
        }),
    });
    return handleResponse(response);
}

export async function runCode(
    code,
    language = "python",
    userId = null,
    question = null,
    customInput = null
) {
    const response = await apiFetch(`${API_URL}/coding/run`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            code,
            language,
            user_id: userId,
            question,
            custom_input: customInput,
        }),
    });
    return handleResponse(response);
}

export async function submitCodingAnswer(
    userId,
    question,
    code,
    language,
    executionResult,
    difficulty = "Easy",
    resumeText = null
) {
    const response = await apiFetch(`${API_URL}/coding/submit`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            user_id: userId,
            question,
            code,
            language,
            execution_result: executionResult,
            difficulty,
            resume_text: resumeText,
        }),
    });
    return handleResponse(response);
}

export async function stopCodingInterview(userId) {
    const response = await apiFetch(`${API_URL}/coding/stop/${userId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });
    return handleResponse(response);
}

/* =========================================================
   USER QUERIES & CONCERNS ENDPOINTS
   ========================================================= */

export async function submitUserQuery(queryData) {
    const response = await apiFetch(`${API_URL}/queries`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(queryData),
    });
    return handleResponse(response);
}

export async function getUserQueries(userId) {
    const response = await apiFetch(`${API_URL}/queries/user/${userId}`);
    return handleResponse(response);
}

/* =========================================================
   ADMIN DASHBOARD ENDPOINTS
   ========================================================= */

export async function getAdminStats() {
    const response = await apiFetch(`${API_URL}/admin/stats`);
    return handleResponse(response);
}

export async function getAdminUsers() {
    const response = await apiFetch(`${API_URL}/admin/users`);
    return handleResponse(response);
}

export async function getAdminUserDetails(userId) {
    const response = await apiFetch(`${API_URL}/admin/users/${userId}`);
    return handleResponse(response);
}

export async function getAdminInterviews() {
    const response = await apiFetch(`${API_URL}/admin/interviews`);
    return handleResponse(response);
}

export async function getAdminCodingSubmissions() {
    const response = await apiFetch(`${API_URL}/admin/coding-submissions`);
    return handleResponse(response);
}

export async function getAdminResumes() {
    const response = await apiFetch(`${API_URL}/admin/resumes`);
    return handleResponse(response);
}

export async function getAdminQueries(status = "", search = "") {
    const params = new URLSearchParams();
    if (status && status !== "all") params.append("status", status);
    if (search) params.append("search", search);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const response = await apiFetch(`${API_URL}/admin/queries${qs}`);
    return handleResponse(response);
}

export async function updateAdminQuery(queryId, updateData) {
    const response = await apiFetch(`${API_URL}/admin/queries/${queryId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
    });
    return handleResponse(response);
}

export async function deleteAdminQuery(queryId) {
    const response = await apiFetch(`${API_URL}/admin/queries/${queryId}`, {
        method: "DELETE",
    });
    return handleResponse(response);
}


/* =========================================================
   ADMIN AUTHENTICATION ENDPOINTS
   ========================================================= */

export async function adminLogin(username, password) {
    const response = await apiFetch(`${API_URL}/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    return handleResponse(response);
}

export async function adminVerifyToken(token) {
    const response = await apiFetch(`${API_URL}/admin/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
    });
    return handleResponse(response);
}

export async function adminLogout() {
    const response = await apiFetch(`${API_URL}/admin/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
    });
    return handleResponse(response);
}

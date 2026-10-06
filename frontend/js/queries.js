const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

if (!token) {
    window.location.href = "index.html";
}

let selectedQueryId = null;

document.addEventListener("DOMContentLoaded", () => {
    // Set user badge name
    const userNameEl = document.getElementById("userName");
    if (userNameEl && user.name) {
        userNameEl.textContent = user.name;
    }

    // Configure sidebar links
    const sidebarDash = document.getElementById("sidebarDash");
    const sidebarIssues = document.getElementById("sidebarIssues");

    if (user.role === "admin") {
        if (sidebarDash) sidebarDash.href = "admin.html";
        if (sidebarIssues) {
            sidebarIssues.href = "admin.html";
            sidebarIssues.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                </svg>
                All Issues
            `;
        }

        document.getElementById("adminQuerySection").style.display = "block";
        loadAdminQueries();
    } else {
        if (sidebarDash) sidebarDash.href = "user.html";
        if (sidebarIssues) {
            sidebarIssues.href = "user.html";
            sidebarIssues.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                </svg>
                My Issues
            `;
        }

        document.getElementById("userQuerySection").style.display = "block";
        loadUserQueries();
    }

    const questionForm = document.getElementById("questionForm");
    if (questionForm) {
        questionForm.addEventListener("submit", submitQuestion);
    }

    const confirmAnswerBtn = document.getElementById("confirmAnswerBtn");
    if (confirmAnswerBtn) {
        confirmAnswerBtn.addEventListener("click", submitAnswer);
    }
});

// ==========================================
// USER CHAT LOGIC (Screen 7)
// ==========================================
async function loadUserQueries() {
    try {
        const response = await fetch("/api/queries/my", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) return;

        const queries = await response.json();
        renderUserChat(queries);
    } catch (e) {
        console.error("Failed to load user queries:", e);
    }
}

function renderUserChat(queries) {
    const chatBox = document.getElementById("chatBox");
    if (!chatBox) return;

    chatBox.innerHTML = "";

    if (queries.length === 0) {
        chatBox.innerHTML = `<div style="text-align: center; color: #6b7280; padding: 20px;">No questions asked yet. Feel free to ask a question below!</div>`;
        return;
    }

    // Sort chronologically
    const sorted = [...queries].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    sorted.forEach(q => {
        const qDateStr = formatDate(q.created_at || new Date());

        // User question bubble
        const userBubble = document.createElement("div");
        userBubble.className = "chat-bubble-user";
        userBubble.innerHTML = `
            <div class="question-text">${escapeHtml(q.question)}</div>
            <div class="timestamp">${qDateStr}</div>
        `;
        chatBox.appendChild(userBubble);

        // Admin answer bubble if exists
        if (q.answer) {
            const aDateStr = q.answered_at ? formatDate(q.answered_at) : qDateStr;
            const adminBubble = document.createElement("div");
            adminBubble.className = "chat-bubble-admin";
            adminBubble.innerHTML = `
                <div class="admin-title">Admin:</div>
                <div class="answer-text">${escapeHtml(q.answer)}</div>
                <div class="timestamp">${aDateStr}</div>
            `;
            chatBox.appendChild(adminBubble);
        }
    });

    chatBox.scrollTop = chatBox.scrollHeight;
}

async function submitQuestion(e) {
    e.preventDefault();
    const input = document.getElementById("questionInput");
    const question = input.value.trim();

    if (!question) return;

    try {
        const response = await fetch("/api/queries", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ question })
        });

        if (response.ok) {
            input.value = "";
            loadUserQueries();
        } else {
            const data = await response.json();
            alert(data.message || "Failed to submit question");
        }
    } catch (e) {
        console.error("Error submitting question:", e);
    }
}

// ==========================================
// ADMIN QUERIES MANAGEMENT LOGIC (Screen 8)
// ==========================================
async function loadAdminQueries() {
    try {
        const response = await fetch("/api/queries", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) return;

        const queries = await response.json();
        renderAdminQueriesTable(queries);
    } catch (e) {
        console.error("Failed to load admin queries:", e);
    }
}

function renderAdminQueriesTable(queries) {
    const tbody = document.getElementById("adminQueryTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (queries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #6b7280;">No user queries found</td></tr>`;
        return;
    }

    queries.forEach(q => {
        const tr = document.createElement("tr");

        let actionBtn = "";
        if (q.answer) {
            actionBtn = `<button class="btn-update" onclick="openAnswerModal(${q.id}, '${escapeHtml(q.question)}', '${escapeHtml(q.answer)}')">Update</button>`;
        } else {
            actionBtn = `<button class="btn-answer" onclick="openAnswerModal(${q.id}, '${escapeHtml(q.question)}', '')">Answer</button>`;
        }

        tr.innerHTML = `
            <td>${escapeHtml(q.user_name || 'User')}</td>
            <td>${escapeHtml(q.question)}</td>
            <td>${q.answer ? escapeHtml(q.answer) : '-'}</td>
            <td>${actionBtn}</td>
        `;

        tbody.appendChild(tr);
    });
}

function openAnswerModal(id, questionText, currentAnswer) {
    selectedQueryId = id;
    document.getElementById("modalQuestionText").textContent = questionText;
    document.getElementById("answerInput").value = currentAnswer || "";

    const modal = document.getElementById("answerModal");
    if (modal) modal.classList.add("active");
}

function closeAnswerModal() {
    selectedQueryId = null;
    const modal = document.getElementById("answerModal");
    if (modal) modal.classList.remove("active");
}

async function submitAnswer() {
    if (!selectedQueryId) return;

    const answer = document.getElementById("answerInput").value.trim();
    if (!answer) {
        alert("Please enter an answer");
        return;
    }

    try {
        const response = await fetch(`/api/queries/${selectedQueryId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ answer })
        });

        if (response.ok) {
            closeAnswerModal();
            loadAdminQueries();
        } else {
            const data = await response.json();
            alert(data.message || "Failed to submit answer");
        }
    } catch (e) {
        console.error("Error submitting answer:", e);
    }
}

function formatDate(dateInput) {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "10 Oct 2025, 10:30 AM";
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}
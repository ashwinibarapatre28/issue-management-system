const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

if (!token) {
    window.location.href = "index.html";
}

const params = new URLSearchParams(window.location.search);
const issueId = params.get("id");

if (!issueId) {
    window.location.href = user.role === "admin" ? "admin.html" : "user.html";
}

document.addEventListener("DOMContentLoaded", () => {
    if (user.name) {
        const nameEl = document.getElementById("userName");
        if (nameEl) nameEl.textContent = user.name;
    }

    const backLink = document.getElementById("backLink");
    if (backLink) {
        backLink.href = user.role === "admin" ? "admin.html" : "user.html";
        backLink.textContent = user.role === "admin" ? "← Back to All Issues" : "← Back to My Issues";
    }

    loadIssue();
});

async function loadIssue() {
    try {
        const response = await fetch(`/api/issues/${issueId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to load issue");
            window.location.href = user.role === "admin" ? "admin.html" : "user.html";
            return;
        }

        const issue = data.issue;

        document.getElementById("issueId").textContent = `ISS-${String(issue.id).padStart(3, '0')}`;
        document.getElementById("client").textContent = issue.client_name;
        document.getElementById("category").textContent = issue.category;
        document.getElementById("title").textContent = issue.title;
        document.getElementById("description").textContent = issue.description;
        document.getElementById("location").textContent = issue.location || "Not provided";

        const badge = document.getElementById("statusBadge");
        badge.textContent = issue.status;
        badge.className = `status ${issue.status.toLowerCase().replace(/\s+/g, '-')}`;

        const completeBtn = document.getElementById("completeButton");
        if (user.role === "admin") {
            completeBtn.style.display = "none";
        } else if (issue.status === "Completed") {
            completeBtn.disabled = true;
            completeBtn.textContent = "Completed";
        }

    } catch (error) {
        console.error("Error loading issue:", error);
    }
}

async function markCompleted() {
    if (!confirm("Are you sure you want to mark this issue as completed?")) return;

    try {
        const response = await fetch(`/api/issues/${issueId}/complete`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to update issue");
            return;
        }

        loadIssue();

    } catch (error) {
        console.error("Error updating issue:", error);
        alert("Server error. Unable to update status.");
    }
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}
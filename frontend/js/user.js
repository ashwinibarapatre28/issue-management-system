const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

if (!token) {
    window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", () => {
    if (user.name) {
        const nameEl = document.getElementById("userName");
        if (nameEl) nameEl.textContent = user.name;
    }

    loadMyIssues();
});

async function loadMyIssues() {
    try {
        const response = await fetch("/api/issues/my", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) return;

        const issues = await response.json();

        let assigned = issues.length;
        let pending = 0;
        let completed = 0;

        const tableBody = document.getElementById("userIssueTable");
        if (!tableBody) return;

        tableBody.innerHTML = "";

        if (issues.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color: #6b7280;">No assigned issues found</td></tr>`;
        }

        issues.forEach(issue => {
            if (issue.status === "Pending" || issue.status === "In Progress") pending++;
            if (issue.status === "Completed") completed++;

            const tr = document.createElement("tr");
            const statusClass = issue.status ? issue.status.toLowerCase().replace(/\s+/g, '-') : 'pending';

            tr.innerHTML = `
                <td>ISS-${String(issue.id).padStart(3, '0')}</td>
                <td>${escapeHtml(issue.title)}</td>
                <td>${escapeHtml(issue.category)}</td>
                <td><span class="status ${statusClass}">${issue.status}</span></td>
                <td>
                    <a href="issue.html?id=${issue.id}" class="btn-view">View</a>
                </td>
            `;

            tableBody.appendChild(tr);
        });

        document.getElementById("assignedIssues").textContent = assigned;
        document.getElementById("pendingIssues").textContent = pending;
        document.getElementById("completedIssues").textContent = completed;

    } catch (error) {
        console.error("Failed to load user issues:", error);
    }
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
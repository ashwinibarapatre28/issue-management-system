const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

if (!token || user.role !== "admin") {
    window.location.href = "index.html";
}

let allIssues = [];
let allUsers = [];
let selectedIssueId = null;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    if (user.name) {
        const adminNameEl = document.getElementById("adminName");
        if (adminNameEl) adminNameEl.textContent = user.name;
    }

    loadUsers();
    loadIssues();

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", filterIssues);
    }

    const confirmAssignBtn = document.getElementById("confirmAssignBtn");
    if (confirmAssignBtn) {
        confirmAssignBtn.addEventListener("click", submitAssignment);
    }
});

// Load Users for dropdown
async function loadUsers() {
    try {
        const response = await fetch("/api/auth/users", {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
            allUsers = await response.json();
            populateUserDropdown();
        }
    } catch (e) {
        console.error("Failed to load users:", e);
    }
}

function populateUserDropdown() {
    const select = document.getElementById("assignSelect");
    if (!select) return;
    select.innerHTML = '<option value="">Select User...</option>';
    allUsers.forEach(u => {
        const opt = document.createElement("option");
        opt.value = u.id;
        opt.textContent = u.name;
        select.appendChild(opt);
    });
}

// Load All Issues
async function loadIssues() {
    try {
        const response = await fetch("/api/issues", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) return;

        allIssues = await response.json();
        updateStats(allIssues);
        renderIssuesTable(allIssues);
    } catch (error) {
        console.error("Error loading issues:", error);
    }
}

function updateStats(issues) {
    let pending = 0;
    let progress = 0;
    let completed = 0;

    issues.forEach(iss => {
        if (iss.status === "Pending") pending++;
        else if (iss.status === "In Progress") progress++;
        else if (iss.status === "Completed") completed++;
    });

    document.getElementById("totalIssues").textContent = issues.length;
    document.getElementById("pendingIssues").textContent = pending;
    document.getElementById("progressIssues").textContent = progress;
    document.getElementById("completedIssues").textContent = completed;
}

function renderIssuesTable(issues) {
    const tbody = document.getElementById("issueTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (issues.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px; color:#6b7280;">No issues found</td></tr>`;
        return;
    }

    issues.forEach(iss => {
        const tr = document.createElement("tr");
        const statusClass = iss.status ? iss.status.toLowerCase().replace(/\s+/g, '-') : 'pending';

        let actionBtn = '';
        if (iss.status === "Pending" && !iss.assigned_user) {
            actionBtn = `<button class="btn-assign" onclick="openAssignModal(${iss.id}, '${escapeHtml(iss.title)}', '${escapeHtml(iss.client_name)}')">Assign</button>`;
        } else {
            actionBtn = `<a href="issue.html?id=${iss.id}" class="btn-view">View</a>`;
        }

        tr.innerHTML = `
            <td>ISS-${String(iss.id).padStart(3, '0')}</td>
            <td>${escapeHtml(iss.client_name)}</td>
            <td>${escapeHtml(iss.title)}</td>
            <td>${escapeHtml(iss.category)}</td>
            <td>${iss.assigned_user ? escapeHtml(iss.assigned_user) : '-'}</td>
            <td><span class="status ${statusClass}">${iss.status}</span></td>
            <td>${actionBtn}</td>
        `;
        tbody.appendChild(tr);
    });
}

function filterIssues() {
    const query = document.getElementById("searchInput").value.toLowerCase().trim();
    if (!query) {
        renderIssuesTable(allIssues);
        return;
    }

    const filtered = allIssues.filter(iss =>
        (iss.client_name && iss.client_name.toLowerCase().includes(query)) ||
        (iss.title && iss.title.toLowerCase().includes(query)) ||
        (iss.category && iss.category.toLowerCase().includes(query)) ||
        (iss.assigned_user && iss.assigned_user.toLowerCase().includes(query)) ||
        (iss.status && iss.status.toLowerCase().includes(query)) ||
        (`ISS-${String(iss.id).padStart(3, '0')}`).toLowerCase().includes(query)
    );

    renderIssuesTable(filtered);
}

// Modal functions for Assign Issue (Screen 4)
function openAssignModal(id, title, clientName) {
    selectedIssueId = id;
    document.getElementById("modalIssueId").textContent = `ISS-${String(id).padStart(3, '0')}`;
    document.getElementById("modalIssueTitle").textContent = title;
    document.getElementById("modalClientName").textContent = clientName;

    const modal = document.getElementById("assignModal");
    if (modal) modal.classList.add("active");
}

function closeAssignModal() {
    selectedIssueId = null;
    const modal = document.getElementById("assignModal");
    if (modal) modal.classList.remove("active");
}

async function submitAssignment() {
    if (!selectedIssueId) return;

    const select = document.getElementById("assignSelect");
    const userId = select.value;

    if (!userId) {
        alert("Please select a user to assign");
        return;
    }

    try {
        const response = await fetch(`/api/issues/${selectedIssueId}/assign`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ userId })
        });

        const data = await response.json();

        if (response.ok) {
            closeAssignModal();
            loadIssues();
        } else {
            alert(data.message || "Failed to assign issue");
        }
    } catch (e) {
        console.error("Assign error:", e);
        alert("Server error. Could not assign issue.");
    }
}

function showUsersView(e) {
    if (e) e.preventDefault();
    // Highlight Users nav link
    document.querySelectorAll(".sidebar a").forEach(a => a.classList.remove("active"));
    const navUsers = document.getElementById("navUsers");
    if (navUsers) navUsers.classList.add("active");

    // Hide stats
    document.getElementById("statsSection").style.display = "none";
    document.getElementById("pageTitle").textContent = "Users";
    document.getElementById("tableSectionTitle").textContent = "All Registered Users";

    // Change table headers to Users format
    const table = document.getElementById("issuesTable");
    table.innerHTML = `
        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
            </tr>
        </thead>
        <tbody>
            ${allUsers.map(u => `
                <tr>
                    <td>USR-${String(u.id).padStart(3, '0')}</td>
                    <td>${escapeHtml(u.name)}</td>
                    <td>${escapeHtml(u.email)}</td>
                    <td><span class="status completed">${u.role}</span></td>
                </tr>
            `).join("")}
        </tbody>
    `;
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
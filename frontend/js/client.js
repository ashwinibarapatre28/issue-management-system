const form = document.getElementById("issueForm");
const messageEl = document.getElementById("message");
const submitBtn = form ? form.querySelector("button[type='submit']") : null;

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const issue = {
        clientName: document.getElementById("clientName").value.trim(),
        category: document.getElementById("category").value,
        title: document.getElementById("title").value.trim(),
        description: document.getElementById("description").value.trim(),
        location: document.getElementById("location").value.trim()
    };

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";
    }

    try {
        const response = await fetch("/api/issues", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(issue)
        });

        const data = await response.json();

        if (response.ok) {
            messageEl.style.color = "#16a34a";
            messageEl.textContent = "Issue submitted successfully! Redirecting to home...";
            form.reset();

            setTimeout(() => {
                window.location.href = "index.html";
            }, 1200);
        } else {
            messageEl.style.color = "#dc2626";
            messageEl.textContent = data.message || "Failed to submit issue.";
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Submit Issue";
            }
        }
    } catch (error) {
        console.error("Submission error:", error);
        messageEl.style.color = "#dc2626";
        messageEl.textContent = "Server error. Please try again.";
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Issue";
        }
    }
});
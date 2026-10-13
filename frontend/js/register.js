const registerForm = document.getElementById("registerForm");
const registerBtn = document.getElementById("registerBtn");
const registerMessage = document.getElementById("registerMessage");

registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Reset message
    registerMessage.textContent = "";
    registerMessage.className = "auth-message";

    // Frontend validations
    if (!name || !email || !password || !confirmPassword) {
        showMessage("Please fill in all fields.", "error");
        return;
    }

    if (name.length < 2) {
        showMessage("Name must be at least 2 characters long.", "error");
        return;
    }

    if (password.length < 6) {
        showMessage("Password must be at least 6 characters long.", "error");
        return;
    }

    if (password !== confirmPassword) {
        showMessage("Passwords do not match.", "error");
        return;
    }

    // Set loading state
    registerBtn.disabled = true;
    const originalBtnText = registerBtn.textContent;
    registerBtn.textContent = "Creating Account...";

    try {
        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message || "Registration failed. Please try again.", "error");
            registerBtn.disabled = false;
            registerBtn.textContent = originalBtnText;
            return;
        }

        // Registration successful
        showMessage("Registration successful! Redirecting to login...", "success");
        registerForm.reset();

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);

    } catch (error) {
        console.error("Register error:", error);
        showMessage("Unable to connect to the server. Please try again later.", "error");
        registerBtn.disabled = false;
        registerBtn.textContent = originalBtnText;
    }
});

function showMessage(text, type) {
    registerMessage.textContent = text;
    registerMessage.className = `auth-message ${type}`;
}

const form = document.getElementById("issueForm");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const issue = {

        clientName:
            document.getElementById("clientName").value,

        category:
            document.getElementById("category").value,

        title:
            document.getElementById("title").value,

        description:
            document.getElementById("description").value,

        location:
            document.getElementById("location").value
    };

    const response = await fetch(
        "/api/issues",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(issue)
        }
    );

    const data = await response.json();

    document.getElementById("message")
        .textContent = data.message;

    if (response.ok) {
        form.reset();
    }
});
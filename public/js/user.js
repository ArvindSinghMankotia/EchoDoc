const token = localStorage.getItem("token");
if (!token) {
    window.location.href = "/login.html";
}

fetch("http://localhost:3000/api/users/profile", {
    headers: { "Authorization": `Bearer ${token}` }
}).then(response => {
    if (!response.ok) {
        localStorage.removeItem("token");
        window.location.href = "/login.html";
    }
    return response.json();
}).then(data => {
    if (data.role !== "user") {
        localStorage.removeItem("token");
        window.location.href = "/login.html";
    }
    document.getElementById("userName").textContent = data.name || "User";
    document.getElementById("creditsCount").textContent = data.credits || "0";
}).catch(() => {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
});

document.getElementById("profileLink").addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "/profile.html";
});

document.getElementById("uploadLink").addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "/upload.html";
});

document.getElementById("logout").addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    window.location.href = "/login.html";
});

document.getElementById("profileLink").insertAdjacentHTML("afterend", `
    <a href="/analytics.html" id="analyticsLink">Analytics</a>
`);

// Helper function to show styled messages
function showMessage(message, isSuccess = true) {
    const responseDiv = document.getElementById("response");
    responseDiv.innerHTML = `<div class="${isSuccess ? 'success-message' : 'error-message'}">${message}</div>`;
    setTimeout(() => responseDiv.innerHTML = '', 5000);
}

document.getElementById("requestCreditsForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const creditsRequested = parseInt(document.getElementById("creditsRequested").value);

    if (!creditsRequested || creditsRequested <= 0) {
        showMessage("Please enter a valid number of credits", false);
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/api/users/request-credits", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ requested_credits: creditsRequested })
        });
        const result = await response.json();
        
        if (response.ok) {
            showMessage(`Credit request for ${creditsRequested} credits submitted successfully! Awaiting admin approval.`, true);
            // Refresh profile data
            const profileResponse = await fetch("http://localhost:3000/api/users/profile", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const profileData = await profileResponse.json();
            document.getElementById("creditsCount").textContent = profileData.credits;
            document.getElementById("requestCreditsForm").reset(); // Clear the form
        } else {
            showMessage(result.message || "Failed to submit credit request", false);
        }
    } catch (error) {
        showMessage(`Error submitting credit request: ${error.message}`, false);
    }
});
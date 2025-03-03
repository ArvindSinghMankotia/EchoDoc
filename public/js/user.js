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
    loadScanCount(data.userid);
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

document.getElementById("requestCreditsForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const creditsRequested = parseInt(document.getElementById("creditsRequested").value);

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
        document.getElementById("response").textContent = JSON.stringify(result, null, 2);
        if (response.ok) {
            const profileResponse = await fetch("http://localhost:3000/api/users/profile", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const profileData = await profileResponse.json();
            document.getElementById("creditsCount").textContent = profileData.credits;
        }
    } catch (error) {
        document.getElementById("response").textContent = `Error: ${error.message}`;
    }
});

async function loadScanCount(userId) {
    try {
        const stmt = db.prepare("SELECT COUNT(*) as scan_count FROM scan_history WHERE user_id = ?");
        const result = stmt.get(userId);
        const scanCount = result.scan_count || 0;
        document.getElementById("stats").insertAdjacentHTML("beforeend", `
            <div class="stat-card">
                <h3>Total Scans</h3>
                <p>${scanCount}</p>
            </div>
        `);
    } catch (error) {
        console.error("Error loading scan count:", error);
    }
}
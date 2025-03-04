const token = localStorage.getItem("token");
if (!token) {
    window.location.href = "/login.html";
}

document.getElementById("logout").addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    window.location.href = "/login.html";
});

function showMessage(message, isSuccess = true) {
    const responseDiv = document.getElementById("response");
    responseDiv.innerHTML = `<div class="${isSuccess ? 'success-message' : 'error-message'}">${message}</div>`;
    setTimeout(() => responseDiv.innerHTML = '', 5000);
}

async function loadProfile() {
    try {
        const profileResponse = await fetch("http://localhost:3000/api/users/profile", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!profileResponse.ok) {
            localStorage.removeItem("token");
            window.location.href = "/login.html";
        }
        const profileData = await profileResponse.json();

        const scanResponse = await fetch("http://localhost:3000/api/users/scan-history", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!scanResponse.ok) throw new Error("Failed to fetch scan history");
        const scanData = await scanResponse.json();

        const profileInfo = document.getElementById("profileInfo");
        profileInfo.innerHTML = `
            <tr><td>Name</td><td>${profileData.name || "N/A"}</td></tr>
            <tr><td>Email</td><td>${profileData.email || "N/A"}</td></tr>
            <tr><td>Credits</td><td>${profileData.credits || 0}</td></tr>
            <tr><td>Role</td><td>${profileData.role || "N/A"}</td></tr>
            <tr><td>Files Uploaded</td><td>${profileData.files_uploaded ? JSON.parse(profileData.files_uploaded).length : 0}</td></tr>
            <tr><td>Total Scans</td><td>${scanData.scanCount || 0}</td></tr>
        `;

        showMessage("Profile loaded successfully", true);
    } catch (error) {
        showMessage(`Error loading profile: ${error.message}`, false);
        localStorage.removeItem("token");
        window.location.href = "/login.html";
    }
}

document.getElementById("exportHistoryBtn").addEventListener("click", async () => {
    try {
        const response = await fetch("http://localhost:3000/api/users/export-history", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || "Failed to export history");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `scan_history_${Date.now()}.txt`;
        link.click();
        window.URL.revokeObjectURL(url);

        showMessage("Scan history exported successfully", true);
    } catch (error) {
        showMessage(`Error exporting history: ${error.message}`, false);
    }
});

loadProfile();
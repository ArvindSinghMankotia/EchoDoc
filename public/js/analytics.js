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
    document.getElementById("homeLink").href = data.role === "admin" ? "/admin.html" : "/user.html";
    loadHistory(data.userid, data.role);
}).catch(() => {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
});

document.getElementById("logout").addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    window.location.href = "/login.html";
});

async function loadHistory(userId, role) {
    try {
        const response = await fetch("http://localhost:3000/api/users/scan-history", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) {
            throw new Error("Failed to fetch scan history");
        }
        const data = await response.json();

        const historyHead = document.getElementById("historyHead");
        const historyList = document.getElementById("historyList");
        historyList.innerHTML = "";

        if (role === "admin") {
            document.getElementById("historyTitle").textContent = "All Scan History";
            historyHead.innerHTML = `
                <tr>
                    <th>Scan ID</th>
                    <th>Document ID</th>
                    <th>User ID</th>
                    <th>Username</th>
                    <th>Scanned At</th>
                    <th>Matches Found</th>
                </tr>
            `;

            if (data.history.length === 0) {
                historyList.innerHTML = "<tr><td colspan='6'>No scan history available.</td></tr>";
            } else {
                data.history.forEach(entry => {
                    const matches = JSON.parse(entry.matches);
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${entry.scan_id}</td>
                        <td>${entry.doc_id}</td>
                        <td>${entry.user_id}</td>
                        <td>${entry.name}</td>
                        <td>${new Date(entry.scanned_at).toLocaleString()}</td>
                        <td>${matches.length}</td>
                    `;
                    historyList.appendChild(tr);
                });
            }

            document.getElementById("adminAnalytics").style.display = "block";
            const analyticsList = document.getElementById("analyticsList");
            analyticsList.innerHTML = "";
            if (data.analytics.length === 0) {
                analyticsList.innerHTML = "<tr><td colspan='4'>No analytics data available.</td></tr>";
            } else {
                data.analytics.forEach(entry => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${entry.user_id}</td>
                        <td>${entry.name}</td>
                        <td>${entry.total_scans}</td>
                        <td>${entry.avg_similarity ? entry.avg_similarity.toFixed(2) : "N/A"}</td>
                    `;
                    analyticsList.appendChild(tr);
                });
            }
        } else {
            document.getElementById("historyTitle").textContent = "Your Scan History";
            historyHead.innerHTML = `
                <tr>
                    <th>Scan ID</th>
                    <th>Document ID</th>
                    <th>Scanned At</th>
                    <th>Matches Found</th>
                </tr>
            `;

            if (data.history.length === 0) {
                historyList.innerHTML = "<tr><td colspan='4'>No scan history available.</td></tr>";
            } else {
                data.history.forEach(entry => {
                    const matches = JSON.parse(entry.matches);
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${entry.scan_id}</td>
                        <td>${entry.doc_id}</td>
                        <td>${new Date(entry.scanned_at).toLocaleString()}</td>
                        <td>${matches.length}</td>
                    `;
                    historyList.appendChild(tr);
                });
            }

            document.getElementById("response").textContent = `Total Scans: ${data.scanCount}`;
        }
    } catch (error) {
        console.error("Error loading history:", error);
        document.getElementById("response").textContent = `Error: ${error.message}`;
    }
}
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
}).catch(() => {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
});

document.getElementById("logout").addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    window.location.href = "/login.html";
});

// Helper function to show styled messages
function showMessage(message, isSuccess = true) {
    const responseDiv = document.getElementById("response");
    responseDiv.innerHTML = `<div class="${isSuccess ? 'success-message' : 'error-message'}">${message}</div>`;
    setTimeout(() => responseDiv.innerHTML = '', 5000);
}

document.getElementById("uploadForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const file = document.getElementById("document").files[0];
    if (!file) {
        showMessage("Please select a file to upload", false);
        return;
    }

    const formData = new FormData();
    formData.append("document", file);

    const loading = document.getElementById("loading");
    loading.style.display = "block";
    document.getElementById("matches").style.display = "none";

    try {
        const response = await fetch("http://localhost:3000/api/users/uploadscan", {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });
        const result = await response.json();

        loading.style.display = "none";
        
        if (response.ok) {
            const matchesList = document.getElementById("matchesList");
            matchesList.innerHTML = "";
            document.getElementById("matches").style.display = "block";

            if (result.matches && result.matches.length > 0) {
                result.matches.forEach(match => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${match.docId}</td>
                        <td>${match.filename}</td>
                        <td>${match.similarity}%</td>
                    `;
                    matchesList.appendChild(tr);
                });
                showMessage(`Scan completed! Found ${result.matches.length} matching document${result.matches.length === 1 ? '' : 's'}.`, true);
            } else {
                matchesList.innerHTML = "<tr><td colspan='3'>No similar documents found.</td></tr>";
                showMessage("Scan completed! No similar documents found.", true);
            }
        } else {
            showMessage(result.message || "Failed to process upload", false);
        }
    } catch (error) {
        loading.style.display = "none";
        showMessage(`Upload failed: ${error.message}`, false);
    }
});
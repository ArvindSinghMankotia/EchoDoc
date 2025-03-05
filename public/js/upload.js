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
                        <td>${match.uploaded_by}</td>
                        <td>${match.similarity}%</td>
                        <td>
                            <button onclick="downloadFile('${match.filename.replace(/'/g, "\\'").replace(/"/g, '\\"')}')">Download</button>
                        </td>
                    `;
                    matchesList.appendChild(tr);
                });
                showMessage(`Scan completed! Found ${result.matches.length} matching document${result.matches.length === 1 ? '' : 's'}. All matches available for download.`, true);
            } else {
                matchesList.innerHTML = "<tr><td colspan='5'>No similar documents found.</td></tr>";
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

function downloadFile(filename) {
    console.log(`Attempting to download: ${filename}`); // Debug log
    const url = `http://localhost:3000/api/users/download/${encodeURIComponent(filename)}`;
    console.log(`Download URL: ${url}`); // Debug log
    fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(response => {
        if (!response.ok) throw new Error("Download failed");
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
        console.log(`Download triggered for: ${url}`);
        showMessage("File downloaded successfully", true);
    })
    .catch(error => {
        console.error(`Download error: ${error.message}`);
        showMessage(`Failed to download file: ${error.message}`, false);
    });
}

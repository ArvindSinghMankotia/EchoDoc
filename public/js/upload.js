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

document.getElementById("uploadForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const file = document.getElementById("document").files[0];
    if (!file) return;

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
        document.getElementById("response").textContent = JSON.stringify(result, null, 2);

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
            } else {
                matchesList.innerHTML = "<tr><td colspan='3'>No similar documents found.</td></tr>";
            }
        }
    } catch (error) {
        loading.style.display = "none";
        document.getElementById("response").textContent = `Error: ${error.message}`;
    }
});
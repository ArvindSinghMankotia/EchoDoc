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
    const profileInfo = document.getElementById("profileInfo");
    profileInfo.innerHTML = `
        <tr><td>Name</td><td>${data.name || "N/A"}</td></tr>
        <tr><td>Email</td><td>${data.email || "N/A"}</td></tr>
        <tr><td>Credits</td><td>${data.credits || 0}</td></tr>
        <tr><td>Role</td><td>${data.role || "N/A"}</td></tr>
        <tr><td>Files Uploaded</td><td>${data.files_uploaded ? JSON.parse(data.files_uploaded).length : 0}</td></tr>
    `;
}).catch(() => {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
});

document.getElementById("logout").addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    window.location.href = "/login.html";
});
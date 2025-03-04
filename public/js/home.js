document.getElementById("loginBtn").addEventListener("click", () => {
    window.location.href = "/login.html";
});

document.getElementById("signupBtn").addEventListener("click", () => {
    window.location.href = "/login.html";
});

const token = localStorage.getItem("token");
if (token) {
    fetch("http://localhost:3000/api/users/profile", {
        headers: { "Authorization": `Bearer ${token}` }
    }).then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error("Not logged in");
    }).then(data => {
        window.location.href = data.role === "admin" ? "/admin.html" : "/user.html";
    }).catch(() => {
        localStorage.removeItem("token");
    });
} 
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
    if (data.role !== "admin") {
        localStorage.removeItem("token");
        window.location.href = "/login.html";
    }
}).catch(() => {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
});

document.getElementById("logout").addEventListener("click", async (e) => {
    e.preventDefault();
    try {
        await fetch("http://localhost:3000/api/users/logout", {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
        });
        localStorage.removeItem("token");
        window.location.href = "/login.html";
    } catch (error) {
        console.error("Logout error:", error);
        localStorage.removeItem("token");
        window.location.href = "/login.html";
    }
});

document.getElementById("searchUserForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("searchEmail").value;

    try {
        const response = await fetch(`http://localhost:3000/api/users/profile?email=${encodeURIComponent(email)}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const result = await response.json();
        const details = document.getElementById("userDetails");
        if (response.ok) {
            details.innerHTML = `
                <p>Name: ${result.name}</p>
                <p>Email: ${result.email}</p>
                <p>Credits: ${result.credits}</p>
                <form id="updateCreditsForm">
                    <label for="newCredits">Update Credits:</label>
                    <input type="number" id="newCredits" placeholder="New credit amount" required>
                    <button type="submit">Update</button>
                </form>
            `;
            document.getElementById("updateCreditsForm").addEventListener("submit", async (e) => {
                e.preventDefault();
                const newCredits = parseInt(document.getElementById("newCredits").value);
                try {
                    const updateResponse = await fetch("http://localhost:3000/api/users/admin/adjust-credits", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ userId: result.userid, credits: newCredits })
                    });
                    const updateResult = await updateResponse.json();
                    document.getElementById("response").textContent = JSON.stringify(updateResult, null, 2);
                } catch (error) {
                    document.getElementById("response").textContent = `Error: ${error.message}`;
                }
            });
        } else {
            details.innerHTML = `<p>${result.message || "User not found"}</p>`;
        }
    } catch (error) {
        document.getElementById("response").textContent = `Error: ${error.message}`;
    }
});
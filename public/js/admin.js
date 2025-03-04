const token = localStorage.getItem("token");
if (!token) {
    console.log("No token found, redirecting to login");
    window.location.href = "/login.html";
}

fetch("http://localhost:3000/api/users/profile", {
    headers: { "Authorization": `Bearer ${token}` }
}).then(response => {
    console.log("Profile fetch status:", response.status);
    if (!response.ok) {
        localStorage.removeItem("token");
        window.location.href = "/login.html";
    }
    return response.json();
}).then(data => {
    console.log("Profile data:", data);
    if (data.role !== "admin") {
        localStorage.removeItem("token");
        window.location.href = "/login.html";
    }
    loadPendingRequests();
}).catch(error => {
    console.error("Profile fetch error:", error);
    localStorage.removeItem("token");
    window.location.href = "/login.html";
});

document.getElementById("pendingRequestsLink").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("pendingRequestsSection").classList.add("active");
    document.getElementById("searchUsersSection").classList.remove("active");
});

document.getElementById("searchUsersLink").insertAdjacentHTML("afterend", `
    <a href="/analytics.html" id="analyticsLink">Analytics</a>
`);

document.getElementById("searchUsersLink").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("pendingRequestsSection").classList.remove("active");
    document.getElementById("searchUsersSection").classList.add("active");
});

document.getElementById("logout").addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    window.location.href = "/login.html";
});

document.getElementById("refreshRequestsBtn").addEventListener("click", loadPendingRequests);

// Helper function to show styled messages
function showMessage(message, isSuccess = true) {
    const responseDiv = document.getElementById("response");
    responseDiv.innerHTML = `<div class="${isSuccess ? 'success-message' : 'error-message'}">${message}</div>`;
    setTimeout(() => responseDiv.innerHTML = '', 5000);
}

async function loadPendingRequests() {
    try {
        console.log("Fetching pending requests...");
        const response = await fetch("http://localhost:3000/api/users/pending-requests", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        console.log("Pending requests status:", response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const result = await response.json();
        console.log("Pending requests data:", result);

        const list = document.getElementById("pendingRequestsList");
        list.innerHTML = "";
        const requestCount = result.pendingRequests.length;
        document.getElementById("requestCount").textContent = requestCount;

        console.log("Number of requests:", requestCount);
        if (requestCount === 0) {
            console.log("No pending requests to display");
            list.innerHTML = "<tr><td colspan='5'>No pending requests available.</td></tr>";
            showMessage("No pending requests found", true);
        } else {
            console.log("Rendering requests...");
            result.pendingRequests.forEach((req, index) => {
                console.log(`Rendering request ${index + 1}:`, req);
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${req.request_id}</td>
                    <td>${req.name || "Unknown"}</td>
                    <td>${req.credits !== undefined ? req.credits : "N/A"}</td>
                    <td>${req.requested_credits}</td>
                    <td>
                        <button onclick="approveRequest(${req.request_id}, ${req.requested_credits})">Approve</button>
                        <button onclick="rejectRequest(${req.request_id})">Reject</button>
                    </td>
                `;
                list.appendChild(tr);
            });
            showMessage("Pending requests loaded successfully", true);
        }
    } catch (error) {
        console.error("Error in loadPendingRequests:", error);
        document.getElementById("pendingRequestsList").innerHTML = "<tr><td colspan='5'>Error loading requests</td></tr>";
        showMessage(`Error loading requests: ${error.message}`, false);
    }
}

async function approveRequest(requestId, credits) {
    try {
        console.log(`Approving request ID: ${requestId} with credits: ${credits}`);
        const response = await fetch("http://localhost:3000/api/users/approve-credits", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ request_id: requestId, status: "approved", credits })
        });
        const result = await response.json();
        console.log("Approve response:", result);
        
        if (response.ok) {
            showMessage(`Request #${requestId} approved successfully! Added ${credits} credits.`);
            loadPendingRequests();
        } else {
            showMessage(result.message || "Failed to approve request", false);
        }
    } catch (error) {
        console.error("Error approving request:", error);
        showMessage(`Error approving request: ${error.message}`, false);
    }
}

async function rejectRequest(requestId) {
    try {
        console.log(`Rejecting request ID: ${requestId}`);
        const response = await fetch("http://localhost:3000/api/users/approve-credits", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ request_id: requestId, status: "rejected" })
        });
        const result = await response.json();
        console.log("Reject response:", result);
        
        if (response.ok) {
            showMessage(`Request #${requestId} rejected successfully!`);
            loadPendingRequests();
        } else {
            showMessage(result.message || "Failed to reject request", false);
        }
    } catch (error) {
        console.error("Error rejecting request:", error);
        showMessage(`Error rejecting request: ${error.message}`, false);
    }
}

document.getElementById("searchUserForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("searchEmail").value;

    try {
        console.log(`Searching for user with email: ${email}`);
        const response = await fetch(`http://localhost:3000/api/users/profile?email=${encodeURIComponent(email)}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const result = await response.json();
        console.log("Search response:", result);
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
            showMessage("User found successfully", true);
            
            document.getElementById("updateCreditsForm").addEventListener("submit", async (e) => {
                e.preventDefault();
                const newCredits = parseInt(document.getElementById("newCredits").value);
                try {
                    console.log(`Updating credits for user ID: ${result.userid} to ${newCredits}`);
                    const updateResponse = await fetch("http://localhost:3000/api/users/admin/adjust-credits", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ userId: result.userid, credits: newCredits })
                    });
                    const updateResult = await updateResponse.json();
                    console.log("Update credits response:", updateResult);
                    
                    if (updateResponse.ok) {
                        showMessage(`Credits updated successfully to ${newCredits}!`);
                        // Refresh user details
                        document.getElementById("searchUserForm").dispatchEvent(new Event("submit"));
                    } else {
                        showMessage(updateResult.message || "Failed to update credits", false);
                    }
                } catch (error) {
                    console.error("Error updating credits:", error);
                    showMessage(`Error updating credits: ${error.message}`, false);
                }
            });
        } else {
            details.innerHTML = `<p>${result.message || "User not found"}</p>`;
            showMessage("User not found", false);
        }
    } catch (error) {
        console.error("Error searching user:", error);
        showMessage(`Error searching user: ${error.message}`, false);
    }
});
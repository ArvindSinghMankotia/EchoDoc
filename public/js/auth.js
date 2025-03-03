const signInBtn = document.querySelector("#sign-in-btn");
const signUpBtn = document.querySelector("#sign-up-btn");
const container = document.querySelector(".container");

signUpBtn.addEventListener('click', () => {
    container.classList.add("sign-up-mode");
});

signInBtn.addEventListener('click', () => {
    container.classList.remove("sign-up-mode");
});

document.getElementById("signInForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
        const response = await fetch("http://localhost:3000/api/users/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();
        if (response.ok) {
            localStorage.setItem("token", result.token);
            const role = JSON.parse(atob(result.token.split('.')[1])).role;
            window.location.href = role === "admin" ? "/admin.html" : "/user.html";
        } else {
            alert(result.message || "Login failed");
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
});

document.getElementById("signUpForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const role = document.getElementById("signupRole").value;
    const secret = document.getElementById("signupSecret").value;

    const payload = { name, email, password };
    if (role === "admin" && secret) {
        payload.role = "admin";
        payload.secret = secret;
    }

    try {
        const response = await fetch("http://localhost:3000/api/users/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (response.ok) {
            alert("Registration successful! Please sign in.");
            container.classList.remove("sign-up-mode");
        } else {
            alert(result.message || "Registration failed");
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
});
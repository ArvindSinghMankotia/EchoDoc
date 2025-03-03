const db = require("./database");
const bcrypt = require("bcrypt");

async function seedAdmin() {
    try {
        const existingAdmin = db.prepare("SELECT * FROM users WHERE email = ?").get("admin@example.com");
        if (existingAdmin) {
            console.log("Admin user already exists.");
            return;
        }

        const hashedPassword = await bcrypt.hash("admin12345", 10);
        const stmt = db.prepare(`
            INSERT INTO users (name, email, password, credits, files_uploaded, role)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        stmt.run("Admin User", "admin@example.com", hashedPassword, 20, null, "admin");
        console.log("✅ Admin user created: admin@example.com / admin12345");
    } catch (error) {
        console.error("Error seeding admin:", error.message);
    }
}

seedAdmin();
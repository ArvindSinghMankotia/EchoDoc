const db = require("./database");
const schedule = require("node-schedule");

// Create Users Table
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        userid INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL CHECK(length(name) > 0),
        email TEXT UNIQUE NOT NULL CHECK(email LIKE '%@%._%'),
        password TEXT NOT NULL CHECK(length(password) >= 8),
        credits INTEGER DEFAULT 20 CHECK(credits >= 0),
        files_uploaded TEXT DEFAULT NULL,
        role TEXT CHECK(role IN ('admin', 'user')) DEFAULT 'user'
    )
`);

console.log("✅ Users table is ready!");

// Function to reset credits at midnight
function resetCredits() {
    db.exec("UPDATE users SET credits = 20 WHERE credits < 20");
    console.log("✅ Credits reset for all users who had less than 20.");
}

// Schedule credit reset at 12 AM every day
schedule.scheduleJob("0 0 * * *", resetCredits); // Runs daily at 12 AM

module.exports = db;
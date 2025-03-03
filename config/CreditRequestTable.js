const db = require("./database");

db.exec(`
    CREATE TABLE IF NOT EXISTS credit_requests (
        request_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        requested_credits INTEGER NOT NULL CHECK(requested_credits > 0),
        status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(userid) ON DELETE CASCADE
    )
`);

console.log("✅ Credit requests table is ready!");
module.exports = db;
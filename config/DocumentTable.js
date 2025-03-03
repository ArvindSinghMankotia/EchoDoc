const db = require("./database");

db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userid INTEGER NOT NULL,
        filename TEXT NOT NULL CHECK(length(filename) > 0),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userid) REFERENCES users(userid) ON DELETE CASCADE
    )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS scan_history (
        scan_id INTEGER PRIMARY KEY AUTOINCREMENT,
        doc_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        matches TEXT,
        FOREIGN KEY(doc_id) REFERENCES documents(id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES users(userid) ON DELETE CASCADE
    )
`);

// Add scan_count column if it doesn't exist
try {
    db.exec("ALTER TABLE scan_history ADD COLUMN scan_count INTEGER DEFAULT 0");
    console.log("✅ Added scan_count column to scan_history");
} catch (error) {
    if (error.code !== 'SQLITE_ERROR' || !error.message.includes('duplicate column name')) {
        console.error("Error adding scan_count column:", error);
    } else {
        console.log("✅ scan_count column already exists in scan_history");
    }
}

console.log("✅ Documents and scan_history tables are ready!");
module.exports = db;
const Database = require("better-sqlite3");

const db = new Database("database.sqlite", {
    verbose: console.log,  // Logs queries for debugging
});

// Enable WAL (Write-Ahead Logging) for better concurrency
db.pragma("journal_mode = WAL");

// Enforce Foreign Key constraints
db.pragma("foreign_keys = ON");

module.exports = db;
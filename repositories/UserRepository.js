const db = require("../config/database");

class UserRepository {
    findByEmail(email) {
        const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
        return stmt.get(email) || null;
    }

    findById(userid) {
        const stmt = db.prepare("SELECT * FROM users WHERE userid = ?");
        return stmt.get(userid) || null;
    }

    create(user) {
        const stmt = db.prepare(`
            INSERT INTO users (name, email, password, credits, files_uploaded, role)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
            user.name,
            user.email,
            user.password,
            user.credits ?? 20,
            user.files_uploaded ? JSON.stringify(user.files_uploaded) : null,
            user.role ?? "user"
        );
        return this.findById(result.lastInsertRowid);
    }

    getPendingRequestByUserId(user_id) {
        const stmt = db.prepare("SELECT * FROM credit_requests WHERE user_id = ? AND status = 'pending'");
        return stmt.get(user_id) || null;
    }

    createCreditRequest(user_id, requested_credits) {
        const stmt = db.prepare(`
            INSERT INTO credit_requests (user_id, requested_credits, status)
            VALUES (?, ?, 'pending')
        `);
        stmt.run(user_id, requested_credits);
        return { status: 200, message: "Credit request submitted successfully", credits: requested_credits };
    }

    updateCreditRequest(request_id, status, requested_credits = null) {
        if (requested_credits !== null) {
            const stmt = db.prepare(`
                UPDATE credit_requests SET requested_credits = ?, status = ? WHERE request_id = ?
            `);
            stmt.run(requested_credits, status, request_id);
        } else {
            const stmt = db.prepare(`
                UPDATE credit_requests SET status = ? WHERE request_id = ?
            `);
            stmt.run(status, request_id);
        }
        return { status: 200, message: `Credit request ${status} successfully` };
    }

    findCreditRequestById(request_id) {
        const stmt = db.prepare("SELECT * FROM credit_requests WHERE request_id = ?");
        return stmt.get(request_id) || null;
    }

    getPendingRequests() {
        const stmt = db.prepare(`
            SELECT cr.request_id, cr.user_id, cr.requested_credits, u.name, u.credits
            FROM credit_requests cr
            JOIN users u ON cr.user_id = u.userid
            WHERE cr.status = 'pending'
            ORDER BY cr.request_id ASC
        `);
        return stmt.all();
    }
}

module.exports = UserRepository;
const UserRepository = require("../repositories/UserRepository");
const UserService = require("../services/UserService");
const upload = require("../utils/uploadFile");
const db = require("../config/database");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs").promises;
const path = require("path");

const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
class UserController {
    static async register(req, res) {
        try {
            const user = await userService.register(req.body);
            res.status(201).json({ message: "User registered successfully", user });
        } catch (error) {
            console.error("Error in register:", error.message);
            res.status(400).json({ error: error.message });
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await userService.login({ email, password });

            if (result.status !== 200) {
                return res.status(result.status).json({ message: result.message });
            }

            return res.status(200).json({
                message: "Login successful",
                token: result.token
            });
        } catch (error) {
            console.error("Login error:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    static async reqcredits(req, res) {
        try {
            const user_id = req.user.userid;
            const { requested_credits } = req.body;

            if (!requested_credits || isNaN(requested_credits) || requested_credits <= 0) {
                return res.status(400).json({ message: "Invalid credit request amount" });
            }

            const response = await userService.requestCredits(user_id, requested_credits);
            return res.status(response.status).json(response);
        } catch (error) {
            console.error("Credit request error:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    static async getPendingRequests(req, res) {
        try {
            const pendingRequests = await userService.getPendingRequests();
            return res.status(200).json({ pendingRequests }); // Wraps array in { pendingRequests: [...] }
        } catch (error) {
            console.error("Error fetching pending requests:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    static async approveCreditRequest(req, res) {
        try {
            const { request_id, status, credits } = req.body;

            if (!["approved", "rejected"].includes(status)) {
                return res.status(400).json({ message: "Invalid status. Must be 'approved' or 'rejected'." });
            }

            if (status === "approved" && (!credits || isNaN(credits) || credits <= 0)) {
                return res.status(400).json({ message: "Approved requests must include a valid credit amount." });
            }

            const response = await userService.approveCreditRequest(request_id, status, credits);
            if (response.status === 200 && status === "approved") {
                const request = await userRepository.findCreditRequestById(request_id);
                const stmt = db.prepare("UPDATE users SET credits = credits + ? WHERE userid = ?");
                stmt.run(credits, request.user_id);
            }
            return res.status(200).json(response);
        } catch (error) {
            console.error("Error in approving credits:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    static async uploadscan(req, res) {
        upload(req, res, async (err) => {
            if (err) {
                console.error("Upload error:", err.message);
                return res.status(400).json({ message: err.message });
            }

            if (!req.file) {
                return res.status(400).json({ message: "No file uploaded" });
            }

            try {
                const user_id = req.user.userid;
                const userStmt = db.prepare("SELECT credits FROM users WHERE userid = ?");
                const user = userStmt.get(user_id);

                if (user.credits <= 0) {
                    return res.status(403).json({ message: "Insufficient credits" });
                }

                const filename = req.file.filename;
                const stmt = db.prepare("INSERT INTO documents (userid, filename) VALUES (?, ?)");
                stmt.run(user_id, filename);

                const filesStmt = db.prepare("SELECT files_uploaded FROM users WHERE userid = ?");
                const filesData = filesStmt.get(user_id);
                let uploadedFiles = filesData.files_uploaded ? JSON.parse(filesData.files_uploaded) : [];
                uploadedFiles.push(filename);

                const updateStmt = db.prepare("UPDATE users SET files_uploaded = ?, credits = credits - 1 WHERE userid = ?");
                updateStmt.run(JSON.stringify(uploadedFiles), user_id);

                return res.status(200).json({ message: "Text file uploaded successfully", filename });
            } catch (error) {
                console.error("Upload error:", error);
                return res.status(500).json({ message: "Internal server error" });
            }
        });
    }

    static async profile(req, res) {
        try {
            const user_id = req.user.userid;
            const emailQuery = req.query.email;

            if (emailQuery && req.user.role === "admin") {
                const user = await userRepository.findByEmail(emailQuery);
                if (!user) {
                    return res.status(404).json({ message: "User not found" });
                }
                const { password, ...userProfile } = user;
                return res.status(200).json(userProfile);
            }

            const user = await userRepository.findById(user_id);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const { password, ...userProfile } = user;
            return res.status(200).json(userProfile);
        } catch (error) {
            console.error("Profile error:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    static async matchingdocs(req, res) {
        try {
            return res.status(501).json({ message: "Document matching not yet implemented" });
        } catch (error) {
            console.error("Matching docs error:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    static async adjustCredits(req, res) {
        try {
            const { userId, credits } = req.body;

            if (!userId || isNaN(userId)) {
                return res.status(400).json({ message: "Invalid userId" });
            }
            if (!credits || isNaN(credits) || credits < 0) {
                return res.status(400).json({ message: "Credits must be a non-negative number" });
            }

            const user = await userRepository.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const stmt = db.prepare("UPDATE users SET credits = ? WHERE userid = ?");
            stmt.run(credits, userId);

            return res.status(200).json({ 
                message: `Credits adjusted successfully for user ${userId}`, 
                newCredits: credits 
            });
        } catch (error) {
            console.error("Error in adjusting credits:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    static async uploadscan(req, res) {
        upload(req, res, async (err) => {
            if (err) return res.status(400).json({ message: err.message });
            if (!req.file) return res.status(400).json({ message: "No file uploaded" });

            try {
                const user_id = req.user.userid;
                const userStmt = db.prepare("SELECT credits FROM users WHERE userid = ?");
                const user = userStmt.get(user_id);

                if (!user || user.credits <= 0) {
                    return res.status(403).json({ message: "Insufficient credits" });
                }

                const filename = req.file.filename;
                const docStmt = db.prepare("INSERT INTO documents (userid, filename) VALUES (?, ?)");
                const docResult = docStmt.run(user_id, filename);
                const docId = docResult.lastInsertRowid;

                const filesStmt = db.prepare("SELECT files_uploaded FROM users WHERE userid = ?");
                const filesData = filesStmt.get(user_id);
                let uploadedFiles = filesData.files_uploaded ? JSON.parse(filesData.files_uploaded) : [];
                uploadedFiles.push(filename);

                const updateStmt = db.prepare("UPDATE users SET files_uploaded = ?, credits = credits - 1 WHERE userid = ?");
                updateStmt.run(JSON.stringify(uploadedFiles), user_id);

                const matches = await UserController.scanAndMatch(docId, filename, user_id);
                res.status(200).json({ message: "Text file uploaded and scanned", filename, matches });
            } catch (error) {
                res.status(500).json({ message: "Internal server error", details: error.message });
            }
        });
    }

    static async scanAndMatch(docId, filename, userId) {
        const filePath = path.join(__dirname, "../uploads", filename);
        let newFileContent;
        try {
            newFileContent = await fs.readFile(filePath, "utf-8");
        } catch (error) {
            throw new Error("Failed to read uploaded file");
        }

        // Fetch only recent documents to reduce comparisons
        const docStmt = db.prepare("SELECT id, filename FROM documents WHERE id != ? ORDER BY uploaded_at DESC LIMIT 10");
        const allDocs = docStmt.all(docId);

        if (allDocs.length === 0) return []; // No documents to compare, return empty matches

        const matches = [];
        for (const doc of allDocs) {
            const oldFilePath = path.join(__dirname, "../uploads", doc.filename);
            let oldFileContent;
            try {
                oldFileContent = await fs.readFile(oldFilePath, "utf-8");
            } catch (error) {
                continue; // Skip if file is missing
            }

            const chunkSize = 2000; // Smaller chunks to reduce API calls and token size
            const newChunks = chunkText(newFileContent, chunkSize);
            const oldChunks = chunkText(oldFileContent, chunkSize);
            let totalSimilarity = 0;
            let chunkCount = Math.min(newChunks.length, oldChunks.length);

            if (chunkCount === 0) continue; // Skip if no chunks to compare

            // Compare only the first few chunks to save time
            const maxChunks = Math.min(chunkCount, 2); // Limit to 2 chunks per comparison
            for (let i = 0; i < maxChunks; i++) {
                const prompt = `
                    Compare these two text chunks and return a similarity score (0-100) as a JSON object:
                    Chunk 1: ${newChunks[i].substring(0, 500)}  // Limit to 500 chars per chunk
                    Chunk 2: ${oldChunks[i].substring(0, 500)}
                    Format: {"similarity": <number>}
                `;

                try {
                    const result = await retryRequest(() => model.generateContent(prompt), 3, 1000);
                    const responseText = result.response.text();
                    const cleanedText = responseText.replace(/```json|\```/g, "").replace(/[^\x20-\x7E\n]/g, "").trim();
                    const similarityObj = JSON.parse(cleanedText);
                    totalSimilarity += similarityObj.similarity || 0;
                } catch (error) {
                    if (error.status === 429) continue; // Skip on rate limit
                    continue; // Skip other errors
                }
            }

            const similarity = maxChunks > 0 ? Math.round(totalSimilarity / maxChunks) : 0;
            if (similarity > 70) { // Higher threshold for relevance
                matches.push({ docId: doc.id, filename: doc.filename, similarity });
            }
        }

        const historyStmt = db.prepare("INSERT INTO scan_history (doc_id, user_id, matches) VALUES (?, ?, ?)");
        historyStmt.run(docId, userId, JSON.stringify(matches));

        return matches;
    }

    static async getMatches(req, res) {
        try {
            const docId = parseInt(req.params.docId);
            const stmt = db.prepare("SELECT matches FROM scan_history WHERE doc_id = ? ORDER BY scanned_at DESC LIMIT 1");
            const history = stmt.get(docId);

            if (!history || !history.matches) {
                return res.status(404).json({ message: "No matches found for this document" });
            }

            res.status(200).json({ matches: JSON.parse(history.matches) });
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    static async getScanHistory(req, res) {
        try {
            const userId = req.user.userid;
            const role = req.user.role;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            let history;
            if (role === "admin") {
                const stmt = db.prepare(`
                    SELECT sh.scan_id, sh.doc_id, sh.user_id, sh.scanned_at, sh.matches, u.name
                    FROM scan_history sh
                    JOIN users u ON sh.user_id = u.userid
                    ORDER BY sh.scanned_at DESC
                    LIMIT ? OFFSET ?
                `);
                history = stmt.all(limit, offset);

                const countStmt = db.prepare("SELECT COUNT(*) as total FROM scan_history");
                const total = countStmt.get().total;

                const analyticsStmt = db.prepare(`
                    SELECT sh.user_id, u.name, 
                           COUNT(*) as total_scans, 
                           AVG(CASE WHEN json_array_length(sh.matches) > 0 
                                   THEN json_extract(json_extract(sh.matches, '$[0]'), '$.similarity') 
                                   ELSE 0 END) as avg_similarity
                    FROM scan_history sh
                    JOIN users u ON sh.user_id = u.userid
                    GROUP BY sh.user_id, u.name
                `);
                const analytics = analyticsStmt.all();
                res.status(200).json({ history, analytics, pagination: { page, limit, total } });
            } else {
                const stmt = db.prepare(`
                    SELECT scan_id, doc_id, scanned_at, matches
                    FROM scan_history
                    WHERE user_id = ?
                    ORDER BY scanned_at DESC
                    LIMIT ? OFFSET ?
                `);
                history = stmt.all(userId, limit, offset);

                const countStmt = db.prepare("SELECT COUNT(*) as total FROM scan_history WHERE user_id = ?");
                const total = countStmt.get(userId).total;

                const scanCount = total;
                res.status(200).json({ history, scanCount, pagination: { page, limit, total } });
            }
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

}
async function retryRequest(fn, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (error.status === 429 && i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
            } else {
                throw error;
            }
        }
    }
    throw new Error("Max retries reached for rate limit");
}
function chunkText(text, size) {
    const chunks = [];
    for (let i = 0; i < text.length; i += size) {
        chunks.push(text.slice(i, i + size));
    }
    return chunks;
}
module.exports = UserController;
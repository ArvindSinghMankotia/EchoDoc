const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async register(userData) {
        const existingUser = await this.userRepository.findByEmail(userData.email);
        if (existingUser) throw new Error("User already exists");

        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = { ...userData, password: hashedPassword };

        console.log("Before Insert:", user);
        const createdUser = await this.userRepository.create(user);
        console.log("After Insert:", createdUser);

        return createdUser;
    }

    async login(userData) {
        try {
            const currentUser = await this.userRepository.findByEmail(userData.email);
            if (!currentUser) {
                return { status: 404, message: "User not found" };
            }

            const isPasswordValid = await bcrypt.compare(userData.password, currentUser.password);
            if (!isPasswordValid) {
                return { status: 401, message: "Invalid password" };
            }

            const token = jwt.sign(
                { userid: currentUser.userid, email: currentUser.email, role: currentUser.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
            );

            return { status: 200, message: "Login successful", token };
        } catch (error) {
            console.error("Error in login:", error.message);
            return { status: 500, message: "Internal server error" };
        }
    }

    async requestCredits(user_id, requested_credits) {
        try {
            const user = await this.userRepository.findById(user_id);
            if (!user) {
                return { status: 404, message: "User not found" };
            }

            const existingRequest = await this.userRepository.getPendingRequestByUserId(user_id);
            if (existingRequest) {
                await this.userRepository.updateCreditRequest(existingRequest.request_id, "pending", requested_credits);
                return { status: 200, message: "Credit request updated successfully" };
            } else {
                await this.userRepository.createCreditRequest(user_id, requested_credits);
                return { status: 201, message: "Credit request submitted successfully" };
            }
        } catch (error) {
            console.error("Error in requesting credits:", error);
            return { status: 500, message: "Internal server error" };
        }
    }

    async approveCreditRequest(request_id, status, credits = null) {
        try {
            const request = await this.userRepository.findCreditRequestById(request_id);
            if (!request) {
                return { status: 404, message: "Credit request not found" };
            }

            if (!["approved", "rejected"].includes(status)) {
                return { status: 400, message: "Invalid status" };
            }

            await this.userRepository.updateCreditRequest(request_id, status, credits);
            return { status: 200, message: `Credit request ${status} successfully` };
        } catch (error) {
            console.error("Error in approving/rejecting credits:", error);
            return { status: 500, message: "Internal server error" };
        }
    }

    async getPendingRequests() {
        try {
            const pendingRequests = await this.userRepository.getPendingRequests();
            return pendingRequests; // Return array directly
        } catch (error) {
            console.error("Error fetching pending requests:", error);
            throw error; // Let controller handle error
        }
    }
    
}

module.exports = UserService;
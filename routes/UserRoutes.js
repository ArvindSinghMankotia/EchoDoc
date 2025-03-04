const express = require("express");
const UserController = require("../controllers/UserController");
const { authenticateToken, authorizeAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.post("/request-credits", authenticateToken, UserController.reqcredits);
router.get("/pending-requests", authenticateToken, authorizeAdmin, UserController.getPendingRequests);
router.post("/approve-credits", authenticateToken, authorizeAdmin, UserController.approveCreditRequest);
router.post("/uploadscan", authenticateToken, UserController.uploadscan);
router.get("/profile", authenticateToken, UserController.profile);
router.get("/matchingdocs", authenticateToken, UserController.matchingdocs);
router.post("/admin/adjust-credits", authenticateToken, authorizeAdmin, UserController.adjustCredits);
router.get("/matches/:docId", authenticateToken, UserController.getMatches);
router.get("/scan-history", authenticateToken, UserController.getScanHistory);
router.get("/download/:filename", authenticateToken, UserController.downloadFile);
router.get("/export-history", authenticateToken, UserController.exportScanHistory); // New endpoint

module.exports = router;
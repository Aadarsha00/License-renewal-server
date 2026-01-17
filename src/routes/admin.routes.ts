import express from "express";
import { adminLogin, getAllRenewals, approveRenewal, rejectRenewal, getStatistics,registerUser } from "../controller/admin.controller";
import { authenticate } from "../middleware/authentication.middleware";
import { Role } from "../@types/jwt.interface";

const router = express.Router();

//admin creating new user
router.post("/users", authenticate([Role.admin]), registerUser);
// Admin login
router.post("/login", adminLogin);

// Get all renewal requests (filterable by status)
router.get("/renewals", authenticate([Role.admin]), getAllRenewals);

// Approve renewal request
router.post("/renewals/:id/approve", authenticate([Role.admin]), approveRenewal);

// Reject renewal request
router.post("/renewals/:id/reject", authenticate([Role.admin]), rejectRenewal);

// Get dashboard statistics
router.get("/statistics", authenticate([Role.admin]), getStatistics);

export default router;
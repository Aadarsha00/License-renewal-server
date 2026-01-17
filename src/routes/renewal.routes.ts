import express from "express";
import { createRenewalRequest, getUserRenewals, getRenewalById } from "../controller/renewal.controller";
import { authenticate } from "../middleware/authentication.middleware";

const router = express.Router();

// Create renewal request
router.post("/", authenticate(), createRenewalRequest);



// Get all renewals for logged-in user
router.get("/", authenticate(), getUserRenewals);

// Get renewal by ID
router.get("/:id", authenticate(), getRenewalById);

export default router;
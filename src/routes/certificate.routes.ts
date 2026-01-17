import express from "express";
import { getUserCertificates, getCertificateById, createCertificate } from "../controller/certificate.controller";
import { authenticate } from "../middleware/authentication.middleware";

const router = express.Router();

// Get all certificates for logged-in user
router.get("/", authenticate(), getUserCertificates);

// Get certificate by ID
router.get("/:id", authenticate(), getCertificateById);

// Create new certificate
router.post("/", authenticate(), createCertificate);

export default router;
// certificate.controller.ts
import { Request, Response } from "express";
import { catchAsyncHandler } from "../utils/asyncHandler.utils";
import { CustomError } from "../middleware/errorhandler.middleware";
import Certificate from "../model/certificate.model";
import User from "../model/user.model";

// Get all user certificates
export const getUserCertificates = catchAsyncHandler(
  async (req: Request, res: Response) => {
    if (!req.User) {
      throw new CustomError("User not authenticated", 401);
    }

    const certificates = await Certificate.find({ userId: req.User._id });

    // Update status based on expiry date
    const today = new Date();
    for (const cert of certificates) {
      const isExpired = new Date(cert.expiryDate) < today;
      if (isExpired && cert.status === "active") {
        cert.status = "inactive";
        await cert.save();
      }
    }

    res.status(200).json({
      status: "success",
      success: true,
      message: "Certificates fetched successfully",
      certificates,
    });
  }
);

// Get certificate by ID
export const getCertificateById = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!req.User) {
      throw new CustomError("User not authenticated", 401);
    }

    const certificate = await Certificate.findOne({
      _id: id,
      userId: req.User._id,
    });

    if (!certificate) {
      throw new CustomError("Certificate not found", 404);
    }

    res.status(200).json({
      status: "success",
      success: true,
      message: "Certificate fetched successfully",
      certificate,
    });
  }
);

// Create certificate (Admin/Seeding)
export const createCertificate = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const {
      certificateType,
      holderName,
      issueDate,
      expiryDate,
      documentUrl,
    } = req.body;

    if (!certificateType) throw new CustomError("Certificate type is required", 400);
    if (!holderName) throw new CustomError("Holder name is required", 400);
    if (!issueDate) throw new CustomError("Issue date is required", 400);
    if (!expiryDate) throw new CustomError("Expiry date is required", 400);

    const userId = req.User?._id || req.body.userId;
    if (!userId) throw new CustomError("User ID is required", 400);

    // Get the user to access their registration number
    const user = await User.findById(userId);
    if (!user) throw new CustomError("User not found", 404);

    // Check if user already has a certificate with this type
    const existingCert = await Certificate.findOne({ 
      userId: userId,
      certificateType: certificateType 
    });
    if (existingCert) {
      throw new CustomError("User already has a certificate of this type", 400);
    }

    const certificate = await Certificate.create({
      userId,
      certificateNumber: user.registrationNumber, // ← AUTO-GENERATED FROM USER
      certificateType,
      holderName,
      issueDate,
      expiryDate,
      documentUrl,
      status: new Date(expiryDate) > new Date() ? "active" : "inactive",
    });

    res.status(201).json({
      status: "success",
      success: true,
      message: "Certificate created successfully",
      certificate,
    });
  }
);
// renewal.controller.ts
import { Request, Response } from "express";
import { catchAsyncHandler } from "../utils/asyncHandler.utils";
import { CustomError } from "../middleware/errorhandler.middleware";
import Renewal from "../model/renewal.model";
import Certificate from "../model/certificate.model";
import { verifyKhaltiPayment } from "../utils/khalti.utils";

// Create renewal request with Khalti payment
export const createRenewalRequest = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const { certificateId, amount, khaltiToken, documentUrl } = req.body;

    if (!req.User) {
      throw new CustomError("User not authenticated", 401);
    }
    if (!certificateId) {
      throw new CustomError("Certificate ID is required", 400);
    }
    if (!amount) {
      throw new CustomError("Amount is required", 400);
    }
    if (!khaltiToken) {
      throw new CustomError("Khalti payment token is required", 400);
    }

    // Verify certificate belongs to user
    const certificate = await Certificate.findOne({
      _id: certificateId,
      userId: req.User._id,
    });

    if (!certificate) {
      throw new CustomError("Certificate not found", 404);
    }

    // Check if there's already a pending renewal
    const existingRenewal = await Renewal.findOne({
      certificateId,
      adminStatus: "pending",
    });

    if (existingRenewal) {
      throw new CustomError(
        "A renewal request is already pending for this certificate",
        400
      );
    }

    // Verify payment with Khalti
    const amountInPaisa = amount * 100; // Convert rupees to paisa
    let paymentVerification;
    
    try {
      paymentVerification = await verifyKhaltiPayment(khaltiToken, amountInPaisa);
    } catch (error: any) {
      throw new CustomError(error.message || "Payment verification failed", 400);
    }

    // Calculate new expiry date (1 year from current expiry or today, whichever is later)
    const currentExpiry = new Date(certificate.expiryDate);
    const today = new Date();
    const baseDate = currentExpiry > today ? currentExpiry : today;
    const renewedUntil = new Date(baseDate);
    renewedUntil.setFullYear(renewedUntil.getFullYear() + 1);

    // Create renewal request with verified payment
    const renewal = await Renewal.create({
      userId: req.User._id,
      certificateId,
      amount,
      paymentMethod: "khalti",
      paymentStatus: "success", // Payment already verified
      adminStatus: "pending",
      receiptUrl: paymentVerification.idx, // Khalti payment ID as receipt
      documentUrl,
    });

    res.status(201).json({
      status: "success",
      success: true,
      message: "Renewal request created successfully. Payment verified.",
      renewal,
      paymentDetails: {
        khaltiPaymentId: paymentVerification.idx,
        amount: paymentVerification.amount / 100, // Convert back to rupees
      },
    });
  }
);

// Get user renewals
export const getUserRenewals = catchAsyncHandler(
  async (req: Request, res: Response) => {
    if (!req.User) {
      throw new CustomError("User not authenticated", 401);
    }

    const renewals = await Renewal.find({ userId: req.User._id })
      .populate("certificateId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      success: true,
      message: "Renewals fetched successfully",
      renewals,
    });
  }
);

// Get renewal by ID
export const getRenewalById = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!req.User) {
      throw new CustomError("User not authenticated", 401);
    }

    const renewal = await Renewal.findOne({ _id: id, userId: req.User._id })
      .populate("certificateId");

    if (!renewal) {
      throw new CustomError("Renewal request not found", 404);
    }

    res.status(200).json({
      status: "success",
      success: true,
      message: "Renewal fetched successfully",
      renewal,
    });
  }
);
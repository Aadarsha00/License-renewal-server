import { Request, Response } from "express";
import { catchAsyncHandler } from "../utils/asyncHandler.utils";
import { CustomError } from "../middleware/errorhandler.middleware";
import { generateToken } from "../utils/jwt.utils";
import { IUserPayload, Role } from "../@types/jwt.interface";
import { comparePassword, hash } from "../utils/bcrypt.utils";
import User from "../model/user.model";
import Renewal from "../model/renewal.model";
import Certificate from "../model/certificate.model";

// Admin Login
export const adminLogin = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email) throw new CustomError("Email is required", 400);
    if (!password) throw new CustomError("Password is required", 400);

    const admin = await User.findOne({ email, role: Role.admin });
    if (!admin) throw new CustomError("Admin not found", 404);

    const isMatch = await comparePassword(password, admin.password);
    if (!isMatch) throw new CustomError("Invalid credentials", 401);

    const payload: IUserPayload = {
      _id: admin._id,
      registrationNumber: admin.registrationNumber,
      phoneNumber: admin.phoneNumber,
      role: admin.role as Role,
    };
    const token = generateToken(payload);

    res
      .status(200)
      .cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
      .json({
        status: "success",
        success: true,
        message: "Admin login successful",
        user: {
          id: admin._id,
          email: admin.email,
          role: admin.role,
        },
        token,
      });
  }
);


// Register new user (Admin only)
export const registerUser = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const { registrationNumber, phoneNumber, email, password } = req.body;

    // Validation
    if (!registrationNumber) throw new CustomError("Registration number is required", 400);
    if (!phoneNumber) throw new CustomError("Phone number is required", 400);
    if (!password) throw new CustomError("Password is required", 400);

    // Check if user already exists
    const existingUser = await User.findOne({ registrationNumber });
    if (existingUser) {
      throw new CustomError("User with this registration number already exists", 400);
    }

    // Check if email exists (if provided)
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        throw new CustomError("Email already in use", 400);
      }
    }

    // Hash password
    const hashedPassword = await hash (password);

    // Create user
    const user = await User.create({
      registrationNumber,
      phoneNumber,
      email: email || null,
      password: hashedPassword,
      role: "user",
    });

    res.status(201).json({
      status: "success",
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        registrationNumber: user.registrationNumber,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
      },
    });
  }
);
// Get all renewals
export const getAllRenewals = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const { status } = req.query;
    const filter: any = {};

    if (status) {
      filter.adminStatus = status;
    }

    const renewals = await Renewal.find(filter)
      .populate("userId", "registrationNumber phoneNumber")
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

export const approveRenewal = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const renewal = await Renewal.findById(id).populate("certificateId");
    if (!renewal) throw new CustomError("Renewal request not found", 404);

    if (renewal.adminStatus !== "pending") {
      throw new CustomError("Renewal already processed", 400);
    }

    if (renewal.paymentStatus !== "success") {
      throw new CustomError("Payment not completed", 400);
    }

    const certificate = await Certificate.findById(renewal.certificateId);
    if (!certificate) throw new CustomError("Certificate not found", 404);

    // ✅ CALCULATE renewedUntil HERE (only when approving)
    const currentExpiry = new Date(certificate.expiryDate);
    const today = new Date();
    const baseDate = currentExpiry > today ? currentExpiry : today;
    const renewedUntil = new Date(baseDate);
    renewedUntil.setFullYear(renewedUntil.getFullYear() + 1);

    // ✅ SET renewedUntil on the renewal document
    renewal.renewedUntil = renewedUntil;
    renewal.adminStatus = "approved";
    await renewal.save();

    // ✅ UPDATE certificate with the new expiry
    certificate.expiryDate = renewedUntil;
    certificate.lastRenewalDate = new Date();
    certificate.status = "active";
    await certificate.save();

    res.status(200).json({
      status: "success",
      success: true,
      message: "Renewal approved successfully",
      renewal,
    });
  }
);

// Reject renewal
export const rejectRenewal = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { cancelReason } = req.body;

    if (!cancelReason) throw new CustomError("Cancellation reason is required", 400);

    const renewal = await Renewal.findById(id);
    if (!renewal) throw new CustomError("Renewal request not found", 404);

    if (renewal.adminStatus !== "pending") {
      throw new CustomError("Renewal already processed", 400);
    }

    renewal.adminStatus = "rejected";
    renewal.cancelReason = cancelReason;
    await renewal.save();

    res.status(200).json({
      status: "success",
      success: true,
      message: "Renewal rejected successfully",
      renewal,
    });
  }
);

// Get statistics
export const getStatistics = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const totalRenewals = await Renewal.countDocuments();
    const pendingRenewals = await Renewal.countDocuments({ adminStatus: "pending" });
    const approvedRenewals = await Renewal.countDocuments({ adminStatus: "approved" });
    const rejectedRenewals = await Renewal.countDocuments({ adminStatus: "rejected" });

    const totalCertificates = await Certificate.countDocuments();
    const activeCertificates = await Certificate.countDocuments({ status: "active" });
    const expiredCertificates = await Certificate.countDocuments({ status: "inactive" });

    res.status(200).json({
      status: "success",
      success: true,
      message: "Statistics fetched successfully",
      data: {
        renewals: {
          total: totalRenewals,
          pending: pendingRenewals,
          approved: approvedRenewals,
          rejected: rejectedRenewals,
        },
        certificates: {
          total: totalCertificates,
          active: activeCertificates,
          expired: expiredCertificates,
        },
      },
    });
  }
);
import { Request, Response } from "express";
import { CustomError } from "../middleware/errorhandler.middleware";
import { catchAsyncHandler } from "../utils/asyncHandler.utils";
import User from "../model/user.model"; 
import { generateToken } from "../utils/jwt.utils";
import { IUserPayload } from "../@types/jwt.interface";
import { comparePassword, hash } from "../utils/bcrypt.utils";
import { Role } from "../@types/jwt.interface";

// Register
export const userRegister = catchAsyncHandler(
  async (req: Request, res: Response) => {
    console.log("🔥 Register endpoint hit!");
    console.log("📦 req.body:", req.body);
    console.log("📋 Content-Type:", req.headers['content-type']);
    const { registrationNumber, phoneNumber, password } = req.body;

    if (!registrationNumber) throw new CustomError("Registration number is required", 400);
    if (!phoneNumber) throw new CustomError("Phone number is required", 400);
    if (!password) throw new CustomError("Password is required", 400);

    // Check if user already exists
    const existingUser = await User.findOne({ registrationNumber });
    if (existingUser) throw new CustomError("Registration number already exists", 400);

    // Hash password
    const hashedPassword = await hash(password);

    // Create new user
    const newUser = await User.create({
      registrationNumber,
      phoneNumber,
      password: hashedPassword,
    });

    // Generate token
    const payload: IUserPayload = {
      _id: newUser._id,
      registrationNumber: newUser.registrationNumber,
      phoneNumber: newUser.phoneNumber,
      role: newUser.role as Role,
    };
    const token = generateToken(payload);

    res
      .status(201)
      .cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
      .json({
        status: "success",
        success: true,
        message: "Registration successful",
        user: {
          id: newUser._id,
          registrationNumber: newUser.registrationNumber,
          phoneNumber: newUser.phoneNumber,
        },
        token,
      });
  }
);

// Login
export const userLogin = catchAsyncHandler(
  async (req: Request, res: Response) => {
    const { registrationNumber, phoneNumber, password } = req.body;

    if (!registrationNumber) throw new CustomError("Registration number is required", 400);
    if (!phoneNumber) throw new CustomError("Phone number is required", 400);
    if (!password) throw new CustomError("Password is required", 400);

    // Find user
    const user = await User.findOne({ registrationNumber, phoneNumber });
    if (!user) throw new CustomError("User not found", 404);

    // Verify password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) throw new CustomError("Invalid credentials", 401);

    // Generate token
    const payload: IUserPayload = {
      _id: user._id,
      registrationNumber: user.registrationNumber,
      phoneNumber: user.phoneNumber,
      role: user.role as Role, 
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
        message: "Login successful",
        user: {
          id: user._id,
          registrationNumber: user.registrationNumber,
          phoneNumber: user.phoneNumber,
          role: user.role,
        },
        token,
      });
  }
);

// Logout
export const userLogout = catchAsyncHandler(
  async (_req: Request, res: Response) => {
    res
      .status(200)
      .clearCookie("access_token")
      .json({
        status: "success",
        success: true,
        message: "Logout successful",
      });
  }
);

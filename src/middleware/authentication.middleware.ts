import { NextFunction, Request, Response } from "express";
import { CustomError } from "./errorhandler.middleware";
import { Role } from "../@types/jwt.interface";
import { verifyToken } from "../utils/jwt.utils";
import user from "../model/user.model";

export const authenticate = (roles?: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers["authorization"] as string;
      console.log(
        "👊 ~ authentication.middleware.ts:15 ~ return ~ token:",
        req.headers["authorization"]
      );

      if (!authHeader || !authHeader.startsWith("BEARER")) {
        throw new CustomError(
          "Unauthorized, Authorization header is missing",
          401
        );
      }
      const accessToken = authHeader.split(" ")[1];
      if (!accessToken) {
        throw new CustomError("Unauthorized, token is missing", 401);
      }

      const decoded = verifyToken(accessToken);
      console.log("🚀 ~ return ~ decoded:", decoded);

      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        console.log(decoded.exp);
        console.log(decoded.exp * 1000, Date.now());
        throw new CustomError("Unauthorized, token expired", 401);
      }
      if (!decoded) {
        throw new CustomError("Unauthorized, Invalid token", 401);
      }

      const User = await user.findById(decoded._id);
      if (!User) {
        throw new CustomError("User not found", 404);
      }
      if (roles && !roles.includes(User.role as Role)) {
        throw new CustomError(
          `Forbidden, ${User.role} can not access this resource`,
          401
        );
      }
      req.User = {
        _id: decoded._id,
        phoneNumber: decoded.phoneNumber,
        registrationNumber: decoded.registrationNumber,
        role: decoded.role,
        
      };

      next();
    } catch (err: any) {
      // throw new CustomError(err?.message ?? "Something wend wrong", 500);
      next(err);
    }
  };
};

import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { IUserPayload } from "../@types/jwt.interface";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_TOKEN_EXPIRES_IN = process.env.JWT_TOKEN_EXPIRES_IN || "1d";

if (!JWT_SECRET) throw new Error("JWT_SECRET not defined in .env");

export const generateToken = (payload: IUserPayload): string => {
  const options: SignOptions = { 
    expiresIn: JWT_TOKEN_EXPIRES_IN as SignOptions["expiresIn"] 
  };
  return jwt.sign(payload, JWT_SECRET as string, options);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET as string) as JwtPayload;
};

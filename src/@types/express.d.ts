import { Request } from "express";
import { IPayload } from "./jwt.interface";
declare global {
  namespace Express {
    export interface Request {
      User: IPayload;
    }
  }
}

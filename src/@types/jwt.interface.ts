import mongoose from "mongoose";

export enum Role {
  user = "user",
  admin = "admin",
}

export interface IUserPayload {
  _id: mongoose.Types.ObjectId;  
  registrationNumber: string;    
  phoneNumber: string;           
  role: Role;                   
}

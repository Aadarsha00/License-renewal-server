const DB_URL = process.env.DB_URL || "";
import mongoose from "mongoose";

export const connectDatabase = () => {
  mongoose
    .connect(DB_URL)
    .then(() => {
      console.log("Database Connected");
    })
    .catch((err: any) => {
      console.log("Error", err);
    });
};

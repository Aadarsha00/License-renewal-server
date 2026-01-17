import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectDatabase } from "./config/dbConnect";
import { CustomError } from "./middleware/errorhandler.middleware";
import userRoutes from "./routes/user.routes";
import certificateRoutes from "./routes/certificate.routes";
import renewalRoutes from "./routes/renewal.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();
const PORT = process.env.PORT || 8000;

//db connection
connectDatabase();

//middlewares
app.use(
  cors({
    origin: "*", 
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

//routes
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Server is up and running",
  });
});

//routes auth
app.use("/api/user", userRoutes);

//routes certificate
app.use("/api/certificate", certificateRoutes);

//routes renewal
app.use("/api/renewal", renewalRoutes);

//routes admin
app.use("/api/admin", adminRoutes);

//handle unhandled routes
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(
    new CustomError(`Cannot ${req.method} on ${req.originalUrl}`, 404)
  );
});

//global error handler
app.use(
  (
    error: any,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    const statusCode = error.statusCode || 500;

    res.status(statusCode).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
);

//server 
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
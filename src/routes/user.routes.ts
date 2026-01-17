import express from "express";
import { userRegister, userLogin, userLogout } from "../controller/user.controller";
const router = express.Router();
// Register User
router.post("/register", userRegister);

// Login User
router.post("/login", userLogin);

// Logout User
router.post("/logout", userLogout);
export default router;
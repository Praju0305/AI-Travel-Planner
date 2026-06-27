import express from "express";
import {
  register,
  login,
  getMe,
  updateMe,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import {
  registerValidation,
  loginValidation,
  validate,
} from "../middleware/validators.js";

const router = express.Router();

router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);

router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);

export default router;

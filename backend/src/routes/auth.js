import express from "express";
import {
  register,
  login,
  getMe,
  updateMe,
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import {
  registerValidation,
  loginValidation,
  validate,
} from "../middlewares/validation.middleware.js";

const router = express.Router();

router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);

router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);

export default router;

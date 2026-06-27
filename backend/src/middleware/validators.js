import { body, validationResult } from "express-validator";

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  next();
};

export const registerValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be 2-50 characters"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

export const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

export const tripValidation = [
  body("destination")
    .trim()
    .notEmpty()
    .withMessage("Destination is required"),

  body("numberOfDays")
    .isInt({ min: 1, max: 30 })
    .withMessage("Number of days must be between 1 and 30"),

  body("budgetType")
    .isIn(["low", "medium", "high"])
    .withMessage("Budget type must be low, medium, or high"),

  body("interests")
    .isArray({ min: 1 })
    .withMessage("At least one interest is required"),
];
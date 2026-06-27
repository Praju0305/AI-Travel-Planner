import express from "express";
import {
  getTrips,
  getTrip,
  createTrip,
  generateTrip,
  regenerateDay,
  addActivity,
  removeActivity,
  chatAssistant,
  getWeatherAdvice,
  updateTrip,
  deleteTrip,
} from "../controllers/trip.controller.js";

import { protect } from "../middlewares/auth.middleware.js";

import {
  tripValidation,
  validate,
} from "../middlewares/validation.middleware.js";

const router = express.Router();

// All routes are protected
router.use(protect);

// Trip CRUD
router.get("/", getTrips);
router.post("/", tripValidation, validate, createTrip);
router.get("/:id", getTrip);
router.put("/:id", updateTrip);
router.delete("/:id", deleteTrip);

// AI itinerary generation
router.post("/:id/generate", generateTrip);

// Day management
router.put("/:id/days/:dayNumber/regenerate", regenerateDay);
router.post("/:id/days/:dayNumber/activities", addActivity);
router.delete(
  "/:id/days/:dayNumber/activities/:activityId",
  removeActivity
);

// AI chat assistant
router.post("/:id/chat", chatAssistant);

// Weather advice
router.post("/:id/weather", getWeatherAdvice);

export default router;
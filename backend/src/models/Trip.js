import mongoose from "mongoose";

const { Schema, model } = mongoose;

const activitySchema = new Schema({
  time: { type: String, default: "" },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  location: { type: String, default: "" },
  duration: { type: String, default: "" },
  cost: { type: String, default: "" },
  type: {
    type: String,
    enum: [
      "food",
      "culture",
      "adventure",
      "shopping",
      "transport",
      "accommodation",
      "other",
    ],
    default: "other",
  },
});

const dayPlanSchema = new Schema({
  day: { type: Number, required: true },
  date: { type: String, default: "" },
  theme: { type: String, default: "" },
  activities: [activitySchema],
  notes: { type: String, default: "" },
});

const budgetSchema = new Schema({
  flights: { type: Number, default: 0 },
  accommodation: { type: Number, default: 0 },
  food: { type: Number, default: 0 },
  activities: { type: Number, default: 0 },
  transport: { type: Number, default: 0 },
  miscellaneous: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  currency: { type: String, default: "USD" },
  notes: { type: String, default: "" },
});

const hotelSchema = new Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ["budget", "mid-range", "luxury"],
    default: "mid-range",
  },
  pricePerNight: { type: String, default: "" },
  rating: { type: Number, default: 0 },
  highlights: [String],
  location: { type: String, default: "" },
});

const dayWeatherSchema = new Schema({
  day: Number,
  condition: { type: String, default: "" },
  tempHigh: { type: String, default: "" },
  tempLow: { type: String, default: "" },
  humidity: { type: String, default: "" },
  precipitation: { type: String, default: "" },
  uvIndex: { type: String, default: "" },
  wind: { type: String, default: "" },
  advice: { type: String, default: "" },
  packingTips: [String],
  activityImpact: { type: String, default: "" },
});

const weatherAdviceSchema = new Schema({
  destination: { type: String, default: "" },
  travelMonth: { type: String, default: "" },
  overview: { type: String, default: "" },
  generalPackingList: [String],
  clothingRecommendations: [String],
  healthTips: [String],
  bestTimeOfDay: { type: String, default: "" },
  days: [dayWeatherSchema],
});

// Chat History Schema
const chatMessageSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const tripSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: [true, "Trip title is required"],
      trim: true,
    },

    destination: {
      type: String,
      required: [true, "Destination is required"],
      trim: true,
    },

    numberOfDays: {
      type: Number,
      required: [true, "Number of days is required"],
      min: [1, "Trip must be at least 1 day"],
      max: [30, "Trip cannot exceed 30 days"],
    },

    startDate: {
      type: Date,
    },

    budgetType: {
      type: String,
      enum: ["low", "medium", "high"],
      required: [true, "Budget type is required"],
    },

    interests: {
      type: [String],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one interest is required",
      },
    },

    travelStyle: {
      type: String,
      enum: ["solo", "couple", "family", "group"],
      default: "solo",
    },

    itinerary: [dayPlanSchema],

    budget: budgetSchema,

    hotels: [hotelSchema],

    chatHistory: [chatMessageSchema],

    weatherAdvice: weatherAdviceSchema,

    status: {
      type: String,
      enum: ["draft", "planning", "confirmed", "completed"],
      default: "planning",
    },

    isGenerated: {
      type: Boolean,
      default: false,
    },

    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

tripSchema.index({ user: 1, createdAt: -1 });

export default model("Trip", tripSchema);

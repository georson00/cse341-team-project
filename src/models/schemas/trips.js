//src/models/schemas/trips.js
import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
  {
    // Human-readable ID used in URLs, e.g. "alpine-panorama".
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    region: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    // Station IDs (see the stations collection).
    startStation: {
      type: String,
      required: true,
      trim: true,
    },
    endStation: {
      type: String,
      required: true,
      trim: true,
    },
    // Stored as display text, e.g. "4.5 hours".
    duration: {
      type: String,
      required: true,
      trim: true,
    },
    // Distance in kilometers; also used to price tickets.
    distance: {
      type: Number,
      required: true,
      min: 0,
    },
    highlights: {
      type: [String],
      default: [],
    },
    bestSeason: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      enum: ["spring", "summer", "autumn", "winter"],
    },
    // Month numbers (1 = January ... 12 = December).
    operatingMonths: {
      type: [{ type: Number, min: 1, max: 12 }],
      default: [],
    },
    imageUrl: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Model "Trip" maps to the existing "trips" collection.
const trip = mongoose.model("Trip", tripSchema);

export default trip;

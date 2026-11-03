import mongoose, { Schema } from "mongoose";

const telemetryPointSchema = new Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    speed: { type: Number, required: true },
    heading: { type: Number, required: true },
    status: {
      type: String,
      enum: ["moving", "idle"],
      required: true,
    },
    timestamp: { type: Date, required: true },
    insideGeofence: { type: Boolean, required: true },
  },
  { _id: false },
);

const telemetryBucketSchema = new Schema(
  {
    vehicleId: { type: String, required: true },
    bucketStart: { type: Date, required: true },
    points: {
      type: [telemetryPointSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "telemetry_buckets",
  },
);

telemetryBucketSchema.index(
  { vehicleId: 1, bucketStart: 1 },
  { unique: true },
);

export const TelemetryBucket = mongoose.model(
  "TelemetryBucket",
  telemetryBucketSchema,
);
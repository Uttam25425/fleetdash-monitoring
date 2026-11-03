import mongoose from "mongoose";

export async function connectDatabase(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.info("[FleetDash] MONGODB_URI not provided — using resilient in-memory storage");
    return;
  }

  try {
    mongoose.set("bufferCommands", false);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log("MongoDB Atlas connected");
  } catch (err) {
    console.warn(
      "[FleetDash] MongoDB connection failed — falling back to in-memory storage:",
      err instanceof Error ? err.message : err
    );
  }
}
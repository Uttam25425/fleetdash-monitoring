import mongoose from "mongoose";
import { TelemetryBucket } from "../models/TelemetryBucket.ts";
import type { VehicleTelemetry } from "../types/telemetry.ts";

export interface InMemoryBucket {
  vehicleId: string;
  bucketStart: Date;
  points: {
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    status: "moving" | "idle";
    timestamp: Date;
    insideGeofence: boolean;
  }[];
}

export const inMemoryBuckets = new Map<string, InMemoryBucket>();

function getHourBucketStart(timestamp: string): Date {
  const bucketStart = new Date(timestamp);
  bucketStart.setUTCMinutes(0, 0, 0);
  return bucketStart;
}

export async function saveTelemetryBatch(
  telemetryBatch: VehicleTelemetry[],
): Promise<void> {
  // Always update in-memory cache for ultra-fast, offline-capable responses
  for (const vehicle of telemetryBatch) {
    const bucketStart = getHourBucketStart(vehicle.timestamp);
    const key = `${vehicle.vehicleId}:${bucketStart.toISOString()}`;
    let bucket = inMemoryBuckets.get(key);
    if (!bucket) {
      bucket = {
        vehicleId: vehicle.vehicleId,
        bucketStart,
        points: [],
      };
      inMemoryBuckets.set(key, bucket);
    }
    bucket.points.push({
      latitude: vehicle.latitude,
      longitude: vehicle.longitude,
      speed: vehicle.speed,
      heading: vehicle.heading,
      status: vehicle.status,
      timestamp: new Date(vehicle.timestamp),
      insideGeofence: vehicle.insideGeofence,
    });
    if (bucket.points.length > 100) {
      bucket.points.shift();
    }
  }

  // If MongoDB is connected, persist to collection
  if (mongoose.connection.readyState === 1) {
    try {
      const operations = telemetryBatch.map((vehicle) => {
        const bucketStart = getHourBucketStart(vehicle.timestamp);

        return {
          updateOne: {
            filter: {
              vehicleId: vehicle.vehicleId,
              bucketStart,
            },
            update: {
              $setOnInsert: {
                vehicleId: vehicle.vehicleId,
                bucketStart,
              },
              $push: {
                points: {
                  latitude: vehicle.latitude,
                  longitude: vehicle.longitude,
                  speed: vehicle.speed,
                  heading: vehicle.heading,
                  status: vehicle.status,
                  timestamp: new Date(vehicle.timestamp),
                  insideGeofence: vehicle.insideGeofence,
                },
              },
            },
            upsert: true,
          },
        };
      });

      const typedOperations =
        operations as unknown as Parameters<
          typeof TelemetryBucket.collection.bulkWrite
        >[0];

      await TelemetryBucket.collection.bulkWrite(typedOperations, {
        ordered: false,
      });
    } catch (error: unknown) {
      console.warn(
        "[FleetDash] MongoDB bulkWrite error (in-memory storage maintained):",
        error instanceof Error ? error.message : error
      );
    }
  }
}
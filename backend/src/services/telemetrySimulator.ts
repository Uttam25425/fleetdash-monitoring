import type { VehicleTelemetry } from "../types/telemetry.ts";
import { isInsideGeofence } from "./geofence.ts";

interface VehicleBounds {
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
}

interface SimulatedVehicle {
  id: string;
  latitude: number;
  longitude: number;
  heading: number;
  bounds: VehicleBounds;
}

const INSIDE_BOUNDS: VehicleBounds = {
  minLatitude: 20.287,
  maxLatitude: 20.305,
  minLongitude: 85.8255,
  maxLongitude: 85.8435,
};

const vehicles: SimulatedVehicle[] = [
  {
    id: "VH-001",
    latitude: 20.296,
    longitude: 85.834,
    heading: 45,
    bounds: INSIDE_BOUNDS,
  },
  {
    id: "VH-002",
    latitude: 20.29,
    longitude: 85.829,
    heading: 90,
    bounds: INSIDE_BOUNDS,
  },
  {
    id: "VH-003",
    latitude: 20.302,
    longitude: 85.84,
    heading: 135,
    bounds: INSIDE_BOUNDS,
  },
  {
    id: "VH-004",
    latitude: 20.299,
    longitude: 85.832,
    heading: 180,
    bounds: INSIDE_BOUNDS,
  },
  {
    id: "VH-005",
    latitude: 20.293,
    longitude: 85.839,
    heading: 225,
    bounds: INSIDE_BOUNDS,
  },
  {
    id: "VH-006",
    latitude: 20.304,
    longitude: 85.827,
    heading: 270,
    bounds: INSIDE_BOUNDS,
  },

  // Outside—south
  {
    id: "VH-007",
    latitude: 20.281,
    longitude: 85.834,
    heading: 20,
    bounds: {
      minLatitude: 20.278,
      maxLatitude: 20.284,
      minLongitude: 85.828,
      maxLongitude: 85.84,
    },
  },

  // Outside—north
  {
    id: "VH-008",
    latitude: 20.311,
    longitude: 85.835,
    heading: 160,
    bounds: {
      minLatitude: 20.308,
      maxLatitude: 20.314,
      minLongitude: 85.828,
      maxLongitude: 85.84,
    },
  },

  // Outside—west
  {
    id: "VH-009",
    latitude: 20.296,
    longitude: 85.819,
    heading: 280,
    bounds: {
      minLatitude: 20.289,
      maxLatitude: 20.303,
      minLongitude: 85.816,
      maxLongitude: 85.822,
    },
  },

  // Outside—east
  {
    id: "VH-010",
    latitude: 20.296,
    longitude: 85.85,
    heading: 340,
    bounds: {
      minLatitude: 20.289,
      maxLatitude: 20.303,
      minLongitude: 85.847,
      maxLongitude: 85.853,
    },
  },
];

function randomBetween(minimum: number, maximum: number): number {
  return Math.random() * (maximum - minimum) + minimum;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function generateTelemetryBatch(): VehicleTelemetry[] {
  return vehicles.map((vehicle) => {
    const moving = Math.random() > 0.2;
    const speed = moving ? Math.round(randomBetween(25, 70)) : 0;
    const distance = moving ? randomBetween(0.00001, 0.00004) : 0;

    vehicle.heading =
      (vehicle.heading + randomBetween(-15, 15) + 360) % 360;

    const angle = (vehicle.heading * Math.PI) / 180;

    vehicle.latitude = clamp(
      vehicle.latitude + Math.cos(angle) * distance,
      vehicle.bounds.minLatitude,
      vehicle.bounds.maxLatitude,
    );

    vehicle.longitude = clamp(
      vehicle.longitude + Math.sin(angle) * distance,
      vehicle.bounds.minLongitude,
      vehicle.bounds.maxLongitude,
    );

    const latitude = Number(vehicle.latitude.toFixed(6));
    const longitude = Number(vehicle.longitude.toFixed(6));

    return {
      vehicleId: vehicle.id,
      latitude,
      longitude,
      speed,
      heading: Math.round(vehicle.heading) % 360,
      status: moving ? "moving" : "idle",
      timestamp: new Date().toISOString(),
      insideGeofence: isInsideGeofence(latitude, longitude),
    };
  });
}
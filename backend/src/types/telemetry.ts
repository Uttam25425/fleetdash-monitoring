export interface VehicleTelemetry {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  status: "moving" | "idle";
  timestamp: string;
  insideGeofence: boolean;
}
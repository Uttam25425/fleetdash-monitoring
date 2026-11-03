import type { VehicleTelemetry } from "../types/telemetry.ts";

function isVehicleTelemetry(
  value: unknown,
): value is VehicleTelemetry {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const telemetry = value as Record<string, unknown>;

  const validVehicleId =
    typeof telemetry.vehicleId === "string" &&
    /^VH-\d{3}$/.test(telemetry.vehicleId);

  const validLatitude =
    typeof telemetry.latitude === "number" &&
    Number.isFinite(telemetry.latitude) &&
    telemetry.latitude >= -90 &&
    telemetry.latitude <= 90;

  const validLongitude =
    typeof telemetry.longitude === "number" &&
    Number.isFinite(telemetry.longitude) &&
    telemetry.longitude >= -180 &&
    telemetry.longitude <= 180;

  const validSpeed =
    typeof telemetry.speed === "number" &&
    Number.isFinite(telemetry.speed) &&
    telemetry.speed >= 0 &&
    telemetry.speed <= 250;

  const validHeading =
    typeof telemetry.heading === "number" &&
    Number.isFinite(telemetry.heading) &&
    telemetry.heading >= 0 &&
    telemetry.heading < 360;

  const validStatus =
    telemetry.status === "moving" ||
    telemetry.status === "idle";

  const validTimestamp =
    typeof telemetry.timestamp === "string" &&
    !Number.isNaN(Date.parse(telemetry.timestamp));

  return (
    validVehicleId &&
    validLatitude &&
    validLongitude &&
    validSpeed &&
    validHeading &&
    validStatus &&
    validTimestamp
  );
}

export function isValidTelemetryBatch(
  value: unknown,
): value is VehicleTelemetry[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(isVehicleTelemetry)
  );
}
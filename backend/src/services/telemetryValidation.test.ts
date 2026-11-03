import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidTelemetryBatch } from "./telemetryValidation.ts";

const validTelemetry = {
  vehicleId: "VH-001",
  latitude: 20.2961,
  longitude: 85.8245,
  speed: 60,
  heading: 180,
  status: "moving",
  timestamp: new Date().toISOString(),
} as const;

test("accepts a valid telemetry batch", () => {
  assert.equal(
    isValidTelemetryBatch([validTelemetry]),
    true,
  );
});

test("rejects an empty telemetry batch", () => {
  assert.equal(isValidTelemetryBatch([]), false);
});

test("rejects telemetry with invalid speed", () => {
  const invalidTelemetry = {
    ...validTelemetry,
    speed: 300,
  };

  assert.equal(
    isValidTelemetryBatch([invalidTelemetry]),
    false,
  );
});

test("rejects telemetry with invalid vehicle ID", () => {
  const invalidTelemetry = {
    ...validTelemetry,
    vehicleId: "CAR-001",
  };

  assert.equal(
    isValidTelemetryBatch([invalidTelemetry]),
    false,
  );
});
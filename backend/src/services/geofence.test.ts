import test from "node:test";
import assert from "node:assert/strict";

import { isInsideGeofence } from "./geofence.ts";
import type { RectangularGeofence } from "./geofence.ts";

const geofence: RectangularGeofence = {
  minLatitude: 20.28,
  maxLatitude: 20.31,
  minLongitude: 85.82,
  maxLongitude: 85.85,
};

test("accepts a point inside the rectangular geofence", () => {
  assert.equal(
    isInsideGeofence(20.2961, 85.8345, geofence),
    true,
  );
});

test("accepts a point on the rectangular boundary", () => {
  assert.equal(
    isInsideGeofence(20.31, 85.85, geofence),
    true,
  );
});

test("rejects a point outside the rectangular geofence", () => {
  assert.equal(
    isInsideGeofence(20.32, 85.87, geofence),
    false,
  );
});

test("rejects an invalid rectangular geofence", () => {
  const invalidGeofence: RectangularGeofence = {
    ...geofence,
    minLatitude: 20.32,
    maxLatitude: 20.31,
  };

  assert.equal(
    isInsideGeofence(20.2961, 85.8345, invalidGeofence),
    false,
  );
});
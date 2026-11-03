export interface RectangularGeofence {
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
}

export const OPERATIONAL_GEOFENCE: RectangularGeofence = {
  minLatitude: 20.2861,
  maxLatitude: 20.3061,
  minLongitude: 85.8245,
  maxLongitude: 85.8445,
};

export function isInsideGeofence(
  latitude: number,
  longitude: number,
  geofence: RectangularGeofence = OPERATIONAL_GEOFENCE,
): boolean {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    !Number.isFinite(geofence.minLatitude) ||
    !Number.isFinite(geofence.maxLatitude) ||
    !Number.isFinite(geofence.minLongitude) ||
    !Number.isFinite(geofence.maxLongitude)
  ) {
    return false;
  }

  return (
    latitude >= geofence.minLatitude &&
    latitude <= geofence.maxLatitude &&
    longitude >= geofence.minLongitude &&
    longitude <= geofence.maxLongitude
  );
}
export interface VehicleTelemetry {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  status: 'moving' | 'idle';
  timestamp: string;
  insideGeofence: boolean;
}

export interface AlertItem {
  id: string;
  type: 'geofence_breach' | 'overspeed' | 'idle_extended';
  vehicleId: string;
  message: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  acknowledged: boolean;
}

export interface GeofenceConfig {
  id: string;
  name: string;
  description: string;
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
  color: string;
}

export type MapLayer = 'blueprint' | 'tactical' | 'radar';
export type NavigationTab = 'overview' | 'map' | 'vehicles' | 'geofences' | 'alerts' | 'analytics';
export type VehicleFilter = 'all' | 'moving' | 'idle' | 'breached';

export interface VehicleSpeedHistory {
  timestamp: string;
  speed: number;
}

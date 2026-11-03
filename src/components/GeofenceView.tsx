import React, { useState } from 'react';
import type { VehicleTelemetry } from '../types/fleet';
import { ShieldCheck, ShieldAlert, MapPin, CheckCircle2, AlertTriangle, Compass } from 'lucide-react';

interface GeofenceViewProps {
  vehicles: VehicleTelemetry[];
  onSelectVehicle: (vehicleId: string) => void;
  onFocusOnMap: (vehicleId: string) => void;
}

const OPERATIONAL_ZONE = {
  name: 'Bhubaneswar Central Ops Perimeter (Zone-01)',
  minLatitude: 20.2861,
  maxLatitude: 20.3061,
  minLongitude: 85.8245,
  maxLongitude: 85.8445,
};

export const GeofenceView: React.FC<GeofenceViewProps> = ({
  vehicles,
  onSelectVehicle,
  onFocusOnMap,
}) => {
  // Test coordinate tester
  const [testLat, setTestLat] = useState('20.2950');
  const [testLng, setTestLng] = useState('85.8340');
  const [testResult, setTestResult] = useState<boolean | null>(null);

  const insideVehicles = vehicles.filter((v) => v.insideGeofence);
  const breachedVehicles = vehicles.filter((v) => !v.insideGeofence);

  const handleTestCoordinate = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(testLat);
    const lng = parseFloat(testLng);
    if (isNaN(lat) || isNaN(lng)) return;

    const isInside =
      lat >= OPERATIONAL_ZONE.minLatitude &&
      lat <= OPERATIONAL_ZONE.maxLatitude &&
      lng >= OPERATIONAL_ZONE.minLongitude &&
      lng <= OPERATIONAL_ZONE.maxLongitude;

    setTestResult(isInside);
  };

  const getBreachDirection = (lat: number, lng: number) => {
    if (lat > OPERATIONAL_ZONE.maxLatitude) return 'North Perimeter Exit';
    if (lat < OPERATIONAL_ZONE.minLatitude) return 'South Perimeter Exit';
    if (lng > OPERATIONAL_ZONE.maxLongitude) return 'East Perimeter Exit';
    if (lng < OPERATIONAL_ZONE.minLongitude) return 'West Perimeter Exit';
    return 'Outside Buffer';
  };

  return (
    <div className="space-y-6">
      {/* Geofence Info Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Boundary Specs */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 md:col-span-2">
          <div className="flex items-center gap-2 mb-2 text-sky-400 font-mono text-xs">
            <ShieldCheck className="w-4 h-4" />
            ACTIVE GEOFENCE DEFINITION
          </div>
          <h3 className="text-lg font-bold text-white mb-2">{OPERATIONAL_ZONE.name}</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Authorized operating corridor covering Bhubaneswar industrial core and central delivery district.
            Any vehicle exiting these bounding coordinates triggers immediate dispatch alerts.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60">
              <span className="text-[10px] text-slate-500 block">NORTH BOUND (MAX LAT)</span>
              <span className="text-slate-200 font-bold tabular-nums">{OPERATIONAL_ZONE.maxLatitude.toFixed(4)}° N</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60">
              <span className="text-[10px] text-slate-500 block">SOUTH BOUND (MIN LAT)</span>
              <span className="text-slate-200 font-bold tabular-nums">{OPERATIONAL_ZONE.minLatitude.toFixed(4)}° N</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60">
              <span className="text-[10px] text-slate-500 block">EAST BOUND (MAX LNG)</span>
              <span className="text-slate-200 font-bold tabular-nums">{OPERATIONAL_ZONE.maxLongitude.toFixed(4)}° E</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60">
              <span className="text-[10px] text-slate-500 block">WEST BOUND (MIN LNG)</span>
              <span className="text-slate-200 font-bold tabular-nums">{OPERATIONAL_ZONE.minLongitude.toFixed(4)}° E</span>
            </div>
          </div>
        </div>

        {/* Card 2: Live Status */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <div>
            <span className="text-xs font-mono text-slate-400 block mb-1">COMPLIANCE BREAKDOWN</span>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-bold font-mono tabular-nums text-white">
                {insideVehicles.length}
              </span>
              <span className="text-xs text-slate-400">/ {vehicles.length} Units Inside</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-teal-400">
                <span>Inside Boundary:</span>
                <span className="font-bold">{insideVehicles.length} units</span>
              </div>
              <div className="flex justify-between items-center text-rose-400">
                <span>Active Breaches:</span>
                <span className="font-bold">{breachedVehicles.length} units</span>
              </div>
            </div>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-4">
            <div
              className="bg-teal-500 h-full rounded-full"
              style={{
                width: `${vehicles.length > 0 ? (insideVehicles.length / vehicles.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Active Breach Units Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h4 className="text-sm font-bold text-white font-mono">
              Active Geofence Breaches ({breachedVehicles.length})
            </h4>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Real-time perimeter monitoring
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Vehicle Unit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Current Velocity</th>
                <th className="py-3 px-4">Exit Sector</th>
                <th className="py-3 px-4">Coordinates</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-[12px]">
              {breachedVehicles.map((v) => (
                <tr key={v.vehicleId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-rose-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    {v.vehicleId}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-slate-300 capitalize">{v.status}</span>
                  </td>
                  <td className="py-3 px-4 tabular-nums text-slate-200">
                    {v.speed} km/h
                  </td>
                  <td className="py-3 px-4 text-amber-400">
                    {getBreachDirection(v.latitude, v.longitude)}
                  </td>
                  <td className="py-3 px-4 text-slate-400 tabular-nums">
                    {v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2 font-sans">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectVehicle(v.vehicleId);
                          onFocusOnMap(v.vehicleId);
                        }}
                        className="px-2.5 py-1 rounded bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 text-xs font-medium transition-colors"
                      >
                        Track on Map
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {breachedVehicles.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-teal-400 font-sans">
                    ✓ All fleet vehicles are currently operating within authorized geofence boundaries.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Coordinate Perimeter Tester */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60">
        <h4 className="text-sm font-bold text-white font-mono mb-2 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-sky-400" />
          Interactive Geofence Boundary Tester
        </h4>
        <p className="text-xs text-slate-400 mb-4">
          Test any latitude and longitude coordinates against the active operational boundary to verify compliance.
        </p>

        <form onSubmit={handleTestCoordinate} className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-mono text-slate-400">Lat:</label>
            <input
              type="text"
              value={testLat}
              onChange={(e) => setTestLat(e.target.value)}
              className="w-28 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              placeholder="20.2950"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-mono text-slate-400">Lng:</label>
            <input
              type="text"
              value={testLng}
              onChange={(e) => setTestLng(e.target.value)}
              className="w-28 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              placeholder="85.8340"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition-colors font-mono"
          >
            Verify Location
          </button>

          {testResult !== null && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium ${
                testResult
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              {testResult ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  INSIDE ZONE-01
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  OUTSIDE ZONE-01
                </>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

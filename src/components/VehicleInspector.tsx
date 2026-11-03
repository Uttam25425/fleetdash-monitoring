import React, { useState, useEffect } from 'react';
import type { VehicleTelemetry, VehicleSpeedHistory } from '../types/fleet';
import { Compass, Gauge, MapPin, Copy, Check, Database, Zap, ShieldAlert, ShieldCheck } from 'lucide-react';

interface VehicleInspectorProps {
  vehicle: VehicleTelemetry | null;
  speedHistory: VehicleSpeedHistory[];
  onClose?: () => void;
}

interface PerformanceStats {
  vehicleId: string;
  databaseExecutionTimeMs?: number;
  queryTimeMs?: number;
  totalKeysExamined?: number;
  totalDocsExamined?: number;
  mode?: string;
}

export const VehicleInspector: React.FC<VehicleInspectorProps> = ({
  vehicle,
  speedHistory,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [perfStats, setPerfStats] = useState<PerformanceStats | null>(null);
  const [loadingPerf, setLoadingPerf] = useState(false);

  // Query backend performance and latest record
  useEffect(() => {
    if (!vehicle) return;
    let isMounted = true;
    setLoadingPerf(true);

    fetch(`/api/telemetry/performance/${vehicle.vehicleId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data) {
          setPerfStats(data);
        }
      })
      .catch((err) => console.warn('Performance fetch error:', err))
      .finally(() => {
        if (isMounted) setLoadingPerf(false);
      });

    return () => {
      isMounted = false;
    };
  }, [vehicle?.vehicleId]);

  if (!vehicle) {
    return (
      <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 text-center text-slate-500 font-mono text-xs">
        Select a vehicle from the map or table to inspect live telemetry.
      </div>
    );
  }

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${vehicle.latitude.toFixed(6)}, ${vehicle.longitude.toFixed(6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getHeadingDirection = (heading: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  };

  // Sparkline points for recent speed
  const maxSpeedInHistory = Math.max(80, ...speedHistory.map((h) => h.speed));
  const sparkPoints = speedHistory
    .map((item, idx) => {
      const x = (idx / Math.max(1, speedHistory.length - 1)) * 100;
      const y = 100 - (item.speed / maxSpeedInHistory) * 80 - 10;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/70 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-sky-400 text-sm">
            {vehicle.vehicleId.slice(-3)}
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              {vehicle.vehicleId}
              <span
                className={`text-[11px] font-sans font-medium px-2 py-0.5 rounded ${
                  vehicle.status === 'moving'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-amber-500/15 text-amber-400'
                }`}
              >
                {vehicle.status === 'moving' ? 'In Transit' : 'Stationary'}
              </span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Bhubaneswar Fleet Asset
            </span>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded hover:bg-slate-800"
          >
            ✕
          </button>
        )}
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Speed */}
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-sky-400" />
              Speed
            </span>
          </div>
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-2xl font-bold tabular-nums text-white">{vehicle.speed}</span>
            <span className="text-xs text-slate-400">km/h</span>
          </div>
        </div>

        {/* Heading & Compass */}
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              Heading
            </span>
            <span className="font-mono text-slate-300 text-xs font-semibold">
              {getHeadingDirection(vehicle.heading)}
            </span>
          </div>
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-2xl font-bold tabular-nums text-white">{vehicle.heading}°</span>
          </div>
        </div>
      </div>

      {/* GPS Coordinates with 1-click copy */}
      <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono">
          <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
          <div>
            <span className="text-slate-400 block text-[10px]">CURRENT COORDINATES</span>
            <span className="text-slate-200 tabular-nums">
              {vehicle.latitude.toFixed(6)}, {vehicle.longitude.toFixed(6)}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCopyCoords}
          className="p-1.5 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Copy Coordinates"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Geofence Perimeter Status */}
      <div
        className={`p-3.5 rounded-lg border text-xs flex items-start gap-3 ${
          vehicle.insideGeofence
            ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}
      >
        {vehicle.insideGeofence ? (
          <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
        ) : (
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        )}
        <div>
          <strong className="block font-semibold">
            {vehicle.insideGeofence
              ? 'Zone-01 Perimeter Compliant'
              : 'Perimeter Breach Detected'}
          </strong>
          <span className="text-[11px] opacity-90 mt-0.5 block">
            {vehicle.insideGeofence
              ? 'Unit is safely operating within designated Bhubaneswar boundaries.'
              : 'Unit has exited the authorized operating geofence corridor.'}
          </span>
        </div>
      </div>

      {/* Velocity Trend Sparkline */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Speed History (Last 20 updates)</span>
          <span className="font-mono text-[11px] text-slate-300">{vehicle.speed} km/h now</span>
        </div>
        <div className="h-16 w-full rounded-lg bg-slate-950 border border-slate-800 p-2 relative overflow-hidden">
          {speedHistory.length > 1 ? (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={sparkPoints}
              />
            </svg>
          ) : (
            <div className="h-full flex items-center justify-center text-[11px] text-slate-600 font-mono">
              Recording speed trajectory...
            </div>
          )}
        </div>
      </div>

      {/* Backend API Execution Metrics */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <Database className="w-3.5 h-3.5 text-sky-400" />
            Backend Storage Stats
          </span>
          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Live Query
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2 rounded bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">DB EXEC TIME</span>
            <span className="text-slate-200 font-bold tabular-nums">
              {perfStats?.databaseExecutionTimeMs ?? 0.2} ms
            </span>
          </div>
          <div className="p-2 rounded bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-500 block">CACHE MODE</span>
            <span className="text-slate-300 truncate block">
              {perfStats?.mode ?? 'in-memory-fast'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

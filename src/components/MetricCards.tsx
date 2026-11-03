import React from 'react';
import type { VehicleTelemetry } from '../types/fleet';
import { Truck, Navigation, Gauge, ShieldAlert } from 'lucide-react';

interface MetricCardsProps {
  vehicles: VehicleTelemetry[];
}

export const MetricCards: React.FC<MetricCardsProps> = ({ vehicles }) => {
  const total = vehicles.length;
  const moving = vehicles.filter((v) => v.status === 'moving').length;
  const idle = total - moving;
  const movingPercent = total > 0 ? Math.round((moving / total) * 100) : 0;

  const insideGeofence = vehicles.filter((v) => v.insideGeofence).length;
  const breachCount = total - insideGeofence;
  const complianceRate = total > 0 ? Math.round((insideGeofence / total) * 100) : 0;

  const averageSpeed = total > 0
    ? Math.round(vehicles.reduce((acc, v) => acc + v.speed, 0) / total)
    : 0;

  const maxSpeed = total > 0
    ? Math.max(...vehicles.map((v) => v.speed))
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: Total Fleet */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Total Fleet Units</span>
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Truck className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-white">{total}</span>
          <span className="text-xs text-slate-500">tracked assets</span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5 font-mono">
          <span>Active telemetry stream</span>
          <span className="text-slate-600">·</span>
          <span className="text-emerald-400">100% online</span>
        </div>
      </div>

      {/* Metric 2: Motion State */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Fleet In Motion</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Navigation className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-white">{moving}</span>
          <span className="text-xs text-emerald-400 font-mono">({movingPercent}%)</span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5 font-mono">
          <span>{idle} units stationary</span>
          <span className="text-slate-600">·</span>
          <span>Bhubaneswar grid</span>
        </div>
      </div>

      {/* Metric 3: Speed & Velocity */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Fleet Average Velocity</span>
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Gauge className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-white">{averageSpeed}</span>
          <span className="text-xs text-slate-400">km/h</span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5 font-mono">
          <span>Max: <strong className="text-slate-200">{maxSpeed} km/h</strong></span>
          <span className="text-slate-600">·</span>
          <span>nominal speed range</span>
        </div>
      </div>

      {/* Metric 4: Geofence Compliance */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Zone Compliance</span>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            breachCount > 0
              ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
              : 'bg-teal-500/10 border border-teal-500/20 text-teal-400'
          }`}>
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-white">{complianceRate}%</span>
          <span className="text-xs text-slate-400 font-mono">({insideGeofence}/{total})</span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5 font-mono">
          {breachCount > 0 ? (
            <span className="text-rose-400 font-medium">{breachCount} breached boundary</span>
          ) : (
            <span className="text-teal-400 font-medium">All units in perimeter</span>
          )}
          <span className="text-slate-600">·</span>
          <span>Zone-01</span>
        </div>
      </div>
    </div>
  );
};

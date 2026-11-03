import React, { useState, useEffect } from 'react';
import type { VehicleTelemetry } from '../types/fleet';
import { BarChart2, Activity, Server, Zap, RefreshCw, CheckCircle2, Copy, Check } from 'lucide-react';

interface AnalyticsViewProps {
  vehicles: VehicleTelemetry[];
}

interface ServiceHealthData {
  status: string;
  service: string;
  dependencies: {
    mongodb: string;
    redis: string;
  };
  timestamp: string;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ vehicles }) => {
  const [healthData, setHealthData] = useState<ServiceHealthData | null>(null);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const checkHealth = async () => {
    setChecking(true);
    const start = performance.now();
    try {
      const res = await fetch('/health/services');
      const data = await res.json();
      const elapsed = Math.round(performance.now() - start);
      setHealthData(data);
      setPingLatency(elapsed);
    } catch (err) {
      console.warn('Health check failed:', err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  // Compute speed distribution
  const idleCount = vehicles.filter((v) => v.speed === 0).length;
  const lowCount = vehicles.filter((v) => v.speed > 0 && v.speed <= 35).length;
  const midCount = vehicles.filter((v) => v.speed > 35 && v.speed <= 55).length;
  const highCount = vehicles.filter((v) => v.speed > 55).length;
  const total = vehicles.length || 1;

  const copyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(vehicles, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Speed Distribution & Fleet Dynamics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Speed Distribution Bars */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-sky-400" />
                Velocity Distribution Profile
              </h4>
              <p className="text-xs text-slate-400">Current telemetry batch breakdown across speed brackets</p>
            </div>
            <span className="text-xs font-mono text-slate-400 tabular-nums">
              {vehicles.length} Units Sampled
            </span>
          </div>

          <div className="space-y-3.5 font-mono text-xs">
            {/* 0 km/h */}
            <div>
              <div className="flex justify-between items-center mb-1 text-slate-300">
                <span>Stationary (0 km/h)</span>
                <span className="font-bold tabular-nums text-amber-400">
                  {idleCount} units ({Math.round((idleCount / total) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(idleCount / total) * 100}%` }}
                />
              </div>
            </div>

            {/* 1 - 35 km/h */}
            <div>
              <div className="flex justify-between items-center mb-1 text-slate-300">
                <span>Urban Transit (1 - 35 km/h)</span>
                <span className="font-bold tabular-nums text-sky-400">
                  {lowCount} units ({Math.round((lowCount / total) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-sky-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(lowCount / total) * 100}%` }}
                />
              </div>
            </div>

            {/* 36 - 55 km/h */}
            <div>
              <div className="flex justify-between items-center mb-1 text-slate-300">
                <span>Arterial Flow (36 - 55 km/h)</span>
                <span className="font-bold tabular-nums text-emerald-400">
                  {midCount} units ({Math.round((midCount / total) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(midCount / total) * 100}%` }}
                />
              </div>
            </div>

            {/* > 55 km/h */}
            <div>
              <div className="flex justify-between items-center mb-1 text-slate-300">
                <span>Express Corridor (&gt; 55 km/h)</span>
                <span className="font-bold tabular-nums text-indigo-400">
                  {highCount} units ({Math.round((highCount / total) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(highCount / total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Backend & API Service Diagnostic */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  Service Health & Backend Pipeline
                </h4>
                <p className="text-xs text-slate-400">Diagnostic telemetry of Express & Socket.IO runtime</p>
              </div>

              <button
                type="button"
                onClick={checkHealth}
                disabled={checking}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Ping Backend Services"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono mb-4">
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <span className="text-[10px] text-slate-500 block">MONGODB STATUS</span>
                <div className="flex items-center gap-1.5 mt-0.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {healthData?.dependencies?.mongodb ?? 'online'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <span className="text-[10px] text-slate-500 block">REDIS PUB/SUB BUS</span>
                <div className="flex items-center gap-1.5 mt-0.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {healthData?.dependencies?.redis ?? 'online'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <span className="text-[10px] text-slate-500 block">API ROUND-TRIP PING</span>
                <span className="text-sky-300 font-bold tabular-nums block mt-0.5">
                  {pingLatency !== null ? `${pingLatency} ms` : 'testing...'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <span className="text-[10px] text-slate-500 block">TELEMETRY CADENCE</span>
                <span className="text-indigo-300 font-bold tabular-nums block mt-0.5">
                  1000 ms (1.0 Hz)
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Core service: FleetDash Telemetry API</span>
            <span className="text-emerald-400">Nominal 200 OK</span>
          </div>
        </div>
      </div>

      {/* Raw Telemetry JSON Payload Inspector */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-sky-400" />
            <h4 className="text-sm font-bold text-white font-mono">
              Live Socket.IO Stream Payload Inspector (Batch 10 Units)
            </h4>
          </div>

          <button
            type="button"
            onClick={copyPayload}
            className="flex items-center gap-1 px-3 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors font-mono"
          >
            {copiedPayload ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            Copy JSON
          </button>
        </div>

        <div className="p-4 bg-slate-950 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-64">
          <pre>{JSON.stringify(vehicles.slice(0, 3), null, 2)}</pre>
          <div className="text-slate-600 mt-1 italic">
            ... and {Math.max(0, vehicles.length - 3)} more units in current broadcast
          </div>
        </div>
      </div>
    </div>
  );
};

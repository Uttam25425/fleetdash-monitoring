import React, { useState } from 'react';
import type { AlertItem } from '../types/fleet';
import { Bell, AlertTriangle, ShieldAlert, CheckCircle2, Check, Trash2, Filter } from 'lucide-react';

interface AlertsViewProps {
  alerts: AlertItem[];
  onAcknowledgeAlert: (id: string) => void;
  onAcknowledgeAll: () => void;
  onClearAcknowledged: () => void;
  onSelectVehicle: (vehicleId: string) => void;
  onFocusOnMap: (vehicleId: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  onAcknowledgeAlert,
  onAcknowledgeAll,
  onClearAcknowledged,
  onSelectVehicle,
  onFocusOnMap,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'unack'>('all');

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === 'critical') return a.severity === 'critical';
    if (filterSeverity === 'warning') return a.severity === 'warning';
    if (filterSeverity === 'unack') return !a.acknowledged;
    return true;
  });

  const criticalCount = alerts.filter((a) => a.severity === 'critical' && !a.acknowledged).length;
  const warningCount = alerts.filter((a) => a.severity === 'warning' && !a.acknowledged).length;
  const unackCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="space-y-6">
      {/* Alert KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10">
          <div className="flex items-center justify-between text-xs font-mono text-rose-400 mb-1">
            <span>CRITICAL BREACHES</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {criticalCount}
          </div>
          <span className="text-[11px] text-rose-300/80 font-mono">Unacknowledged boundary exits</span>
        </div>

        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
          <div className="flex items-center justify-between text-xs font-mono text-amber-400 mb-1">
            <span>VELOCITY WARNINGS</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {warningCount}
          </div>
          <span className="text-[11px] text-amber-300/80 font-mono">Speed threshold &gt; 60 km/h</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span>PENDING ACTION</span>
            <Bell className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {unackCount}
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Awaiting dispatcher review</span>
        </div>
      </div>

      {/* Alert Feed Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="p-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Severity Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs font-mono">
            <button
              type="button"
              onClick={() => setFilterSeverity('all')}
              className={`px-3 py-1 rounded transition-colors ${
                filterSeverity === 'all' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterSeverity('unack')}
              className={`px-3 py-1 rounded transition-colors ${
                filterSeverity === 'unack' ? 'bg-sky-500/20 text-sky-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Active ({unackCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterSeverity('critical')}
              className={`px-3 py-1 rounded transition-colors ${
                filterSeverity === 'critical' ? 'bg-rose-500/20 text-rose-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Critical ({criticalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterSeverity('warning')}
              className={`px-3 py-1 rounded transition-colors ${
                filterSeverity === 'warning' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Warnings ({warningCount})
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAcknowledgeAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors whitespace-nowrap"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Acknowledge All
            </button>
            <button
              type="button"
              onClick={onClearAcknowledged}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Resolved
            </button>
          </div>
        </div>

        {/* List of alerts */}
        <div className="divide-y divide-slate-800/60 font-mono text-xs">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                alert.acknowledged ? 'bg-slate-900/30 opacity-70' : 'hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                  alert.severity === 'critical'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {alert.severity === 'critical' ? (
                    <ShieldAlert className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-white font-bold">{alert.vehicleId}</strong>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400 tabular-nums">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                    {alert.acknowledged && (
                      <span className="text-teal-400 text-[10px] bg-teal-500/10 px-1.5 py-0.2 rounded border border-teal-500/30">
                        ACKNOWLEDGED
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 font-sans text-xs mt-1">
                    {alert.message}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 font-sans">
                <button
                  type="button"
                  onClick={() => {
                    onSelectVehicle(alert.vehicleId);
                    onFocusOnMap(alert.vehicleId);
                  }}
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-sky-400 transition-colors"
                >
                  Locate
                </button>
                {!alert.acknowledged ? (
                  <button
                    type="button"
                    onClick={() => onAcknowledgeAlert(alert.id)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Ack
                  </button>
                ) : (
                  <span className="text-xs text-slate-500 px-2">Resolved</span>
                )}
              </div>
            </div>
          ))}

          {filteredAlerts.length === 0 && (
            <div className="py-10 text-center text-slate-500 font-sans">
              No alerts match the selected filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

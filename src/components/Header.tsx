import React from 'react';
import type { NavigationTab } from '../types/fleet';
import { Radio, Bell, Download, ShieldCheck, Activity, Map, Truck, BarChart2 } from 'lucide-react';

interface HeaderProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  connected: boolean;
  alertCount: number;
  onExportData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  connected,
  alertCount,
  onExportData,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#070d18]/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
      <div className="flex items-center justify-between gap-8">
        {/* Zone 1: Brand title, single line */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-base tracking-wider font-mono">
            FD
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
              FleetDash
            </span>
            <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap -mt-0.5">
              Telemetry Command
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => onSelectTab('overview')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-sky-500/20 text-sky-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Overview
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('map')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'map'
                ? 'bg-sky-500/20 text-sky-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            Fleet Map
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('vehicles')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'vehicles'
                ? 'bg-sky-500/20 text-sky-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Vehicles
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('geofences')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'geofences'
                ? 'bg-sky-500/20 text-sky-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Geofences
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('alerts')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap relative ${
              activeTab === 'alerts'
                ? 'bg-sky-500/20 text-sky-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Alerts
            {alertCount > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white font-mono text-[10px] font-bold">
                {alertCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-sky-500/20 text-sky-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Analytics
          </button>
        </nav>

        {/* Zone 3: Primary actions & telemetry status */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Connection status */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono whitespace-nowrap ${
              connected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            {connected ? 'LIVE 1Hz' : 'OFFLINE'}
          </div>

          {/* Export telemetry data */}
          <button
            type="button"
            onClick={onExportData}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors whitespace-nowrap"
            title="Export Telemetry JSON"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            Export Data
          </button>

          {/* User Profile Monogram */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200">
              FD
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

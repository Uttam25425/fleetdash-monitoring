import React, { useState, useMemo } from 'react';
import type { VehicleTelemetry, VehicleFilter } from '../types/fleet';
import { Search, ArrowUpDown, ChevronRight, Download, Filter } from 'lucide-react';

interface VehicleTableProps {
  vehicles: VehicleTelemetry[];
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicleId: string) => void;
  onFocusOnMap?: (vehicleId: string) => void;
}

type SortField = 'vehicleId' | 'speed' | 'heading' | 'status' | 'insideGeofence';
type SortOrder = 'asc' | 'desc';

export const VehicleTable: React.FC<VehicleTableProps> = ({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  onFocusOnMap,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<VehicleFilter>('all');
  const [sortField, setSortField] = useState<SortField>('vehicleId');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSorted = useMemo(() => {
    return vehicles
      .filter((v) => {
        const matchesSearch = v.vehicleId.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;
        if (filter === 'moving') return v.status === 'moving';
        if (filter === 'idle') return v.status === 'idle';
        if (filter === 'breached') return !v.insideGeofence;
        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];
        if (typeof valA === 'string') {
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (typeof valA === 'boolean') {
          valA = valA ? 1 : 0;
          valB = valB ? 1 : 0;
        }
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [vehicles, search, filter, sortField, sortOrder]);

  const handleExportCSV = () => {
    const headers = ['VehicleID', 'Status', 'Speed(km/h)', 'Heading(deg)', 'Latitude', 'Longitude', 'InsideGeofence', 'Timestamp'];
    const rows = filteredAndSorted.map((v) => [
      v.vehicleId,
      v.status,
      v.speed,
      v.heading,
      v.latitude.toFixed(6),
      v.longitude.toFixed(6),
      v.insideGeofence ? 'YES' : 'NO',
      v.timestamp,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fleetdash_telemetry_${new Date().toISOString().slice(0, 19)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search vehicle ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800/70 border border-slate-700/70 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          {/* Segmented Filter Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                filter === 'all' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({vehicles.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('moving')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                filter === 'moving' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Moving
            </button>
            <button
              type="button"
              onClick={() => setFilter('idle')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                filter === 'idle' ? 'bg-amber-500/20 text-amber-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Idle
            </button>
            <button
              type="button"
              onClick={() => setFilter('breached')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                filter === 'breached' ? 'bg-rose-500/20 text-rose-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Breached
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors whitespace-nowrap self-start md:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-sky-400" />
          Export CSV
        </button>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 font-medium border-b border-slate-800 uppercase tracking-wider text-[11px] font-mono">
            <tr>
              <th className="py-3 px-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('vehicleId')}>
                <div className="flex items-center gap-1.5">
                  Unit ID
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1.5">
                  Status
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-slate-200 text-right" onClick={() => handleSort('speed')}>
                <div className="flex items-center justify-end gap-1.5">
                  Velocity
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-slate-200 text-right" onClick={() => handleSort('heading')}>
                <div className="flex items-center justify-end gap-1.5">
                  Heading
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4">Coordinates (Lat, Lng)</th>
              <th className="py-3 px-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('insideGeofence')}>
                <div className="flex items-center gap-1.5">
                  Geofence
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[12px]">
            {filteredAndSorted.map((v) => {
              const isSelected = selectedVehicleId === v.vehicleId;
              return (
                <tr
                  key={v.vehicleId}
                  onClick={() => onSelectVehicle(v.vehicleId)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-sky-500/10 hover:bg-sky-500/15'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-3 px-4 font-semibold text-slate-200">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        !v.insideGeofence ? 'bg-rose-500' : v.status === 'moving' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} />
                      {v.vehicleId}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={v.status === 'moving' ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                      {v.status === 'moving' ? 'In Transit' : 'Stationary'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="h-full bg-sky-400 rounded-full"
                          style={{ width: `${Math.min(100, (v.speed / 75) * 100)}%` }}
                        />
                      </div>
                      <span className="tabular-nums font-semibold text-slate-200">{v.speed}</span>
                      <span className="text-slate-500 text-[10px]">km/h</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-300">
                    {v.heading}°
                  </td>
                  <td className="py-3 px-4 tabular-nums text-slate-400">
                    {v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}
                  </td>
                  <td className="py-3 px-4">
                    {v.insideGeofence ? (
                      <span className="text-teal-400">Inside Zone-01</span>
                    ) : (
                      <span className="text-rose-400 font-medium">Perimeter Breach</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      {onFocusOnMap && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectVehicle(v.vehicleId);
                            onFocusOnMap(v.vehicleId);
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 text-[11px] transition-colors"
                        >
                          Map
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectVehicle(v.vehicleId)}
                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                        title="Inspect unit"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredAndSorted.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                  No vehicle telemetry records matched your search or filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

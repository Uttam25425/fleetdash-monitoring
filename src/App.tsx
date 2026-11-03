import React, { useEffect, useState, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import type { VehicleTelemetry, AlertItem, NavigationTab, VehicleSpeedHistory } from './types/fleet';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { FleetCanvasMap } from './components/FleetCanvasMap';
import { VehicleTable } from './components/VehicleTable';
import { VehicleInspector } from './components/VehicleInspector';
import { GeofenceView } from './components/GeofenceView';
import { AlertsView } from './components/AlertsView';
import { AnalyticsView } from './components/AnalyticsView';
import { Bell, ArrowRight, ShieldAlert, Sparkles, Filter } from 'lucide-react';

const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '');

const socket = io(API_URL || undefined, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

export default function App() {
  const [connected, setConnected] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleTelemetry[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  // Rolling history for vehicle speeds
  const speedHistoryMapRef = useRef<Map<string, VehicleSpeedHistory[]>>(new Map());

  // Socket connection & telemetry streaming
  useEffect(() => {
    const handleConnect = () => {
      setConnected(true);
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    const handleTelemetry = (data: ArrayBuffer | Uint8Array | string | VehicleTelemetry[]) => {
      try {
        let telemetryBatch: VehicleTelemetry[];

        if (Array.isArray(data)) {
          telemetryBatch = data;
        } else if (typeof data === 'string') {
          telemetryBatch = JSON.parse(data);
        } else {
          const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
          const json = new TextDecoder().decode(bytes);
          telemetryBatch = JSON.parse(json);
        }

        if (!Array.isArray(telemetryBatch)) return;

        setVehicles(telemetryBatch);

        // Auto select first vehicle if none selected
        setSelectedVehicleId((prev) => prev || telemetryBatch[0]?.vehicleId || null);

        // Update speed history
        telemetryBatch.forEach((v) => {
          const currentHist = speedHistoryMapRef.current.get(v.vehicleId) || [];
          const updated = [...currentHist, { timestamp: v.timestamp, speed: v.speed }];
          if (updated.length > 20) updated.shift();
          speedHistoryMapRef.current.set(v.vehicleId, updated);
        });

        // Trigger incident alerts
        const newAlerts: AlertItem[] = [];
        const now = new Date().toISOString();

        telemetryBatch.forEach((v) => {
          // Geofence breach detection
          if (!v.insideGeofence) {
            newAlerts.push({
              id: `geo-${v.vehicleId}-${now.slice(0, 16)}`,
              type: 'geofence_breach',
              vehicleId: v.vehicleId,
              message: `Perimeter Breach: Unit exited Zone-01 boundaries at ${v.speed} km/h`,
              timestamp: v.timestamp,
              severity: 'critical',
              acknowledged: false,
            });
          }

          // Overspeed warning (> 60 km/h)
          if (v.speed > 60) {
            newAlerts.push({
              id: `speed-${v.vehicleId}-${now.slice(0, 16)}`,
              type: 'overspeed',
              vehicleId: v.vehicleId,
              message: `High Velocity Warning: Reached ${v.speed} km/h in urban sector`,
              timestamp: v.timestamp,
              severity: 'warning',
              acknowledged: false,
            });
          }
        });

        if (newAlerts.length > 0) {
          setAlerts((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const additions = newAlerts.filter((a) => !existingIds.has(a.id));
            return [...additions, ...prev].slice(0, 30);
          });
        }
      } catch (err) {
        console.error('Telemetry processing error:', err);
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('telemetry:batch', handleTelemetry);
    socket.connect();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('telemetry:batch', handleTelemetry);
      socket.disconnect();
    };
  }, []);

  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => v.vehicleId === selectedVehicleId) || null;
  }, [vehicles, selectedVehicleId]);

  const selectedVehicleSpeedHistory = useMemo(() => {
    if (!selectedVehicleId) return [];
    return speedHistoryMapRef.current.get(selectedVehicleId) || [];
  }, [selectedVehicleId, vehicles]);

  // Alert actions
  const handleAcknowledgeAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  };

  const handleAcknowledgeAll = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
  };

  const handleClearAcknowledged = () => {
    setAlerts((prev) => prev.filter((a) => !a.acknowledged));
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(vehicles, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `fleetdash_batch_${new Date().toISOString().slice(0, 19)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const unacknowledgedAlertsCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="min-h-screen bg-[#070d18] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        connected={connected}
        alertCount={unacknowledgedAlertsCount}
        onExportData={handleExportData}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Metric Cards always visible on overview or prominent */}
        <MetricCards vehicles={vehicles} />

        {/* View Routing */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Split layout: Fleet Map + Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono text-white">
                      Live Operational Map
                    </span>
                    <span className="text-slate-500 text-xs">·</span>
                    <span className="text-xs font-mono text-slate-400">
                      Zone-01 Corridor
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('map')}
                    className="text-xs font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
                  >
                    Expand Map <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <FleetCanvasMap
                  vehicles={vehicles}
                  selectedVehicleId={selectedVehicleId}
                  onSelectVehicle={setSelectedVehicleId}
                  height="460px"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold font-mono text-white">
                    Unit Telemetry Inspector
                  </span>
                  {selectedVehicle && (
                    <span className="text-xs font-mono text-slate-400">
                      {selectedVehicle.vehicleId}
                    </span>
                  )}
                </div>

                <VehicleInspector
                  vehicle={selectedVehicle}
                  speedHistory={selectedVehicleSpeedHistory}
                />
              </div>
            </div>

            {/* Live Data Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-mono text-white">
                    Real-Time Fleet Grid
                  </span>
                  <span className="text-slate-500 text-xs">·</span>
                  <span className="text-xs font-mono text-slate-400">
                    Live Telemetry Stream
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('vehicles')}
                  className="text-xs font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
                >
                  Full Table View <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <VehicleTable
                vehicles={vehicles}
                selectedVehicleId={selectedVehicleId}
                onSelectVehicle={setSelectedVehicleId}
                onFocusOnMap={(id) => {
                  setSelectedVehicleId(id);
                  setActiveTab('map');
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold font-mono text-white">
                    Expanded Tactical Fleet Map
                  </h2>
                  <span className="text-xs font-mono text-slate-400">
                    Interactive Pan & Zoom Enabled
                  </span>
                </div>

                <FleetCanvasMap
                  vehicles={vehicles}
                  selectedVehicleId={selectedVehicleId}
                  onSelectVehicle={setSelectedVehicleId}
                  height="620px"
                />
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold font-mono text-white">
                  Focused Unit Telemetry
                </h3>
                <VehicleInspector
                  vehicle={selectedVehicle}
                  speedHistory={selectedVehicleSpeedHistory}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vehicles' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold font-mono text-white">
                  Vehicle Fleet Directory & Telemetry Stream
                </h2>
                <p className="text-xs text-slate-400">
                  Comprehensive listing of all connected units with live velocity, heading, and status
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <VehicleTable
                  vehicles={vehicles}
                  selectedVehicleId={selectedVehicleId}
                  onSelectVehicle={setSelectedVehicleId}
                  onFocusOnMap={(id) => {
                    setSelectedVehicleId(id);
                    setActiveTab('map');
                  }}
                />
              </div>
              <div>
                <VehicleInspector
                  vehicle={selectedVehicle}
                  speedHistory={selectedVehicleSpeedHistory}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'geofences' && (
          <GeofenceView
            vehicles={vehicles}
            onSelectVehicle={setSelectedVehicleId}
            onFocusOnMap={(id) => {
              setSelectedVehicleId(id);
              setActiveTab('map');
            }}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsView
            alerts={alerts}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onAcknowledgeAll={handleAcknowledgeAll}
            onClearAcknowledged={handleClearAcknowledged}
            onSelectVehicle={setSelectedVehicleId}
            onFocusOnMap={(id) => {
              setSelectedVehicleId(id);
              setActiveTab('map');
            }}
          />
        )}

        {activeTab === 'analytics' && <AnalyticsView vehicles={vehicles} />}
      </main>
    </div>
  );
}
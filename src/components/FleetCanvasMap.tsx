import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { VehicleTelemetry, MapLayer } from '../types/fleet';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair, Layers, Route, ShieldAlert } from 'lucide-react';

interface FleetCanvasMapProps {
  vehicles: VehicleTelemetry[];
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicleId: string) => void;
  showGeofence?: boolean;
  activeLayer?: MapLayer;
  height?: string;
}

const DEFAULT_MAP_BOUNDS = {
  minLatitude: 20.2761,
  maxLatitude: 20.3161,
  minLongitude: 85.8145,
  maxLongitude: 85.8545,
};

const OPERATIONAL_GEOFENCE = {
  name: 'Bhubaneswar Central Ops Zone',
  minLatitude: 20.2861,
  maxLatitude: 20.3061,
  minLongitude: 85.8245,
  maxLongitude: 85.8445,
};

export const FleetCanvasMap: React.FC<FleetCanvasMapProps> = ({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  showGeofence = true,
  activeLayer = 'blueprint',
  height = '540px',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showTrails, setShowTrails] = useState(true);
  const [selectedLayer, setSelectedLayer] = useState<MapLayer>(activeLayer);
  const [showGeofenceOverlay, setShowGeofenceOverlay] = useState(showGeofence);

  // Track breadcrumbs history for trails
  const trailsRef = useRef<Map<string, { lat: number; lng: number }[]>>(new Map());

  // Update trails when vehicles update
  useEffect(() => {
    vehicles.forEach((v) => {
      const history = trailsRef.current.get(v.vehicleId) || [];
      const lastPoint = history[history.length - 1];
      if (!lastPoint || lastPoint.lat !== v.latitude || lastPoint.lng !== v.longitude) {
        const nextHistory = [...history, { lat: v.latitude, lng: v.longitude }];
        if (nextHistory.length > 20) {
          nextHistory.shift();
        }
        trailsRef.current.set(v.vehicleId, nextHistory);
      }
    });
  }, [vehicles]);

  // Center on selected vehicle if clicked
  const centerOnVehicle = (vehicleId: string) => {
    const v = vehicles.find((item) => item.vehicleId === vehicleId);
    if (!v || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const normX = (v.longitude - DEFAULT_MAP_BOUNDS.minLongitude) / (DEFAULT_MAP_BOUNDS.maxLongitude - DEFAULT_MAP_BOUNDS.minLongitude);
    const normY = (DEFAULT_MAP_BOUNDS.maxLatitude - v.latitude) / (DEFAULT_MAP_BOUNDS.maxLatitude - DEFAULT_MAP_BOUNDS.minLatitude);

    const basePadX = width * 0.08;
    const basePadY = height * 0.08;
    const targetX = basePadX + normX * (width - basePadX * 2);
    const targetY = basePadY + normY * (height - basePadY * 2);

    setPanOffset({
      x: width / 2 - targetX * zoom,
      y: height / 2 - targetY * zoom,
    });
  };

  const resetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Convert GPS coordinates to Canvas X/Y taking into account zoom and pan
  const projectCoords = (lat: number, lng: number, width: number, height: number) => {
    const padX = width * 0.08;
    const padY = height * 0.08;
    const usableW = width - padX * 2;
    const usableH = height - padY * 2;

    const normX = (lng - DEFAULT_MAP_BOUNDS.minLongitude) / (DEFAULT_MAP_BOUNDS.maxLongitude - DEFAULT_MAP_BOUNDS.minLongitude);
    const normY = (DEFAULT_MAP_BOUNDS.maxLatitude - lat) / (DEFAULT_MAP_BOUNDS.maxLatitude - DEFAULT_MAP_BOUNDS.minLatitude);

    const baseX = padX + normX * usableW;
    const baseY = padY + normY * usableH;

    return {
      x: baseX * zoom + panOffset.x,
      y: baseY * zoom + panOffset.y,
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let radarAngle = 0;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = rect.height;

      if (canvas.width !== Math.round(width * pixelRatio) || canvas.height !== Math.round(height * pixelRatio)) {
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
      }

      ctx.save();
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // 1. Background fill based on layer
      if (selectedLayer === 'radar') {
        const radGrad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width * 0.7);
        radGrad.addColorStop(0, '#06131f');
        radGrad.addColorStop(1, '#03080e');
        ctx.fillStyle = radGrad;
      } else if (selectedLayer === 'tactical') {
        ctx.fillStyle = '#050a12';
      } else {
        // blueprint
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#081120');
        grad.addColorStop(1, '#050b14');
        ctx.fillStyle = grad;
      }
      ctx.fillRect(0, 0, width, height);

      // 2. Grid & contours
      ctx.lineWidth = 1;
      const gridSize = 48 * zoom;
      const startX = (panOffset.x % gridSize);
      const startY = (panOffset.y % gridSize);

      ctx.strokeStyle = selectedLayer === 'radar' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(56, 189, 248, 0.07)';
      for (let x = startX; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = startY; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Layer extras: Radar sweep or tactical vector routes
      if (selectedLayer === 'radar') {
        radarAngle = (radarAngle + 0.02) % (Math.PI * 2);
        const cx = width / 2;
        const cy = height / 2;
        const maxR = Math.hypot(width, height) / 2;

        // Concentric distance rings
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.12)';
        for (let r = 80; r < maxR; r += 90) {
          ctx.beginPath();
          ctx.arc(cx, cy, r * zoom, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Sweeping radar beam
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, maxR, radarAngle - 0.35, radarAngle);
        ctx.closePath();
        const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
        sweepGrad.addColorStop(0, 'rgba(16, 185, 129, 0.18)');
        sweepGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = sweepGrad;
        ctx.fill();
        ctx.restore();
      } else {
        // Road / corridor curves
        const p1 = projectCoords(20.280, 85.818, width, height);
        const p2 = projectCoords(20.295, 85.835, width, height);
        const p3 = projectCoords(20.312, 85.850, width, height);

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.lineWidth = 2 * zoom;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(p2.x, p2.y, p3.x, p3.y);
        ctx.stroke();

        const q1 = projectCoords(20.312, 85.820, width, height);
        const q2 = projectCoords(20.298, 85.834, width, height);
        const q3 = projectCoords(20.278, 85.845, width, height);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
        ctx.beginPath();
        ctx.moveTo(q1.x, q1.y);
        ctx.quadraticCurveTo(q2.x, q2.y, q3.x, q3.y);
        ctx.stroke();
      }

      // 3. Geofence Boundary
      if (showGeofenceOverlay) {
        const topLeft = projectCoords(OPERATIONAL_GEOFENCE.maxLatitude, OPERATIONAL_GEOFENCE.minLongitude, width, height);
        const bottomRight = projectCoords(OPERATIONAL_GEOFENCE.minLatitude, OPERATIONAL_GEOFENCE.maxLongitude, width, height);
        const geoW = bottomRight.x - topLeft.x;
        const geoH = bottomRight.y - topLeft.y;

        ctx.save();
        ctx.setLineDash([8, 6]);
        ctx.strokeStyle = 'rgba(20, 184, 166, 0.85)';
        ctx.fillStyle = 'rgba(20, 184, 166, 0.05)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.rect(topLeft.x, topLeft.y, geoW, geoH);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Geofence corner crosshairs
        const markSize = 8;
        ctx.strokeStyle = '#2dd4bf';
        ctx.lineWidth = 2;
        // TL
        ctx.beginPath();
        ctx.moveTo(topLeft.x, topLeft.y + markSize);
        ctx.lineTo(topLeft.x, topLeft.y);
        ctx.lineTo(topLeft.x + markSize, topLeft.y);
        ctx.stroke();
        // BR
        ctx.beginPath();
        ctx.moveTo(bottomRight.x - markSize, bottomRight.y);
        ctx.lineTo(bottomRight.x, bottomRight.y);
        ctx.lineTo(bottomRight.x, bottomRight.y - markSize);
        ctx.stroke();

        // Zone label
        ctx.font = '600 11px var(--font-mono, monospace)';
        ctx.fillStyle = '#2dd4bf';
        ctx.fillText('OPERATIONAL GEOFENCE [ZONE-01]', topLeft.x + 12, topLeft.y + 18);
      }

      // 4. Vehicle Trails
      if (showTrails) {
        trailsRef.current.forEach((trail, vehicleId) => {
          if (trail.length < 2) return;
          const isSelected = selectedVehicleId === vehicleId;
          ctx.strokeStyle = isSelected ? 'rgba(56, 189, 248, 0.6)' : 'rgba(100, 116, 139, 0.25)';
          ctx.lineWidth = isSelected ? 2.5 : 1.5;
          ctx.beginPath();
          trail.forEach((pt, index) => {
            const mapped = projectCoords(pt.lat, pt.lng, width, height);
            if (index === 0) ctx.moveTo(mapped.x, mapped.y);
            else ctx.lineTo(mapped.x, mapped.y);
          });
          ctx.stroke();
        });
      }

      // 5. Vehicles
      vehicles.forEach((vehicle) => {
        const { x, y } = projectCoords(vehicle.latitude, vehicle.longitude, width, height);
        const isSelected = selectedVehicleId === vehicle.vehicleId;

        // Color coding
        let vehicleColor = '#10b981'; // Moving - emerald
        if (vehicle.status === 'idle') {
          vehicleColor = '#f59e0b'; // Idle - amber
        }
        if (!vehicle.insideGeofence) {
          vehicleColor = '#f43f5e'; // Geofence breach - rose
        }

        ctx.save();
        ctx.translate(x, y);

        // Highlight ring if selected
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(0, 0, 18 * zoom, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
          ctx.fill();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Direction chevron oriented to heading
        ctx.rotate((vehicle.heading * Math.PI) / 180);
        ctx.beginPath();
        const size = Math.max(9, 12 * Math.min(zoom, 1.6));
        ctx.moveTo(size, 0);
        ctx.lineTo(-size * 0.7, -size * 0.6);
        ctx.lineTo(-size * 0.35, 0);
        ctx.lineTo(-size * 0.7, size * 0.6);
        ctx.closePath();

        ctx.fillStyle = vehicleColor;
        ctx.shadowColor = vehicleColor;
        ctx.shadowBlur = isSelected ? 16 : 8;
        ctx.fill();
        ctx.restore();

        // Vehicle Callout Tag
        ctx.font = isSelected ? '600 11px var(--font-mono, monospace)' : '500 10px var(--font-mono, monospace)';
        ctx.fillStyle = isSelected ? '#ffffff' : '#94a3b8';
        ctx.fillText(vehicle.vehicleId, x + 14, y - 6);

        if (isSelected || zoom > 1.2) {
          ctx.font = '500 9px var(--font-mono, monospace)';
          ctx.fillStyle = vehicle.status === 'moving' ? '#34d399' : '#fbbf24';
          ctx.fillText(`${vehicle.speed} km/h`, x + 14, y + 7);
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [vehicles, selectedVehicleId, zoom, panOffset, showTrails, selectedLayer, showGeofenceOverlay]);

  // Click handler for vehicle selection
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || vehicles.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    let closestVehicle: VehicleTelemetry | null = null;
    let closestDist = 26; // click radius threshold

    vehicles.forEach((v) => {
      const { x, y } = projectCoords(v.latitude, v.longitude, rect.width, rect.height);
      const dist = Math.hypot(clickX - x, clickY - y);
      if (dist < closestDist) {
        closestDist = dist;
        closestVehicle = v;
      }
    });

    if (closestVehicle) {
      onSelectVehicle((closestVehicle as VehicleTelemetry).vehicleId);
    }
  };

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div ref={containerRef} className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-[#070d18]">
      {/* Top Map Action Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Layer Selector */}
        <div className="pointer-events-auto flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-700/60 shadow-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setSelectedLayer('blueprint')}
            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
              selectedLayer === 'blueprint' ? 'bg-sky-500/20 text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Blueprint
          </button>
          <button
            type="button"
            onClick={() => setSelectedLayer('tactical')}
            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
              selectedLayer === 'tactical' ? 'bg-sky-500/20 text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tactical
          </button>
          <button
            type="button"
            onClick={() => setSelectedLayer('radar')}
            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
              selectedLayer === 'radar' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Radar
          </button>
        </div>

        {/* Map Overlays & Tool Toggles */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-700/60 shadow-lg text-xs">
          <button
            type="button"
            onClick={() => setShowGeofenceOverlay((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
              showGeofenceOverlay ? 'bg-teal-500/20 text-teal-300 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Geofence Boundary"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Geofence
          </button>

          <button
            type="button"
            onClick={() => setShowTrails((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
              showTrails ? 'bg-sky-500/20 text-sky-300 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Vehicle Trails"
          >
            <Route className="w-3.5 h-3.5" />
            Trails
          </button>

          {selectedVehicleId && (
            <button
              type="button"
              onClick={() => centerOnVehicle(selectedVehicleId)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors whitespace-nowrap"
              title="Focus on Selected Vehicle"
            >
              <Crosshair className="w-3.5 h-3.5 text-sky-400" />
              Focus {selectedVehicleId}
            </button>
          )}
        </div>
      </div>

      {/* Floating Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1 pointer-events-auto">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
          className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/70 shadow-md transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
          className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/70 shadow-md transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={resetView}
          className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/70 shadow-md transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Map Status & Legend */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-4 px-3 py-1.5 bg-slate-900/85 backdrop-blur-md rounded-lg border border-slate-800 text-xs text-slate-400 pointer-events-none">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          Moving
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
          Idle
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
          Breached
        </div>
        <span className="text-slate-600">|</span>
        <span className="font-mono text-[11px] tabular-nums text-slate-400">
          Zoom: {(zoom * 100).toFixed(0)}% · Units: {vehicles.length}
        </span>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ height }}
        className="w-full cursor-grab active:cursor-grabbing block"
      />
    </div>
  );
};

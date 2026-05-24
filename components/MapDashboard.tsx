'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ReportModal from './ReportModal';

const CENTER: [number, number] = [36.0194, -78.9207];

type Sighting = {
  id: number;
  created_at: string;
  location_name: string;
  lat: number;
  lng: number;
  description: string | null;
  photo_path: string | null;
  reporter_name: string;
  threat_level: 'Spotted' | 'Approaching' | 'RUN';
};

const pulseIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:32px;height:32px">
      <span style="
        display:block;position:absolute;inset:0;border-radius:50%;
        background:rgba(239,68,68,0.35);
        animation:jasRipple 1.6s ease-out infinite;
      "></span>
      <span style="
        display:block;position:absolute;inset:6px;border-radius:50%;
        background:#ef4444;box-shadow:0 0 12px #ef4444;
      "></span>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function timeAgo(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes === 0) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function threatBadge(t: string) {
  if (t === 'RUN') return { label: '🚨 RUN', color: '#ef4444' };
  if (t === 'Approaching') return { label: '⚠️ Approaching', color: '#f59e0b' };
  return { label: '👀 Spotted', color: '#22d3ee' };
}

function HeatLayer({ sightings }: { sightings: Sighting[] }) {
  const map = useMap();
  const layerRef = useRef<any>(null);

  useEffect(() => {
    if (!sightings.length) return;

    let cancelled = false;
    import('leaflet.heat' as any).then(() => {
      if (cancelled) return;
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
      const points = sightings.map((s) => [s.lat, s.lng, 0.8] as [number, number, number]);
      layerRef.current = (L as any).heatLayer(points, {
        radius: 35,
        blur: 25,
        maxZoom: 18,
        gradient: { 0.2: '#22c55e', 0.5: '#f59e0b', 0.8: '#ef4444', 1.0: '#7f1d1d' },
      }).addTo(map);
    });

    return () => {
      cancelled = true;
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, sightings]);

  return null;
}

export default function MapDashboard() {
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [latest, setLatest] = useState<Sighting | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showHeat, setShowHeat] = useState(true);

  const fetchSightings = async () => {
    try {
      const res = await fetch('/api/sightings');
      const data = await res.json();
      const list: Sighting[] = data?.sightings ?? [];
      setSightings(list);
      setLatest(list[0] ?? null);
    } catch {
      // network error — keep stale data
    }
  };

  useEffect(() => {
    fetchSightings();
    const id = setInterval(fetchSightings, 30_000);
    return () => clearInterval(id);
  }, []);

  const latestTime = useMemo(() => (latest ? timeAgo(latest.created_at) : 'No reports'), [latest]);
  const topFive = sightings.slice(0, 5);

  return (
    <div className="relative flex h-full min-h-[600px]">
      {/* Ripple keyframe injected inline */}
      <style>{`
        @keyframes jasRipple {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(3); opacity: 0; }
        }
      `}</style>

      {/* ── Left sidebar ──────────────────────────────────── */}
      <aside className="relative z-10 flex w-72 flex-shrink-0 flex-col gap-4 overflow-y-auto border-r border-red-950/30 bg-[#080808]/95 p-5 backdrop-blur-sm">
        {/* Branding */}
        <div className="border-b border-red-950/30 pb-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-amber-400/80">
            J.A.S. // INTEL DASHBOARD
          </p>
          <h2 className="mt-3 font-mono text-2xl font-bold tracking-tighter text-white">
            J<span className="text-red-500">.</span>A<span className="text-red-500">.</span>S
            <span className="text-red-500">.</span>
          </h2>
          <p className="mt-1 font-mono text-[11px] text-slate-400">JEDI ALERT SYSTEM // NCSSM</p>
        </div>

        {/* Live status */}
        <div className="flex items-center gap-2 rounded-xl border border-red-900/30 bg-red-950/20 px-3 py-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
          <span className="font-mono text-xs uppercase tracking-widest text-red-400">LIVE</span>
          <span className="ml-auto font-mono text-[10px] text-slate-500">30s refresh</span>
        </div>

        {/* Last known */}
        <div className="rounded-xl border border-amber-900/30 bg-[#0f0e08]/90 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.38em] text-amber-400/70">Last Known Position</p>
          <p className="mt-2 font-mono text-lg font-semibold text-white">
            {latest ? latest.location_name : '— UNKNOWN —'}
          </p>
          <p className="mt-1 font-mono text-xs text-amber-300/60">{latestTime}</p>
          {latest && (
            <p className="mt-2 font-mono text-[10px] text-slate-500">
              {latest.lat.toFixed(5)}, {latest.lng.toFixed(5)}
            </p>
          )}
        </div>

        {/* Recent sightings */}
        <div className="flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.38em] text-slate-500">Recent Reports</p>
          <div className="mt-3 space-y-2">
            {topFive.length === 0 && (
              <p className="font-mono text-xs text-slate-600">No sightings in last 48h</p>
            )}
            {topFive.map((s) => {
              const badge = threatBadge(s.threat_level);
              return (
                <div
                  key={s.id}
                  className="rounded-xl border border-slate-800/60 bg-[#0d0d0f]/80 p-3 transition hover:border-red-900/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-mono text-xs font-semibold text-white">{s.location_name}</p>
                    <span className="font-mono text-[10px]" style={{ color: badge.color }}>{badge.label}</span>
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-slate-500">{timeAgo(s.created_at)}</p>
                  {s.description && (
                    <p className="mt-1.5 line-clamp-2 font-mono text-[10px] leading-relaxed text-slate-400">
                      {s.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Heat map toggle */}
        <button
          onClick={() => setShowHeat((v) => !v)}
          className="rounded-xl border border-slate-700/60 bg-slate-900/70 px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-slate-300 transition hover:border-amber-700/50 hover:text-amber-300"
        >
          {showHeat ? 'Hide' : 'Show'} Density Map
        </button>
      </aside>

      {/* ── Map ───────────────────────────────────────────── */}
      <div className="relative flex-1">
        <MapContainer
          center={CENTER}
          zoom={17}
          scrollWheelZoom
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
            className="map-tiles-dark"
          />
          {showHeat && <HeatLayer sightings={sightings} />}
          {latest && (
            <Marker position={[latest.lat, latest.lng]} icon={pulseIcon}>
              <Popup>
                <div className="space-y-1 font-mono text-sm">
                  <p className="font-bold text-red-400">LAST KNOWN POSITION</p>
                  <p className="text-white">{latest.location_name}</p>
                  <p className="text-slate-400">{latestTime}</p>
                  <p className="text-xs" style={{ color: threatBadge(latest.threat_level).color }}>
                    {threatBadge(latest.threat_level).label}
                  </p>
                  {latest.description && (
                    <p className="text-xs text-slate-300">{latest.description}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* REPORT button — floating over the map */}
        <button
          onClick={() => setModalOpen(true)}
          className="absolute bottom-8 right-8 z-[1000] flex items-center gap-2 rounded-2xl bg-red-600 px-6 py-3.5 font-mono text-sm font-bold uppercase tracking-[0.22em] text-white shadow-[0_0_32px_rgba(239,68,68,0.5)] transition hover:bg-red-500 hover:shadow-[0_0_48px_rgba(239,68,68,0.7)] active:scale-95"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
          REPORT JEDI
        </button>

        {/* Coordinates watermark */}
        <div className="absolute bottom-4 left-4 z-[1000] font-mono text-[10px] text-slate-600 select-none">
          NCSSM // 36.0194°N 78.9207°W // DURHAM NC
        </div>
      </div>

      <ReportModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={() => {
          setModalOpen(false);
          fetchSightings();
        }}
      />
    </div>
  );
}

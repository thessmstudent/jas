'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

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

const THREAT_META: Record<string, { label: string; color: string; bg: string }> = {
  Spotted:    { label: '👀 Spotted',     color: '#22d3ee', bg: 'rgba(34,211,238,0.08)' },
  Approaching:{ label: '⚠️ Approaching', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  RUN:        { label: '🚨 RUN',         color: '#ef4444', bg: 'rgba(239,68,68,0.10)'  },
};

const LOCATIONS = [
  'All Locations', 'Bryan', 'Beall', 'Library', 'PFM', 'Watts', 'Hill', 'Hunt', 'ETC', 'PEC', 'Reynolds', 'Royal', 'Field',
];

function timeAgo(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m === 0) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function SightingsPage() {
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterThreat, setFilterThreat] = useState<string>('All');
  const [filterLocation, setFilterLocation] = useState<string>('All Locations');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/sightings?all=true');
      const data = await res.json();
      setSightings(data.sightings ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return sightings.filter((s) => {
      const matchThreat = filterThreat === 'All' || s.threat_level === filterThreat;
      const matchLoc = filterLocation === 'All Locations' || s.location_name === filterLocation;
      return matchThreat && matchLoc;
    });
  }, [sightings, filterThreat, filterLocation]);

  const displayed = showAll ? filtered : filtered.slice(0, 20);

  const locationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of sightings) {
      counts[s.location_name] = (counts[s.location_name] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [sightings]);

  return (
    <main className="min-h-screen bg-[#060606] text-white">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-red-950/30 bg-[#060606]/95 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-amber-400/60">J.A.S. // SIGHTINGS FEED</p>
            <h1 className="mt-1 font-mono text-2xl font-bold tracking-tight text-white">Live Report Stream</h1>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/" className="rounded-xl border border-slate-700/40 bg-slate-900/60 px-4 py-2 font-mono text-xs uppercase tracking-widest text-slate-400 transition hover:border-red-800/40 hover:text-white">
              Map
            </Link>
            <Link href="/sightings" className="rounded-xl border border-red-700/50 bg-red-950/20 px-4 py-2 font-mono text-xs uppercase tracking-widest text-red-300">
              Feed
            </Link>
            <Link href="/stats" className="rounded-xl border border-slate-700/40 bg-slate-900/60 px-4 py-2 font-mono text-xs uppercase tracking-widest text-slate-400 transition hover:border-red-800/40 hover:text-white">
              Stats
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_300px] lg:px-6">

        {/* Feed */}
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {(['All', 'Spotted', 'Approaching', 'RUN'] as const).map((t) => (
              <button key={t} onClick={() => setFilterThreat(t)}
                style={filterThreat === t && t !== 'All' ? { borderColor: THREAT_META[t]?.color, color: THREAT_META[t]?.color } : {}}
                className={`rounded-xl border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition ${
                  filterThreat === t ? 'border-current bg-slate-900' : 'border-slate-700/40 text-slate-500 hover:text-slate-300'
                }`}>
                {t === 'All' ? 'All Threats' : THREAT_META[t].label}
              </button>
            ))}
            <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}
              className="rounded-xl border border-slate-700/40 bg-slate-900/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-slate-400 outline-none transition hover:border-red-800/30">
              {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {loading && (
            <div className="flex items-center gap-3 py-12 font-mono text-sm text-slate-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              Loading feed...
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="rounded-2xl border border-slate-800/40 bg-[#0d0d0f] p-12 text-center font-mono text-sm text-slate-600">
              No sightings match current filters.
            </div>
          )}

          {displayed.map((s) => {
            const meta = THREAT_META[s.threat_level];
            return (
              <article key={s.id}
                style={{ borderColor: `${meta.color}20`, background: meta.bg }}
                className="rounded-2xl border p-5 transition hover:brightness-110">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span style={{ color: meta.color }} className="font-mono text-[10px] uppercase tracking-[0.35em]">
                        {meta.label}
                      </span>
                      <span className="h-px flex-1 bg-slate-800/60" />
                      <span className="font-mono text-[10px] tabular-nums text-slate-600">{timeAgo(s.created_at)}</span>
                    </div>
                    <h2 className="mt-2 font-mono text-lg font-bold text-white">{s.location_name}</h2>
                  </div>
                </div>
                {s.description && (
                  <p className="mt-3 font-mono text-sm leading-relaxed text-slate-300">{s.description}</p>
                )}
                {s.photo_path && (
                  <img src={s.photo_path} alt="Evidence" className="mt-4 max-h-60 w-full rounded-xl object-cover" />
                )}
                <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-800/40 pt-3 font-mono text-[10px] text-slate-600">
                  <span>Agent: <span className="text-slate-400">{s.reporter_name}</span></span>
                  <span className="tabular-nums">{s.lat.toFixed(5)}, {s.lng.toFixed(5)}</span>
                  <span className="ml-auto">{new Date(s.created_at).toLocaleString()}</span>
                </div>
              </article>
            );
          })}

          {!showAll && filtered.length > 20 && (
            <button onClick={() => setShowAll(true)}
              className="w-full rounded-2xl border border-slate-700/40 py-3 font-mono text-xs uppercase tracking-widest text-slate-500 transition hover:border-red-900/40 hover:text-red-400">
              Load all {filtered.length} reports
            </button>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Summary stats */}
          <div className="rounded-2xl border border-slate-800/40 bg-[#0a0a0c] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.38em] text-slate-500">Summary</p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-400">Total sightings</span>
                <span className="font-mono text-lg font-bold text-white">{sightings.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-400">Filtered</span>
                <span className="font-mono text-sm text-amber-400">{filtered.length}</span>
              </div>
              {(['RUN', 'Approaching', 'Spotted'] as const).map((t) => {
                const count = sightings.filter((s) => s.threat_level === t).length;
                return (
                  <div key={t} className="flex items-center justify-between">
                    <span style={{ color: THREAT_META[t].color }} className="font-mono text-[10px]">{THREAT_META[t].label}</span>
                    <span className="font-mono text-sm text-slate-300">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hotspot list */}
          <div className="rounded-2xl border border-slate-800/40 bg-[#0a0a0c] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.38em] text-slate-500">Hotspots</p>
            <div className="mt-4 space-y-2">
              {locationCounts.slice(0, 8).map(([loc, count], i) => {
                const pct = locationCounts[0]?.[1] ? (count / locationCounts[0][1]) * 100 : 0;
                return (
                  <div key={loc}>
                    <div className="flex items-center justify-between">
                      <button onClick={() => setFilterLocation(loc)}
                        className="font-mono text-xs text-slate-300 transition hover:text-white">
                        {loc}
                      </button>
                      <span className="font-mono text-xs tabular-nums text-amber-400">{count}</span>
                    </div>
                    <div className="mt-1 h-px bg-slate-800">
                      <div className="h-px transition-all" style={{ width: `${pct}%`, background: i === 0 ? '#ef4444' : '#f59e0b' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

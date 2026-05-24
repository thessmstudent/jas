import { getSightings } from '@/lib/db';
import Link from 'next/link';

const THREAT_SCORE: Record<string, number> = { Spotted: 1, Approaching: 3, RUN: 7 };

function fmt12(hour: number) {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

export default async function StatsPage() {
  const sightings = await getSightings(true);
  const total = sightings.length;

  /* ── threat breakdown ───────────────────────────────── */
  const threatCounts = { Spotted: 0, Approaching: 0, RUN: 0 } as Record<string, number>;
  for (const s of sightings) threatCounts[s.threat_level] = (threatCounts[s.threat_level] ?? 0) + 1;

  /* ── location ranking ───────────────────────────────── */
  const locationCounts: Record<string, number> = {};
  for (const s of sightings) locationCounts[s.location_name] = (locationCounts[s.location_name] ?? 0) + 1;
  const sortedLocations = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]);
  const mostDangerous = sortedLocations[0];

  /* ── hourly breakdown ───────────────────────────────── */
  const hourly: Record<number, number> = {};
  for (const s of sightings) {
    const h = new Date(s.created_at).getHours();
    hourly[h] = (hourly[h] ?? 0) + 1;
  }
  const maxHourCount = Math.max(...Object.values(hourly), 1);
  const busiestHour = Object.entries(hourly).sort((a, b) => b[1] - a[1])[0];

  /* ── Jedi Activity Index ────────────────────────────── */
  // Weighted score / max possible, scaled to 0–100
  const rawScore = sightings.reduce((s, r) => s + (THREAT_SCORE[r.threat_level] ?? 1), 0);
  const maxScore = total * 7; // max = all RUN
  const jaiRaw = maxScore > 0 ? Math.round((rawScore / maxScore) * 100) : 0;
  // Recent activity bonus: sightings in last 24h lift the index
  const recent = sightings.filter((s) => Date.now() - new Date(s.created_at).getTime() < 24 * 3600000).length;
  const jai = Math.min(100, jaiRaw + Math.round((recent / Math.max(total, 1)) * 20));

  const jaiColor = jai >= 70 ? '#ef4444' : jai >= 40 ? '#f59e0b' : '#22c55e';
  const jaiLabel = jai >= 70 ? 'CRITICAL' : jai >= 40 ? 'ELEVATED' : 'LOW';

  return (
    <main className="min-h-[100dvh] bg-[#060606] pb-16 text-white lg:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-red-950/30 bg-[#060606]/95 px-4 py-3 backdrop-blur-sm lg:px-6 lg:py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-amber-400/60">J.A.S. // Stats</p>
            <h1 className="font-mono text-lg font-bold tracking-tight text-white lg:text-2xl">System Status</h1>
          </div>
          <nav className="hidden items-center gap-2 lg:flex">
            <Link href="/" className="rounded-xl border border-slate-700/40 bg-slate-900/60 px-4 py-2 font-mono text-xs uppercase tracking-widest text-slate-400 transition hover:border-red-800/40 hover:text-white">Map</Link>
            <Link href="/sightings" className="rounded-xl border border-slate-700/40 bg-slate-900/60 px-4 py-2 font-mono text-xs uppercase tracking-widest text-slate-400 transition hover:border-red-800/40 hover:text-white">Feed</Link>
            <Link href="/stats" className="rounded-xl border border-red-700/50 bg-red-950/20 px-4 py-2 font-mono text-xs uppercase tracking-widest text-red-300">Stats</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-4 px-4 py-4 lg:space-y-6 lg:px-6 lg:py-8">

        {/* Top KPI row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total */}
          <div className="rounded-2xl border border-slate-800/40 bg-[#0a0a0c] p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.42em] text-slate-500">Total Sightings</p>
            <p className="mt-3 font-mono text-5xl font-bold tabular-nums text-white">{total}</p>
            <p className="mt-1 font-mono text-[10px] text-slate-600">All time</p>
          </div>

          {/* Most dangerous */}
          <div className="rounded-2xl border border-red-950/30 bg-[#0d080a] p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.42em] text-slate-500">Hottest Zone</p>
            <p className="mt-3 font-mono text-2xl font-bold text-red-400">{mostDangerous ? mostDangerous[0] : '—'}</p>
            {mostDangerous && (
              <p className="mt-1 font-mono text-[10px] text-slate-600">{mostDangerous[1]} reports</p>
            )}
          </div>

          {/* Busiest hour */}
          <div className="rounded-2xl border border-amber-950/30 bg-[#0c0b08] p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.42em] text-slate-500">Peak Hour</p>
            <p className="mt-3 font-mono text-3xl font-bold text-amber-400">
              {busiestHour ? fmt12(Number(busiestHour[0])) : '—'}
            </p>
            {busiestHour && (
              <p className="mt-1 font-mono text-[10px] text-slate-600">{busiestHour[1]} reports</p>
            )}
          </div>

          {/* JAI */}
          <div className="rounded-2xl border p-6" style={{ borderColor: `${jaiColor}30`, background: `${jaiColor}08` }}>
            <p className="font-mono text-[10px] uppercase tracking-[0.42em] text-slate-500">Activity Index</p>
            <div className="mt-3 flex items-end gap-2">
              <p style={{ color: jaiColor }} className="font-mono text-5xl font-bold tabular-nums">{jai}</p>
              <p style={{ color: jaiColor }} className="mb-1 font-mono text-[10px] uppercase tracking-widest opacity-80">{jaiLabel}</p>
            </div>
            {/* gauge bar */}
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full transition-all" style={{ width: `${jai}%`, background: jaiColor }} />
            </div>
            <p className="mt-1 font-mono text-[9px] text-slate-600">Weighted by threat level + recency</p>
          </div>
        </div>

        {/* Middle row */}
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">

          {/* Threat breakdown */}
          <div className="rounded-2xl border border-slate-800/40 bg-[#0a0a0c] p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.42em] text-slate-500">Threat Breakdown</p>
            <div className="mt-6 space-y-4">
              {([['RUN', '#ef4444'], ['Approaching', '#f59e0b'], ['Spotted', '#22d3ee']] as const).map(([t, color]) => {
                const count = threatCounts[t] ?? 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const labels: Record<string, string> = { Spotted: '👀 Spotted', Approaching: '⚠️ Approaching', RUN: '🚨 RUN' };
                return (
                  <div key={t}>
                    <div className="flex items-center justify-between">
                      <span style={{ color }} className="font-mono text-xs">{labels[t]}</span>
                      <span className="font-mono text-xs tabular-nums text-slate-400">{count} <span className="text-slate-600">({pct}%)</span></span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Location ranking */}
          <div className="rounded-2xl border border-slate-800/40 bg-[#0a0a0c] p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.42em] text-slate-500">Location Ranking</p>
            <div className="mt-6 space-y-3">
              {sortedLocations.length === 0 && (
                <p className="font-mono text-xs text-slate-600">No data yet.</p>
              )}
              {sortedLocations.slice(0, 7).map(([loc, count], i) => {
                const pct = sortedLocations[0]?.[1] ? (count / sortedLocations[0][1]) * 100 : 0;
                const color = i === 0 ? '#ef4444' : i === 1 ? '#f59e0b' : '#64748b';
                return (
                  <div key={loc}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-slate-300">{i + 1}. {loc}</span>
                      <span style={{ color }} className="font-mono text-xs tabular-nums font-bold">{count}</span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Hourly chart */}
        <div className="rounded-2xl border border-slate-800/40 bg-[#0a0a0c] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.42em] text-slate-500">Activity by Hour of Day</p>
          <div className="mt-6 flex items-end gap-1" style={{ height: '100px' }}>
            {Array.from({ length: 24 }, (_, h) => {
              const count = hourly[h] ?? 0;
              const heightPct = (count / maxHourCount) * 100;
              const active = count > 0;
              const isPeak = busiestHour && Number(busiestHour[0]) === h;
              return (
                <div key={h} className="group relative flex flex-1 flex-col items-center justify-end" style={{ height: '100px' }}>
                  <div
                    className="w-full rounded-t transition-all"
                    style={{
                      height: `${Math.max(heightPct, active ? 4 : 1)}%`,
                      background: isPeak ? '#ef4444' : active ? '#f59e0b' : '#1e293b',
                      opacity: active ? 1 : 0.3,
                    }}
                  />
                  {/* Tooltip */}
                  {active && (
                    <div className="absolute bottom-full mb-1 hidden w-max rounded-lg border border-slate-700/50 bg-[#0d0d10] px-2 py-1 font-mono text-[9px] text-white shadow-xl group-hover:block">
                      {fmt12(h)}: {count}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* X-axis labels */}
          <div className="mt-1 flex gap-1">
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="flex-1 text-center font-mono text-[8px] tabular-nums text-slate-700">
                {h % 6 === 0 ? fmt12(h).replace(' ', '') : ''}
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}

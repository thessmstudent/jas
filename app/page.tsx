import dynamic from 'next/dynamic';
import Link from 'next/link';

const MapDashboard = dynamic(() => import('@/components/MapDashboard'), { ssr: false });

export default function HomePage() {
  return (
    <main className="flex h-[100dvh] flex-col bg-[#070707] text-[#f9fafb]">
      {/* Desktop-only header */}
      <header className="hidden lg:block flex-shrink-0 border-b border-red-950/40 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.34em] text-amber-300/90">Jedi Alert System</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">J.A.S.</h1>
          </div>
          <nav className="flex items-center gap-3">
            <Link className="rounded-xl border border-red-700/50 bg-red-950/20 px-4 py-2 font-mono text-xs uppercase tracking-widest text-red-300" href="/">Map</Link>
            <Link className="rounded-xl border border-slate-800/70 bg-slate-900/75 px-4 py-2 font-mono text-xs uppercase tracking-widest text-slate-300 transition hover:border-red-500/70 hover:text-white" href="/sightings">Feed</Link>
            <Link className="rounded-xl border border-slate-800/70 bg-slate-900/75 px-4 py-2 font-mono text-xs uppercase tracking-widest text-slate-300 transition hover:border-red-500/70 hover:text-white" href="/stats">Stats</Link>
          </nav>
        </div>
      </header>

      {/* Map — full screen on mobile, card on desktop */}
      <div className="relative flex-1 overflow-hidden pb-14 lg:p-4 lg:pb-4">
        <div className="h-full overflow-hidden lg:rounded-3xl lg:border lg:border-red-950/40 lg:shadow-[0_25px_80px_rgba(0,0,0,0.55)]">
          <MapDashboard />
        </div>
      </div>
    </main>
  );
}

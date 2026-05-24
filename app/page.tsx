import dynamic from 'next/dynamic';
import Link from 'next/link';

const MapDashboard = dynamic(() => import('@/components/MapDashboard'), { ssr: false });

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#070707] text-[#f9fafb]">
      <header className="border-b border-red-950/40 px-6 py-5 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.34em] text-amber-300/90">Jedi Alert System</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">J.A.S.</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">Know where he is. Stay safe. Crowdsourced campus tracking for NCSSM.</p>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <Link className="rounded-xl border border-slate-800/70 bg-slate-900/75 px-4 py-2 transition hover:border-red-500/70 hover:text-white" href="/">Map</Link>
            <Link className="rounded-xl border border-slate-800/70 bg-slate-900/75 px-4 py-2 transition hover:border-red-500/70 hover:text-white" href="/sightings">Sightings Feed</Link>
            <Link className="rounded-xl border border-slate-800/70 bg-slate-900/75 px-4 py-2 transition hover:border-red-500/70 hover:text-white" href="/stats">Stats</Link>
          </nav>
        </div>
      </header>
      <section className="mx-auto flex min-h-[calc(100vh-96px)] max-w-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="relative flex-1 overflow-hidden rounded-3xl border border-red-950/40 bg-[#090909]/90 shadow-[0_25px_80px_rgba(0,0,0,0.55)]">
          <MapDashboard />
        </div>
      </section>
    </main>
  );
}

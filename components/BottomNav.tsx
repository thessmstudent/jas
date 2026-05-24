'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-red-950/30 bg-[#080808]/96 backdrop-blur-md lg:hidden">
      <div className="flex">
        {[
          { href: '/', label: 'Map' },
          { href: '/sightings', label: 'Feed' },
          { href: '/stats', label: 'Stats' },
        ].map(({ href, label }) => (
          <Link key={href} href={href}
            className={`flex flex-1 items-center justify-center py-4 font-mono text-xs uppercase tracking-widest transition ${
              pathname === href ? 'text-red-400' : 'text-slate-600 active:text-slate-400'
            }`}>
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

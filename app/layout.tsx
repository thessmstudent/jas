import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'J.A.S. — Jedi Alert System',
  description: 'Crowdsourced monster sighting tracker for NCSSM.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

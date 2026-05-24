import { NextResponse } from 'next/server';
import { getLatestSighting } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const latest = await getLatestSighting();
  if (!latest) {
    return NextResponse.json({ sighting: null });
  }
  return NextResponse.json({ sighting: latest });
}

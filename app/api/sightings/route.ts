import { NextResponse } from 'next/server';
import { insertSighting, getSightings, Sighting } from '@/lib/db';
import { join } from 'path';
import { mkdirSync, writeFileSync, existsSync } from 'fs';

export const dynamic = 'force-dynamic';

const uploadDir = join(process.cwd(), 'public', 'uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

const mapThreat = (value: string | null) => {
  if (value === '⚠️ Approaching' || value === 'Approaching') return 'Approaching';
  if (value === '🚨 RUN' || value === 'RUN') return 'RUN';
  return 'Spotted';
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const all = url.searchParams.get('all') === 'true';
  const sightings = getSightings(all);
  return NextResponse.json({ sightings });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const location_name = String(formData.get('location_name') || 'Unknown Location');
  const lat = Number(formData.get('lat') || 36.0194);
  const lng = Number(formData.get('lng') || -78.9207);
  const description = String(formData.get('description') || '').slice(0, 280) || null;
  const reporter_name = String(formData.get('reporter_name') || 'Anonymous Witness').trim() || 'Anonymous Witness';
  const threat_level = mapThreat(String(formData.get('threat_level') || 'Spotted'));
  const file = formData.get('photo');
  let photo_path: string | null = null;

  if (file && typeof file !== 'string' && 'arrayBuffer' in file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const path = join(uploadDir, filename);
    writeFileSync(path, buffer);
    photo_path = `/uploads/${filename}`;
  }

  const sighting: Omit<Sighting, 'id'> = {
    created_at: new Date().toISOString(),
    location_name,
    lat,
    lng,
    description,
    photo_path,
    reporter_name,
    threat_level,
  };

  const inserted = insertSighting(sighting);
  return NextResponse.json({ sighting: inserted }, { status: 201 });
}

import { createClient } from '@libsql/client';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';

function makeClient() {
  if (process.env.TURSO_DATABASE_URL) {
    return createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  // local dev: use a local SQLite file
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  return createClient({ url: `file:${join(dataDir, 'jas.db')}` });
}

const client = makeClient();

const ready = client.execute(`
  CREATE TABLE IF NOT EXISTS sightings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    location_name TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    description TEXT,
    photo_path TEXT,
    reporter_name TEXT NOT NULL,
    threat_level TEXT NOT NULL
  )
`);

export type Sighting = {
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

export async function getSightings(_all = false): Promise<Sighting[]> {
  await ready;
  const midnight = new Date();
  midnight.setUTCHours(0, 0, 0, 0);
  const res = await client.execute({
    sql: 'SELECT * FROM sightings WHERE created_at >= ? ORDER BY created_at DESC',
    args: [midnight.toISOString()],
  });
  return res.rows as unknown as Sighting[];
}

export async function getLatestSighting(): Promise<Sighting | null> {
  await ready;
  const midnight = new Date();
  midnight.setUTCHours(0, 0, 0, 0);
  const res = await client.execute({
    sql: 'SELECT * FROM sightings WHERE created_at >= ? ORDER BY created_at DESC LIMIT 1',
    args: [midnight.toISOString()],
  });
  return (res.rows[0] as unknown as Sighting) ?? null;
}

export async function insertSighting(sighting: Omit<Sighting, 'id'>): Promise<Sighting & { id: number }> {
  await ready;
  const res = await client.execute({
    sql: 'INSERT INTO sightings (created_at, location_name, lat, lng, description, photo_path, reporter_name, threat_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [
      sighting.created_at,
      sighting.location_name,
      sighting.lat,
      sighting.lng,
      sighting.description,
      sighting.photo_path,
      sighting.reporter_name,
      sighting.threat_level,
    ],
  });
  return { id: Number(res.lastInsertRowid), ...sighting };
}

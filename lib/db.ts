import { DatabaseSync } from 'node:sqlite';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';

// On Vercel the project root is read-only; use /tmp instead
const dataDir = process.env.VERCEL ? '/tmp' : join(process.cwd(), 'data');
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(join(dataDir, 'jas.db'));

db.exec('PRAGMA journal_mode = WAL');
db.exec(`
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

export const getSightings = (all = false): Sighting[] => {
  if (all) {
    return db.prepare('SELECT * FROM sightings ORDER BY created_at DESC').all() as Sighting[];
  }
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  return db.prepare('SELECT * FROM sightings WHERE created_at >= ? ORDER BY created_at DESC').all(cutoff) as Sighting[];
};

export const getLatestSighting = (): Sighting | null => {
  return (db.prepare('SELECT * FROM sightings ORDER BY created_at DESC LIMIT 1').get() as Sighting) ?? null;
};

export const insertSighting = (sighting: Omit<Sighting, 'id'>): Sighting & { id: number } => {
  const result = db.prepare(
    'INSERT INTO sightings (created_at, location_name, lat, lng, description, photo_path, reporter_name, threat_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    sighting.created_at,
    sighting.location_name,
    sighting.lat,
    sighting.lng,
    sighting.description,
    sighting.photo_path,
    sighting.reporter_name,
    sighting.threat_level
  );
  return { id: Number(result.lastInsertRowid), ...sighting };
};

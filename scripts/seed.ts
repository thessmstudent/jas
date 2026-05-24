import { DatabaseSync } from 'node:sqlite';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const dataDir = join(process.cwd(), 'data');
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
  );
`);

db.prepare('DELETE FROM sightings').run();

const now = Date.now();
const hr = 3_600_000;
const min = 60_000;

// All coordinates relative to real NCSSM campus: 36.0194, -78.9207
const sightings = [
  {
    offset: 8 * min,
    location_name: 'Main Building',
    lat: 36.0202,
    lng: -78.9209,
    description: 'Spotted near main entrance moving at pace. Avoid front corridor — heading east.',
    reporter_name: 'ShadowObserver',
    threat_level: 'Approaching',
  },
  {
    offset: 35 * min,
    location_name: 'Zeiss',
    lat: 36.0198,
    lng: -78.9211,
    description: 'Lurking by Zeiss entrance. Made sustained eye contact with two students. Recommend detour.',
    reporter_name: 'Anonymous Witness',
    threat_level: 'Spotted',
  },
  {
    offset: 1.2 * hr,
    location_name: 'The Pit',
    lat: 36.0194,
    lng: -78.9205,
    description: 'ACTIVE MOVEMENT THROUGH THE PIT. Full sprint. At least 6 witnesses. Clear the area NOW.',
    reporter_name: 'WatcherOnTheWall',
    threat_level: 'RUN',
  },
  {
    offset: 2.5 * hr,
    location_name: 'Cafeteria',
    lat: 36.0191,
    lng: -78.9203,
    description: 'Casually seated near the window. Appears calm. Low immediate threat but do not approach.',
    reporter_name: 'GhostReporter',
    threat_level: 'Spotted',
  },
  {
    offset: 4 * hr,
    location_name: 'Library',
    lat: 36.0200,
    lng: -78.9214,
    description: 'Occupying a study carrel on the second floor for over 40 minutes. Appears stationary.',
    reporter_name: 'Anonymous Witness',
    threat_level: 'Spotted',
  },
  {
    offset: 6 * hr,
    location_name: 'Hackspace',
    lat: 36.0189,
    lng: -78.9200,
    description: 'Attempted entry — door was locked. Paced outside for several minutes, then departed south.',
    reporter_name: 'CodeMonitorX',
    threat_level: 'Approaching',
  },
  {
    offset: 9 * hr,
    location_name: 'Davies',
    lat: 36.0204,
    lng: -78.9196,
    description: 'Near Davies at an unusual hour. Spoke to no one. Stood outside for 15 minutes.',
    reporter_name: 'NightShift',
    threat_level: 'Approaching',
  },
  {
    offset: 14 * hr,
    location_name: 'Gym',
    lat: 36.0186,
    lng: -78.9215,
    description: 'Doing slow laps around the gym exterior. Has not entered. Still monitoring.',
    reporter_name: 'TrackWatcher',
    threat_level: 'Spotted',
  },
  {
    offset: 20 * hr,
    location_name: 'Weinstein',
    lat: 36.0196,
    lng: -78.9191,
    description: 'FULL SPRINT through Weinstein. Students scattered in both directions. Multiple independent witnesses confirmed.',
    reporter_name: 'HallMonitorPro',
    threat_level: 'RUN',
  },
  {
    offset: 31 * hr,
    location_name: 'Dorms',
    lat: 36.0209,
    lng: -78.9201,
    description: 'Knocked on three dorm room doors. No answer. Lingered in the hallway for 10 minutes. Departed calmly.',
    reporter_name: 'DormPatrol',
    threat_level: 'Approaching',
  },
];

const stmt = db.prepare(
  'INSERT INTO sightings (created_at, location_name, lat, lng, description, photo_path, reporter_name, threat_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
);

for (const s of sightings) {
  stmt.run(
    new Date(now - s.offset).toISOString(),
    s.location_name,
    s.lat,
    s.lng,
    s.description,
    null,
    s.reporter_name,
    s.threat_level
  );
}

console.log(`✅  Seeded ${sightings.length} sightings into data/jas.db`);
db.close();

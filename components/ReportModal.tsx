'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CENTER: [number, number] = [36.0194, -78.9207];

const LOCATIONS = [
  'Bryan', 'Beall', 'Library', 'PFM', 'Watts', 'Hill', 'Hunt', 'ETC', 'PEC', 'Reynolds', 'Royal', 'Field',
];

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#ef4444;border:2px solid #fff;box-shadow:0 0 10px #ef4444;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function PinPlacer({ onPlace }: { onPlace: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onPlace(e.latlng.lat, e.latlng.lng); } });
  return null;
}

type Props = { open: boolean; onClose: () => void; onSubmit: () => void };

export default function ReportModal({ open, onClose, onSubmit }: Props) {
  const [locationName, setLocationName] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [lat, setLat] = useState(CENTER[0]);
  const [lng, setLng] = useState(CENTER[1]);
  const [pinned, setPinned] = useState(false);
  const [description, setDescription] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setLocationName(''); setLat(CENTER[0]); setLng(CENTER[1]); setPinned(false);
    setDescription('');
    setPhotoFile(null); setPhotoPreview(null); setError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleLocationInput = (val: string) => {
    setLocationName(val);
    const filtered = LOCATIONS.filter((l) => l.toLowerCase().includes(val.toLowerCase()));
    setSuggestions(filtered);
    setShowSug(true);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName.trim()) { setError('Location name is required.'); return; }
    setSubmitting(true); setError(null);
    try {
      const fd = new FormData();
      fd.set('location_name', locationName.trim());
      fd.set('lat', String(lat));
      fd.set('lng', String(lng));
      fd.set('description', description);
      fd.set('reporter_name', 'Anonymous Witness');
      fd.set('threat_level', 'Spotted');
      if (photoFile) fd.set('photo', photoFile);
      const res = await fetch('/api/sightings', { method: 'POST', body: fd });
      if (!res.ok) throw new Error();
      onSubmit();
    } catch {
      setError('Transmission failed. Check connection and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/80 backdrop-blur-sm lg:items-center lg:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative flex w-full max-h-[92dvh] flex-col overflow-hidden rounded-t-3xl border border-red-950/50 bg-[#080808] shadow-[0_-20px_80px_rgba(0,0,0,0.9)] lg:max-w-3xl lg:max-h-[90vh] lg:rounded-3xl lg:shadow-[0_40px_120px_rgba(0,0,0,0.95)]">

        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 lg:hidden">
          <div className="h-1 w-10 rounded-full bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-red-950/30 bg-[#0a0808] px-5 py-3 lg:px-6 lg:py-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-amber-400/60">J.A.S. // FIELD REPORT</p>
            <h2 className="mt-0.5 font-mono text-base font-bold tracking-tight text-white lg:text-lg">Submit Sighting</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700/40 font-mono text-xs text-slate-500 transition hover:border-red-800/50 hover:text-red-400">
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden">

            {/* Fields */}
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5 lg:p-6">

              {/* Location */}
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.38em] text-slate-500">Location *</label>
                <div className="relative">
                  <input
                    type="text" value={locationName}
                    onChange={(e) => handleLocationInput(e.target.value)}
                    onFocus={() => { setSuggestions(locationName ? suggestions : LOCATIONS); setShowSug(true); }}
                    onBlur={() => setTimeout(() => setShowSug(false), 140)}
                    placeholder="e.g. Library"
                    className="w-full rounded-xl border border-slate-700/50 bg-[#101013] px-4 py-3 font-mono text-sm text-white placeholder-slate-700 outline-none focus:border-red-800/60"
                    autoComplete="off"
                  />
                  {showSug && suggestions.length > 0 && (
                    <ul className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-slate-700/50 bg-[#0f0f12] shadow-2xl">
                      {suggestions.map((loc) => (
                        <li key={loc} onMouseDown={() => { setLocationName(loc); setShowSug(false); }}
                          className="cursor-pointer px-4 py-2.5 font-mono text-xs text-slate-300 transition hover:bg-red-950/40 hover:text-white">
                          {loc}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {/* Quick-select chips */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {LOCATIONS.map((loc) => (
                    <button key={loc} type="button" onClick={() => { setLocationName(loc); setShowSug(false); }}
                      className={`rounded-lg border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest transition active:scale-95 ${
                        locationName === loc
                          ? 'border-red-700/60 bg-red-950/30 text-red-300'
                          : 'border-slate-800/50 bg-slate-900/60 text-slate-400 hover:border-red-900/50 hover:text-red-300'
                      }`}>
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.38em] text-slate-500">
                  <span>Notes</span>
                  <span className="normal-case tabular-nums">{description.length}/280</span>
                </label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 280))}
                  placeholder="Direction of movement, behavior, details..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-700/50 bg-[#101013] px-4 py-3 font-mono text-sm text-white placeholder-slate-700 outline-none focus:border-red-800/60" />
              </div>

              {/* Photo */}
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.38em] text-slate-500">Evidence Photo</label>
                <div onClick={() => fileRef.current?.click()}
                  className="flex min-h-[64px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700/40 bg-[#0d0d10] transition hover:border-red-900/40 active:scale-[0.98]">
                  {photoPreview
                    ? <img src={photoPreview} alt="preview" className="max-h-32 rounded-lg object-contain p-2" />
                    : <><span className="text-2xl">📷</span><p className="font-mono text-[10px] text-slate-600">Tap to attach photo</p></>}
                </div>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
              </div>

              {error && (
                <p className="rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-2 font-mono text-xs text-red-400">{error}</p>
              )}
            </div>

            {/* Desktop-only: mini map */}
            <div className="hidden w-72 flex-shrink-0 flex-col border-l border-slate-800/40 bg-[#070709] lg:flex">
              <div className="border-b border-slate-800/40 px-4 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.38em] text-slate-500">Pin Exact Location</p>
                <p className="mt-1 font-mono text-[10px] text-slate-600">Click map to place marker</p>
              </div>
              <div className="flex-1">
                <MapContainer center={CENTER} zoom={17} scrollWheelZoom={false} className="h-full w-full min-h-[280px]" zoomControl={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="" />
                  <PinPlacer onPlace={(la, ln) => { setLat(la); setLng(ln); setPinned(true); }} />
                  {pinned && <Marker position={[lat, lng]} icon={pinIcon} />}
                </MapContainer>
              </div>
              <div className="border-t border-slate-800/40 px-4 py-3">
                <p className="font-mono text-[9px] tabular-nums text-amber-400/60">
                  {pinned ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'No pin — using campus center'}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-shrink-0 gap-3 border-t border-red-950/30 px-5 py-4 lg:px-6">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-slate-700/40 px-4 py-3 font-mono text-xs uppercase tracking-widest text-slate-500 transition hover:text-white active:scale-95">
              Abort
            </button>
            <button type="submit" disabled={submitting}
              className="flex-[2] rounded-xl bg-red-600 px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.22em] text-white shadow-lg transition hover:bg-red-500 active:scale-95 disabled:opacity-40">
              {submitting ? 'Transmitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

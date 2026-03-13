'use client';

/**
 * GhostFlight — Animated demo aircraft that flies across the map
 * 
 * Drop into your Leaflet map component:
 *   import { useGhostFlight } from '@/components/map/GhostFlight'
 *   
 *   // Inside your map component (after map is initialized):
 *   useGhostFlight(mapRef.current)
 * 
 * Works with vanilla Leaflet.
 * No backend. No real data. Purely for demo.
 */

import { useEffect, useRef } from 'react';

// ─── Flight paths (lon/lat pairs → Leaflet [lat, lon]) ──────────────────────
// Three routes that look like real UK/Europe traffic patterns
const FLIGHT_ROUTES = [
  {
    icao: 'AWX001',
    callsign: 'GHOST-1',
    alt_ft: 34000,
    speed_kts: 485,
    heading: 127,
    type: 'B738',
    cooperative: false, // no ADS-B — pure MLAT ghost
    color: '#FF4444',   // red = non-cooperative
    waypoints: [
      [51.80, -2.50],   // enter west
      [51.72, -2.10],
      [51.65, -1.70],
      [51.58, -1.30],
      [51.50, -0.80],
      [51.42, -0.35],
      [51.35,  0.10],   // exit east
    ],
    durationMs: 28000,
  },
  {
    icao: 'AWX002',
    callsign: 'DELTA-7',
    alt_ft: 28500,
    speed_kts: 420,
    heading: 195,
    type: 'A320',
    cooperative: true,
    color: '#3DDC97',   // green = ADS-B
    waypoints: [
      [52.10, -0.90],   // enter north
      [51.95, -0.85],
      [51.80, -0.80],
      [51.65, -0.75],
      [51.50, -0.70],
      [51.35, -0.65],
      [51.15, -0.60],   // exit south
    ],
    durationMs: 22000,
  },
  {
    icao: 'AWX003',
    callsign: 'GHOST-3',
    alt_ft: 41000,
    speed_kts: 510,
    heading: 78,
    type: 'UNKNOWN',
    cooperative: false,
    color: '#FFB020',   // amber = uncertain
    waypoints: [
      [51.60, -2.20],
      [51.55, -1.60],
      [51.52, -1.00],
      [51.50, -0.40],
      [51.48,  0.20],
      [51.46,  0.80],
    ],
    durationMs: 32000,
  },
];

// ─── SVG aircraft icon (rotates with heading) ────────────────────────────────
function makeAircraftIcon(color: string, heading: number, cooperative: boolean) {
  // Dynamic import guard — L only exists client-side
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const L = require('leaflet');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <g transform="rotate(${heading}, 16, 16)">
        <!-- Aircraft body -->
        <path d="M16 4 L18 14 L28 18 L28 20 L18 18 L17 26 L20 27 L20 28 L16 27 L12 28 L12 27 L15 26 L14 18 L4 20 L4 18 L14 14 Z"
              fill="${color}" opacity="0.95"/>
        ${!cooperative ? `
        <!-- Ghost ring (non-cooperative) -->
        <circle cx="16" cy="16" r="14" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.6"/>
        ` : ''}
      </g>
      ${!cooperative ? `
      <!-- Pulse ring animation -->
      <circle cx="16" cy="16" r="6" fill="${color}" opacity="0.3">
        <animate attributeName="r" values="6;14;6" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite"/>
      </circle>
      ` : ''}
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// ─── Trail polyline (last N positions) ───────────────────────────────────────
const TRAIL_LENGTH = 8;

// ─── Interpolate between two waypoints ───────────────────────────────────────
function lerp(a: [number, number], b: [number, number], t: number): [number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
  ];
}

// ─── Get position along entire route given progress 0→1 ──────────────────────
function getPositionAlongRoute(
  waypoints: number[][],
  progress: number
): [number, number] {
  const segments = waypoints.length - 1;
  const scaledProgress = progress * segments;
  const segIndex = Math.min(Math.floor(scaledProgress), segments - 1);
  const segProgress = scaledProgress - segIndex;
  return lerp(
    waypoints[segIndex] as [number, number],
    waypoints[segIndex + 1] as [number, number],
    segProgress
  );
}

// ─── Main hook ────────────────────────────────────────────────────────────────
export function useGhostFlight(map: any) {
  const markersRef = useRef<Record<string, any>>({});
  const trailsRef = useRef<Record<string, any[]>>({});
  const trailPolylinesRef = useRef<Record<string, any>>({});
  const startTimesRef = useRef<Record<string, number>>({});
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!map || typeof window === 'undefined') return;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const L = require('leaflet');

    // Stagger flight starts so they don't all appear at once
    const now = Date.now();
    FLIGHT_ROUTES.forEach((route, i) => {
      startTimesRef.current[route.icao] = now + i * 4500;
      trailsRef.current[route.icao] = [];
    });

    function animate() {
      const now = Date.now();

      FLIGHT_ROUTES.forEach((route) => {
        const startTime = startTimesRef.current[route.icao];
        if (now < startTime) return; // not started yet

        const elapsed = (now - startTime) % route.durationMs;
        const progress = elapsed / route.durationMs;

        const pos = getPositionAlongRoute(route.waypoints, progress);

        // Update or create marker
        if (!markersRef.current[route.icao]) {
          const icon = makeAircraftIcon(route.color, route.heading, route.cooperative);
          const marker = L.marker(pos, { icon, zIndexOffset: 1000 });

          // Popup content
          const popupHtml = `
            <div style="
              background: #0D1117;
              border: 1px solid ${route.color}44;
              border-radius: 8px;
              padding: 12px 14px;
              min-width: 200px;
              font-family: 'Courier New', monospace;
              color: #E6EAF0;
            ">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                <span style="
                  background:${route.color}22;
                  color:${route.color};
                  border:1px solid ${route.color}66;
                  padding:2px 8px;
                  border-radius:4px;
                  font-size:11px;
                  font-weight:bold;
                  letter-spacing:1px;
                ">${route.cooperative ? '● ADS-B' : '◌ MLAT ONLY'}</span>
                <span style="color:#666;font-size:11px;">${route.type}</span>
              </div>
              <div style="font-size:16px;font-weight:bold;color:${route.color};margin-bottom:6px;">
                ${route.icao} · ${route.callsign}
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:12px;">
                <div style="color:#888;">ALT</div>
                <div style="color:#E6EAF0;">${route.alt_ft.toLocaleString()} ft</div>
                <div style="color:#888;">SPD</div>
                <div style="color:#E6EAF0;">${route.speed_kts} kts</div>
                <div style="color:#888;">HDG</div>
                <div style="color:#E6EAF0;">${route.heading}°</div>
                <div style="color:#888;">METHOD</div>
                <div style="color:#3DDC97;">${route.cooperative ? 'ADS-B+MLAT' : 'TDOA/MLAT'}</div>
              </div>
              ${!route.cooperative ? `
              <div style="
                margin-top:8px;
                padding:6px 8px;
                background:#FF444411;
                border:1px solid #FF444433;
                border-radius:4px;
                font-size:11px;
                color:#FF8888;
              ">
                ⚠ Non-cooperative · No transponder broadcast
              </div>` : ''}
              <div style="
                margin-top:8px;
                padding:4px 6px;
                background:#3DDC9711;
                border-radius:4px;
                font-size:10px;
                color:#3DDC97;
                font-family:monospace;
              ">
                HCS: 0.0.7968510 · DEMO
              </div>
            </div>
          `;

          marker.bindPopup(popupHtml, {
            className: 'aw-ghost-popup',
            maxWidth: 260,
          });

          marker.addTo(map);
          markersRef.current[route.icao] = marker;
        } else {
          // Move existing marker
          markersRef.current[route.icao].setLatLng(pos);
        }

        // Update trail
        const trail = trailsRef.current[route.icao];
        trail.push([...pos]);
        if (trail.length > TRAIL_LENGTH) trail.shift();

        // Update or create trail polyline
        if (trail.length >= 2) {
          if (!trailPolylinesRef.current[route.icao]) {
            const poly = L.polyline(trail, {
              color: route.color,
              weight: 2,
              opacity: 0.5,
              dashArray: '4, 4',
            });
            poly.addTo(map);
            trailPolylinesRef.current[route.icao] = poly;
          } else {
            trailPolylinesRef.current[route.icao].setLatLngs(trail);
          }
        }
      });

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      // Clean up markers and trails
      Object.values(markersRef.current).forEach((m) => m.remove());
      Object.values(trailPolylinesRef.current).forEach((p) => p.remove());
      markersRef.current = {};
      trailsRef.current = {};
      trailPolylinesRef.current = {};
      startTimesRef.current = {};
    };
  }, [map]);
}

export default useGhostFlight;

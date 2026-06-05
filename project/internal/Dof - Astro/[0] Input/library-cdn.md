# CDN Dependencies — DOF·ASTRO

---

## 1. Leaflet.js — Interactive Map

```
CSS:
https://unpkg.com/leaflet@1.9.4/dist/leaflet.css

JS:
https://unpkg.com/leaflet@1.9.4/dist/leaflet.js

Provider : unpkg.com
Version  : 1.9.4 (Latest Stable)
Size     : ~142KB (JS) + ~5KB (CSS)
Purpose  : Interactive map, marker, drag, click event
License  : BSD-2-Clause
```

---

## 2. Luxon — Date & Time

```
JS:
https://cdn.jsdelivr.net/npm/luxon@3.4.4/build/global/luxon.min.js

Provider : jsdelivr.net
Version  : 3.4.4
Size     : ~72KB (minified)
Purpose  : Timezone management, DateTime manipulation,
           IANA timezone database, warp time engine
License  : MIT
```

---

## 3. SwissEph WASM — Ephemeris Engine

```
JS (ES Module):
https://cdn.jsdelivr.net/gh/prolaxu/swisseph-wasm@main/src/swisseph.js

Provider  : jsdelivr.net (via GitHub)
Repository: github.com/prolaxu/swisseph-wasm
Version   : @main (latest commit)
Purpose   : Swiss Ephemeris WebAssembly port
            → swe.julday()
            → swe.sidtime()
            → swe.set_topo()
            → swe.calc_ut()
            → swe.fixstar2_ut()
License   : AGPL-3.0 (Swiss Ephemeris License)
```

---

## 4. Nominatim API — Geocoding

```
Endpoint:
https://nominatim.openstreetmap.org/search
  ?q={query}
  &format=json
  &limit=6

Provider : OpenStreetMap Foundation
Version  : API v1 (current)
Size     : —  (REST API, no local bundle)
Purpose  : City/location search → lat/lon coordinates
License  : ODbL (OpenStreetMap Data)

Usage Policy:
  • Max 1 request/second (sudah ada debounce 380ms)
  • Wajib set Accept-Language header
  • Tidak untuk bulk geocoding
```

---

## 5. CartoDB Positron — Map Tiles

```
Tile URL:
https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png

Provider   : CARTO (via Leaflet tileLayer)
Subdomains : a, b, c, d
MaxZoom    : 19
Purpose    : Minimalist light basemap (Adidas-compatible)
License    : CC BY 3.0 — requires attribution
Attribution: © CARTO · © OpenStreetMap contributors
```

---

## Ringkasan

```
┌───────────────────────┬─────────────────┬──────────────┬───────────────┐
│ Library               │ Provider        │ Version      │ Load Type     │
├───────────────────────┼─────────────────┼──────────────┼───────────────┤
│ Leaflet.js (CSS)      │ unpkg.com       │ 1.9.4        │ <link>        │
│ Leaflet.js (JS)       │ unpkg.com       │ 1.9.4        │ <script>      │
│ Luxon                 │ jsdelivr.net    │ 3.4.4        │ <script>      │
│ SwissEph WASM         │ jsdelivr.net/gh │ @main        │ ES Module     │
│ Nominatim API         │ OSM Foundation  │ v1           │ fetch()       │
│ CartoDB Positron      │ CARTO           │ current      │ Leaflet Tile  │
└───────────────────────┴─────────────────┴──────────────┴───────────────┘

Total bundle size (estimasi):
  Leaflet JS  : ~142 KB
  Luxon       :  ~72 KB
  SwissEph    : ~2–5 MB (termasuk WASM binary)
  ─────────────────────────
  Total       : ~2.2–5.2 MB (first load)
  Runtime API : Nominatim + CartoDB tiles (on-demand)
```
// js/map.js

let map;
let currentTileLayer;
let mapWest; // Kept as placeholder/null since we render direct SVGs
let mapEast; // Kept as placeholder/null since we render direct SVGs

let currentMapMode = "MAP";

// Dicts to keep track of layers per map instance
let terminatorLayers = {}; // mapId -> { polygon, polyline }
let pathLayers = {}; // `${bodyId}_${mapId}` -> polyline
let markerLayers = {}; // `${id}_${mapId}` -> array of markers
let pathCoordsCache = {}; // `${bodyId}_${mapId}` -> last coordinates array reference

function getActiveMaps() {
  if (
    currentMapMode === "CHART" ||
    currentMapMode === "CONFIG" ||
    currentMapMode === "MATRIX"
  ) {
    return [];
  }
  return map ? [map] : [];
}

function setMapMode(mode) {
  currentMapMode = mode;
  state.mapMode = mode;

  const mapContainer = document.getElementById("map-container");
  const mapElement = document.getElementById("map");
  const splitContainer = document.getElementById("map-split-container");
  const mobileDots = document.getElementById("chart-mobile-dots");
  const astronomyData = document.getElementById("astronomy-data-container");
  const chartMatrixContainer = document.getElementById(
    "chart-matrix-container",
  );
  const luckContainer = document.getElementById("luck-container");

  if (luckContainer) {
    if (mode === "LUCK") {
      luckContainer.classList.remove("hidden");
    } else {
      luckContainer.classList.add("hidden");
    }
  }

  if (mode === "CONFIG") {
    if (mapContainer) {
      mapContainer.classList.add("hidden");
    }
    if (mapElement) {
      mapElement.classList.add("hidden");
    }
    if (splitContainer) {
      splitContainer.classList.add("hidden");
      splitContainer.classList.remove("flex");
    }
    if (mobileDots) {
      mobileDots.classList.add("hidden");
      mobileDots.classList.remove("flex");
    }
    if (astronomyData) {
      astronomyData.classList.remove("hidden");
    }
    if (chartMatrixContainer) {
      chartMatrixContainer.classList.add("hidden");
    }
  } else if (mode === "MATRIX") {
    if (mapContainer) {
      mapContainer.classList.add("hidden");
    }
    if (mapElement) {
      mapElement.classList.add("hidden");
    }
    if (splitContainer) {
      splitContainer.classList.add("hidden");
      splitContainer.classList.remove("flex");
    }
    if (mobileDots) {
      mobileDots.classList.add("hidden");
      mobileDots.classList.remove("flex");
    }
    if (astronomyData) {
      astronomyData.classList.add("hidden");
    }
    if (chartMatrixContainer) {
      chartMatrixContainer.classList.remove("hidden");
    }
    if (typeof renderAspectMatrices === "function") {
      renderAspectMatrices();
    }
  } else if (mode === "CHART") {
    if (mapContainer) {
      mapContainer.classList.remove("hidden");
    }
    if (mapElement) {
      mapElement.classList.add("hidden");
    }
    if (splitContainer) {
      splitContainer.classList.remove("hidden");
      splitContainer.classList.add("flex");
    }
    if (mobileDots) {
      mobileDots.classList.remove("hidden");
      mobileDots.classList.add("flex");
    }
    if (astronomyData) {
      astronomyData.classList.add("hidden");
    }
    if (chartMatrixContainer) {
      chartMatrixContainer.classList.add("hidden");
    }
  } else if (mode === "LUCK") {
    if (mapContainer) {
      mapContainer.classList.add("hidden");
    }
    if (mapElement) {
      mapElement.classList.add("hidden");
    }
    if (splitContainer) {
      splitContainer.classList.add("hidden");
      splitContainer.classList.remove("flex");
    }
    if (mobileDots) {
      mobileDots.classList.add("hidden");
      mobileDots.classList.remove("flex");
    }
    if (astronomyData) {
      astronomyData.classList.add("hidden");
    }
    if (chartMatrixContainer) {
      chartMatrixContainer.classList.add("hidden");
    }
    if (typeof updateLuckMode === "function") {
      updateLuckMode();
    }
  } else {
    if (mapContainer) {
      mapContainer.classList.remove("hidden");
    }
    if (splitContainer) {
      splitContainer.classList.add("hidden");
      splitContainer.classList.remove("flex");
    }
    if (mapElement) {
      mapElement.classList.remove("hidden");
    }
    if (mobileDots) {
      mobileDots.classList.add("hidden");
      mobileDots.classList.remove("flex");
    }
    if (astronomyData) {
      astronomyData.classList.add("hidden");
    }
    if (chartMatrixContainer) {
      chartMatrixContainer.classList.add("hidden");
    }
    if (map) {
      map.invalidateSize();
    }
  }

  updateMap();
}

function initMap() {
  // 1. Initialise standard MAP
  map = window.L.map("map", {
    worldCopyJump: true,
    maxBoundsViscosity: 1.0,
    minZoom: 1.5,
    zoomDelta: 0.25,
    zoomSnap: 0,
    wheelPxPerZoomLevel: 100, // Makes scroll zooming smoother
    wheelDebounceTime: 20,
    fadeAnimation: true,
    markerZoomAnimation: true,
    zoomControl: false, // Custom position instead
    attributionControl: false, // Hide default attribution for a cleaner look
    preferCanvas: true, // Eksekusi Optimalisasi: force vector layers to use Canvas rendering for smooth animations
  }).setView([15, 45], 2.2); // Initial center
  map.id = "default";

  const isDarkAtStart = document.documentElement.classList.contains("dark");
  const initialTileUrl = isDarkAtStart
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  currentTileLayer = window.L.tileLayer(initialTileUrl, {
    subdomains: "abcd",
    maxZoom: 20,
  }).addTo(map);

  // Add minimal zoom control to bottom right
  window.L.control
    .zoom({
      position: "bottomright",
    })
    .addTo(map);

  // Make the map more interactive with cursor changes
  map.getContainer().style.cursor = "crosshair";

  map.on("click", (e) => {
    const wrapped = e.latlng.wrap();
    const event = new CustomEvent("map-clicked", {
      detail: { lat: wrapped.lat, lng: wrapped.lng },
    });
    window.dispatchEvent(event);
  });

  // Wire up map mode selector dropdown
  const select = document.getElementById("MODE");
  if (select) {
    select.addEventListener("change", (e) => {
      setMapMode(e.target.value);
    });
    select.value = state.mapMode || "MAP";
  }

  // Wire up light/dark theme toggle
  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
    // Apply initial visual theme load
    const savedTheme = localStorage.getItem("theme");
    if (
      savedTheme === "dark" ||
      (savedTheme === null &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      if (currentTileLayer) {
        currentTileLayer.setUrl(
          "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        );
      }
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
      if (currentTileLayer) {
        currentTileLayer.setUrl(
          "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        );
      }
    }

    themeBtn.addEventListener("click", () => {
      const htmlEl = document.documentElement;
      if (htmlEl.classList.contains("dark")) {
        htmlEl.classList.remove("dark");
        htmlEl.classList.add("light");
        localStorage.setItem("theme", "light");
        if (currentTileLayer) {
          currentTileLayer.setUrl(
            "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          );
        }
      } else {
        htmlEl.classList.remove("light");
        htmlEl.classList.add("dark");
        localStorage.setItem("theme", "dark");
        if (currentTileLayer) {
          currentTileLayer.setUrl(
            "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          );
        }
      }
      if (window.feather) window.feather.replace();
    });
  }

  // Wire up mobile swipe indicator dots
  const splitContainer = document.getElementById("map-split-container");
  const dotWest = document.getElementById("dot-west");
  const dotEast = document.getElementById("dot-east");

  if (splitContainer && dotWest && dotEast) {
    const updateDotActiveStates = () => {
      const width = splitContainer.clientWidth;
      if (width > 0) {
        const scrollLeft = splitContainer.scrollLeft;
        // If scrolled more than 35% of the split panel container view width, select East
        const isEast = scrollLeft > width * 0.35;
        if (isEast) {
          dotWest.classList.remove(
            "bg-black",
            "dark:bg-white",
            "ring-2",
            "ring-black",
            "dark:ring-white",
            "ring-offset-2",
            "ring-offset-white",
            "dark:ring-offset-black",
          );
          dotWest.classList.add("bg-black/40", "dark:bg-white/40");
          dotEast.classList.remove("bg-black/40", "dark:bg-white/40");
          dotEast.classList.add(
            "bg-black",
            "dark:bg-white",
            "ring-2",
            "ring-black",
            "dark:ring-white",
            "ring-offset-2",
            "ring-offset-white",
            "dark:ring-offset-black",
          );
        } else {
          dotEast.classList.remove(
            "bg-black",
            "dark:bg-white",
            "ring-2",
            "ring-black",
            "dark:ring-white",
            "ring-offset-2",
            "ring-offset-white",
            "dark:ring-offset-black",
          );
          dotEast.classList.add("bg-black/40", "dark:bg-white/40");
          dotWest.classList.remove("bg-black/40", "dark:bg-white/40");
          dotWest.classList.add(
            "bg-black",
            "dark:bg-white",
            "ring-2",
            "ring-black",
            "dark:ring-white",
            "ring-offset-2",
            "ring-offset-white",
            "dark:ring-offset-black",
          );
        }
      }
    };

    splitContainer.addEventListener("scroll", updateDotActiveStates);

    dotWest.addEventListener("click", () => {
      splitContainer.scrollTo({
        left: 0,
        behavior: "smooth",
      });
    });

    dotEast.addEventListener("click", () => {
      splitContainer.scrollTo({
        left: splitContainer.clientWidth,
        behavior: "smooth",
      });
    });

    // Initial call
    updateDotActiveStates();
  }

  // Initial map mode check
  setMapMode(state.mapMode || "MAP");
}

function removeMarker(id) {
  const maps = [map];
  maps.forEach((m) => {
    if (!m) return;
    const key = `${id}_${m.id}`;
    if (markerLayers[key]) {
      markerLayers[key].forEach((marker) => {
        if (marker && marker._map) m.removeLayer(marker);
      });
      delete markerLayers[key];
    }
  });
}

function syncMarker(id, point, icon, popupContent, zIndexOffset = 1000) {
  const activeMaps = getActiveMaps();
  activeMaps.forEach((m) => {
    syncMarkerForMap(m, id, point, icon, popupContent, zIndexOffset);
  });
}

function syncMarkerForMap(
  m,
  id,
  point,
  icon,
  popupContent,
  zIndexOffset = 1000,
) {
  if (!m) return;
  const key = `${id}_${m.id}`;

  let lat = point[0];
  let lng = point[1];

  if (markerLayers[key] && markerLayers[key].length === 3) {
    // Update existing markers instead of recreating
    markerLayers[key][0].setLatLng([lat, lng - 360]);
    markerLayers[key][1].setLatLng([lat, lng]);
    markerLayers[key][2].setLatLng([lat, lng + 360]);

    markerLayers[key].forEach((marker) => {
      if (marker.getIcon().options.html !== icon.options.html) {
        marker.setIcon(icon);
      }
      marker.setZIndexOffset(zIndexOffset);

      const popup = marker.getPopup();
      if (popup && popup.getContent() !== popupContent) {
        marker.setPopupContent(popupContent);
      } else if (!popup) {
        marker.bindPopup(popupContent);
      }
    });
  } else {
    // Clear old layers just in case
    if (markerLayers[key]) {
      markerLayers[key].forEach((layer) => {
        if (layer && layer._map) layer._map.removeLayer(layer);
      });
    }
    markerLayers[key] = [];

    // Standard full map: 3 wraps for seamless loops
    const m1 = window.L.marker([lat, lng - 360], { icon, zIndexOffset })
      .addTo(m)
      .bindPopup(popupContent);
    const m2 = window.L.marker([lat, lng], { icon, zIndexOffset })
      .addTo(m)
      .bindPopup(popupContent);
    const m3 = window.L.marker([lat, lng + 360], { icon, zIndexOffset })
      .addTo(m)
      .bindPopup(popupContent);
    markerLayers[key].push(m1, m2, m3);
  }
}

function syncPathForMap(m, bodyId, coords, color) {
  if (!m) return;
  const key = `${bodyId}_${m.id}`;
  let processedCoords = coords || [];

  if (pathLayers[key]) {
    if (processedCoords.length > 0) {
      // Bypass Leaflet re-rendering if coordinates array reference is unchanged (memoized by getBodyPath)
      if (pathCoordsCache[key] === processedCoords) {
        return;
      }
      pathCoordsCache[key] = processedCoords;
      pathLayers[key].setLatLngs(processedCoords);
      pathLayers[key].setStyle({ color: color });
    } else {
      m.removeLayer(pathLayers[key]);
      delete pathLayers[key];
      delete pathCoordsCache[key];
    }
  } else {
    if (processedCoords.length > 0) {
      pathCoordsCache[key] = processedCoords;
      pathLayers[key] = window.L.polyline(processedCoords, {
        color: color,
        weight: 1.5,
        opacity: 0.5,
        dashArray: "4, 4",
      }).addTo(m);
    }
  }
}

function syncTerminatorForMap(m, sunPoint) {
  if (!m) return;
  const term = getTerminator(sunPoint[0], sunPoint[1]);

  const key = m.id;
  let polygonCoords = term.polygon;
  let polylineCoords = term.polyline;

  if (terminatorLayers[key]) {
    terminatorLayers[key].polygon.setLatLngs(polygonCoords);
    terminatorLayers[key].polyline.setLatLngs(polylineCoords);
  } else {
    const poly = window.L.polygon(polygonCoords, {
      color: "transparent",
      stroke: false,
      fillColor: "#0f172a",
      fillOpacity: 0.4,
      interactive: false,
    }).addTo(m);

    const line = window.L.polyline(polylineCoords, {
      color: "#eab308",
      weight: 2,
      opacity: 0.8,
      interactive: false,
    }).addTo(m);

    terminatorLayers[key] = { polygon: poly, polyline: line };
  }
}

// Convert fixed RA (hours) and Dec (degrees) to local Azimuth & Altitude
function getObliquity(jd) {
  if (typeof swe !== "undefined" && swe) {
    try {
      const res = swe.calc_ut(jd, -1, swe.SEFLG_SWIEPH);
      if (res && res.length >= 1) {
        return (res[0] * Math.PI) / 180;
      }
    } catch (e) {
      console.warn("Error getting obliquity from Swiss Ephemeris, using fallback", e);
    }
  }
  const T = (jd - 2451545.0) / 36525.0;
  const epsilonDeg = 23.43929111 - (46.815 * T) / 3600;
  return (epsilonDeg * Math.PI) / 180;
}

function getFixedCoordinateAzAlt(raHours, dec, date, subject) {
  if (typeof swe === "undefined" || !swe) return { az: 0, alt: 0 };
  try {
    const jd = getJD(date);
    const raDeg = raHours * 15;
    
    let az = 0;
    let alt = 0;
    let trueAlt = 0;

    if (typeof swe.azalt === "function") {
      const geopos = [subject.lng, subject.lat, subject.elevation || 0];
      const xin = [raDeg, dec, 1.0];
      const SE_EQU2HOR = 1;
      const xaz = swe.azalt(jd, SE_EQU2HOR, geopos, 0, 15, xin);
      if (xaz && xaz.length >= 2) {
        az = (xaz[0] + 180) % 360;
        alt = xaz[1];
        trueAlt = xaz[2];
      }
    }
    
    if (az === 0 && alt === 0) {
      const gstHours = swe.sidtime(jd);
      const gstDeg = gstHours * 15;
      const lstDeg = (gstDeg + subject.lng) % 360;
      let haDeg = lstDeg - raDeg;
      haDeg = ((haDeg % 360) + 360) % 360;
      const H = (haDeg * Math.PI) / 180;

      const pLat = (subject.lat * Math.PI) / 180;
      const objDec = (dec * Math.PI) / 180;

      const sinAlt =
        Math.sin(pLat) * Math.sin(objDec) +
        Math.cos(pLat) * Math.cos(objDec) * Math.cos(H);
      trueAlt = (Math.asin(Math.max(-1, Math.min(1, sinAlt))) * 180) / Math.PI;

      const cosAzCosAlt = Math.sin(objDec) - Math.sin(pLat) * sinAlt;
      const sinAzCosAlt = -Math.sin(H) * Math.cos(objDec) * Math.cos(pLat);

      if (Math.abs(sinAlt) > 0.99999) {
        az = sinAlt > 0 ? 0 : 180;
      } else {
        az = (Math.atan2(sinAzCosAlt, cosAzCosAlt) * 180) / Math.PI;
        if (az < 0) az += 360;
      }

      alt = trueAlt;
      if (trueAlt > -0.5) {
        const rArcMin = 1.02 / Math.tan((trueAlt + 10.3 / (trueAlt + 5.11)) * Math.PI / 180);
        alt = trueAlt + rArcMin / 60;
      }
    }

    return { az, alt, trueAlt };
  } catch (e) {
    console.error("Fixed coordinates transformation error", e);
    return { az: 0, alt: 0 };
  }
}

// Get projected Azimuth for any ecliptic longitude at current date-time and subject
function getEclipticAz(lon, date, subject) {
  if (typeof swe === "undefined" || !swe) return 0;
  try {
    const jd = getJD(date);
    const Ob = getObliquity(jd);
    const lonRad = (lon * Math.PI) / 180;
    const sinDec = Math.sin(Ob) * Math.sin(lonRad);
    const decRad = Math.asin(sinDec);
    const dec = (decRad * 180) / Math.PI;

    const y = Math.sin(lonRad) * Math.cos(Ob);
    const x = Math.cos(lonRad);
    const raRad = Math.atan2(y, x);
    const raHours = ((raRad * 180) / Math.PI / 15 + 24) % 24;

    const azAlt = getFixedCoordinateAzAlt(raHours, dec, date, subject);
    return azAlt.az;
  } catch (e) {
    return 0;
  }
}

function getZodiacBoundaries() {
  if (state.zodiacConfig === "IAU") {
    return [
      { label: "ARI", start: 29.8, end: 53.5 },
      { label: "TAU", start: 53.5, end: 90.1 },
      { label: "GEM", start: 90.1, end: 118.0 },
      { label: "CAN", start: 118.0, end: 138.2 },
      { label: "LEO", start: 138.2, end: 173.9 },
      { label: "VIR", start: 173.9, end: 218.0 },
      { label: "LIB", start: 218.0, end: 241.1 },
      { label: "SCO", start: 241.1, end: 247.7 },
      { label: "OPH", start: 247.7, end: 266.3 },
      { label: "SGR", start: 266.3, end: 299.7 },
      { label: "CAP", start: 299.7, end: 327.6 },
      { label: "AQR", start: 327.6, end: 351.9 },
      { label: "PSC", start: 351.9, end: 29.8 },
    ];
  } else {
    return [
      { label: "ARI", start: 0, end: 30 },
      { label: "TAU", start: 30, end: 60 },
      { label: "GEM", start: 60, end: 90 },
      { label: "CAN", start: 90, end: 120 },
      { label: "LEO", start: 120, end: 150 },
      { label: "VIR", start: 150, end: 180 },
      { label: "LIB", start: 180, end: 210 },
      { label: "SCO", start: 210, end: 240 },
      { label: "SGR", start: 240, end: 270 },
      { label: "CAP", start: 270, end: 300 },
      { label: "AQR", start: 300, end: 330 },
      { label: "PSC", start: 330, end: 360 },
    ];
  }
}

// Generate the beautiful Polar Chart SVG
function renderChartSVG(type, activeSubject, date) {
  const isZenith = type === "zenith";
  const cx = 300;
  const cy = 300;
  const R1 = 70;
  const R2 = 140;
  const R3 = 210; // Horizon outer constraint
  const R4 = 250; // Zodiac boundary ring

  const hThreshold = typeof state !== "undefined" && state.horizonThreshold !== undefined ? state.horizonThreshold : 0.0;
  const denomZenith = (90 - hThreshold) !== 0 ? (90 - hThreshold) : 1;
  const denomNadir = (hThreshold + 90) !== 0 ? (hThreshold + 90) : 1;

  // Aesthetic Styling Hooks
  const textMuted =
    "fill-neutral-400 dark:fill-neutral-600 font-mono text-[8.5px]";
  const textBold =
    "fill-neutral-700 dark:fill-neutral-300 font-sans font-extrabold text-[10px]";
  const graticuleStyle = "stroke-neutral-200 dark:stroke-neutral-850 fill-none";
  const horizonStyle = "stroke-neutral-900 dark:stroke-neutral-100 fill-none";

  let svg = `<svg viewBox="0 0 600 600" class="w-full h-full select-none" xmlns="http://www.w3.org/2050/svg" style="transform-box: fill-box; transform-origin: center;">`;

  // Calculate Sirius Azimuth dynamically as reference anchor
  let siriusAz = 0;
  const siriusStats = getBodyStats("Sirius", date, activeSubject, {
    coord: state.coordConfig,
    zodiac: state.zodiacConfig,
  });
  if (siriusStats) {
    siriusAz = siriusStats.az;
  }

  // 1. Concentric altitude grid rings
  svg += `<circle cx="${cx}" cy="${cy}" r="${R1}" stroke="currentColor" class="${graticuleStyle}" stroke-width="0.75" />`;
  svg += `<circle cx="${cx}" cy="${cy}" r="${R2}" stroke="currentColor" class="${graticuleStyle}" stroke-width="0.75" />`;
  svg += `<circle cx="${cx}" cy="${cy}" r="${R3}" stroke="currentColor" class="${horizonStyle}" stroke-width="2.5" />`;
  svg += `<circle cx="${cx}" cy="${cy}" r="${R4}" stroke="currentColor" class="${graticuleStyle}" stroke-width="0.75" />`;

  // 2. Structural sector radial dividing lines (72 total sectors divided into 3 rings)
  // Inner Ring (12 divisions, spaced 30 degrees, radius 22 to 70)
  for (let s = 0; s < 12; s++) {
    const angle = siriusAz + s * 30;
    const rad = isZenith ? ((angle - 90) * Math.PI) / 180 : ((90 - angle) * Math.PI) / 180;
    const x1 = cx + 22 * Math.cos(rad);
    const y1 = cy + 22 * Math.sin(rad);
    const x2 = cx + R1 * Math.cos(rad);
    const y2 = cy + R1 * Math.sin(rad);
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="currentColor" class="${graticuleStyle}" stroke-width="0.75" />`;
  }
  // Middle Ring (24 divisions, spaced 15 degrees, radius 70 to 140)
  for (let s = 0; s < 24; s++) {
    const angle = siriusAz + s * 15;
    const rad = isZenith ? ((angle - 90) * Math.PI) / 180 : ((90 - angle) * Math.PI) / 180;
    const x1 = cx + R1 * Math.cos(rad);
    const y1 = cy + R1 * Math.sin(rad);
    const x2 = cx + R2 * Math.cos(rad);
    const y2 = cy + R2 * Math.sin(rad);
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="currentColor" class="${graticuleStyle}" stroke-width="0.75" />`;
  }
  // Outer Ring (36 divisions, spaced 10 degrees, radius 140 to 210)
  for (let s = 0; s < 36; s++) {
    const angle = siriusAz + s * 10;
    const rad = isZenith ? ((angle - 90) * Math.PI) / 180 : ((90 - angle) * Math.PI) / 180;
    const x1 = cx + R2 * Math.cos(rad);
    const y1 = cy + R2 * Math.sin(rad);
    const x2 = cx + R3 * Math.cos(rad);
    const y2 = cy + R3 * Math.sin(rad);
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="currentColor" class="${graticuleStyle}" stroke-width="0.75" />`;
  }

  // Draw perfect vertical and horizontal cardinal reference lines (Removed for clean styling - showing labels only)

  // 3. Grid cell numbering centered in sectors, dynamically rotated following Sirius Azimuth
  // Inner Ring (01 to 12, centered at r1 = 45)
  for (let slice = 0; slice < 12; slice++) {
    const midAngle = siriusAz + slice * 30 + 15;
    const rad = isZenith ? ((midAngle - 90) * Math.PI) / 180 : ((90 - midAngle) * Math.PI) / 180;
    const name = String(slice + 1).padStart(2, "0");
    const r1 = 45;
    const x = cx + r1 * Math.cos(rad);
    const y = cy + r1 * Math.sin(rad);
    svg += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" class="${textMuted}">${name}</text>`;
  }

  // Middle Ring (13 to 36, centered at r2 = 105)
  for (let slice = 0; slice < 24; slice++) {
    const midAngle = siriusAz + slice * 15 + 7.5;
    const rad = isZenith ? ((midAngle - 90) * Math.PI) / 180 : ((90 - midAngle) * Math.PI) / 180;
    const name = String(slice + 13).padStart(2, "0");
    const r2 = 105;
    const x = cx + r2 * Math.cos(rad);
    const y = cy + r2 * Math.sin(rad);
    svg += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" class="${textMuted}">${name}</text>`;
  }

  // Outer Ring (37 to 72, centered at r3 = 175)
  for (let slice = 0; slice < 36; slice++) {
    const midAngle = siriusAz + slice * 10 + 5.0;
    const rad = isZenith ? ((midAngle - 90) * Math.PI) / 180 : ((90 - midAngle) * Math.PI) / 180;
    const name = String(slice + 37).padStart(2, "0");
    const r3 = 175;
    const x = cx + r3 * Math.cos(rad);
    const y = cy + r3 * Math.sin(rad);
    svg += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" class="${textMuted}">${name}</text>`;
  }

  // 4. Direction Labels (N, S, W, E) outside horizon
  if (isZenith) {
    // Red North at Top
    svg += `<text x="${cx}" y="42" text-anchor="middle" font-weight="900" font-size="20px" fill="#ef4444" font-family="sans-serif">N</text>`;
    // Neutral South at Bottom
    svg += `<text x="${cx}" y="568" text-anchor="middle" font-weight="900" font-size="20px" class="fill-neutral-900 dark:fill-neutral-100" font-family="sans-serif">S</text>`;
    // Neutral West at Left
    svg += `<text x="42" y="${cy}" text-anchor="middle" dominant-baseline="central" font-weight="900" font-size="20px" class="fill-neutral-900 dark:fill-neutral-100" font-family="sans-serif">W</text>`;
    // Neutral East at Right
    svg += `<text x="558" y="${cy}" text-anchor="middle" dominant-baseline="central" font-weight="900" font-size="20px" class="fill-neutral-900 dark:fill-neutral-100" font-family="sans-serif">E</text>`;
  } else {
    // Blue South at Top
    svg += `<text x="${cx}" y="42" text-anchor="middle" font-weight="900" font-size="20px" fill="#3b82f6" font-family="sans-serif">S</text>`;
    // Neutral North at Bottom
    svg += `<text x="${cx}" y="568" text-anchor="middle" font-weight="900" font-size="20px" class="fill-neutral-900 dark:fill-neutral-100" font-family="sans-serif">N</text>`;
    // Neutral West at Left
    svg += `<text x="42" y="${cy}" text-anchor="middle" dominant-baseline="central" font-weight="900" font-size="20px" class="fill-neutral-900 dark:fill-neutral-100" font-family="sans-serif">W</text>`;
    // Neutral East at Right
    svg += `<text x="558" y="${cy}" text-anchor="middle" dominant-baseline="central" font-weight="900" font-size="20px" class="fill-neutral-900 dark:fill-neutral-100" font-family="sans-serif">E</text>`;
  }

  // 5. Observer Celestial/Terrestrial Center Point (Zenith or Nadir, NILAI KUNCI: Nomor 0)
  const centerTitle = isZenith ? "ZENITH" : "NADIR";
  // Small subtitle text
  svg += `<text x="${cx}" y="${cy - 23}" text-anchor="middle" font-size="7.5px" font-weight="900" class="fill-neutral-400 dark:fill-neutral-500 uppercase tracking-[0.2em] leading-none">${centerTitle}</text>`;
  // Center emblem - displays TZ (white) for Zenith, TN (black) for Nadir (using centralized entity functions)
  const centerEntityId = isZenith
    ? "terrestrial-zenith"
    : "terrestrial-nadir";
  const centerEntity = ENTITIES.find((e) => e.id === centerEntityId);
  if (centerEntity) {
    svg += getChartMarkerSVG(centerEntity, cx, cy);
  }

  // 6. Project Zodiac Ring around the Horizon boundary
  const boundaries = getZodiacBoundaries();
  const projectedZodiacs = boundaries.map((b) => ({
    label: b.label,
    startAz: getEclipticAz(b.start, date, activeSubject),
    endAz: getEclipticAz(b.end, date, activeSubject),
  }));

  projectedZodiacs.forEach((pb) => {
    // Segment divider line at startAz
    const startRad =
      ((isZenith ? pb.startAz - 90 : 90 - pb.startAz) * Math.PI) / 180;
    const x3 = cx + R3 * Math.cos(startRad);
    const y3 = cy + R3 * Math.sin(startRad);
    const x4 = cx + R4 * Math.cos(startRad);
    const y4 = cy + R4 * Math.sin(startRad);

    svg += `<line x1="${x3}" y1="${y3}" x2="${x4}" y2="${y4}" stroke="currentColor" class="stroke-neutral-300 dark:stroke-neutral-800" stroke-width="1.25" />`;

    // Label position centered in the projected arc
    let diff = pb.endAz - pb.startAz;
    if (diff < 0) diff += 360;
    const midAz = (pb.startAz + diff / 2) % 360;
    const midRad = ((isZenith ? midAz - 90 : 90 - midAz) * Math.PI) / 180;
    const lx = cx + 230 * Math.cos(midRad);
    const ly = cy + 230 * Math.sin(midRad);

    svg += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="central" class="${textBold}">${pb.label}</text>`;
  });

  // 7. Render Celestial Zenith & Celestial Nadir Projections
  const anchorTime = getSubjectAnchorTime(activeSubject);
  const coords = getCelestialCoordinates(
    activeSubject.lat,
    activeSubject.lng,
    anchorTime,
  );

  if (coords) {
    // 7.1 Check Celestial Zenith (CZ)
    if (state.showZenith && state.activeBodies.has("celestial-zenith")) {
      const czAzAlt = getFixedCoordinateAzAlt(
        coords.zenith.ra,
        coords.zenith.dec,
        date,
        activeSubject,
      );
      if (czAzAlt) {
        const drawCZ = isZenith ? czAzAlt.alt >= hThreshold : czAzAlt.alt < hThreshold;
        if (drawCZ) {
          const r = isZenith ? ((90 - czAzAlt.alt) / denomZenith) * R3 : ((czAzAlt.alt + 90) / denomNadir) * R3;
          const theta = isZenith
            ? ((czAzAlt.az - 90) * Math.PI) / 180
            : ((90 - czAzAlt.az) * Math.PI) / 180;
          const px = cx + r * Math.cos(theta);
          const py = cy + r * Math.sin(theta);

          const czEntity = ENTITIES.find((e) => e.id === "celestial-zenith");
          if (czEntity) {
            svg += `<g class="transition-transform duration-200 hover:scale-110">
                          ${getChartMarkerSVG(czEntity, px, py)}
                      </g>`;
          }
        }
      }
    }

    // 7.2 Check Celestial Nadir (CN)
    if (state.showNadir && state.activeBodies.has("celestial-nadir")) {
      const cnAzAlt = getFixedCoordinateAzAlt(
        coords.nadir.ra,
        coords.nadir.dec,
        date,
        activeSubject,
      );
      if (cnAzAlt) {
        const drawCN = isZenith ? cnAzAlt.alt >= hThreshold : cnAzAlt.alt < hThreshold;
        if (drawCN) {
          const r = isZenith ? ((90 - cnAzAlt.alt) / denomZenith) * R3 : ((cnAzAlt.alt + 90) / denomNadir) * R3;
          const theta = isZenith
            ? ((cnAzAlt.az - 90) * Math.PI) / 180
            : ((90 - cnAzAlt.az) * Math.PI) / 180;
          const px = cx + r * Math.cos(theta);
          const py = cy + r * Math.sin(theta);

          const cnEntity = ENTITIES.find((e) => e.id === "celestial-nadir");
          if (cnEntity) {
            svg += `<g class="transition-transform duration-200 hover:scale-110">
                          ${getChartMarkerSVG(cnEntity, px, py)}
                      </g>`;
          }
        }
      }
    }
  }

  // 8. Render active celestial bodies
  BODIES.forEach((b) => {
    if (!state.activeBodies.has(b.id)) return;

    const stats = getBodyStats(b.id, date, activeSubject, {
      coord: state.coordConfig,
      zodiac: state.zodiacConfig,
    });
    if (!stats) return;

    const alt = stats.alt;
    const az = stats.az;

    const drawOnThisChart = isZenith ? alt >= hThreshold : alt < hThreshold;
    if (!drawOnThisChart) return;

    const r = isZenith ? ((90 - alt) / denomZenith) * R3 : ((alt + 90) / denomNadir) * R3;
    const theta = isZenith
      ? ((az - 90) * Math.PI) / 180
      : ((90 - az) * Math.PI) / 180;

    const px = cx + r * Math.cos(theta);
    const py = cy + r * Math.sin(theta);

    // Calculate sector number based on concentric divisions anchored to Sirius Azimuth
    let relAz = (az - siriusAz) % 360;
    if (relAz < 0) relAz += 360;
    let absAlt = Math.abs(alt);
    let sectorNum = 1;
    const isExactlyAtCenter = Math.abs(absAlt - 90) < 1e-9;
    let sectorString = "";
    if (isExactlyAtCenter) {
      sectorString = "[00]";
    } else {
      if (absAlt >= 60 && absAlt < 90) {
        let sliceIndex = Math.floor(relAz / 30);
        sectorNum = sliceIndex + 1;
      } else if (absAlt >= 30 && absAlt < 60) {
        let sliceIndex = Math.floor(relAz / 15);
        sectorNum = sliceIndex + 13;
      } else {
        let sliceIndex = Math.floor(relAz / 10);
        sectorNum = sliceIndex + 37;
      }
      sectorString = `[${String(sectorNum).padStart(2, "0")}]`;
    }

    // Render planet marker using centralized function
    svg += getChartMarkerSVG(b, px, py, sectorString);
  });

  svg += `</svg>`;
  return svg;
}

function updateMap() {
  if (!map) return;

  // Clear layers on inactive maps to keep performance high and prevent stale markers
  const allMaps = [map];
  const activeMaps = getActiveMaps();
  const inactiveMaps = allMaps.filter((m) => !activeMaps.includes(m));

  inactiveMaps.forEach((m) => {
    if (!m) return;

    // Remove terminator layers
    const termKey = m.id;
    if (terminatorLayers[termKey]) {
      m.removeLayer(terminatorLayers[termKey].polygon);
      m.removeLayer(terminatorLayers[termKey].polyline);
      delete terminatorLayers[termKey];
    }

    // Remove path lines & body markers
    BODIES.forEach((b) => {
      const pathKey = `${b.id}_${m.id}`;
      if (pathLayers[pathKey]) {
        m.removeLayer(pathLayers[pathKey]);
        delete pathLayers[pathKey];
      }

      const markerKey = `${b.id}_${m.id}`;
      if (markerLayers[markerKey]) {
        markerLayers[markerKey].forEach((marker) => m.removeLayer(marker));
        delete markerLayers[markerKey];
      }
    });

    // Remove special markers
    ["zenith", "cz", "nadir", "cn"].forEach((id) => {
      const markerKey = `${id}_${m.id}`;
      if (markerLayers[markerKey]) {
        markerLayers[markerKey].forEach((marker) => m.removeLayer(marker));
        delete markerLayers[markerKey];
      }
    });
  });

  // 1. Handle SVG Vector view mode
  if (currentMapMode === "CHART") {
    const activeSubject =
      state.subjects.find((s) => s.id === state.selectedSubjectId) ||
      state.subjects[0];
    const date = state.customDate;

    // Render Nadir (underfoot) chart to map-west
    const mapWestDiv = document.getElementById("map-west");
    if (mapWestDiv) {
      let svgContainer = document.getElementById("chart-west-svg-container");
      if (!svgContainer) {
        mapWestDiv.innerHTML = `
                    <div class="absolute top-2.5 right-2.5 z-[1000] bg-black/85 dark:bg-black/85 border border-white dark:border-white p-1.5 px-2 text-[9px] font-extrabold font-mono text-white select-none uppercase tracking-widest leading-none">
                         NADIR HEMISPHERE (TN / CN)
                    </div>
                    <div id="chart-west-svg-container" class="absolute inset-0 w-full h-full flex items-center justify-center p-4 bg-[#fcfcfc] dark:bg-[#070709] transition-colors">
                    </div>
                `;
        svgContainer = document.getElementById("chart-west-svg-container");
      }
      if (svgContainer) {
        svgContainer.innerHTML = renderChartSVG("nadir", activeSubject, date);
      }
    }

    // Render Zenith (overhead) chart to map-east
    const mapEastDiv = document.getElementById("map-east");
    if (mapEastDiv) {
      let svgContainer = document.getElementById("chart-east-svg-container");
      if (!svgContainer) {
        mapEastDiv.innerHTML = `
                    <div class="absolute top-2.5 right-2.5 z-[1000] bg-black/85 dark:bg-black/85 border border-white dark:border-white p-1.5 px-2 text-[9px] font-extrabold font-mono text-white select-none uppercase tracking-widest leading-none">
                         ZENITH HEMISPHERE (TZ / CZ)
                    </div>
                    <div id="chart-east-svg-container" class="absolute inset-0 w-full h-full flex items-center justify-center p-4 bg-[#fcfcfc] dark:bg-[#070709] transition-colors">
                    </div>
                `;
        svgContainer = document.getElementById("chart-east-svg-container");
      }
      if (svgContainer) {
        svgContainer.innerHTML = renderChartSVG("zenith", activeSubject, date);
      }
    }
    return;
  }

  // 2. Handle Leaflet normal MAP view mode
  const sunPoint = getSubPoint("Sun", state.customDate);
  activeMaps.forEach((m) => {
    syncTerminatorForMap(m, sunPoint);
  });

  // Celestial Bodies trajectory paths & markers
  BODIES.forEach((b) => {
    if (!state.activeBodies.has(b.id)) {
      removeMarker(b.id);
      return;
    }

    const point = getSubPoint(b.id, state.customDate);
    const wrappedPaths = getBodyPath(b.id, state.customDate);

    const iconElement = getMapMarkerElement(b);

    const icon = window.L.divIcon({
      className: "",
      html: iconElement.outerHTML,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const popupContent = `<div class="font-bold text-center text-slate-800 uppercase tracking-wide">${b.label}</div>
                 <div class="text-[11px] text-slate-500 font-mono text-center mt-1">
                 ${formatCoord(point[0], true)} <br/> ${formatCoord(point[1], false)}
                 </div>`;

    activeMaps.forEach((m) => {
      syncPathForMap(m, b.id, wrappedPaths, b.color);
      syncMarkerForMap(m, b.id, point, icon, popupContent, 1000);
    });
  });

  const activeSubject =
    state.subjects.find((s) => s.id === state.selectedSubjectId) ||
    state.subjects[0];
  if (activeSubject) {
    // Zenith (TZ)
    if (
      !state.showZenith ||
      !state.activeBodies.has("terrestrial-zenith")
    ) {
      removeMarker("zenith");
    } else {
      const zLat = activeSubject.lat;
      const zLng = activeSubject.lng;
      const point = [zLat, zLng];

      const tzEntity = ENTITIES.find(
        (e) => e.id === "terrestrial-zenith",
      );
      const iconElement = getMapMarkerElement(tzEntity);

      const icon = window.L.divIcon({
        className: "",
        html: iconElement.outerHTML,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const popupContent = `<div class="font-bold text-center text-slate-800 uppercase tracking-wide font-sans">Terrestrial Zenith (TZ)</div>
                     <div class="text-[10px] text-center text-slate-400 font-medium leading-tight mt-0.5">Overhead Observer Point</div>
                     <div class="text-[11px] text-slate-500 font-mono text-center mt-1.5 border-t border-slate-100 pt-1.5">
                     ${activeSubject.label || "Subject"} <br/>
                     ${formatCoord(point[0], true)} <span class="text-slate-300">|</span> ${formatCoord(point[1], false)}
                     </div>`;

      activeMaps.forEach((m) => {
        syncMarkerForMap(m, "zenith", point, icon, popupContent, 2000);
      });
    }

    // Celestial Zenith (CZ)
    if (
      !state.showZenith ||
      !state.activeBodies.has("celestial-zenith")
    ) {
      removeMarker("cz");
    } else {
      const anchorTime = getSubjectAnchorTime(activeSubject);
      const coords = getCelestialCoordinates(
        activeSubject.lat,
        activeSubject.lng,
        anchorTime,
      );
      let point = [activeSubject.lat, activeSubject.lng];
      if (coords) {
        point = getSubPointFromRA(
          coords.zenith.ra,
          coords.zenith.dec,
          state.customDate,
        );
      }

      const popupContent = coords
        ? `<div class="font-bold text-center text-slate-850 uppercase tracking-wide font-sans">Celestial Zenith (CZ)</div>
                 <div class="text-[10px] text-center text-slate-400 font-medium leading-none mt-0.5">Local Horizon Zenith Projection</div>
                 <div class="text-[11px] text-slate-6050 font-mono text-center mt-2 border-t border-slate-100 pt-2 space-y-1">
                   <div>Dec: <span class="font-semibold text-slate-800">${formatCoord(coords.zenith.dec, true)}</span></div>
                   <div>RA: <span class="font-semibold text-slate-800">${formatRA(coords.zenith.ra)}</span></div>
                 </div>`
        : `<div class="font-bold text-center text-slate-800 uppercase tracking-wide font-sans">Celestial Zenith (CZ)</div>`;

      const czEntity = ENTITIES.find(
        (e) => e.id === "celestial-zenith",
      );
      const iconElement = getMapMarkerElement(czEntity);

      const icon = window.L.divIcon({
        className: "",
        html: iconElement.outerHTML,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      activeMaps.forEach((m) => {
        syncMarkerForMap(m, "cz", point, icon, popupContent, 3000);
      });
    }

    // Nadir (TN)
    if (
      !state.showNadir ||
      !state.activeBodies.has("terrestrial-nadir")
    ) {
      removeMarker("nadir");
    } else {
      const nLat = -activeSubject.lat;
      let nLng = activeSubject.lng + 180;
      if (nLng > 180) nLng -= 360;
      const point = [nLat, nLng];

      const tnEntity = ENTITIES.find(
        (e) => e.id === "terrestrial-nadir",
      );
      const iconElement = getMapMarkerElement(tnEntity);

      const icon = window.L.divIcon({
        className: "",
        html: iconElement.outerHTML,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const popupContent = `<div class="font-bold text-center text-slate-800 uppercase tracking-wide font-sans">Terrestrial Nadir (TN)</div>
                     <div class="text-[10px] text-center text-slate-400 font-medium leading-tight mt-0.5">Antipodal Observer Point</div>
                     <div class="text-[11px] text-slate-500 font-mono text-center mt-1.5 border-t border-slate-100 pt-1.5">
                     ${activeSubject.label || "Subject"} Antipod <br/>
                     ${formatCoord(point[0], true)} <span class="text-slate-300">|</span> ${formatCoord(point[1], false)}
                     </div>`;

      activeMaps.forEach((m) => {
        syncMarkerForMap(m, "nadir", point, icon, popupContent, 2000);
      });
    }

    // Celestial Nadir (CN)
    if (
      !state.showNadir ||
      !state.activeBodies.has("celestial-nadir")
    ) {
      removeMarker("cn");
    } else {
      const anchorTime = getSubjectAnchorTime(activeSubject);
      const coords = getCelestialCoordinates(
        activeSubject.lat,
        activeSubject.lng,
        anchorTime,
      );
      let point = [0, 0];
      if (coords) {
        point = getSubPointFromRA(
          coords.nadir.ra,
          coords.nadir.dec,
          state.customDate,
        );
      } else {
        let nLng = activeSubject.lng + 180;
        if (nLng > 180) nLng -= 360;
        point = [-activeSubject.lat, nLng];
      }

      const popupContent = coords
        ? `<div class="font-bold text-center text-slate-850 uppercase tracking-wide font-sans">Celestial Nadir (CN)</div>
                 <div class="text-[10px] text-center text-slate-400 font-medium leading-none mt-0.5">Local Horizon Nadir Projection</div>
                 <div class="text-[11px] text-slate-6050 font-mono text-center mt-2 border-t border-slate-100 pt-2 space-y-1">
                   <div>Dec: <span class="font-semibold text-slate-800">${formatCoord(coords.nadir.dec, true)}</span></div>
                   <div>RA: <span class="font-semibold text-slate-800">${formatRA(coords.nadir.ra)}</span></div>
                 </div>`
        : `<div class="font-bold text-center text-slate-800 uppercase tracking-wide font-sans">Celestial Nadir (CN)</div>`;

      const cnEntity = ENTITIES.find((e) => e.id === "celestial-nadir");
      const iconElement = getMapMarkerElement(cnEntity);

      const icon = window.L.divIcon({
        className: "",
        html: iconElement.outerHTML,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      activeMaps.forEach((m) => {
        syncMarkerForMap(m, "cn", point, icon, popupContent, 3000);
      });
    }
  }
}

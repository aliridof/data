// js/map.js

let map;
let mapWest; // Kept as placeholder/null since we render direct SVGs
let mapEast; // Kept as placeholder/null since we render direct SVGs

let currentMapMode = 'MAP';

// Dicts to keep track of layers per map instance
let terminatorLayers = {}; // mapId -> { polygon, polyline }
let pathLayers = {};       // `${bodyId}_${mapId}` -> polyline
let markerLayers = {};     // `${id}_${mapId}` -> array of markers
let pathCoordsCache = {};  // `${bodyId}_${mapId}` -> last coordinates array reference

function getActiveMaps() {
    if (currentMapMode === 'CHART') {
        return [];
    }
    return map ? [map] : [];
}

function setMapMode(mode) {
    currentMapMode = mode;
    state.mapMode = mode;
    
    const mapElement = document.getElementById('map');
    const splitContainer = document.getElementById('map-split-container');
    const mobileDots = document.getElementById('chart-mobile-dots');
    const astronomyData = document.getElementById('astronomy-data-container');
    
    if (mode === 'CHART') {
        if (mapElement) {
            mapElement.classList.add('hidden');
        }
        if (splitContainer) {
            splitContainer.classList.remove('hidden');
            splitContainer.classList.add('flex');
        }
        if (mobileDots) {
            mobileDots.classList.remove('hidden');
            mobileDots.classList.add('flex');
        }
        if (astronomyData) {
            astronomyData.classList.add('hidden');
        }
    } else {
        if (splitContainer) {
            splitContainer.classList.add('hidden');
            splitContainer.classList.remove('flex');
        }
        if (mapElement) {
            mapElement.classList.remove('hidden');
        }
        if (mobileDots) {
            mobileDots.classList.add('hidden');
            mobileDots.classList.remove('flex');
        }
        if (astronomyData) {
            astronomyData.classList.remove('hidden');
        }
        if (map) {
            map.invalidateSize();
        }
    }
    
    updateMap();
}

function initMap() {
    // 1. Initialise standard MAP
    map = window.L.map('map', {
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
        preferCanvas: true // Eksekusi Optimalisasi: force vector layers to use Canvas rendering for smooth animations
    }).setView([15, 45], 2.2); // Initial center
    map.id = 'default';

    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Add minimal zoom control to bottom right
    window.L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // Make the map more interactive with cursor changes
    map.getContainer().style.cursor = 'crosshair';

    map.on('click', (e) => {
        const wrapped = e.latlng.wrap();
        const event = new CustomEvent('map-clicked', {
            detail: { lat: wrapped.lat, lng: wrapped.lng }
        });
        window.dispatchEvent(event);
    });

    // Wire up map mode selector dropdown
    const select = document.getElementById('MODE');
    if (select) {
        select.addEventListener('change', (e) => {
            setMapMode(e.target.value);
        });
        select.value = state.mapMode || 'MAP';
    }

    // Wire up mobile swipe indicator dots
    const splitContainer = document.getElementById('map-split-container');
    const dotWest = document.getElementById('dot-west');
    const dotEast = document.getElementById('dot-east');
    
    if (splitContainer && dotWest && dotEast) {
        const updateDotActiveStates = () => {
            const width = splitContainer.clientWidth;
            if (width > 0) {
                const scrollLeft = splitContainer.scrollLeft;
                // If scrolled more than 35% of the split panel container view width, select East
                const isEast = scrollLeft > width * 0.35;
                if (isEast) {
                    dotWest.classList.remove('bg-black', 'ring-2', 'ring-black', 'ring-offset-2', 'ring-offset-white');
                    dotWest.classList.add('bg-black/40');
                    dotEast.classList.remove('bg-black/40');
                    dotEast.classList.add('bg-black', 'ring-2', 'ring-black', 'ring-offset-2', 'ring-offset-white');
                } else {
                    dotEast.classList.remove('bg-black', 'ring-2', 'ring-black', 'ring-offset-2', 'ring-offset-white');
                    dotEast.classList.add('bg-black/40');
                    dotWest.classList.remove('bg-black/40');
                    dotWest.classList.add('bg-black', 'ring-2', 'ring-black', 'ring-offset-2', 'ring-offset-white');
                }
            }
        };

        splitContainer.addEventListener('scroll', updateDotActiveStates);
        
        dotWest.addEventListener('click', () => {
            splitContainer.scrollTo({
                left: 0,
                behavior: 'smooth'
            });
        });

        dotEast.addEventListener('click', () => {
            splitContainer.scrollTo({
                left: splitContainer.clientWidth,
                behavior: 'smooth'
            });
        });
        
        // Initial call
        updateDotActiveStates();
    }

    // Initial map mode check
    setMapMode(state.mapMode || 'MAP');
}

function removeMarker(id) {
    const maps = [map];
    maps.forEach(m => {
        if (!m) return;
        const key = `${id}_${m.id}`;
        if (markerLayers[key]) {
            markerLayers[key].forEach(marker => {
                if (marker && marker._map) m.removeLayer(marker);
            });
            delete markerLayers[key];
        }
    });
}

function syncMarker(id, point, icon, popupContent, zIndexOffset = 1000) {
    const activeMaps = getActiveMaps();
    activeMaps.forEach(m => {
        syncMarkerForMap(m, id, point, icon, popupContent, zIndexOffset);
    });
}

function syncMarkerForMap(m, id, point, icon, popupContent, zIndexOffset = 1000) {
    if (!m) return;
    const key = `${id}_${m.id}`;
    
    let lat = point[0];
    let lng = point[1];
    
    if (markerLayers[key] && markerLayers[key].length === 3) {
        // Update existing markers instead of recreating
        markerLayers[key][0].setLatLng([lat, lng - 360]);
        markerLayers[key][1].setLatLng([lat, lng]);
        markerLayers[key][2].setLatLng([lat, lng + 360]);

        markerLayers[key].forEach(marker => {
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
            markerLayers[key].forEach(layer => {
                if (layer && layer._map) layer._map.removeLayer(layer);
            });
        }
        markerLayers[key] = [];
        
        // Standard full map: 3 wraps for seamless loops
        const m1 = window.L.marker([lat, lng - 360], { icon, zIndexOffset }).addTo(m).bindPopup(popupContent);
        const m2 = window.L.marker([lat, lng], { icon, zIndexOffset }).addTo(m).bindPopup(popupContent);
        const m3 = window.L.marker([lat, lng + 360], { icon, zIndexOffset }).addTo(m).bindPopup(popupContent);
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
                dashArray: '4, 4'
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
            color: 'transparent',
            stroke: false,
            fillColor: '#0f172a',
            fillOpacity: 0.4,
            interactive: false
        }).addTo(m);
        
        const line = window.L.polyline(polylineCoords, {
            color: '#eab308',
            weight: 2,
            opacity: 0.8,
            interactive: false
        }).addTo(m);
        
        terminatorLayers[key] = { polygon: poly, polyline: line };
    }
}

// Convert fixed RA (hours) and Dec (degrees) to local Azimuth & Altitude
function getFixedCoordinateAzAlt(raHours, dec, date, persona) {
    if (typeof swe === 'undefined' || !swe) return { az: 0, alt: 0 };
    try {
        const jd = getJD(date);
        const gstHours = swe.sidtime(jd);
        const gstDeg = gstHours * 15;
        const raDeg = raHours * 15;
        
        const lstDeg = (gstDeg + persona.lng) % 360;
        let haDeg = lstDeg - raDeg;
        haDeg = ((haDeg % 360) + 360) % 360;
        const H = haDeg * Math.PI / 180;
        
        const pLat = persona.lat * Math.PI / 180;
        const objDec = dec * Math.PI / 180;
        
        const sinAlt = Math.sin(pLat) * Math.sin(objDec) + Math.cos(pLat) * Math.cos(objDec) * Math.cos(H);
        const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * 180 / Math.PI;
        
        const cosAz = (Math.sin(objDec) - Math.sin(pLat) * sinAlt) / (Math.cos(pLat) * Math.cos(alt * Math.PI / 180));
        const sinAz = -Math.sin(H) * Math.cos(objDec) / Math.cos(alt * Math.PI / 180);
        
        let az = Math.atan2(sinAz, cosAz) * 180 / Math.PI;
        if (az < 0) az += 360;
        
        return { az, alt };
    } catch (e) {
        console.error("Fixed coordinates transformation error", e);
        return { az: 0, alt: 0 };
    }
}

// Get projected Azimuth for any ecliptic longitude at current date-time and persona
function getEclipticAz(lon, date, persona) {
    if (typeof swe === 'undefined' || !swe) return 0;
    try {
        const Ob = 23.4392911 * Math.PI / 180;
        const lonRad = lon * Math.PI / 180;
        const sinDec = Math.sin(Ob) * Math.sin(lonRad);
        const decRad = Math.asin(sinDec);
        const dec = decRad * 180 / Math.PI;
        
        const y = Math.sin(lonRad) * Math.cos(Ob);
        const x = Math.cos(lonRad);
        const raRad = Math.atan2(y, x);
        const raHours = (raRad * 180 / Math.PI / 15 + 24) % 24;
        
        const azAlt = getFixedCoordinateAzAlt(raHours, dec, date, persona);
        return azAlt.az;
    } catch (e) {
        return 0;
    }
}

function getZodiacBoundaries() {
    if (state.zodiacConfig === 'IAU') {
        return [
            { label: 'ARI', start: 29.8, end: 53.5 },
            { label: 'TAU', start: 53.5, end: 90.1 },
            { label: 'GEM', start: 90.1, end: 118.0 },
            { label: 'CAN', start: 118.0, end: 138.2 },
            { label: 'LEO', start: 138.2, end: 173.9 },
            { label: 'VIR', start: 173.9, end: 218.0 },
            { label: 'LIB', start: 218.0, end: 241.1 },
            { label: 'SCO', start: 241.1, end: 247.7 },
            { label: 'OPH', start: 247.7, end: 266.3 },
            { label: 'SGR', start: 266.3, end: 299.7 },
            { label: 'CAP', start: 299.7, end: 327.6 },
            { label: 'AQR', start: 327.6, end: 351.9 },
            { label: 'PSC', start: 351.9, end: 29.8 }
        ];
    } else {
        return [
            { label: 'ARI', start: 0, end: 30 },
            { label: 'TAU', start: 30, end: 60 },
            { label: 'GEM', start: 60, end: 90 },
            { label: 'CAN', start: 90, end: 120 },
            { label: 'LEO', start: 120, end: 150 },
            { label: 'VIR', start: 150, end: 180 },
            { label: 'LIB', start: 180, end: 210 },
            { label: 'SCO', start: 210, end: 240 },
            { label: 'SGR', start: 240, end: 270 },
            { label: 'CAP', start: 270, end: 300 },
            { label: 'AQR', start: 300, end: 330 },
            { label: 'PSC', start: 330, end: 360 }
        ];
    }
}

// Generate the beautiful Polar Chart SVG
function renderChartSVG(type, activePersona, date) {
    const isZenith = type === 'zenith';
    const cx = 300;
    const cy = 300;
    const R1 = 70;
    const R2 = 140;
    const R3 = 210; // Horizon outer constraint
    const R4 = 250; // Zodiac boundary ring
    
    // Aesthetic Styling Hooks
    const textMuted = "fill-neutral-400 dark:fill-neutral-600 font-mono text-[8.5px]";
    const textBold = "fill-neutral-700 dark:fill-neutral-300 font-sans font-extrabold text-[10px]";
    const graticuleStyle = "stroke-neutral-200 dark:stroke-neutral-850 fill-none";
    const horizonStyle = "stroke-neutral-900 dark:stroke-neutral-100 fill-none";
    
    let svg = `<svg viewBox="0 0 600 600" class="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg" style="transform-box: fill-box; transform-origin: center;">`;
    
    // Calculate Sirius Azimuth dynamically as reference anchor
    let siriusAz = 0;
    const siriusStats = getBodyStats('Sirius', date, activePersona, { coord: state.coordConfig, zodiac: state.zodiacConfig });
    if (siriusStats) {
        siriusAz = siriusStats.az;
    }
    
    // 1. Concentric altitude grid rings
    svg += `<circle cx="${cx}" cy="${cy}" r="${R1}" stroke="currentColor" class="${graticuleStyle}" stroke-width="0.75" />`;
    svg += `<circle cx="${cx}" cy="${cy}" r="${R2}" stroke="currentColor" class="${graticuleStyle}" stroke-width="0.75" />`;
    svg += `<circle cx="${cx}" cy="${cy}" r="${R3}" stroke="currentColor" class="${horizonStyle}" stroke-width="2.5" />`;
    svg += `<circle cx="${cx}" cy="${cy}" r="${R4}" stroke="currentColor" class="${graticuleStyle}" stroke-width="0.75" />`;
    
    // 2. Structural sector radial dividing lines (12 sections, spaced every 30 degrees, dynamically anchored to Sirius Azimuth)
    for (let s = 0; s < 12; s++) {
        const angle = siriusAz + s * 30;
        let rad = 0;
        if (isZenith) {
            rad = (angle - 90) * Math.PI / 180;
        } else {
            rad = (90 - angle) * Math.PI / 180;
        }
        const x1 = cx + 22 * Math.cos(rad);
        const y1 = cy + 22 * Math.sin(rad);
        const x2 = cx + R3 * Math.cos(rad); // End perfectly at the Ring 4 horizon ring limit so it doesn't overlap the Ring 5 Zodiac belt
        const y2 = cy + R3 * Math.sin(rad);
        
        svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="currentColor" class="${graticuleStyle}" stroke-width="0.75" />`;
    }
    
    // Draw perfect vertical and horizontal cardinal reference lines (Removed for clean styling - showing labels only)

    // 3. Grid cell numbering (01 to 36) centered in sectors, dynamically rotated following Sirius Azimuth
    for (let slice = 0; slice < 12; slice++) {
        const midAngle = siriusAz + slice * 30 + 15;
        let rad = 0;
        if (isZenith) {
            rad = (midAngle - 90) * Math.PI / 180;
        } else {
            rad = (90 - midAngle) * Math.PI / 180;
        }
        
        // Inner Ring (01 - 12)
        const name1 = String(slice + 1).padStart(2, '0');
        const r1 = 45;
        const x1 = cx + r1 * Math.cos(rad);
        const y1 = cy + r1 * Math.sin(rad);
        svg += `<text x="${x1}" y="${y1}" text-anchor="middle" dominant-baseline="central" class="${textMuted}">${name1}</text>`;
        
        // Middle Ring (13 - 24)
        const name2 = String(slice + 13);
        const r2 = 105;
        const x2 = cx + r2 * Math.cos(rad);
        const y2 = cy + r2 * Math.sin(rad);
        svg += `<text x="${x2}" y="${y2}" text-anchor="middle" dominant-baseline="central" class="${textMuted}">${name2}</text>`;
        
        // Outer Ring (25 - 36)
        const name3 = String(slice + 25);
        const r3 = 175;
        const x3 = cx + r3 * Math.cos(rad);
        const y3 = cy + r3 * Math.sin(rad);
        svg += `<text x="${x3}" y="${y3}" text-anchor="middle" dominant-baseline="central" class="${textMuted}">${name3}</text>`;
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
    const centerTitle = isZenith ? 'ZENITH' : 'NADIR';
    // Small subtitle text
    svg += `<text x="${cx}" y="${cy - 23}" text-anchor="middle" font-size="7.5px" font-weight="900" class="fill-neutral-400 dark:fill-neutral-500 uppercase tracking-[0.2em] leading-none">${centerTitle}</text>`;
    // Center emblem
    svg += `<circle cx="${cx}" cy="${cy}" r="13" class="fill-white dark:fill-neutral-900 stroke-neutral-950 dark:stroke-neutral-50" stroke-width="2.5" />`;
    svg += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="11.5px" font-weight="900" class="fill-neutral-900 dark:fill-neutral-50 font-mono">0</text>`;
    
    // 6. Project Zodiac Ring around the Horizon boundary
    const boundaries = getZodiacBoundaries();
    const projectedZodiacs = boundaries.map(b => ({
        label: b.label,
        startAz: getEclipticAz(b.start, date, activePersona),
        endAz: getEclipticAz(b.end, date, activePersona)
    }));
    
    projectedZodiacs.forEach(pb => {
        // Segment divider line at startAz
        const startRad = (isZenith ? (pb.startAz - 90) : (90 - pb.startAz)) * Math.PI / 180;
        const x3 = cx + R3 * Math.cos(startRad);
        const y3 = cy + R3 * Math.sin(startRad);
        const x4 = cx + R4 * Math.cos(startRad);
        const y4 = cy + R4 * Math.sin(startRad);
        
        svg += `<line x1="${x3}" y1="${y3}" x2="${x4}" y2="${y4}" stroke="currentColor" class="stroke-neutral-300 dark:stroke-neutral-800" stroke-width="1.25" />`;
        
        // Label position centered in the projected arc
        let diff = pb.endAz - pb.startAz;
        if (diff < 0) diff += 360;
        const midAz = (pb.startAz + diff / 2) % 360;
        const midRad = (isZenith ? (midAz - 90) : (90 - midAz)) * Math.PI / 180;
        const lx = cx + 230 * Math.cos(midRad);
        const ly = cy + 230 * Math.sin(midRad);
        
        svg += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="central" class="${textBold}">${pb.label}</text>`;
    });
    
    // 7. Render Celestial Zenith & Celestial Nadir Projections
    if (isZenith && state.showZenith) {
        const anchorTime = getPersonaAnchorTime(activePersona);
        const coords = getCelestialCoordinates(activePersona.lat, activePersona.lng, anchorTime);
        if (coords) {
            const czAzAlt = getFixedCoordinateAzAlt(coords.zenith.ra, coords.zenith.dec, date, activePersona);
            if (czAzAlt && czAzAlt.alt >= 0) {
                const r = (90 - czAzAlt.alt) / 90 * R3;
                const theta = (czAzAlt.az - 90) * Math.PI / 180;
                const px = cx + r * Math.cos(theta);
                const py = cy + r * Math.sin(theta);
                
                svg += `<g class="transition-transform duration-200 hover:scale-110">
                    <circle cx="${px}" cy="${py}" r="11" fill="#ffffff" class="fill-white dark:fill-neutral-900 stroke-neutral-900 dark:stroke-neutral-100" stroke-width="1.5" stroke-dasharray="3,2" />
                    <text x="${px}" y="${py}" text-anchor="middle" dominant-baseline="central" font-size="9px" font-weight="900" class="fill-neutral-950 dark:fill-neutral-50 font-mono">CZ</text>
                </g>`;
            }
        }
    } else if (!isZenith && state.showNadir) {
        const anchorTime = getPersonaAnchorTime(activePersona);
        const coords = getCelestialCoordinates(activePersona.lat, activePersona.lng, anchorTime);
        if (coords) {
            const cnAzAlt = getFixedCoordinateAzAlt(coords.nadir.ra, coords.nadir.dec, date, activePersona);
            if (cnAzAlt && cnAzAlt.alt < 0) {
                const r = (90 + cnAzAlt.alt) / 90 * R3;
                const theta = (90 - cnAzAlt.az) * Math.PI / 180;
                const px = cx + r * Math.cos(theta);
                const py = cy + r * Math.sin(theta);
                
                svg += `<g class="transition-transform duration-200 hover:scale-110">
                    <circle cx="${px}" cy="${py}" r="11" fill="#ffffff" class="fill-white dark:fill-neutral-900 stroke-neutral-900 dark:stroke-neutral-100" stroke-width="1.5" stroke-dasharray="3,2" />
                    <text x="${px}" y="${py}" text-anchor="middle" dominant-baseline="central" font-size="9px" font-weight="900" class="fill-neutral-950 dark:fill-neutral-50 font-mono">CN</text>
                </g>`;
            }
        }
    }
    
    // 8. Render active celestial bodies
    BODIES.forEach(b => {
        if (!state.activeBodies.has(b.id)) return;
        
        const stats = getBodyStats(b.id, date, activePersona, { coord: state.coordConfig, zodiac: state.zodiacConfig });
        if (!stats) return;
        
        const alt = stats.alt;
        const az = stats.az;
        
        const drawOnThisChart = isZenith ? (alt >= 0) : (alt < 0);
        if (!drawOnThisChart) return;
        
        const r = isZenith ? ((90 - alt) / 90 * R3) : ((90 + alt) / 90 * R3);
        const theta = isZenith ? ((az - 90) * Math.PI / 180) : ((90 - az) * Math.PI / 180);
        
        const px = cx + r * Math.cos(theta);
        const py = cy + r * Math.sin(theta);
        
        // Calculate sector number based on 5-ring framework anchored to Sirius Azimuth
        let relAz = (az - siriusAz) % 360;
        if (relAz < 0) relAz += 360;
        let sliceIndex = Math.floor(relAz / 30);
        let absAlt = Math.abs(alt);
        let sectorNum = 1;
        const isExactlyAtCenter = Math.abs(absAlt - 90) < 1e-9;
        let sectorString = '';
        if (isExactlyAtCenter) {
            sectorString = '[00]';
        } else {
            if (absAlt >= 60 && absAlt < 90) {
                sectorNum = sliceIndex + 1;
            } else if (absAlt >= 30 && absAlt < 60) {
                sectorNum = sliceIndex + 13;
            } else {
                sectorNum = sliceIndex + 25;
            }
            sectorString = `[${String(sectorNum).padStart(2, '0')}]`;
        }
        
        // Render planet marker
        const isSirius = b.id === 'Sirius';
        const labelAbbrev = b.id === 'Sirius' ? 'SUI' : b.label.substring(0, 3).toUpperCase();
        
        svg += `<g class="transition-all duration-300 hover:scale-115">`;
            
        // Brand style label on top of marker
        svg += `<text x="${px}" y="${py - 16}" text-anchor="middle" font-size="8.5px" font-weight="900" class="fill-neutral-550 dark:fill-neutral-450 tracking-wider font-sans uppercase leading-none">${labelAbbrev}</text>`;
        
        // Circular marker with solid background matching body color, and white text
        svg += `<circle cx="${px}" cy="${py}" r="11" fill="${b.color}" class="stroke-black dark:stroke-white" stroke="currentColor" stroke-width="1.5" />`;
        svg += `<text x="${px}" y="${py}" text-anchor="middle" dominant-baseline="central" font-size="11.5px" fill="#ffffff" font-weight="900" font-family="sans-serif">${b.symbol}</text>`;
        
        // Dynamic zero-padded sector locator label on bottom e.g. "[18]"
        svg += `<text x="${px}" y="${py + 18}" text-anchor="middle" font-size="8px" font-weight="900" class="fill-neutral-400 dark:fill-neutral-600 font-mono tracking-tighter leading-none">${sectorString}</text>`;
        
        svg += `</g>`;
    });
    
    svg += `</svg>`;
    return svg;
}

function updateMap() {
    if (!map) return;
    
    // Clear layers on inactive maps to keep performance high and prevent stale markers
    const allMaps = [map];
    const activeMaps = getActiveMaps();
    const inactiveMaps = allMaps.filter(m => !activeMaps.includes(m));
    
    inactiveMaps.forEach(m => {
        if (!m) return;
        
        // Remove terminator layers
        const termKey = m.id;
        if (terminatorLayers[termKey]) {
            m.removeLayer(terminatorLayers[termKey].polygon);
            m.removeLayer(terminatorLayers[termKey].polyline);
            delete terminatorLayers[termKey];
        }
        
        // Remove path lines & body markers
        BODIES.forEach(b => {
            const pathKey = `${b.id}_${m.id}`;
            if (pathLayers[pathKey]) {
                m.removeLayer(pathLayers[pathKey]);
                delete pathLayers[pathKey];
            }
            
            const markerKey = `${b.id}_${m.id}`;
            if (markerLayers[markerKey]) {
                markerLayers[markerKey].forEach(marker => m.removeLayer(marker));
                delete markerLayers[markerKey];
            }
        });
        
        // Remove special markers
        ['zenith', 'cz', 'nadir', 'cn'].forEach(id => {
            const markerKey = `${id}_${m.id}`;
            if (markerLayers[markerKey]) {
                markerLayers[markerKey].forEach(marker => m.removeLayer(marker));
                delete markerLayers[markerKey];
            }
        });
    });

    // 1. Handle SVG Vector view mode
    if (currentMapMode === 'CHART') {
        const activePersona = state.personas.find(p => p.id === state.selectedPersonaId) || state.personas[0];
        const date = state.customDate;
        
        // Render Nadir (underfoot) chart to map-west
        const mapWestDiv = document.getElementById('map-west');
        if (mapWestDiv) {
            let svgContainer = document.getElementById('chart-west-svg-container');
            if (!svgContainer) {
                mapWestDiv.innerHTML = `
                    <div class="absolute top-2.5 right-2.5 z-[1000] bg-black/85 dark:bg-black/85 border border-white dark:border-white p-1.5 px-2 text-[9px] font-extrabold font-mono text-white select-none uppercase tracking-widest leading-none">
                         NADIR HEMISPHERE (TN / CN)
                    </div>
                    <div id="chart-west-svg-container" class="absolute inset-0 w-full h-full flex items-center justify-center p-4 bg-[#fcfcfc] dark:bg-[#070709] transition-colors">
                    </div>
                `;
                svgContainer = document.getElementById('chart-west-svg-container');
            }
            if (svgContainer) {
                svgContainer.innerHTML = renderChartSVG('nadir', activePersona, date);
            }
        }
        
        // Render Zenith (overhead) chart to map-east
        const mapEastDiv = document.getElementById('map-east');
        if (mapEastDiv) {
            let svgContainer = document.getElementById('chart-east-svg-container');
            if (!svgContainer) {
                mapEastDiv.innerHTML = `
                    <div class="absolute top-2.5 right-2.5 z-[1000] bg-black/85 dark:bg-black/85 border border-white dark:border-white p-1.5 px-2 text-[9px] font-extrabold font-mono text-white select-none uppercase tracking-widest leading-none">
                         ZENITH HEMISPHERE (TZ / CZ)
                    </div>
                    <div id="chart-east-svg-container" class="absolute inset-0 w-full h-full flex items-center justify-center p-4 bg-[#fcfcfc] dark:bg-[#070709] transition-colors">
                    </div>
                `;
                svgContainer = document.getElementById('chart-east-svg-container');
            }
            if (svgContainer) {
                svgContainer.innerHTML = renderChartSVG('zenith', activePersona, date);
            }
        }
        return;
    }
    
    // 2. Handle Leaflet normal MAP view mode
    const sunPoint = getSubPoint('Sun', state.customDate);
    activeMaps.forEach(m => {
        syncTerminatorForMap(m, sunPoint);
    });
    
    // Celestial Bodies trajectory paths & markers
    BODIES.forEach(b => {
        if (!state.activeBodies.has(b.id)) {
            removeMarker(b.id);
            return;
        }

        const point = getSubPoint(b.id, state.customDate);
        const wrappedPaths = getBodyPath(b.id, state.customDate);
        
        const iconElement = document.createElement('div');
        iconElement.className = 'w-7 h-7 border border-black dark:border-white flex items-center justify-center text-sm font-extrabold transition-transform transform hover:scale-110 relative z-10 text-white rounded-full shadow-none';
        iconElement.style.backgroundColor = b.color;
        iconElement.innerHTML = `<span>${b.symbol}</span>`;
        
        const icon = window.L.divIcon({
            className: '',
            html: iconElement.outerHTML,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
        });
        
        const popupContent = `<div class="font-bold text-center text-slate-800 uppercase tracking-wide">${b.label}</div>
                 <div class="text-[11px] text-slate-500 font-mono text-center mt-1">
                 ${formatCoord(point[0], true)} <br/> ${formatCoord(point[1], false)}
                 </div>`;
                 
        activeMaps.forEach(m => {
            syncPathForMap(m, b.id, wrappedPaths, b.color);
            syncMarkerForMap(m, b.id, point, icon, popupContent, 1000);
        });
    });

    const activePersona = state.personas.find(p => p.id === state.selectedPersonaId) || state.personas[0];
    if (activePersona) {
        // Zenith (TZ)
        if (!state.showZenith) {
            removeMarker('zenith');
        } else {
            const zLat = activePersona.lat;
            const zLng = activePersona.lng;
            const point = [zLat, zLng];
            
            const iconElement = document.createElement('div');
            iconElement.className = 'w-7 h-7 bg-slate-950 dark:bg-white rounded-full border border-white dark:border-slate-950 shadow-md flex items-center justify-center text-xs font-mono font-bold text-white dark:text-slate-950 transition-transform transform hover:scale-110 relative z-20';
            iconElement.innerHTML = `<span>TZ</span>`;
            
            const icon = window.L.divIcon({
                className: '',
                html: iconElement.outerHTML,
                iconSize: [28, 28],
                iconAnchor: [14, 14],
            });
            
            const popupContent = `<div class="font-bold text-center text-slate-800 uppercase tracking-wide font-sans">Terrestrial Zenith (TZ)</div>
                     <div class="text-[10px] text-center text-slate-400 font-medium leading-tight mt-0.5">Overhead Observer Point</div>
                     <div class="text-[11px] text-slate-500 font-mono text-center mt-1.5 border-t border-slate-100 pt-1.5">
                     ${activePersona.label || "Ka'bah"} <br/>
                     ${formatCoord(point[0], true)} <span class="text-slate-300">|</span> ${formatCoord(point[1], false)}
                     </div>`;
                     
            activeMaps.forEach(m => {
                syncMarkerForMap(m, 'zenith', point, icon, popupContent, 2000);
            });
        }

        // Celestial Zenith (CZ)
        if (!state.showZenith) {
            removeMarker('cz');
        } else {
            const anchorTime = getPersonaAnchorTime(activePersona);
            const coords = getCelestialCoordinates(activePersona.lat, activePersona.lng, anchorTime);
            let point = [activePersona.lat, activePersona.lng];
            if (coords) {
                point = getSubPointFromRA(coords.zenith.ra, coords.zenith.dec, state.customDate);
            }
            
            const popupContent = coords ? 
                `<div class="font-bold text-center text-slate-850 uppercase tracking-wide font-sans">Celestial Zenith (CZ)</div>
                 <div class="text-[10px] text-center text-slate-400 font-medium leading-none mt-0.5">Local Horizon Zenith Projection</div>
                 <div class="text-[11px] text-slate-6050 font-mono text-center mt-2 border-t border-slate-100 pt-2 space-y-1">
                   <div>Dec: <span class="font-semibold text-slate-800">${formatCoord(coords.zenith.dec, true)}</span></div>
                   <div>RA: <span class="font-semibold text-slate-800">${formatRA(coords.zenith.ra)}</span></div>
                 </div>` : 
                `<div class="font-bold text-center text-slate-800 uppercase tracking-wide font-sans">Celestial Zenith (CZ)</div>`;

            const iconElement = document.createElement('div');
            iconElement.className = 'w-7 h-7 bg-white text-slate-950 rounded-full border-2 border-slate-950 shadow-md flex items-center justify-center text-xs font-mono font-bold transition-transform transform hover:scale-110 relative z-30';
            iconElement.innerHTML = `<span>CZ</span>`;
            
            const icon = window.L.divIcon({
                className: '',
                html: iconElement.outerHTML,
                iconSize: [28, 28],
                iconAnchor: [14, 14],
            });
            
            activeMaps.forEach(m => {
                syncMarkerForMap(m, 'cz', point, icon, popupContent, 3000);
            });
        }

        // Nadir (TN)
        if (!state.showNadir) {
            removeMarker('nadir');
        } else {
            const nLat = -activePersona.lat;
            let nLng = activePersona.lng + 180;
            if (nLng > 180) nLng -= 360;
            const point = [nLat, nLng];
            
            const iconElement = document.createElement('div');
            iconElement.className = 'w-7 h-7 bg-slate-950 dark:bg-white rounded-full border border-white dark:border-slate-950 shadow-md flex items-center justify-center text-xs font-mono font-bold text-white dark:text-slate-950 transition-transform transform hover:scale-110 relative z-20';
            iconElement.innerHTML = `<span>TN</span>`;
            
            const icon = window.L.divIcon({
                className: '',
                html: iconElement.outerHTML,
                iconSize: [28, 28],
                iconAnchor: [14, 14],
            });
            
            const popupContent = `<div class="font-bold text-center text-slate-800 uppercase tracking-wide font-sans">Terrestrial Nadir (TN)</div>
                     <div class="text-[10px] text-center text-slate-400 font-medium leading-tight mt-0.5">Antipodal Observer Point</div>
                     <div class="text-[11px] text-slate-500 font-mono text-center mt-1.5 border-t border-slate-100 pt-1.5">
                     ${activePersona.label || "Ka'bah"} Antipod <br/>
                     ${formatCoord(point[0], true)} <span class="text-slate-300">|</span> ${formatCoord(point[1], false)}
                     </div>`;
                     
            activeMaps.forEach(m => {
                syncMarkerForMap(m, 'nadir', point, icon, popupContent, 2000);
            });
        }

        // Celestial Nadir (CN)
        if (!state.showNadir) {
            removeMarker('cn');
        } else {
            const anchorTime = getPersonaAnchorTime(activePersona);
            const coords = getCelestialCoordinates(activePersona.lat, activePersona.lng, anchorTime);
            let point = [0, 0];
            if (coords) {
                point = getSubPointFromRA(coords.nadir.ra, coords.nadir.dec, state.customDate);
            } else {
                let nLng = activePersona.lng + 180;
                if (nLng > 180) nLng -= 360;
                point = [-activePersona.lat, nLng];
            }
            
            const popupContent = coords ? 
                `<div class="font-bold text-center text-slate-850 uppercase tracking-wide font-sans">Celestial Nadir (CN)</div>
                 <div class="text-[10px] text-center text-slate-400 font-medium leading-none mt-0.5">Local Horizon Nadir Projection</div>
                 <div class="text-[11px] text-slate-6050 font-mono text-center mt-2 border-t border-slate-100 pt-2 space-y-1">
                   <div>Dec: <span class="font-semibold text-slate-800">${formatCoord(coords.nadir.dec, true)}</span></div>
                   <div>RA: <span class="font-semibold text-slate-800">${formatRA(coords.nadir.ra)}</span></div>
                 </div>` : 
                `<div class="font-bold text-center text-slate-800 uppercase tracking-wide font-sans">Celestial Nadir (CN)</div>`;

            const iconElement = document.createElement('div');
            iconElement.className = 'w-7 h-7 bg-white text-slate-950 rounded-full border-2 border-slate-950 shadow-md flex items-center justify-center text-xs font-mono font-bold transition-transform transform hover:scale-110 relative z-30';
            iconElement.innerHTML = `<span>CN</span>`;
            
            const icon = window.L.divIcon({
                className: '',
                html: iconElement.outerHTML,
                iconSize: [28, 28],
                iconAnchor: [14, 14],
            });
            
            activeMaps.forEach(m => {
                syncMarkerForMap(m, 'cn', point, icon, popupContent, 3000);
            });
        }
    }
}

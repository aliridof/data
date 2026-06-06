// js/astro.js

let swe = null;

async function initAstro() {
    if (!swe) {
        const SwissEph = (await import('https://cdn.jsdelivr.net/gh/prolaxu/swisseph-wasm@main/src/swisseph.js')).default;
        swe = new SwissEph();
        await swe.initSwissEph();
        
        // Wrap julday with caching to prevent expensive WASM calculations
        const rawJulday = swe.julday.bind(swe);
        const jdCache = new Map();
        swe.julday = function(y, m, d, h) {
            const key = `${y}_${m}_${d}_${h.toFixed(6)}`;
            if (jdCache.has(key)) {
                return jdCache.get(key);
            }
            const res = rawJulday(y, m, d, h);
            if (jdCache.size > 2000) {
                jdCache.delete(jdCache.keys().next().value);
            }
            jdCache.set(key, res);
            return res;
        };

        // Wrap calc_ut with caching
        const rawCalcUt = swe.calc_ut.bind(swe);
        const utCache = new Map();
        swe.calc_ut = function(jd, body, flags) {
            const personaId = (window.state && window.state.selectedPersonaId) || '';
            const coordCfg = (window.state && window.state.coordConfig) || '';
            const zodiacCfg = (window.state && window.state.zodiacConfig) || '';
            const key = `${jd}_${body}_${flags}_${personaId}_${coordCfg}_${zodiacCfg}`;
            if (utCache.has(key)) {
                return utCache.get(key);
            }
            const res = rawCalcUt(jd, body, flags);
            const val = Array.from(res);
            if (utCache.size > 5000) {
                utCache.delete(utCache.keys().next().value);
            }
            utCache.set(key, val);
            return val;
        };

        // Wrap sidtime with caching
        const rawSidtime = swe.sidtime.bind(swe);
        const sidCache = new Map();
        swe.sidtime = function(jd) {
            if (sidCache.has(jd)) {
                return sidCache.get(jd);
            }
            const res = rawSidtime(jd);
            if (sidCache.size > 2000) {
                sidCache.delete(sidCache.keys().next().value);
            }
            sidCache.set(jd, res);
            return res;
        };
    }
}

const BODY_MAP = {
    'Sun': 0, // swe.SE_SUN
    'Moon': 1,
    'Mercury': 2,
    'Venus': 3,
    'Mars': 4,
    'Jupiter': 5,
    'Saturn': 6,
    'Uranus': 7,
    'Neptune': 8,
    'Pluto': 9
};

function getJD(date) {
    return swe.julday(
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate(),
        date.getUTCHours() + (date.getUTCMinutes() / 60.0) + (date.getUTCSeconds() / 3600.0) + (date.getUTCMilliseconds() / 3600000.0)
    );
}

function getSubPoint(bodyStr, date) {
    try {
        if (!swe) return [0, 0];
        
        if (bodyStr === 'Sirius') {
            const raHours = 6.7525;
            const dec = -16.7161;
            return getSubPointFromRA(raHours, dec, date);
        }
        
        const jd = getJD(date);
        const body = BODY_MAP[bodyStr];
        
        // Use Swiss Ephemeris for Equatorial Coordinates (2 = SEFLG_SWIEPH, 2048 = SEFLG_EQUATORIAL)
        const flags = swe.SEFLG_SWIEPH | swe.SEFLG_EQUATORIAL;
        const eq = swe.calc_ut(jd, body, flags);
        
        const raDeg = eq[0]; // RA in degrees
        const dec = eq[1]; // Declination in degrees
        
        const gstHours = swe.sidtime(jd);
        const gstDeg = gstHours * 15;
        
        let lon = raDeg - gstDeg;
        lon = ((lon % 360) + 360) % 360; 
        if (lon > 180) lon -= 360;
        
        return [dec, lon];
    } catch (e) {
        console.error("Math error for body:", bodyStr, e);
        return [0, 0];
    }
}

function getSubPointFromRA(raHours, dec, date) {
    try {
        if (!swe) return [0, 0];
        const jd = getJD(date);
        const gstHours = swe.sidtime(jd);
        
        let lon = (raHours - gstHours) * 15;
        lon = ((lon % 360) + 360) % 360; 
        if (lon > 180) lon -= 360;
        
        return [dec, lon];
    } catch (e) {
        console.error("Math error subpoint from RA:", e);
        return [0, 0];
    }
}

function formatCoord(val, isLat) {
    const dir = isLat ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
    return `${Math.abs(val).toFixed(4)}° ${dir}`;
}

function getCelestialCoordinates(lat, lng, date) {
    try {
        if (!swe) return null;
        const jd = getJD(date);
        const gstHours = swe.sidtime(jd);
        
        let lstHours = gstHours + (lng / 15);
        lstHours = ((lstHours % 24) + 24) % 24;
        
        const zenithDec = lat;
        const zenithRa = lstHours;
        
        const nadirDec = -lat;
        const nadirRa = (lstHours + 12) % 24;
        
        return {
            gst: gstHours,
            lst: lstHours,
            latitude: lat,
            zenith: { ra: zenithRa, dec: zenithDec },
            nadir: { ra: nadirRa, dec: nadirDec }
        };
    } catch (e) {
        console.error("Failed to calculate celestial coordinates", e);
        return null;
    }
}

function formatRA(raHours) {
    const hours = Math.floor(raHours);
    const minutes = Math.floor((raHours - hours) * 60);
    const seconds = Math.floor(((raHours - hours) * 60 - minutes) * 60);
    const deg = (raHours * 15).toFixed(4);
    return `${hours.toString().padStart(2, '0')}j ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}d (${deg}°)`;
}

function formatDec(deg) {
    const isNegative = deg < 0;
    const absDeg = Math.abs(deg);
    const d = Math.floor(absDeg);
    const m = Math.floor((absDeg - d) * 60);
    const s = Math.floor(((absDeg - d) * 60 - m) * 60);
    return `${isNegative ? '-' : '+'}${d}° ${m}' ${s}" (${deg.toFixed(4)}°)`;
}

const ZODIAC_NAMES = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpius", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

function getZodiac(lon, config) {
    if (config === 'IAU') {
        const d = (lon % 360 + 360) % 360;
        if (d < 29.8) return "Pisces";
        if (d < 53.5) return "Aries";
        if (d < 90.1) return "Taurus";
        if (d < 118.0) return "Gemini";
        if (d < 138.2) return "Cancer";
        if (d < 173.9) return "Leo";
        if (d < 218.0) return "Virgo";
        if (d < 241.1) return "Libra";
        if (d < 247.7) return "Scorpius";
        if (d < 266.3) return "Ophiuchus";
        if (d < 299.7) return "Sagittarius";
        if (d < 327.6) return "Capricornus";
        if (d < 351.9) return "Aquarius";
        return "Pisces";
    }
    const idx = Math.floor(lon / 30) % 12;
    return ZODIAC_NAMES[idx];
}

function getBodyStats(bodyStr, date, activePersona, reqConfig) {
    if (!swe) return null;
    const jd = getJD(date);
    const config = reqConfig || {};
    
    if (bodyStr === 'Sirius') {
        const raDeg = 6.7525 * 15;
        const dec = -16.7161;
        
        const Ob = 23.4392911 * Math.PI / 180;
        const raRad = raDeg * Math.PI / 180;
        const decRad = dec * Math.PI / 180;
        
        const y = Math.sin(raRad) * Math.cos(decRad) * Math.cos(Ob) + Math.sin(decRad) * Math.sin(Ob);
        const x = Math.cos(raRad) * Math.cos(decRad);
        
        let lon = Math.atan2(y, x) * 180 / Math.PI;
        lon = (lon % 360 + 360) % 360;
        
        let lat = Math.asin(Math.sin(decRad) * Math.cos(Ob) - Math.cos(decRad) * Math.sin(Ob) * Math.sin(raRad)) * 180 / Math.PI;
        
        const distAU = 543137;
        const speedLon = 0.0;
        
        let zodiacName = getZodiac(lon, config.zodiac);
        
        const gstHours = swe.sidtime(jd);
        const gstDeg = gstHours * 15;
        
        let subLon = raDeg - gstDeg;
        subLon = ((subLon % 360) + 360) % 360;
        if (subLon > 180) subLon -= 360;
        let subLat = dec;
        
        let az = 0, alt = 0, hourAngle = 0;
        if (activePersona) {
            let lstDeg = (gstDeg + activePersona.lng) % 360;
            let haDeg = lstDeg - raDeg;
            haDeg = ((haDeg % 360) + 360) % 360;
            if (haDeg > 180) haDeg -= 360;
            hourAngle = haDeg;
            
            let H = haDeg * Math.PI / 180;
            let pLat = activePersona.lat * Math.PI / 180;
            let objDec = dec * Math.PI / 180;
            
            let sinAlt = Math.sin(pLat) * Math.sin(objDec) + Math.cos(pLat) * Math.cos(objDec) * Math.cos(H);
            alt = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * 180 / Math.PI;
            
            let cosAz = (Math.sin(objDec) - Math.sin(pLat) * sinAlt) / (Math.cos(pLat) * Math.cos(Math.asin(sinAlt)));
            let sinAz = -Math.sin(H) * Math.cos(objDec) / Math.cos(Math.asin(sinAlt));
            
            az = Math.atan2(sinAz, cosAz) * 180 / Math.PI;
            if (az < 0) az += 360;
        }
        
        return {
            subLat, subLon,
            az, alt,
            ra: raDeg / 15,
            dec,
            lon, lat,
            zodiacName,
            hourAngle,
            distAU,
            speed: speedLon,
            gerak: 'Direct'
        };
    }

    const body = BODY_MAP[bodyStr];
    if (body === undefined) return null;
    
    let centerFlag = 0;
    if (config.coord === 'Toposentris') {
        centerFlag = swe.SEFLG_TOPOCTR;
        if (activePersona && swe.set_topo) {
            swe.set_topo(activePersona.lng, activePersona.lat, activePersona.elevation || 0);
        }
    } else if (config.coord === 'Heliosentris') {
        centerFlag = swe.SEFLG_HELCTR;
    }
    
    let siderealFlag = 0;
    if (config.zodiac === 'Sidereal') {
        siderealFlag = swe.SEFLG_SIDEREAL;
        if (swe.set_sid_mode) swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0); 
    }
    
    const eclFlags = swe.SEFLG_SWIEPH | swe.SEFLG_SPEED | centerFlag | siderealFlag;
    const ecl = swe.calc_ut(jd, body, eclFlags);
    let lon = ecl[0] || 0;
    let lat = ecl[1] || 0;
    let distAU = ecl[2] || 0;
    let speedLon = ecl[3] || 0;
    
    const eqFlags = swe.SEFLG_SWIEPH | swe.SEFLG_SPEED | swe.SEFLG_EQUATORIAL | centerFlag | siderealFlag;
    const eq = swe.calc_ut(jd, body, eqFlags);
    let raDeg = eq[0] || 0;
    let dec = eq[1] || 0;
    
    let zodiacName = getZodiac(lon, config.zodiac);
    
    const gstHours = swe.sidtime(jd);
    const gstDeg = gstHours * 15;
    
    let subLon = raDeg - gstDeg;
    subLon = ((subLon % 360) + 360) % 360; 
    if (subLon > 180) subLon -= 360;
    let subLat = dec;
    
    let az = 0, alt = 0, hourAngle = 0;
    if (activePersona) {
        let lstDeg = (gstDeg + activePersona.lng) % 360;
        let haDeg = lstDeg - raDeg;
        haDeg = ((haDeg % 360) + 360) % 360;
        if (haDeg > 180) haDeg -= 360; 
        hourAngle = haDeg;
        
        let H = haDeg * Math.PI / 180;
        let pLat = activePersona.lat * Math.PI / 180;
        let objDec = dec * Math.PI / 180;
        
        let sinAlt = Math.sin(pLat) * Math.sin(objDec) + Math.cos(pLat) * Math.cos(objDec) * Math.cos(H);
        alt = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * 180 / Math.PI;
        
        let cosAz = (Math.sin(objDec) - Math.sin(pLat) * sinAlt) / (Math.cos(pLat) * Math.cos(Math.asin(sinAlt)));
        let sinAz = -Math.sin(H) * Math.cos(objDec) / Math.cos(Math.asin(sinAlt));
        
        az = Math.atan2(sinAz, cosAz) * 180 / Math.PI;
        if (az < 0) az += 360;
    }
    
    return {
        subLat, subLon,
        az, alt,
        ra: raDeg / 15,
        dec,
        lon, lat,
        zodiacName,
        hourAngle,
        distAU,
        speed: speedLon,
        gerak: speedLon > 0 ? 'Direct' : (speedLon < 0 ? 'Retrograde' : 'Stationary')
    };
}


const pathCache = new Map();
function getBodyPath(bodyId, centerDate) {
    // Round centerDate to nearest 5 minutes (300,000 ms) to allow extensive caching
    const roundedTime = Math.round(centerDate.getTime() / 300000) * 300000;
    const cacheKey = `${bodyId}_${roundedTime}`;
    if (pathCache.has(cacheKey)) {
        return pathCache.get(cacheKey);
    }

    const path = [];
    for (let i = -24; i <= 24; i++) {
        const d = new Date(roundedTime + i * 1800000); // 30 mins
        path.push(getSubPoint(bodyId, d));
    }
    
    const unwrapped = [];
    let prevLng = null;
    let offset = 0;
    
    for (const [lat, lng] of path) {
        let currentLng = lng;
        if (prevLng !== null) {
            const diff = currentLng - prevLng;
            if (diff > 180) offset -= 360;
            else if (diff < -180) offset += 360;
        }
        prevLng = currentLng;
        unwrapped.push([lat, currentLng + offset]);
    }
    
    const result = [
        unwrapped.map(([lat, lng]) => [lat, lng - 360]),
        unwrapped,
        unwrapped.map(([lat, lng]) => [lat, lng + 360])
    ];

    if (pathCache.size > 1000) {
        pathCache.delete(pathCache.keys().next().value);
    }
    pathCache.set(cacheKey, result);
    return result;
}

function getTerminator(sunLat, sunLng) {
    let latRad = sunLat * Math.PI / 180;
    const lngRad = sunLng * Math.PI / 180;
    const R2D = 180 / Math.PI;
    
    if (Math.abs(sunLat) < 0.1) {
        latRad = (sunLat >= 0 ? 0.1 : -0.1) * Math.PI / 180;
    }
    
    const polyline = [];
    for (let lon = -360; lon <= 360; lon += 5) {
        const lonRad = lon * Math.PI / 180;
        let tanPhi = -Math.cos(lonRad - lngRad) / Math.tan(latRad);
        let phi = Math.atan(tanPhi) * R2D;
        polyline.push([phi, lon]);
    }
    
    const closeLat = (sunLat > 0) ? -90 : 90;
    const polygon = [...polyline, [closeLat, 360], [closeLat, -360]];
    
    return { polyline, polygon };
}


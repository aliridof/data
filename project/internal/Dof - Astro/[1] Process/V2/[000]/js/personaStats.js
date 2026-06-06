// js/personaStats.js

function getImaginaryPointStats(raDeg, decDeg, date, activePersona, reqConfig) {
    if (!swe) return null;
    const jd = getJD(date);
    
    // Calculate Ecliptic Longitude and Latitude
    const T = (jd - 2451545.0) / 36525.0;
    const epsilonDeg = 23.43929111 - (46.8150 * T) / 3600;
    const eps = epsilonDeg * Math.PI / 180;
    
    const ra = raDeg * Math.PI / 180;
    const dec = decDeg * Math.PI / 180;
    
    const sinLat = Math.sin(dec)*Math.cos(eps) - Math.cos(dec)*Math.sin(eps)*Math.sin(ra);
    const eclLat = Math.asin(sinLat);
    
    const sinLon = Math.sin(dec)*Math.sin(eps) + Math.cos(dec)*Math.cos(eps)*Math.sin(ra);
    const cosLon = Math.cos(dec)*Math.cos(ra);
    let eclLon = Math.atan2(sinLon, cosLon);
    
    let lonDeg = eclLon * 180 / Math.PI;
    if (lonDeg < 0) lonDeg += 360;
    let latDeg = eclLat * 180 / Math.PI;
    
    let finalLon = lonDeg;
    if (reqConfig && reqConfig.zodiac === 'Sidereal') {
        let ayanamsa = 0;
        if (swe.get_ayanamsa_ut) {
            if (swe.set_sid_mode) swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
            ayanamsa = swe.get_ayanamsa_ut(jd);
        } else {
            // Fallback Lahiri approximation
            ayanamsa = 23.85 + ((date.getFullYear() - 2000) + date.getMonth() / 12) * (50.290966 / 3600);
        }
        finalLon = (lonDeg - ayanamsa + 360) % 360;
    }
    
    // Zodiac
    const zodiacName = getZodiac ? getZodiac(finalLon, reqConfig ? reqConfig.zodiac : 'Tropical') : 'N/A';
    
    const gstHours = swe.sidtime(jd);
    const gstDeg = gstHours * 15;
    
    let subLon = raDeg - gstDeg;
    subLon = ((subLon % 360) + 360) % 360; 
    if (subLon > 180) subLon -= 360;
    
    let hourAngle = 0, az = 0, alt = 0;
    if (activePersona) {
        let lstDeg = (gstDeg + activePersona.lng) % 360;
        let haDeg = lstDeg - raDeg;
        haDeg = ((haDeg % 360) + 360) % 360;
        if (haDeg > 180) haDeg -= 360;
        hourAngle = haDeg;
        
        // Horizontal coordinates
        let H = haDeg * Math.PI / 180;
        let pLat = activePersona.lat * Math.PI / 180;
        let objDec = dec;
        
        let sinAlt = Math.sin(pLat) * Math.sin(objDec) + Math.cos(pLat) * Math.cos(objDec) * Math.cos(H);
        alt = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * 180 / Math.PI;
        
        let cosAzCosAlt = Math.sin(objDec) - Math.sin(pLat) * sinAlt;
        let sinAzCosAlt = -Math.sin(H) * Math.cos(objDec) * Math.cos(pLat);
        
        if (Math.abs(sinAlt) > 0.99999) {
            az = sinAlt > 0 ? 0 : 180;
        } else {
            az = Math.atan2(sinAzCosAlt, cosAzCosAlt) * 180 / Math.PI;
            if (az < 0) az += 360;
        }
    }
    
    return {
        subLat: decDeg,
        subLon: subLon,
        az: az,
        alt: alt,
        ra: raDeg / 15,
        dec: decDeg,
        lon: finalLon,
        lat: latDeg,
        zodiacName: zodiacName,
        hourAngle: hourAngle,
        distAU: 0,
        speed: 0,
        gerak: 'N/A'
    };
}

function getTerrestrialStaticStats(isZenith, date, activePersona, reqConfig) {
    if (!swe) return null;
    const jd = getJD(date);
    const gstHours = swe.sidtime(jd);
    
    let lstHours = gstHours + (activePersona.lng / 15);
    lstHours = ((lstHours % 24) + 24) % 24;
    
    let raHours = isZenith ? lstHours : (lstHours + 12) % 24;
    let decDeg = isZenith ? activePersona.lat : -activePersona.lat;
    
    // Calculate Ecliptic Longitude and Latitude of this dynamic direction overhead/underfoot
    const T = (jd - 2451545.0) / 36525.0;
    const epsilonDeg = 23.43929111 - (46.8150 * T) / 3600;
    const eps = epsilonDeg * Math.PI / 180;
    
    const raDeg = raHours * 15;
    const ra = raDeg * Math.PI / 180;
    const dec = decDeg * Math.PI / 180;
    
    const sinLat = Math.sin(dec)*Math.cos(eps) - Math.cos(dec)*Math.sin(eps)*Math.sin(ra);
    const eclLat = Math.asin(sinLat);
    
    const sinLon = Math.sin(dec)*Math.sin(eps) + Math.cos(dec)*Math.cos(eps)*Math.sin(ra);
    const cosLon = Math.cos(dec)*Math.cos(ra);
    let eclLon = Math.atan2(sinLon, cosLon);
    
    let lonDeg = eclLon * 180 / Math.PI;
    if (lonDeg < 0) lonDeg += 360;
    let latDeg = eclLat * 180 / Math.PI;
    
    let finalLon = lonDeg;
    if (reqConfig && reqConfig.zodiac === 'Sidereal') {
        let ayanamsa = 0;
        if (swe.get_ayanamsa_ut) {
            if (swe.set_sid_mode) swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
            ayanamsa = swe.get_ayanamsa_ut(jd);
        } else {
            ayanamsa = 23.85 + ((date.getFullYear() - 2000) + date.getMonth() / 12) * (50.290966 / 3600);
        }
        finalLon = (lonDeg - ayanamsa + 360) % 360;
    }
    
    const zodiacName = getZodiac ? getZodiac(finalLon, reqConfig ? reqConfig.zodiac : 'Tropical') : 'N/A';
    
    let subLat = isZenith ? activePersona.lat : -activePersona.lat;
    let subLon = activePersona.lng;
    if (!isZenith) {
        subLon += 180;
        if (subLon > 180) subLon -= 360;
    }
    
    return {
        subLat: subLat,
        subLon: subLon,
        az: isZenith ? 0 : 180,
        alt: isZenith ? 90 : -90,
        ra: raHours,
        dec: decDeg,
        lon: finalLon,
        lat: latDeg,
        zodiacName: zodiacName,
        hourAngle: isZenith ? 0 : 12 * 15, // Local Hour Angle of zenith is always 0, nadir is always 12h
        distAU: 0,
        speed: 0,
        gerak: 'N/A'
    };
}

function updatePersonaStats() {
    const activePersona = state.personas.find(p => p.id === state.selectedPersonaId) || state.personas[0];
    const reqConfig = { zodiac: state.zodiacConfig, coord: state.coordConfig };
    
    const anchorTime = getPersonaAnchorTime ? getPersonaAnchorTime(activePersona) : state.customDate;
    const coords = getCelestialCoordinates ? getCelestialCoordinates(activePersona.lat, activePersona.lng, anchorTime) : null;
    
    if (!coords) return;
    
    const cZenith = coords.zenith;
    const cNadir = coords.nadir;
    
    const renderCardStats = (domId, stats) => {
        const statsContainer = document.getElementById(domId);
        if (!statsContainer || !stats) return;
        statsContainer.innerHTML = generateStatsTableHTML(stats, false);
    };
    
    // CZ (Celestial Zenith)
    const statsCZ = getImaginaryPointStats(cZenith.ra * 15, cZenith.dec, state.customDate, activePersona, reqConfig);
    const czInfo = document.querySelector('#celestial-card-persona-celestial-zenith .celestial-info');
    if (czInfo && !czInfo.classList.contains('hidden') && statsCZ) {
        renderCardStats('stats-persona-celestial-zenith', statsCZ);
    }
    
    // CN (Celestial Nadir)
    const statsCN = getImaginaryPointStats(cNadir.ra * 15, cNadir.dec, state.customDate, activePersona, reqConfig);
    const cnInfo = document.querySelector('#celestial-card-persona-celestial-nadir .celestial-info');
    if (cnInfo && !cnInfo.classList.contains('hidden') && statsCN) {
        renderCardStats('stats-persona-celestial-nadir', statsCN);
    }
    
    // TZ (Terrestrial Zenith)
    const statsTZ = getTerrestrialStaticStats(true, state.customDate, activePersona, reqConfig);
    const tzInfo = document.querySelector('#terrestrial-card-persona-terrestrial-zenith .terrestrial-info');
    if (tzInfo && !tzInfo.classList.contains('hidden') && statsTZ) {
        renderCardStats('stats-persona-terrestrial-zenith', statsTZ);
    }
    
    // TN (Terrestrial Nadir)
    const statsTN = getTerrestrialStaticStats(false, state.customDate, activePersona, reqConfig);
    const tnInfo = document.querySelector('#terrestrial-card-persona-terrestrial-nadir .terrestrial-info');
    if (tnInfo && !tnInfo.classList.contains('hidden') && statsTN) {
        renderCardStats('stats-persona-terrestrial-nadir', statsTN);
    }
}

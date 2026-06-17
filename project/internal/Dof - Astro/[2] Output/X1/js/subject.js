// js/subject.js

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

function getAyanamsa(jd, date) {
  if (typeof swe !== "undefined" && swe) {
    if (typeof swe.set_sid_mode === "function") {
      const SIDM_LAHIRI = typeof swe.SE_SIDM_LAHIRI !== "undefined" ? swe.SE_SIDM_LAHIRI : 21;
      swe.set_sid_mode(SIDM_LAHIRI, 0, 0);
    }
    if (typeof swe.get_ayanamsa_ut === "function") {
      return swe.get_ayanamsa_ut(jd);
    }
  }
  return 23.85 + (date.getFullYear() - 2000 + date.getMonth() / 12) * (50.290966 / 3600);
}

function getImaginaryPointStats(raDeg, decDeg, date, activeSubject, reqConfig) {
  if (!swe) return null;
  const jd = getJD(date);

  // Calculate Ecliptic Longitude and Latitude
  const eps = getObliquity(jd);

  const ra = (raDeg * Math.PI) / 180;
  const dec = (decDeg * Math.PI) / 180;

  const sinLat =
    Math.sin(dec) * Math.cos(eps) -
    Math.cos(dec) * Math.sin(eps) * Math.sin(ra);
  const eclLat = Math.asin(sinLat);

  const sinLon =
    Math.sin(dec) * Math.sin(eps) +
    Math.cos(dec) * Math.cos(eps) * Math.sin(ra);
  const cosLon = Math.cos(dec) * Math.cos(ra);
  let eclLon = Math.atan2(sinLon, cosLon);

  let lonDeg = (eclLon * 180) / Math.PI;
  if (lonDeg < 0) lonDeg += 360;
  let latDeg = (eclLat * 180) / Math.PI;

  let finalLon = lonDeg;
  if (reqConfig && reqConfig.zodiac === "Sidereal") {
    const ayanamsa = getAyanamsa(jd, date);
    finalLon = (lonDeg - ayanamsa + 360) % 360;
  }

  // Zodiac
  const zodiacName = getZodiac
    ? getZodiac(finalLon, reqConfig ? reqConfig.zodiac : "Tropical")
    : "N/A";

  const gstHours = swe.sidtime(jd);
  const gstDeg = gstHours * 15;

  let subLon = raDeg - gstDeg;
  subLon = ((subLon % 360) + 360) % 360;
  if (subLon > 180) subLon -= 360;

  let hourAngle = 0,
    az = 0,
    alt = 0;
  if (activeSubject) {
    let lstDeg = (gstDeg + activeSubject.lng) % 360;
    let haDeg = lstDeg - raDeg;
    haDeg = ((haDeg % 360) + 360) % 360;
    if (haDeg > 180) haDeg -= 360;
    hourAngle = haDeg;

    // Horizontal coordinates
    let H = (haDeg * Math.PI) / 180;
    let pLat = (activeSubject.lat * Math.PI) / 180;
    let objDec = dec;

    let sinAlt =
      Math.sin(pLat) * Math.sin(objDec) +
      Math.cos(pLat) * Math.cos(objDec) * Math.cos(H);
    alt = (Math.asin(Math.max(-1, Math.min(1, sinAlt))) * 180) / Math.PI;

    let cosAzCosAlt = Math.sin(objDec) - Math.sin(pLat) * sinAlt;
    let sinAzCosAlt = -Math.sin(H) * Math.cos(objDec) * Math.cos(pLat);

    if (Math.abs(sinAlt) > 0.99999) {
      az = sinAlt > 0 ? 0 : 180;
    } else {
      az = (Math.atan2(sinAzCosAlt, cosAzCosAlt) * 180) / Math.PI;
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
    gerak: "N/A",
  };
}

function getTerrestrialStaticStats(isZenith, date, activeSubject, reqConfig) {
  if (!swe) return null;
  const jd = getJD(date);
  const gstHours = swe.sidtime(jd);

  let lstHours = gstHours + activeSubject.lng / 15;
  lstHours = ((lstHours % 24) + 24) % 24;

  let raHours = isZenith ? lstHours : (lstHours + 12) % 24;
  let decDeg = isZenith ? activeSubject.lat : -activeSubject.lat;

  // Calculate Ecliptic Longitude and Latitude of this dynamic direction overhead/underfoot
  const eps = getObliquity(jd);

  const raDeg = raHours * 15;
  const ra = (raDeg * Math.PI) / 180;
  const dec = (decDeg * Math.PI) / 180;

  const sinLat =
    Math.sin(dec) * Math.cos(eps) -
    Math.cos(dec) * Math.sin(eps) * Math.sin(ra);
  const eclLat = Math.asin(sinLat);

  const sinLon =
    Math.sin(dec) * Math.sin(eps) +
    Math.cos(dec) * Math.cos(eps) * Math.sin(ra);
  const cosLon = Math.cos(dec) * Math.cos(ra);
  let eclLon = Math.atan2(sinLon, cosLon);

  let lonDeg = (eclLon * 180) / Math.PI;
  if (lonDeg < 0) lonDeg += 360;
  let latDeg = (eclLat * 180) / Math.PI;

  let finalLon = lonDeg;
  if (reqConfig && reqConfig.zodiac === "Sidereal") {
    const ayanamsa = getAyanamsa(jd, date);
    finalLon = (lonDeg - ayanamsa + 360) % 360;
  }

  const zodiacName = getZodiac
    ? getZodiac(finalLon, reqConfig ? reqConfig.zodiac : "Tropical")
    : "N/A";

  let subLat = isZenith ? activeSubject.lat : -activeSubject.lat;
  let subLon = activeSubject.lng;
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
    gerak: "N/A",
  };
}

function updateSubjectStats() {
  const activeSubject =
    state.subjects.find((s) => s.id === state.selectedSubjectId) ||
    state.subjects[0];
  const reqConfig = { zodiac: state.zodiacConfig, coord: state.coordConfig };

  const anchorTime = getSubjectAnchorTime
    ? getSubjectAnchorTime(activeSubject)
    : state.customDate;
  const coords = getCelestialCoordinates
    ? getCelestialCoordinates(activeSubject.lat, activeSubject.lng, anchorTime)
    : null;

  if (!coords) return;

  const cZenith = coords.zenith;
  const cNadir = coords.nadir;

  const renderCardStats = (domId, stats) => {
    const statsContainer = document.getElementById(domId);
    if (!statsContainer || !stats) return;
    statsContainer.innerHTML = generateStatsTableHTML(stats, false);
  };

  // CZ (Celestial Zenith)
  const statsCZ = getImaginaryPointStats(
    cZenith.ra * 15,
    cZenith.dec,
    state.customDate,
    activeSubject,
    reqConfig,
  );
  const czInfo = document.querySelector(
    "#celestial-card-celestial-zenith .celestial-info",
  );
  if (czInfo && !czInfo.classList.contains("hidden") && statsCZ) {
    renderCardStats("stats-celestial-zenith", statsCZ);
  }

  // CN (Celestial Nadir)
  const statsCN = getImaginaryPointStats(
    cNadir.ra * 15,
    cNadir.dec,
    state.customDate,
    activeSubject,
    reqConfig,
  );
  const cnInfo = document.querySelector(
    "#celestial-card-celestial-nadir .celestial-info",
  );
  if (cnInfo && !cnInfo.classList.contains("hidden") && statsCN) {
    renderCardStats("stats-celestial-nadir", statsCN);
  }

  // TZ (Terrestrial Zenith)
  const statsTZ = getTerrestrialStaticStats(
    true,
    state.customDate,
    activeSubject,
    reqConfig,
  );
  const tzInfo = document.querySelector(
    "#terrestrial-card-terrestrial-zenith .terrestrial-info",
  );
  if (tzInfo && !tzInfo.classList.contains("hidden") && statsTZ) {
    renderCardStats("stats-terrestrial-zenith", statsTZ);
  }

  // TN (Terrestrial Nadir)
  const statsTN = getTerrestrialStaticStats(
    false,
    state.customDate,
    activeSubject,
    reqConfig,
  );
  const tnInfo = document.querySelector(
    "#terrestrial-card-terrestrial-nadir .terrestrial-info",
  );
  if (tnInfo && !tnInfo.classList.contains("hidden") && statsTN) {
    renderCardStats("stats-terrestrial-nadir", statsTN);
  }
}

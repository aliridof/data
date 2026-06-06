// js/entity.js

const ENTITIES = [
    // 1. TERRESTRIAL ZENITH
    {
        id: 'persona-terrestrial-zenith',
        type: 'TERRESTRIAL',
        category: 'STATIC - PERSONA - TERRESTRIAL',
        label: 'STATIC - PERSONA - TERRESTRIAL - ZENITH',
        subLabel: 'Zenith - Terrestrial • ',
        symbol: 'TZ',
        color: '#10b981', // emerald-500
        toggleKey: 'showZenith',
        isZenith: true
    },
    // 2. TERRESTRIAL NADIR
    {
        id: 'persona-terrestrial-nadir',
        type: 'TERRESTRIAL',
        category: 'STATIC - PERSONA - TERRESTRIAL',
        label: 'STATIC - PERSONA - TERRESTRIAL - NADIR',
        subLabel: 'Nadir - Terrestrial • ',
        symbol: 'TN',
        color: '#f43f5e', // rose-500
        toggleKey: 'showNadir',
        isZenith: false
    },
    // 3. CELESTIAL ZENITH
    {
        id: 'persona-celestial-zenith',
        type: 'CELESTIAL',
        category: 'DYNAMIC - PERSONA - CELESTIAL',
        label: 'DYNAMIC - PERSONA - CELESTIAL - ZENITH',
        subLabel: 'Zenith - Celestial • ',
        symbol: 'CZ',
        color: '#10b981', // emerald-500
        isZenith: true
    },
    // 4. CELESTIAL NADIR
    {
        id: 'persona-celestial-nadir',
        type: 'CELESTIAL',
        category: 'DYNAMIC - PERSONA - CELESTIAL',
        label: 'DYNAMIC - PERSONA - CELESTIAL - NADIR',
        subLabel: 'Nadir - Celestial • ',
        symbol: 'CN',
        color: '#f43f5e', // rose-500
        isZenith: false
    },
    // 5. SUN
    { 
        id: 'Sun', 
        type: 'OBJECT', 
        category: 'STAR', 
        label: 'SUN', 
        subLabel: 'Matahari / شمس (Syams)', 
        color: '#f59e0b', 
        symbol: '☉', 
        class: 'sun-marker' 
    },
    // 6. MOON
    { 
        id: 'Moon', 
        type: 'OBJECT', 
        category: 'SATELLITE - NATURAL', 
        label: 'MOON', 
        subLabel: 'Bulan / قمر (Qamar)', 
        color: '#94a3b8', 
        symbol: '☽', 
        class: 'moon-marker' 
    },
    // 7. MERCURY
    { 
        id: 'Mercury', 
        type: 'OBJECT', 
        category: 'PLANET', 
        label: 'MERCURY', 
        subLabel: 'Merkurius / عطارد (Atarid)', 
        color: '#f87171', 
        symbol: '☿', 
        class: 'mercury-marker' 
    },
    // 8. VENUS
    { 
        id: 'Venus', 
        type: 'OBJECT', 
        category: 'PLANET', 
        label: 'VENUS', 
        subLabel: 'Venus / زهرة (Zuhrah)', 
        color: '#facc15', 
        symbol: '♀', 
        class: 'venus-marker' 
    },
    // 9. MARS
    { 
        id: 'Mars', 
        type: 'OBJECT', 
        category: 'PLANET', 
        label: 'MARS', 
        subLabel: 'Mars / مريخ (Marrikh)', 
        color: '#ef4444', 
        symbol: '♂', 
        class: 'mars-marker' 
    },
    // 10. JUPITER
    { 
        id: 'Jupiter', 
        type: 'OBJECT', 
        category: 'PLANET', 
        label: 'JUPITER', 
        subLabel: 'Jupiter / مشتری (Musytari)', 
        color: '#ea580c', 
        symbol: '♃', 
        class: 'jupiter-marker' 
    },
    // 11. SATURN
    { 
        id: 'Saturn', 
        type: 'OBJECT', 
        category: 'PLANET', 
        label: 'SATURN', 
        subLabel: 'Saturnus / زحل (Zuhal)', 
        color: '#fbbf24', 
        symbol: '♄', 
        class: 'saturn-marker' 
    },
    // 12. URANUS
    { 
        id: 'Uranus', 
        type: 'OBJECT', 
        category: 'PLANET', 
        label: 'URANUS', 
        subLabel: 'Uranus / أورانوس (Uranus)', 
        color: '#38bdf8', 
        symbol: '♅', 
        class: 'uranus-marker' 
    },
    // 13. NEPTUNE
    { 
        id: 'Neptune', 
        type: 'OBJECT', 
        category: 'PLANET', 
        label: 'NEPTUNE', 
        subLabel: 'Neptunus / نبتون (Nibtun)', 
        color: '#3b82f6', 
        symbol: '♆', 
        class: 'neptune-marker' 
    },
    // 14. PLUTO
    { 
        id: 'Pluto', 
        type: 'OBJECT', 
        category: 'DWARF', 
        label: 'PLUTO', 
        subLabel: 'Pluto / بلوتو (Bluto)', 
        color: '#a855f7', 
        symbol: '♇', 
        class: 'pluto-marker' 
    },
    // 15. SIRIUS
    { 
        id: 'Sirius', 
        type: 'OBJECT', 
        category: 'STAR', 
        label: 'SIRIUS', 
        subLabel: 'Alpha Canis Majoris / الشعرى (Asy-Syi\'ra)', 
        color: '#000000', 
        symbol: '★', 
        class: 'sirius-marker' 
    }
];

const expandedEntities = new Set();

const BASE_AREAS = {
    'Sun': 59277.63,
    'Moon': 63266.58,
    'Venus': 2040.86,
    'Jupiter': 1549.19,
    'Mars': 776.14,
    'Saturn': 621.53,
    'Mercury': 401.99,
    'Uranus': 126.78,
    'Neptune': 74.21,
    'Pluto': 3.09,
    'Sirius': 1200000.00
};

const REF_DIST_AU = {
    'Sun': 1.0,
    'Moon': 0.002569,
    'Venus': 0.28,
    'Mars': 0.38,
    'Jupiter': 4.2,
    'Saturn': 8.5,
    'Mercury': 0.61,
    'Uranus': 18.2,
    'Neptune': 29.1,
    'Pluto': 38.5,
    'Sirius': 543137.0
};

function getEntityIcons(name) {
    const icons = {
        compass: `<svg class="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>`,
        activity: `<svg class="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>`,
        mapPin: `<svg class="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
        maximize: `<svg class="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>`,
        navigation: `<svg class="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>`,
        arrowUpRight: `<svg class="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>`,
        globe: `<svg class="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
        layers: `<svg class="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polygon points="2 17 12 22 22 17"></polygon><polygon points="2 12 12 17 22 12"></polygon></svg>`,
        map: `<svg class="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>`,
        star: `<svg class="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
        clock: `<svg class="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
        link: `<svg class="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
        zap: `<svg class="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
        shuffle: `<svg class="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>`,
        calendar: `<svg class="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`
    };
    return icons[name] || '';
}

function generateStatsTableHTML(stats, isObject, bodyId = null) {
    const inlineIcon = getEntityIcons;
    
    const safeFormatCoord = (val, isLat) => typeof formatCoord === 'function' ? formatCoord(val, isLat) : val.toFixed(4);
    const safeFormatRA = (val) => typeof formatRA === 'function' ? formatRA(val) : val.toFixed(4);
    const safeFormatDec = (val) => typeof formatDec === 'function' ? formatDec(val) : val.toFixed(4);
    
    const posTz = (stats.alt / 90) * 100;
    const posTzStr = (posTz >= 0 ? '+' : '') + posTz.toFixed(2) + '%';
    const posWord = stats.alt >= 0 ? "ZENITH" : "NADIR";

    // Sub latitude & longitude with precision
    const subLatStr = safeFormatCoord(stats.subLat, true);
    const subLonStr = safeFormatCoord(stats.subLon, false);

    // Calculate Map Grid Positions
    let sectorString = '00';
    let houseString = '00';
    let ringString = '00';
    
    // Sirius-referenced relative azimuth calculation
    let siriusAzAux = 0;
    if (typeof getBodyStats === 'function') {
        const activePersona = state.personas.find(p => p.id === state.selectedPersonaId) || state.personas[0];
        const siriusStats = getBodyStats('Sirius', state.customDate, activePersona);
        if (siriusStats) siriusAzAux = siriusStats.az;
    }
    
    let relAz = (stats.az - siriusAzAux) % 360;
    if (relAz < 0) relAz += 360;
    let sliceIndex = Math.floor(relAz / 30);
    let absAlt = Math.abs(stats.alt);
    let sectorNum = 1;
    
    const isExactlyAtCenter = Math.abs(absAlt - 90) < 1e-9;
    
    if (isExactlyAtCenter) {
        sectorString = '00';
        houseString = '00';
        ringString = '00';
    } else {
        if (absAlt >= 60 && absAlt < 90) {
            sectorNum = sliceIndex + 1;
        } else if (absAlt >= 30 && absAlt < 60) {
            sectorNum = sliceIndex + 13;
        } else {
            sectorNum = sliceIndex + 25;
        }
        sectorString = String(sectorNum).padStart(2, '0');
        
        let houseNum = ((sectorNum - 1) % 12) + 1;
        houseString = String(houseNum).padStart(2, '0');
        
        if (sectorNum >= 1 && sectorNum <= 12) {
            ringString = '01';
        } else if (sectorNum >= 13 && sectorNum <= 24) {
            ringString = '02';
        } else if (sectorNum >= 25 && sectorNum <= 36) {
            ringString = '03';
        }
    }

    const gmapLink = `https://www.google.com/maps/search/?api=1&query=${stats.subLat},${stats.subLon}`;

    // Compute Area
    let areaHtmlContent = 'N/A';
    if (isObject && bodyId) {
        const baseArea = BASE_AREAS[bodyId] || 0;
        const refDist = REF_DIST_AU[bodyId] || 1.0;
        const currentArea = baseArea * (refDist / stats.distAU);
        areaHtmlContent = currentArea.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' METER';
    }

    // Transit predictions
    let transitRows = '';
    if (isObject && bodyId) {
        const activePersona = state.personas.find(p => p.id === state.selectedPersonaId) || state.personas[0];
        const zenithDate = typeof predictConjunction === 'function' ? predictConjunction(bodyId, state.customDate, activePersona, true) : null;
        const nadirDate = typeof predictConjunction === 'function' ? predictConjunction(bodyId, state.customDate, activePersona, false) : null;
        
        const formatLocalTime = (date, tz) => {
            const { DateTime } = window.luxon || {};
            if (DateTime && date && tz) {
                try {
                    const dt = DateTime.fromJSDate(date).setZone(tz);
                    if (dt.isValid) {
                        const offsetInMinutes = dt.offset;
                        const hours = Math.floor(Math.abs(offsetInMinutes) / 60);
                        const mins = Math.abs(offsetInMinutes) % 60;
                        const sign = offsetInMinutes >= 0 ? '+' : '-';
                        const offsetStr = mins === 0 ? `${sign}${hours}` : `${sign}${hours}:${mins.toString().padStart(2, '0')}`;
                        return dt.toFormat('dd LLLL yyyy hh:mm a').toUpperCase() + ' [GMT' + offsetStr + ']';
                    }
                } catch (e) {
                    console.error(e);
                }
            }
            return date ? date.toUTCString().toUpperCase() : "N/A";
        };
        
        const zStr = formatLocalTime(zenithDate, activePersona.timezone);
        const nStr = formatLocalTime(nadirDate, activePersona.timezone);
        
        transitRows = `
        <!-- Row: Zenith Transit -->
        <div class="flex items-center text-[10px] hover:bg-neutral-100/30 dark:hover:bg-neutral-800/20 px-3 py-1.5 transition-colors">
            <div class="flex items-center gap-1.5 w-1/3 min-w-[105px] shrink-0 text-neutral-500 dark:text-neutral-400 select-none font-semibold font-sans tracking-wide">
                ${inlineIcon('calendar')}
                <span>ZENITH TRANSIT</span>
            </div>
            <div class="flex-1 font-mono font-medium text-neutral-800 dark:text-neutral-100 pl-3 border-l border-neutral-150 dark:border-neutral-800/80 break-words text-[10px]">
                ${zStr}
            </div>
        </div>
        <!-- Row: Nadir Transit -->
        <div class="flex items-center text-[10px] hover:bg-neutral-100/30 dark:hover:bg-neutral-800/20 px-3 py-1.5 transition-colors">
            <div class="flex items-center gap-1.5 w-1/3 min-w-[105px] shrink-0 text-neutral-500 dark:text-neutral-400 select-none font-semibold font-sans tracking-wide">
                ${inlineIcon('calendar')}
                <span>NADIR TRANSIT</span>
            </div>
            <div class="flex-1 font-mono font-medium text-neutral-800 dark:text-neutral-100 pl-3 border-l border-neutral-150 dark:border-neutral-800/80 break-words text-[10px]">
                ${nStr}
            </div>
        </div>
        `;
    }

    return `
        <div class="bg-neutral-50 dark:bg-radial-to-t dark:from-neutral-900 dark:to-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-none overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800/80 shadow-xs">
            <!-- Row: Position / Map Classification -->
            <div class="flex items-start text-[10px] bg-neutral-100/30 dark:bg-neutral-800/20 px-3 py-2 border-b border-neutral-100 dark:border-neutral-800/80 transition-colors">
                <div class="w-1/3 min-w-[105px] shrink-0 select-none text-[10px] leading-normal">
                    <div class="flex items-center gap-1.5 font-sans font-semibold text-neutral-500 dark:text-neutral-400">
                        ${inlineIcon('compass')}
                        <span>POSITION</span>
                    </div>
                    <div class="font-mono mt-0.5 text-neutral-400 dark:text-neutral-600">
                        <div class="flex items-center">
                            <span>└──&nbsp;</span>
                            <span class="font-medium text-neutral-500 dark:text-neutral-500">RING</span>
                        </div>
                        <div class="flex items-center mt-0.5">
                            <span>&nbsp;&nbsp;&nbsp;&nbsp;└──&nbsp;</span>
                            <span class="font-medium text-neutral-500 dark:text-neutral-500">HOUSE</span>
                        </div>
                        <div class="flex items-center mt-0.5">
                            <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└──&nbsp;</span>
                            <span class="font-medium text-neutral-500 dark:text-neutral-500">SECTOR</span>
                        </div>
                    </div>
                </div>
                <div class="flex-1 pl-3 border-l border-neutral-150 dark:border-neutral-800/80 flex flex-col justify-start">
                    <div class="font-mono text-[10px] leading-normal select-none">
                        <div class="text-neutral-800 dark:text-neutral-100 font-extrabold">${posWord}</div>
                        <div class="text-neutral-650 dark:text-neutral-450 mt-0.5 flex items-center">
                            <span class="text-neutral-400 dark:text-neutral-600">└──&nbsp;</span>
                            <span class="font-bold text-neutral-850 dark:text-neutral-150">${ringString}</span>
                        </div>
                        <div class="text-neutral-550 dark:text-neutral-500 flex items-center mt-0.5 font-bold">
                            <span class="text-neutral-400 dark:text-neutral-600 font-normal">&nbsp;&nbsp;&nbsp;&nbsp;└──&nbsp;</span>
                            <span>${houseString}</span>
                        </div>
                        <div class="text-neutral-450 dark:text-neutral-550 flex items-center mt-0.5 font-bold">
                            <span class="text-neutral-400 dark:text-neutral-600 font-normal">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└──&nbsp;</span>
                            <span class="text-neutral-800 dark:text-neutral-200">${sectorString}</span>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Row: Status -->
            <div class="flex items-center text-[10px] hover:bg-neutral-100/30 dark:hover:bg-neutral-800/20 px-3 py-1.5 transition-colors">
                <div class="flex items-center gap-1.5 w-1/3 min-w-[105px] shrink-0 text-neutral-500 dark:text-neutral-400 select-none font-semibold font-sans tracking-wide">
                    ${inlineIcon('activity')}
                    <span>STATUS</span>
                </div>
                <div class="flex-1 font-mono font-medium text-neutral-800 dark:text-neutral-100 pl-3 border-l border-neutral-150 dark:border-neutral-800/80">
                    <span class="inline-block px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-800 text-[9px] rounded-none font-bold text-black dark:text-white">${posTzStr}</span>
                </div>
            </div>
            <!-- Row: Location -->
            <div class="flex items-center text-[10px] hover:bg-neutral-100/30 dark:hover:bg-neutral-800/20 px-3 py-1.5 transition-colors">
                <div class="flex items-center gap-1.5 w-1/3 min-w-[105px] shrink-0 text-neutral-500 dark:text-neutral-400 select-none font-semibold font-sans tracking-wide">
                    ${inlineIcon('mapPin')}
                    <span>LOCATION</span>
                </div>
                <div class="flex-1 font-mono font-medium text-neutral-800 dark:text-neutral-100 pl-3 border-l border-neutral-150 dark:border-neutral-800/80 truncate">
                    <a href="${gmapLink}" target="_blank" class="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:underline inline-flex items-center gap-1">
                        <span>${subLatStr}, ${subLonStr}</span>
                        <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </a>
                </div>
            </div>
            <!-- Row: Area -->
            <div class="flex items-center text-[10px] hover:bg-neutral-100/30 dark:hover:bg-neutral-800/20 px-3 py-1.5 transition-colors">
                <div class="flex items-center gap-1.5 w-1/3 min-w-[105px] shrink-0 text-neutral-500 dark:text-neutral-400 select-none font-semibold font-sans tracking-wide">
                    ${inlineIcon('maximize')}
                    <span>AREA</span>
                </div>
                <div class="flex-1 font-mono font-bold text-neutral-800 dark:text-neutral-100 pl-3 border-l border-neutral-150 dark:border-neutral-800/80 uppercase">
                    ${areaHtmlContent}
                </div>
            </div>
            ${transitRows}
            <!-- Row: Sub Lat -->
            <div class="flex items-center text-[10px] hover:bg-neutral-100/30 dark:hover:bg-neutral-800/20 px-3 py-1.5 transition-colors">
                <div class="flex items-center gap-1.5 w-1/3 min-w-[105px] shrink-0 text-neutral-500 dark:text-neutral-400 select-none font-semibold font-sans tracking-wide">
                    ${inlineIcon('navigation')}
                    <span>SUB LAT</span>
                </div>
                <div class="flex-1 font-mono font-medium text-neutral-800 dark:text-neutral-100 pl-3 border-l border-neutral-150 dark:border-neutral-800/80">
                    ${subLatStr}
                </div>
            </div>
            <!-- Row: Sub Lon -->
            <div class="flex items-center text-[10px] hover:bg-neutral-100/30 dark:hover:bg-neutral-800/20 px-3 py-1.5 transition-colors">
                <div class="flex items-center gap-1.5 w-1/3 min-w-[105px] shrink-0 text-neutral-500 dark:text-neutral-400 select-none font-semibold font-sans tracking-wide">
                    ${inlineIcon('navigation')}
                    <span>SUB LON</span>
                </div>
                <div class="flex-1 font-mono font-medium text-neutral-800 dark:text-neutral-100 pl-3 border-l border-neutral-150 dark:border-neutral-800/80">
                    ${subLonStr}
                </div>
            </div>
            <!-- Row: Azimuth -->
            <div class="flex items-center text-[10px] hover:bg-neutral-100/30 dark:hover:bg-neutral-800/20 px-3 py-1.5 transition-colors">
                <div class="flex items-center gap-1.5 w-1/3 min-w-[105px] shrink-0 text-neutral-500 dark:text-neutral-400 select-none font-semibold font-sans tracking-wide">
                    ${inlineIcon('compass')}
                    <span>AZIMUTH</span>
                </div>
                <div class="flex-1 font-mono font-medium text-neutral-800 dark:text-neutral-100 pl-3 border-l border-neutral-150 dark:border-neutral-800/80">
                    ${stats.az.toFixed(4)}°
                </div>
            </div>
            <!-- Row: Altitude -->
            <div class="flex items-center text-[10px] hover:bg-neutral-100/30 dark:hover:bg-neutral-800/20 px-3 py-1.5 transition-colors">
                <div class="flex items-center gap-1.5 w-1/3 min-w-[105px] shrink-0 text-neutral-500 dark:text-neutral-400 select-none font-semibold font-sans tracking-wide">
                    ${inlineIcon('arrowUpRight')}
                    <span>ALTITUDE</span>
                </div>
                <div class="flex-1 font-mono font-medium text-neutral-800 dark:text-neutral-100 pl-3 border-l border-neutral-150 dark:border-neutral-800/80">
                    ${stats.alt.toFixed(4)}°
                </div>
            </div>
            <!-- Row: RA -->
            <div class="flex items-center text-[10px] hover:bg-neutral-100/30 dark:hover:bg-neutral-800/20 px-3 py-1.5 transition-colors">
                <div class="flex items-center gap-1.5 w-1/3 min-w-[105px] shrink-0 text-neutral-500 dark:text-neutral-400 select-none font-semibold font-sans tracking-wide">
                    ${inlineIcon('globe')}
                    <span>RI. ASC. (RA)</span>
                </div>
                <div class="flex-1 font-mono font-medium text-neutral-800 dark:text-neutral-100 pl-3 border-l border-neutral-150 dark:border-neutral-800/80">
                    ${safeFormatRA(stats.ra)}
                </div>
            </div>
            <!-- Row: Dec -->
            <div class="flex items-center text-[10px] hover:bg-neutral-100/30 dark:hover:bg-neutral-800/20 px-3 py-1.5 transition-colors">
                <div class="flex items-center gap-1.5 w-1/3 min-w-[105px] shrink-0 text-neutral-500 dark:text-neutral-400 select-none font-semibold font-sans tracking-wide">
                    ${inlineIcon('globe')}
                    <span>DECLINATION</span>
                </div>
                <div class="flex-1 font-mono font-medium text-neutral-800 dark:text-neutral-100 pl-3 border-l border-neutral-150 dark:border-neutral-800/80">
                    ${safeFormatDec(stats.dec)}
                </div>
            </div>
            <!-- Row: Longitude -->
            <div class="flex items-center text-[10px] hover:bg-neutral-100/30 dark:hover:bg-neutral-800/20 px-3 py-1.5 transition-colors">
                <div class="flex items-center gap-1.5 w-1/3 min-w-[105px] shrink-0 text-neutral-500 dark:text-neutral-400 select-none font-semibold font-sans tracking-wide">
                    ${inlineIcon('map')}
                    <span>LONGITUDE</span>
                </div>
                <div class="flex-1 font-mono font-medium text-neutral-800 dark:text-neutral-100 pl-3 border-l border-neutral-150 dark:border-neutral-800/80">
                    ${stats.lon.toFixed(4)}°
                </div>
            </div>
            <!-- Row: Latitude -->
            <div class="flex items-center text-[10px] hover:bg-neutral-100/30 dark:hover:bg-neutral-800/20 px-3 py-1.5 transition-colors">
                <div class="flex items-center gap-1.5 w-1/3 min-w-[105px] shrink-0 text-neutral-500 dark:text-neutral-400 select-none font-semibold font-sans tracking-wide">
                    ${inlineIcon('map')}
                    <span>LATITUDE</span>
                </div>
                <div class="flex-1 font-mono font-medium text-neutral-800 dark:text-neutral-100 pl-3 border-l border-neutral-150 dark:border-neutral-800/80">
                    ${stats.lat.toFixed(4)}°
                </div>
            </div>
            <!-- Row: Zodiac -->
            <div class="flex items-center text-[10px] hover:bg-neutral-100/30 dark:hover:bg-neutral-800/20 px-3 py-1.5 transition-colors">
                <div class="flex items-center gap-1.5 w-1/3 min-w-[105px] shrink-0 text-neutral-500 dark:text-neutral-400 select-none font-semibold font-sans tracking-wide">
                    ${inlineIcon('star')}
                    <span>ZODIAK</span>
                </div>
                <div class="flex-1 font-mono font-extrabold text-neutral-800 dark:text-neutral-100 pl-3 border-l border-neutral-150 dark:border-neutral-800/80 uppercase">
                    ${stats.zodiacName}
                </div>
            </div>
            <!-- Row: Hour Angle -->
            <div class="flex items-center text-[10px] hover:bg-neutral-100/30 dark:hover:bg-neutral-800/20 px-3 py-1.5 transition-colors">
                <div class="flex items-center gap-1.5 w-1/3 min-w-[105px] shrink-0 text-neutral-500 dark:text-neutral-400 select-none font-semibold font-sans tracking-wide">
                    ${inlineIcon('clock')}
                    <span>HOUR ANGLE</span>
                </div>
                <div class="flex-1 font-mono font-medium text-neutral-800 dark:text-neutral-100 pl-3 border-l border-neutral-150 dark:border-neutral-800/80">
                    ${(stats.hourAngle / 15).toFixed(4)}h
                </div>
            </div>
            <!-- Row: Jarak AU -->
            <div class="flex items-center text-[10px] hover:bg-neutral-100/30 dark:hover:bg-neutral-800/20 px-3 py-1.5 transition-colors">
                <div class="flex items-center gap-1.5 w-1/3 min-w-[105px] shrink-0 text-neutral-500 dark:text-neutral-400 select-none font-semibold font-sans tracking-wide">
                    ${inlineIcon('link')}
                    <span>JARAK AU</span>
                </div>
                <div class="flex-1 font-mono font-medium text-neutral-800 dark:text-neutral-100 pl-3 border-l border-neutral-150 dark:border-neutral-800/80">
                    ${isObject ? stats.distAU.toFixed(6) : 'N/A'}
                </div>
            </div>
            <!-- Row: Speed -->
            <div class="flex items-center text-[10px] hover:bg-neutral-100/30 dark:hover:bg-neutral-800/20 px-3 py-1.5 transition-colors">
                <div class="flex items-center gap-1.5 w-1/3 min-w-[105px] shrink-0 text-neutral-500 dark:text-neutral-400 select-none font-semibold font-sans tracking-wide">
                    ${inlineIcon('zap')}
                    <span>SPEED</span>
                </div>
                <div class="flex-1 font-mono font-medium text-neutral-800 dark:text-neutral-100 pl-3 border-l border-neutral-150 dark:border-neutral-800/80">
                    ${isObject ? stats.speed.toFixed(5) + '°/d' : 'N/A'}
                </div>
            </div>
            <!-- Row: Gerak -->
            <div class="flex items-center text-[10px] hover:bg-neutral-100/30 dark:hover:bg-neutral-800/20 px-3 py-1.5 transition-colors">
                <div class="flex items-center gap-1.5 w-1/3 min-w-[105px] shrink-0 text-neutral-500 dark:text-neutral-400 select-none font-semibold font-sans tracking-wide">
                    ${inlineIcon('shuffle')}
                    <span>MOTION</span>
                </div>
                <div class="flex-1 font-mono font-medium text-neutral-800 dark:text-neutral-100 pl-3 border-l border-neutral-150 dark:border-neutral-800/80 font-semibold">
                    ${isObject ? stats.gerak : 'N/A'}
                </div>
            </div>
        </div>
    `;
}

function handleEntityClick(cardDiv, infoDiv, entityId) {
    if (expandedEntities.has(entityId)) {
        expandedEntities.delete(entityId);
        infoDiv.classList.add('hidden');
    } else {
        expandedEntities.add(entityId);
        infoDiv.classList.remove('hidden');
        triggerSingleEntityUpdate(entityId);
    }
}

function triggerSingleEntityUpdate(entityId) {
    const activePersona = state.personas.find(p => p.id === state.selectedPersonaId) || state.personas[0];
    if (!activePersona) return;
    
    const reqConfig = { zodiac: state.zodiacConfig, coord: state.coordConfig };
    const entity = ENTITIES.find(e => e.id === entityId);
    if (!entity) return;

    const statsContainerId = `stats-${entity.id}`;
    const statsContainer = document.getElementById(statsContainerId);
    if (!statsContainer) return;

    let stats = null;
    let isObject = false;

    if (entity.type === 'OBJECT') {
        stats = typeof getBodyStats === 'function' ? getBodyStats(entity.id, state.customDate, activePersona, reqConfig) : null;
        isObject = true;
    } else if (entity.type === 'TERRESTRIAL') {
        stats = typeof getTerrestrialStaticStats === 'function' ? getTerrestrialStaticStats(entity.isZenith, state.customDate, activePersona, reqConfig) : null;
    } else if (entity.type === 'CELESTIAL') {
        const anchorTime = typeof getPersonaAnchorTime === 'function' ? getPersonaAnchorTime(activePersona) : state.customDate;
        const coords = typeof getCelestialCoordinates === 'function' ? getCelestialCoordinates(activePersona.lat, activePersona.lng, anchorTime) : null;
        if (coords) {
            const coordPoint = entity.isZenith ? coords.zenith : coords.nadir;
            stats = typeof getImaginaryPointStats === 'function' ? getImaginaryPointStats(coordPoint.ra * 15, coordPoint.dec, state.customDate, activePersona, reqConfig) : null;
        }
    }

    if (stats) {
        statsContainer.innerHTML = generateStatsTableHTML(stats, isObject, entity.id);
    }
}

const BODIES = ENTITIES.filter(e => e.type === 'OBJECT');


// js/store.js

const state = {
    personas: [
        { id: 'p1', label: "Ka'bah", name: "المطاف", lat: 21.4225079, lng: 39.826189, timezone: 'Asia/Riyadh', isRealTime: true, date: null, time: null, elevation: 277 }
    ],
    selectedPersonaId: 'p1',
    activeBodies: new Set(['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Sirius']),
    showZenith: true,
    showNadir: true,
    isRealTime: true,
    timeMachineEnabled: false,
    timeSourceMode: 'MANUAL',
    playDirection: 'FORWARD',
    simulationTimezone: 'UTC',
    simulationTimezoneConfirmed: false,
    customDate: new Date(),
    isPlaying: false,
    speed: 1, // Time skip magnitude (seconds per tick)
    timeMachineMode: 'N', // 'N' for Normal, 'C' for Custom
    customSpeedValue: 1,
    customSpeedUnit: 1, // 1 for SECOND, 60 for MINUTE, 3600 for HOUR, 86400 for DAY
    zodiacConfig: 'IAU',
    coordConfig: 'Toposentris',
    mapMode: 'MAP'
};

function getPersonaAnchorTime(persona) {
    if (persona.isRealTime !== false && (!persona.date || !persona.time)) {
        return new Date(); // Wall clock currently
    } else {
        const { DateTime } = window.luxon || {};
        if (DateTime && persona.date && persona.time && persona.timezone) {
            const dt = DateTime.fromISO(`${persona.date}T${persona.time}`, { zone: persona.timezone }).toUTC();
            if (dt.isValid) return dt.toJSDate();
        }
        return new Date();
    }
}

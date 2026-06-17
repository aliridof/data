// js/store.js

const state = {
  subjects: [
    {
      id: "p1",
      label: "TES",
      name: "TES",
      lat: -7.6040789,
      lng: 112.818894,
      timezone: "Asia/Jakarta",
      isRealTime: false,
      date: "1993-12-15",
      time: "23:45",
      elevation: 4,
    },
  ],
  selectedSubjectId: "p1",
  activeBodies: new Set([
    "Sun",
    "Moon",
    "Mercury",
    "Venus",
    "Mars",
    "Jupiter",
    "Saturn",
    "Uranus",
    "Neptune",
    "Pluto",
    "Sirius",
    "terrestrial-zenith",
    "terrestrial-nadir",
    "celestial-zenith",
    "celestial-nadir",
  ]),
  showZenith: true,
  showNadir: true,
  isRealTime: false,
  timeMachineEnabled: true,
  timeSourceMode: "MANUAL",
  playDirection: "FORWARD",
  simulationTimezone: "UTC",
  simulationTimezoneConfirmed: false,
  customDate: new Date(Date.UTC(1993, 11, 15, 16, 45, 0)),
  isPlaying: false,
  speed: 1, // Time skip magnitude (seconds per tick)
  timeMachineMode: "N", // 'N' for Normal, 'C' for Custom
  customSpeedValue: 1,
  customSpeedUnit: 1, // 1 for SECOND, 60 for MINUTE, 3600 for HOUR, 86400 for DAY
  zodiacConfig: "IAU",
  coordConfig: "Toposentris",
  mapMode: "MAP",
  horizonThreshold: parseFloat(localStorage.getItem("horizon_threshold") || "0.0"),
  horizonHysteresis: parseFloat(localStorage.getItem("horizon_hysteresis") || "0.0"),
};

function getSubjectAnchorTime(subject) {
  if (subject.isRealTime !== false && (!subject.date || !subject.time)) {
    return new Date(); // Wall clock currently
  } else {
    const { DateTime } = window.luxon || {};
    if (DateTime && subject.date && subject.time && subject.timezone) {
      const dt = DateTime.fromISO(`${subject.date}T${subject.time}`, {
        zone: subject.timezone,
      }).toUTC();
      if (dt.isValid) return dt.toJSDate();
    }
    return new Date();
  }
}

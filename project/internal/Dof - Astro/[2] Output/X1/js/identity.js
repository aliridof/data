// js/identity.js

/**
 * Default configurations for identity aspects.
 */
const DEFAULT_ASPECTS = [
  // 1. NEUTRAL
  {
    id: "CON",
    name: "CONJUNCTION",
    angle: 0,
    symbol: "=",
    color: "#f18701",
    enabled: true,
    isCore: true,
    orb: 1.0,
    sentiment: "[=]",
    score: 5,
  },
  // 2. POSITIVE
  {
    id: "SSX",
    name: "SEMI-SEXTILE",
    angle: 30,
    symbol: "+1",
    color: "#00ad45",
    enabled: true,
    isCore: true,
    orb: 1.0,
    sentiment: "[+]",
    score: 1,
  },
  {
    id: "DEC",
    name: "DECILE",
    angle: 36,
    symbol: "+1",
    color: "#00ad45",
    enabled: true,
    isCore: true,
    orb: 1.0,
    sentiment: "[+]",
    score: 1,
  },
  {
    id: "SEX",
    name: "SEXTILE",
    angle: 60,
    symbol: "+3",
    color: "#00ad45",
    enabled: true,
    isCore: true,
    orb: 1.0,
    sentiment: "[+]",
    score: 3,
  },
  {
    id: "QUI",
    name: "QUINTILE",
    angle: 72,
    symbol: "+3",
    color: "#00ad45",
    enabled: true,
    isCore: true,
    orb: 1.0,
    sentiment: "[+]",
    score: 3,
  },
  {
    id: "TRI",
    name: "TRINE",
    angle: 120,
    symbol: "+5",
    color: "#00ad45",
    enabled: true,
    isCore: true,
    orb: 1.0,
    sentiment: "[+]",
    score: 5,
  },
  // 3. NEGATIVE
  {
    id: "NOV",
    name: "NOVILE",
    angle: 40,
    symbol: "-1",
    color: "#ea4335",
    enabled: true,
    isCore: true,
    orb: 1.0,
    sentiment: "[-]",
    score: 1,
  },
  {
    id: "SSQ",
    name: "SEMI-SQUARE",
    angle: 45,
    symbol: "-1",
    color: "#ea4335",
    enabled: true,
    isCore: true,
    orb: 1.0,
    sentiment: "[-]",
    score: 1,
  },
  {
    id: "SQR",
    name: "SQUARE",
    angle: 90,
    symbol: "-3",
    color: "#ea4335",
    enabled: true,
    isCore: true,
    orb: 1.0,
    sentiment: "[-]",
    score: 3,
  },
  {
    id: "OPP",
    name: "OPPOSITION",
    angle: 180,
    symbol: "-5",
    color: "#ea4335",
    enabled: true,
    isCore: true,
    orb: 1.0,
    sentiment: "[-]",
    score: 5,
  },
];

function getAspectsList() {
  const saved = localStorage.getItem("identity_aspects_list");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Check if saved contains outdated shortcodes that could break operations
      const hasOldCodes = parsed.some(aspect => 
        ["CONJ", "SEXTILE", "QUINTILE", "SQUARE", "TRINE", "OPPO"].includes(aspect.id)
      );

      // Verify that all core aspects are present in the list
      const missingCore = DEFAULT_ASPECTS.some(da => !parsed.some(pa => pa.id === da.id));

      if (hasOldCodes || missingCore) {
        // Safe migration: preserve any valid custom aspects while restoring the standard core aspects
        const customAspects = parsed.filter(a => !a.isCore && !["CONJ", "SEXTILE", "QUINTILE", "SQUARE", "TRINE", "OPPO"].includes(a.id));
        const merged = [
          ...JSON.parse(JSON.stringify(DEFAULT_ASPECTS)),
          ...customAspects
        ];
        saveAspectsList(merged);
        return merged;
      }

      let changed = false;
      parsed.forEach(aspect => {
        // Initialize undefined orbs to default 1.0 but preserve user dynamic values
        if (aspect.orb === undefined) {
          aspect.orb = 1.0;
          changed = true;
        }
        if (!aspect.sentiment || aspect.sentiment === "(None)" || aspect.sentiment === "") {
          aspect.sentiment = "[=]";
          changed = true;
        }
        // Migrate CON default color/score if they were using old default values
        if (aspect.id === "CON") {
          if (aspect.color === "#fbbc05") {
            aspect.color = "#f18701";
            changed = true;
          }
          if (aspect.score === 0) {
            aspect.score = 5;
            changed = true;
          }
        }
      });
      if (changed) {
        saveAspectsList(parsed);
      }
      return parsed;
    } catch (e) {
      console.error("Error parsing saved aspects list:", e);
    }
  }
  saveAspectsList(DEFAULT_ASPECTS);
  return JSON.parse(JSON.stringify(DEFAULT_ASPECTS));
}

function saveAspectsList(list) {
  localStorage.setItem("identity_aspects_list", JSON.stringify(list));
}

const ASPECTS_CORE = DEFAULT_ASPECTS;

const defaultOrbConfig = {
  mode: "default",
  default_value: 1.0, // Default orb threshold (dalam derajat)
  custom_values: {
    CON: 1.0,
    SSX: 1.0,
    DEC: 1.0,
    SEX: 1.0,
    QUI: 1.0,
    TRI: 1.0,
    NOV: 1.0,
    SSQ: 1.0,
    SQR: 1.0,
    OPP: 1.0,
  },
};

/**
 * Mengambil nilai ORB (Offset Limit) untuk aspeks tertentu.
 *
 * @param {string} aspect_id - ID aspek
 * @param {Object} config - Konfigurasi ORB
 * @returns {number} Nilai ORB dalam derajat
 */
function getOrb(aspect_id, config = defaultOrbConfig) {
  const list = getAspectsList();
  const aspect = list.find((a) => a.id === aspect_id);
  if (aspect && aspect.orb !== undefined) {
    return aspect.orb;
  }
  return 3.5;
}

/**
 * Mendapatkan daftar aspek kustom aktif (jika ada).
 *
 * @returns {Array} Aspek kustom aktif
 */
function getActiveCustomAspects() {
  return getAspectsList().filter((a) => !a.isCore);
}

/**
 * Mencari aspek yang paling cocok untuk sudut θ (Nearest-ORB).
 *
 * @param {number} theta - Jarak sudut aktual dalam derajat
 * @param {Object} orbConfig - Konfigurasi ORB
 * @returns {Object|null} Objek aspek terpilih lengkap dengan deviasi, atau null
 */
function matchAspect(theta, orbConfig = defaultOrbConfig) {
  if (theta === null || theta === undefined) return null;

  const allAspects = getAspectsList().filter((a) => a.enabled);
  let bestAspect = null;
  let bestDeviation = Infinity;

  for (const aspect of allAspects) {
    const orb = aspect.orb !== undefined ? aspect.orb : 3.5;
    const deviation = Math.abs(theta - aspect.angle);

    // Cek: (1) deviasi harus masuk di bawah batas ORB, (2) deviasi terkecil (Nearest-ORB)
    if (deviation <= orb && deviation < bestDeviation) {
      bestDeviation = deviation;
      bestAspect = {
        id: aspect.id,
        name: aspect.name,
        angle: aspect.angle,
        symbol: aspect.symbol,
        color: aspect.color,
        orbUsed: orb,
        deviation: deviation,
      };
    }
  }

  return bestAspect;
}

/**
 * Menghitung vektor unit 3D dari Altitude dan Azimuth (Great-Circle path).
 *
 * @param {number} az - Azimuth dalam derajat [0, 360]
 * @param {number} alt - Altitude dalam derajat [-90, +90]
 * @param {Object} [entity] - Referensi entitas jika persona khusus
 * @returns {number[]} Array vektor unit 3D [x, y, z]
 */
function calculate3DVector(az, alt, entity) {
  if (entity) {
    if (
      entity.id === "terrestrial-zenith"
    ) {
      return [0, 0, 1]; // Zenith mengarah tepat ke atas
    }
    if (
      entity.id === "terrestrial-nadir"
    ) {
      return [0, 0, -1]; // Nadir mengarah tepat ke bawah
    }
  }

  const azRad = (az * Math.PI) / 180;
  const altRad = (alt * Math.PI) / 180;

  const x = Math.cos(altRad) * Math.cos(azRad);
  const y = Math.cos(altRad) * Math.sin(azRad);
  const z = Math.sin(altRad);

  return [x, y, z];
}

/**
 * Menghitung sudut pisah (angular separation) antara dua vektor unit 3D menggunakan Dot Product.
 * Menerapkan Clamping untuk pencegahan bias kepresisian angka desimal berlebih (NaN protection).
 *
 * @param {number[]} v1 - Vektor unit pertama [x, y, z]
 * @param {number[]} v2 - Vektor unit kedua [x, y, z]
 * @returns {number|null} Sudut pemisah dalam derajat [0, 180] atau null jika tidak valid
 */
function calculateAngularSeparation(v1, v2) {
  if (!v1 || !v2 || v1.length !== 3 || v2.length !== 3) return null;

  // Hasil perkalian dot product v1 . v2
  const dot = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];

  // Clamping untuk memotong presisi berlebih di luar jangkauan [-1.0, 1.0]
  const dotClamped = Math.max(-1.0, Math.min(1.0, dot));

  // Hitung arccos untuk memperoleh sudut dalam radian
  const rad = Math.acos(dotClamped);

  // Konversi ke derajat
  return (rad * 180) / Math.PI;
}

/**
 * Mendapatkan koordinat/stats astronomi aktif dari suatu entitas.
 *
 * @param {string} entityId - ID entitas yang ingin dicari
 * @param {Date} date - Waktu kalkulasi
 * @param {Object} activeSubject - Pengamat terestrial utama
 * @param {Object} [reqConfig] - Konfigurasi tambahan (Zodiac / Koordinat sistem)
 * @returns {Object|null} Statistik toposentris aktif (az, alt, ra, dec, zodiac, subLat, subLon, dll.)
 */
function getActiveEntityStats(
  entityId,
  date = state.customDate,
  activeSubject = null,
  reqConfig = null,
) {
  if (typeof ENTITIES === "undefined") return null;
  const entity = ENTITIES.find((e) => e.id === entityId);
  if (!entity) return null;

  const subject =
    activeSubject ||
    (typeof state !== "undefined"
      ? state.subjects.find((s) => s.id === state.selectedSubjectId) ||
        state.subjects[0]
      : null);
  if (!subject) return null;

  const config = reqConfig || {
    zodiac: state.zodiacConfig,
    coord: state.coordConfig,
  };
  let stats = null;

  if (entity.type === "OBJECT") {
    if (typeof getBodyStats === "function") {
      stats = getBodyStats(entity.id, date, subject, config);
    }
  } else if (entity.type === "TERRESTRIAL") {
    if (typeof getTerrestrialStaticStats === "function") {
      stats = getTerrestrialStaticStats(entity.isZenith, date, subject, config);
    }
  } else if (entity.type === "CELESTIAL") {
    const anchorTime =
      typeof getSubjectAnchorTime === "function"
        ? getSubjectAnchorTime(subject)
        : date;
    if (
      typeof getCelestialCoordinates === "function" &&
      typeof getImaginaryPointStats === "function"
    ) {
      const coords = getCelestialCoordinates(
        subject.lat,
        subject.lng,
        anchorTime,
      );
      if (coords) {
        const coordPoint = entity.isZenith ? coords.zenith : coords.nadir;
        stats = getImaginaryPointStats(
          coordPoint.ra * 15,
          coordPoint.dec,
          date,
          subject,
          config,
        );
      }
    }
  }

  return stats;
}

/**
 * Helper untuk memeriksa apakah entitas berada di belahan Zenith.
 *
 * @param {Object} entity
 * @param {boolean} isAbove - Apakah alt >= H_threshold
 * @returns {boolean}
 */
function isZenithSide(entity, isAbove) {
  if (
    entity.id === "terrestrial-zenith"
  )
    return true;
  if (
    entity.id === "terrestrial-nadir"
  )
    return false;
  return isAbove;
}

/**
 * Helper untuk memeriksa apakah entitas berada di belahan Nadir.
 *
 * @param {Object} entity
 * @param {boolean} isAbove - Apakah alt >= H_threshold
 * @returns {boolean}
 */
function isNadirSide(entity, isAbove) {
  if (
    entity.id === "terrestrial-nadir"
  )
    return true;
  if (
    entity.id === "terrestrial-zenith"
  )
    return false;
  return !isAbove;
}

// Map to track the last calculated 'above horizon' state for each entity for hysteresis
const previousAboveStates = new Map();

/**
 * Resets the cached horizon states (called when horizon parameters are updated).
 */
function resetHorizonStateCache() {
  previousAboveStates.clear();
}
window.resetHorizonStateCache = resetHorizonStateCache;

/**
 * Calculates whether an entity is above the horizon threshold, incorporating hysteresis.
 * 
 * @param {string} entityId - The ID of the entity
 * @param {number} currentAltitude - Current altitude in degrees
 * @param {number} hThreshold - Horizon threshold in degrees
 * @param {number} hHysteresis - Hysteresis buffer in degrees
 * @returns {boolean} Whether the entity is classified as above the horizon
 */
function calculateIsAbove(entityId, currentAltitude, hThreshold, hHysteresis) {
  const cached = previousAboveStates.get(entityId);
  if (cached !== undefined) {
    if (cached) {
      // Was above, remains above unless altitude falls below boundary with margin
      if (currentAltitude < (hThreshold - hHysteresis)) {
        previousAboveStates.set(entityId, false);
        return false;
      }
      return true;
    } else {
      // Was below, remains below unless altitude rises above boundary with margin
      if (currentAltitude >= (hThreshold + hHysteresis)) {
        previousAboveStates.set(entityId, true);
        return true;
      }
      return false;
    }
  } else {
    // No cached state, perform standard comparison
    const isAbove = currentAltitude >= hThreshold;
    previousAboveStates.set(entityId, isAbove);
    return isAbove;
  }
}

/**
 * Kelas Identity merepresentasikan hubungan interaksi spasial 3D / hubungan logis antara 2 buah entitas.
 */
class Identity {
  /**
   * @param {Object|string} entityA - Entitas pertama (objek utuh atau ID)
   * @param {Object|string} entityB - Entitas kedua (objek utuh atau ID)
   * @param {Date} [date] - Waktu kalkulasi
   * @param {Object} [activeSubject] - Subjek pengamat terestrial
   * @param {Object} [orbConfig] - Konfigurasi ORB aspek
   */
  constructor(
    entityA,
    entityB,
    date = typeof state !== "undefined" ? state.customDate : new Date(),
    activeSubject = null,
    orbConfig = null,
  ) {
    if (typeof ENTITIES === "undefined") {
      throw new Error(
        "ENTITIES is not defined. Ensure js/entity.js is loaded.",
      );
    }

    // Resolusi Entitas
    this.entityA =
      typeof entityA === "string"
        ? ENTITIES.find((e) => e.id === entityA)
        : entityA;
    this.entityB =
      typeof entityB === "string"
        ? ENTITIES.find((e) => e.id === entityB)
        : entityB;

    if (!this.entityA || !this.entityB) {
      throw new Error(
        `Invalid entities provided to Identity: ${entityA}, ${entityB}`,
      );
    }

    this.date = date;
    this.subject =
      activeSubject ||
      (typeof state !== "undefined"
        ? state.subjects.find((s) => s.id === state.selectedSubjectId) ||
          state.subjects[0]
        : null);
    this.orbConfig = orbConfig || defaultOrbConfig;

    // Tarik data koordinat rill toposentris aktif kedua objek
    this.statsA = getActiveEntityStats(
      this.entityA.id,
      this.date,
      this.subject,
    );
    this.statsB = getActiveEntityStats(
      this.entityB.id,
      this.date,
      this.subject,
    );

    // Jika data koordinat tersedia, hitung sudut & kecocokan aspek
    if (this.statsA && this.statsB) {
      this.vecA = calculate3DVector(
        this.statsA.az,
        this.statsA.alt,
        this.entityA,
      );
      this.vecB = calculate3DVector(
        this.statsB.az,
        this.statsB.alt,
        this.entityB,
      );

      // Hitung Sudut Pisah Terpendek (Great-Circle Path)
      this.theta = calculateAngularSeparation(this.vecA, this.vecB);

      // Cari Aspek Aktif (Nearest-ORB)
      this.aspect = matchAspect(this.theta, this.orbConfig);

      const hThreshold =
        typeof state !== "undefined" && state.horizonThreshold !== undefined
          ? state.horizonThreshold
          : 0.0;
      const hHysteresis =
        typeof state !== "undefined" && state.horizonHysteresis !== undefined
          ? state.horizonHysteresis
          : 0.0;

      this.isAboveA = calculateIsAbove(this.entityA.id, this.statsA.alt, hThreshold, hHysteresis);
      this.isAboveB = calculateIsAbove(this.entityB.id, this.statsB.alt, hThreshold, hHysteresis);

      this.isZenithSideA = isZenithSide(this.entityA, this.isAboveA);
      this.isZenithSideB = isZenithSide(this.entityB, this.isAboveB);
      this.isNadirSideA = isNadirSide(this.entityA, this.isAboveA);
      this.isNadirSideB = isNadirSide(this.entityB, this.isAboveB);

      // Klasifikasi Zona Kubah Belahan Langit
      this.isZenithZone = this.isZenithSideA && this.isZenithSideB; // Hanya aktif jika kedua objek di Zenith
      this.isNadirZone = this.isNadirSideA && this.isNadirSideB; // Hanya aktif jika kedua objek di Nadir
    } else {
      this.vecA = null;
      this.vecB = null;
      this.theta = null;
      this.aspect = null;
      this.isZenithZone = false;
      this.isNadirZone = false;
    }
  }

  /**
   * Mengembalikan status representasi apakah hubungan Identity aktif untuk tipe matriks tertentu.
   *
   * @param {string} matrixType - 'ZENITH', 'NADIR', or 'MATRIX' (general)
   * @returns {boolean} True jika aktif di zona matriks tersebut
   */
  isActiveInMatrix(matrixType) {
    if (matrixType === "ZENITH") {
      return this.isZenithZone;
    }
    if (matrixType === "NADIR") {
      return this.isNadirZone;
    }
    // General 'MATRIX' selalu aktif
    return true;
  }
}

/**
 * Menerjemahkan konfigurasi aspek ke dalam format HTML Card
 * (Berguna untuk merender list aspek di UI)
 *
 * @param {Object} aspect - Data profil aspek
 * @returns {string} Markup HTML
 */
function generateAspectCardHTML(aspect) {
  return `
      <div id="aspect-row-${aspect.id}" class="w-full flex items-center justify-between gap-3 border bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 border-l-[4px] p-4 transition-colors hover:bg-neutral-100/55 dark:hover:bg-neutral-900/55 select-none rounded-none pointer-events-auto" style="border-left-color: ${aspect.color};">
        <div class="flex items-center gap-4 min-w-0 pointer-events-none">
          <!-- Colored Circle with Symbol -->
          <div class="w-11 h-11 rounded-full border-2 border-neutral-200 dark:border-neutral-800 flex items-center justify-center font-extrabold text-[12px] text-white select-none shrink-0 shadow-sm" style="background-color: ${aspect.color};">
            <span>${aspect.symbol}</span>
          </div>
          <div class="min-w-0">
            <h3 class="font-extrabold text-[11px] text-black dark:text-white leading-tight uppercase tracking-wider font-sans select-none">${aspect.name}</h3>
            <p class="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 leading-none select-none font-sans flex items-center gap-1.5 flex-wrap">
              <span>${aspect.id} • ${aspect.angle}°</span>
              <span class="text-neutral-300 dark:text-neutral-700">|</span>
              <span>Orb: ${aspect.orb}°</span>
              ${
                aspect.sentiment
                  ? `
              <span class="text-neutral-300 dark:text-neutral-700">|</span>
              <span class="font-mono text-[9px] px-1.5 py-0.5 rounded-sm bg-neutral-100 dark:bg-neutral-800">${aspect.sentiment}</span>
              `
                  : ""
              }
              ${
                aspect.score !== undefined
                  ? `
              <span class="text-neutral-300 dark:text-neutral-700">|</span>
              <span class="font-mono text-[9px]">Score: ${aspect.score}</span>
              `
                  : ""
              }
            </p>
          </div>
        </div>
        
        <div class="flex items-center gap-2 shrink-0 pointer-events-auto">
          <!-- Edit button -->
          <button class="aspect-edit-btn flex items-center justify-center border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-500 hover:bg-blue-500/5 p-2 h-8 rounded-none transition-colors focus:outline-none cursor-pointer text-neutral-400 dark:text-neutral-500" data-id="${aspect.id}" title="Edit aspek ini">
            <i data-feather="edit-2" class="w-3.5 h-3.5 pointer-events-none"></i>
          </button>
          
          <!-- Delete button (only if not core) -->
          ${
            !aspect.isCore
              ? `
          <button class="aspect-delete-btn flex items-center justify-center border border-neutral-200 dark:border-neutral-800 hover:border-rose-500 hover:text-rose-500 dark:hover:border-rose-500 hover:bg-rose-500/5 p-2 h-8 rounded-none transition-colors focus:outline-none cursor-pointer text-neutral-400 dark:text-neutral-500" data-id="${aspect.id}" title="Hapus aspek ini">
            <i data-feather="trash-2" class="w-3.5 h-3.5 pointer-events-none"></i>
          </button>
          `
              : ""
          }

          <!-- Info button -->
          <button class="aspect-info-btn flex items-center justify-center border border-black dark:border-white p-2 h-8 rounded-none text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors focus:outline-none cursor-pointer" data-id="${aspect.id}" title="Lihat Detail">
            <i data-feather="info" class="w-3.5 h-3.5 pointer-events-none"></i>
          </button>

          <!-- ON / OFF Toggle Custom Styled Button -->
          <button class="aspect-toggle-btn cursor-pointer select-none border-none bg-transparent focus:outline-none" data-id="${aspect.id}" title="Toggle aspect active status">
            ${
              aspect.enabled
                ? `
              <div class="px-2.5 h-8 bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white font-black text-[10px] tracking-wider transition-all duration-300 rounded-none shadow-sm flex items-center justify-center gap-1 min-w-[56px] hover:bg-neutral-900 dark:hover:bg-neutral-100">
                <span class="w-1 h-1 bg-white dark:bg-black rounded-full inline-block animate-pulse"></span> ON
              </div>
            `
                : `
              <div class="px-2.5 h-8 bg-transparent text-neutral-400 dark:text-neutral-500 border border-neutral-300 dark:border-neutral-800 font-black text-[10px] tracking-wider transition-all duration-300 rounded-none flex items-center justify-center gap-1 min-w-[56px] hover:bg-neutral-50/50 dark:hover:bg-neutral-950/50 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white">
                <span class="w-1 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full inline-block"></span> OFF
              </div>
            `
            }
          </button>
        </div>
      </div>
    `;
}

/**
 * Calculates raw celestial alignment indicators data structure for a specific matrix type.
 * Divides alignments into:
 * - A1: Same value degree (unrounded floor/round value matching)
 * - A2: Anchored same degree
 * - A3: Same aspect pair
 * - S0: Identity aspect
 * - S1: Anchored mixed aspect
 * - S2: Anchored same aspect
 * - S3: Triangular / closed loop lock
 */
function getIndicatorsData(matrixType) {
  const activeEntities = ENTITIES.filter((item) => state.activeBodies.has(item.id));
  if (activeEntities.length < 2) {
    return null;
  }

  const identitiesList = [];
  for (let i = 0; i < activeEntities.length; i++) {
    for (let j = i + 1; j < activeEntities.length; j++) {
      try {
        const iden = new Identity(activeEntities[i], activeEntities[j], state.customDate);
        if (iden && iden.theta !== null && iden.theta !== undefined) {
          // Check eligibility according to matrixType
          let eligible = false;
          if (matrixType === "ZENITH") {
            eligible = iden.isZenithZone;
          } else if (matrixType === "NADIR") {
            eligible = iden.isNadirZone;
          } else if (matrixType === "MATRIX") {
            // General Matrix displays cross-dome relationships
            eligible = iden.isZenithSideA !== iden.isZenithSideB;
          }
          if (eligible) {
            identitiesList.push(iden);
          }
        }
      } catch (e) {
        console.error("Error creating identity for indicator calculations:", e);
      }
    }
  }

  function findSharedEntity(id1, id2) {
    const set1 = new Set([id1.entityA.id, id1.entityB.id]);
    if (set1.has(id2.entityA.id)) return id2.entityA;
    if (set1.has(id2.entityB.id)) return id2.entityB;
    return null;
  }

  // Retrieve dynamic anomaly configuration overrides
  const anomaliesList = getAnomaliesList();
  const a1Config = anomaliesList.find(a => a.key === "A1") || { orb: 1.0, id: "A1", enabled: true };
  const a2Config = anomaliesList.find(a => a.key === "A2") || { orb: 1.0, id: "A2", enabled: true };
  const a3Config = anomaliesList.find(a => a.key === "A3") || { orb: 1.0, id: "S1", enabled: true };
  const s1Config = anomaliesList.find(a => a.key === "S1") || { orb: 1.0, id: "S2", enabled: true };
  const s2Config = anomaliesList.find(a => a.key === "S2") || { orb: 1.0, id: "S3", enabled: true };
  const s3Config = anomaliesList.find(a => a.key === "S3") || { orb: 1.0, id: "S4", enabled: true };

  // ==========================================
  // A1: SAME VALUE DEGREE (Anomaly Angle)
  // ==========================================
  const a1Indicators = [];
  if (a1Config.enabled !== false) {
    const hashA1 = new Set();
    for (let i = 0; i < identitiesList.length; i++) {
      const id1 = identitiesList[i];
      for (let j = i + 1; j < identitiesList.length; j++) {
        const id2 = identitiesList[j];
        const diff = Math.abs(id1.theta - id2.theta);
        if (diff <= a1Config.orb) {
          const disjoint = (
            id1.entityA.id !== id2.entityA.id &&
            id1.entityA.id !== id2.entityB.id &&
            id1.entityB.id !== id2.entityA.id &&
            id1.entityB.id !== id2.entityB.id
          );
          if (disjoint) {
            const key = [id1.entityA.id, id1.entityB.id, id2.entityA.id, id2.entityB.id].sort().join('-');
            if (!hashA1.has(key)) {
              hashA1.add(key);
              a1Indicators.push({ id1, id2, deg: Math.round((id1.theta + id2.theta) / 2) });
            }
          }
        }
      }
    }
  }

  // ==========================================
  // A2: ANCHORED SAME DEGREE (Anomaly Angle)
  // ==========================================
  const a2Indicators = [];
  if (a2Config.enabled !== false) {
    const hashA2 = new Set();
    for (let i = 0; i < identitiesList.length; i++) {
      const id1 = identitiesList[i];
      for (let j = i + 1; j < identitiesList.length; j++) {
        const id2 = identitiesList[j];
        const diff = Math.abs(id1.theta - id2.theta);
        if (diff <= a2Config.orb) {
          const anchor = findSharedEntity(id1, id2);
          if (anchor) {
            const sortedAll = [id1.entityA.id, id1.entityB.id, id2.entityA.id, id2.entityB.id].sort().join('-');
            const key = `${sortedAll}@anchor:${anchor.id}`;
            if (!hashA2.has(key)) {
              hashA2.add(key);
              const other1 = id1.entityA.id === anchor.id ? id1.entityB : id1.entityA;
              const other2 = id2.entityA.id === anchor.id ? id2.entityB : id2.entityA;
              a2Indicators.push({ id1, id2, anchor, other1, other2, deg: Math.round((id1.theta + id2.theta) / 2) });
            }
          }
        }
      }
    }
  }

  // ==========================================
  // A3: SAME ASPECT PAIR (Anomaly Angle)
  // ==========================================
  const a3Indicators = [];
  if (a3Config.enabled !== false) {
    const hashA3 = new Set();
    for (let i = 0; i < identitiesList.length; i++) {
      const id1 = identitiesList[i];
      if (!id1.aspect) continue;
      const dev1 = Math.abs(id1.theta - id1.aspect.angle);
      if (dev1 > a3Config.orb) continue;
      for (let j = i + 1; j < identitiesList.length; j++) {
        const id2 = identitiesList[j];
        if (!id2.aspect) continue;
        const dev2 = Math.abs(id2.theta - id2.aspect.angle);
        if (dev2 > a3Config.orb) continue;
        if (id1.aspect.id === id2.aspect.id) {
          const disjoint = (
            id1.entityA.id !== id2.entityA.id &&
            id1.entityA.id !== id2.entityB.id &&
            id1.entityB.id !== id2.entityA.id &&
            id1.entityB.id !== id2.entityB.id
          );
          if (disjoint) {
            const sortedAll = [id1.entityA.id, id1.entityB.id, id2.entityA.id, id2.entityB.id].sort().join('-');
            const key = `${sortedAll}@aspect:${id1.aspect.id}`;
            if (!hashA3.has(key)) {
              hashA3.add(key);
              a3Indicators.push({ id1, id2, aspect: id1.aspect });
            }
          }
        }
      }
    }
  }

  // ==========================================
  // S0: IDENTITY ASPECT (Normal Aspect)
  // ==========================================
  const s0Indicators = [];
  identitiesList.forEach((iden) => {
    if (iden.aspect) {
      s0Indicators.push(iden);
    }
  });

  // ==========================================
  // S1: ANCHORED MIXED ASPECT (Anomaly Aspect)
  // ==========================================
  const s1Indicators = [];
  if (s1Config.enabled !== false) {
    const hashS1 = new Set();
    for (let i = 0; i < identitiesList.length; i++) {
      const id1 = identitiesList[i];
      if (!id1.aspect) continue;
      const dev1 = Math.abs(id1.theta - id1.aspect.angle);
      if (dev1 > s1Config.orb) continue;
      for (let j = i + 1; j < identitiesList.length; j++) {
        const id2 = identitiesList[j];
        if (!id2.aspect) continue;
        const dev2 = Math.abs(id2.theta - id2.aspect.angle);
        if (dev2 > s1Config.orb) continue;
        if (id1.aspect.id !== id2.aspect.id) {
          const anchor = findSharedEntity(id1, id2);
          if (anchor) {
            const sortedAll = [id1.entityA.id, id1.entityB.id, id2.entityA.id, id2.entityB.id].sort().join('-');
            const key = `${sortedAll}@anchor:${anchor.id}`;
            if (!hashS1.has(key)) {
              hashS1.add(key);
              const other1 = id1.entityA.id === anchor.id ? id1.entityB : id1.entityA;
              const other2 = id2.entityA.id === anchor.id ? id2.entityB : id2.entityA;
              s1Indicators.push({ id1, id2, anchor, other1, other2, aspect1: id1.aspect, aspect2: id2.aspect });
            }
          }
        }
      }
    }
  }

  // ==========================================
  // S2: ANCHORED SAME ASPECT (Anomaly Aspect)
  // ==========================================
  const s2Indicators = [];
  if (s2Config.enabled !== false) {
    const hashS2 = new Set();
    for (let i = 0; i < identitiesList.length; i++) {
      const id1 = identitiesList[i];
      if (!id1.aspect) continue;
      const dev1 = Math.abs(id1.theta - id1.aspect.angle);
      if (dev1 > s2Config.orb) continue;
      for (let j = i + 1; j < identitiesList.length; j++) {
        const id2 = identitiesList[j];
        if (!id2.aspect) continue;
        const dev2 = Math.abs(id2.theta - id2.aspect.angle);
        if (dev2 > s2Config.orb) continue;
        if (id1.aspect.id === id2.aspect.id) {
          const anchor = findSharedEntity(id1, id2);
          if (anchor) {
            const sortedAll = [id1.entityA.id, id1.entityB.id, id2.entityA.id, id2.entityB.id].sort().join('-');
            const key = `${sortedAll}@anchor:${anchor.id}@aspect:${id1.aspect.id}`;
            if (!hashS2.has(key)) {
              hashS2.add(key);
              const other1 = id1.entityA.id === anchor.id ? id1.entityB : id1.entityA;
              const other2 = id2.entityA.id === anchor.id ? id2.entityB : id2.entityA;
              s2Indicators.push({ id1, id2, anchor, other1, other2, aspect: id1.aspect });
            }
          }
        }
      }
    }
  }

  // ==========================================
  // S3: TRIANGULAR LOCK (Anomaly Aspect)
  // ==========================================
  const s3Indicators = [];
  if (s3Config.enabled !== false) {
    const hashS3 = new Set();
    for (let i = 0; i < activeEntities.length; i++) {
      const bodyA = activeEntities[i];
      for (let j = i + 1; j < activeEntities.length; j++) {
        const bodyB = activeEntities[j];
        for (let k = j + 1; k < activeEntities.length; k++) {
          const bodyC = activeEntities[k];

          const idenAB = identitiesList.find(id => (id.entityA.id === bodyA.id && id.entityB.id === bodyB.id) || (id.entityA.id === bodyB.id && id.entityB.id === bodyA.id));
          const idenBC = identitiesList.find(id => (id.entityA.id === bodyB.id && id.entityB.id === bodyC.id) || (id.entityA.id === bodyC.id && id.entityB.id === bodyB.id));
          const idenAC = identitiesList.find(id => (id.entityA.id === bodyA.id && id.entityB.id === bodyC.id) || (id.entityA.id === bodyC.id && id.entityB.id === bodyA.id));

          if (idenAB && idenBC && idenAC && idenAB.aspect && idenBC.aspect && idenAC.aspect) {
            const devAB = Math.abs(idenAB.theta - idenAB.aspect.angle);
            const devBC = Math.abs(idenBC.theta - idenBC.aspect.angle);
            const devAC = Math.abs(idenAC.theta - idenAC.aspect.angle);
            if (devAB <= s3Config.orb && devBC <= s3Config.orb && devAC <= s3Config.orb) {
              if (idenAB.aspect.id === idenBC.aspect.id && idenBC.aspect.id === idenAC.aspect.id) {
                const key = [bodyA.id, bodyB.id, bodyC.id].sort().join('-') + `@aspect:${idenAB.aspect.id}`;
                if (!hashS3.has(key)) {
                  hashS3.add(key);
                  s3Indicators.push({
                    bodyA,
                    bodyB,
                    bodyC,
                    aspect: idenAB.aspect,
                    idenAB,
                    idenBC,
                    idenAC
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  return {
    activeEntities,
    identitiesList,
    a1Indicators,
    a2Indicators,
    a3Indicators,
    s0Indicators,
    s1Indicators,
    s2Indicators,
    s3Indicators
  };
}

/**
 * Default custom configuration profiles for the 6 Anomalies.
 */
const DEFAULT_ANOMALIE_PROFILES = [
  {
    key: "A1",
    id: "A1",
    name: "SAME VALUE DEGREE",
    orb: 1.0,
    symbol: "A1",
    sentiment: "[=]",
    score: 0,
    color: "#43bccd",
    category: "ANGLE",
    enabled: true
  },
  {
    key: "A2",
    id: "A2",
    name: "ANCHORED SAME DEGREE",
    orb: 1.0,
    symbol: "A2",
    sentiment: "[=]",
    score: 0,
    color: "#43bccd",
    category: "ANGLE",
    enabled: true
  },
  {
    key: "A3",
    id: "S1",
    name: "SAME ASPECT PAIR",
    orb: 1.0,
    symbol: "S1",
    sentiment: "[=]",
    score: 0,
    color: "#a663cc",
    category: "ASPECT",
    enabled: true
  },
  {
    key: "S1",
    id: "S2",
    name: "ANCHORED MIXED ASPECT",
    orb: 1.0,
    symbol: "S2",
    sentiment: "[=]",
    score: 0,
    color: "#a663cc",
    category: "ASPECT",
    enabled: true
  },
  {
    key: "S2",
    id: "S3",
    name: "ANCHORED SAME ASPECT",
    orb: 1.0,
    symbol: "S3",
    sentiment: "[=]",
    score: 0,
    color: "#a663cc",
    category: "ASPECT",
    enabled: true
  },
  {
    key: "S3",
    id: "S4",
    name: "TRIANGULAR LOCK",
    orb: 1.0,
    symbol: "S4",
    sentiment: "[=]",
    score: 0,
    color: "#a663cc",
    category: "ASPECT",
    enabled: true
  }
];

function getAnomaliesList() {
  const saved = localStorage.getItem("identity_anomalies_list");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      let migrated = false;
      parsed.forEach(a => {
        // Ensure enabled flag exists
        if (a.enabled === undefined) {
          a.enabled = true;
          migrated = true;
        }
        // Force upgrade all default orbs to 1.0
        if (a.orb === 1.5) {
          a.orb = 1.0;
          migrated = true;
        }
        // Automatically migrate components
        if (a.key === "A1" || a.key === "A2") {
          if (a.color === "#F18701" || a.color === "#f18701" || a.score > 0) {
            a.color = "#43bccd";
            a.score = 0;
            migrated = true;
          }
        } else if (a.key === "A3" || a.key === "S1" || a.key === "S2" || a.key === "S3") {
          if (a.color === "#00ad45" || a.color === "#00AD45" || a.color === "#ea4335" || a.color === "#EA4335" || a.score > 0 || a.sentiment !== "[=]") {
            a.color = "#a663cc";
            a.sentiment = "[=]";
            a.score = 0;
            migrated = true;
          }
        }
      });
      if (migrated) {
        saveAnomaliesList(parsed);
      }
      return parsed;
    } catch (e) {
      console.error("Error parsing saved anomalies", e);
    }
  }
  saveAnomaliesList(DEFAULT_ANOMALIE_PROFILES);
  return DEFAULT_ANOMALIE_PROFILES;
}

function saveAnomaliesList(list) {
  localStorage.setItem("identity_anomalies_list", JSON.stringify(list));
}

function generateAnomalyCardHTML(anomaly) {
  return `
    <div id="anomaly-row-${anomaly.key}" class="w-full flex items-center justify-between gap-3 border bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 border-l-[4px] p-4 transition-colors hover:bg-neutral-100/55 dark:hover:bg-neutral-900/55 select-none rounded-none pointer-events-auto" style="border-left-color: ${anomaly.color};">
      <div class="flex items-center gap-4 min-w-0 pointer-events-none">
        <!-- Colored Circle with Symbol -->
        <div class="w-11 h-11 rounded-full border-2 border-neutral-200 dark:border-neutral-800 flex items-center justify-center font-extrabold text-[12px] text-white select-none shrink-0 shadow-sm" style="background-color: ${anomaly.color};">
          <span>${anomaly.symbol}</span>
        </div>
        <div class="min-w-0">
          <h3 class="font-extrabold text-[11px] text-black dark:text-white leading-tight uppercase tracking-wider font-sans select-none">${anomaly.name}</h3>
          <p class="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 leading-none select-none font-sans flex items-center gap-1.5 flex-wrap">
            <span class="font-black text-black dark:text-white font-mono text-[9px]">${anomaly.id}</span>
            <span class="text-neutral-300 dark:text-neutral-700">|</span>
            <span class="font-mono text-[9.5px]">Orb: ${anomaly.orb}°</span>
            ${anomaly.sentiment ? `
              <span class="text-neutral-300 dark:text-neutral-700">|</span>
              <span class="font-mono text-[9.5px] px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800">${anomaly.sentiment}</span>
            ` : ""}
            ${anomaly.score !== undefined ? `
              <span class="text-neutral-300 dark:text-neutral-700">|</span>
              <span class="font-mono text-[9.5px]">Score: ${anomaly.score}</span>
            ` : ""}
          </p>
        </div>
      </div>
      
      <div class="flex items-center gap-2 shrink-0 pointer-events-auto">
        <button class="anomaly-edit-btn flex items-center justify-center border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-500 hover:bg-blue-500/5 p-2 h-8 rounded-none transition-colors focus:outline-none cursor-pointer text-neutral-400 dark:text-neutral-400" data-key="${anomaly.key}" title="Edit anomalies ini">
          <i data-feather="edit-2" class="w-3.5 h-3.5 pointer-events-none"></i>
        </button>

        <!-- ON / OFF Toggle Custom Styled Button -->
        <button class="anomaly-toggle-btn cursor-pointer select-none border-none bg-transparent focus:outline-none" data-key="${anomaly.key}" title="Toggle anomaly active status">
          ${
            anomaly.enabled !== false
              ? `
            <div class="px-2.5 h-8 bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white font-black text-[10px] tracking-wider transition-all duration-300 rounded-none shadow-sm flex items-center justify-center gap-1 min-w-[56px] hover:bg-neutral-900 dark:hover:bg-neutral-100">
              <span class="w-1 h-1 bg-white dark:bg-black rounded-full inline-block animate-pulse"></span> ON
            </div>
          `
              : `
            <div class="px-2.5 h-8 bg-transparent text-neutral-400 dark:text-neutral-500 border border-neutral-300 dark:border-neutral-800 font-black text-[10px] tracking-wider transition-all duration-300 rounded-none flex items-center justify-center gap-1 min-w-[56px] hover:bg-neutral-50/50 dark:hover:bg-neutral-950/50 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white">
              <span class="w-1 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full inline-block"></span> OFF
            </div>
          `
          }
        </button>
      </div>
    </div>
  `;
}

// Global scope hooks for backward compatibility
window.getIndicatorsData = getIndicatorsData;
window.getAnomaliesList = getAnomaliesList;
window.saveAnomaliesList = saveAnomaliesList;
window.generateAnomalyCardHTML = generateAnomalyCardHTML;


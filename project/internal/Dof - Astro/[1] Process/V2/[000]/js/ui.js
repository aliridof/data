// js/ui.js

let lastNominatimRequestTime = 0;

function showPersonaModal(editPersonaId = null) {
  const isEdit = editPersonaId !== null;
  const persona = isEdit
    ? state.personas.find((p) => p.id === editPersonaId)
    : null;

  const modal = document.getElementById("persona-modal");

  const d = new Date();
  const defaultDate =
    isEdit && persona.date ? persona.date : d.toISOString().split("T")[0];
  const defaultTime =
    isEdit && persona.time ? persona.time : d.toTimeString().slice(0, 5);
  const defaultTimezone = isEdit
    ? persona.timezone
    : Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const defaultElevation = isEdit
    ? persona.elevation !== undefined
      ? persona.elevation
      : ""
    : "";

  modal.innerHTML = `
        <div class="bg-white dark:bg-neutral-950 p-6 rounded-none w-full max-w-md mx-4 border border-black dark:border-white animate-fade-in relative overflow-hidden max-h-[90vh] flex flex-col">
            <div class="absolute top-0 left-0 w-full h-[3px] bg-black dark:bg-white"></div>
            <div class="flex justify-between items-center mb-5 shrink-0">
                <h2 class="font-extrabold uppercase text-black dark:text-white tracking-widest text-[12px] font-sans">${isEdit ? "Edit Lokasi / Persona" : "Tambah Lokasi"}</h2>
                <button id="close-modal" class="text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors border border-black dark:border-white p-1.5 rounded-none"><i data-feather="x" class="w-3.5 h-3.5"></i></button>
            </div>
            
            <div class="space-y-4 overflow-y-auto flex-1 pr-1 pb-1 scrollbar-none scrollbar-thin">
                <!-- 1. Label Section -->
                <div class="space-y-1">
                    <label class="block text-[9px] font-bold text-neutral-400 mb-1.5 uppercase tracking-widest font-sans">Label Persona</label>
                    <input type="text" id="p-label" value="${isEdit ? persona.label || "" : ""}" placeholder="Cth: Rumah, Kantor, Masjid" class="w-full px-3 py-2 text-xs bg-white dark:bg-black border border-black dark:border-white rounded-none focus:outline-none dark:text-white font-medium">
                </div>

                <!-- 1.1 Time Mode Selection -->
                <div class="space-y-1">
                    <label class="block text-[9px] font-bold text-neutral-400 mb-1.5 uppercase tracking-widest font-sans">Mode Waktu (Time Mode)</label>
                    <div class="grid grid-cols-2 gap-1 bg-[#f5f5f5] dark:bg-neutral-900 p-1 border border-black dark:border-white rounded-none">
                        <button type="button" id="btn-mode-realtime" class="py-1.5 px-3 rounded-none text-[10px] font-bold uppercase tracking-wider transition-all focus:outline-none select-none">
                            Real-Time
                        </button>
                        <button type="button" id="btn-mode-manual" class="py-1.5 px-3 rounded-none text-[10px] font-bold uppercase tracking-wider transition-all focus:outline-none select-none">
                            Manual
                        </button>
                    </div>
                </div>

                <!-- 2 & 3. Date & Time Section (Hidden under Real-Time) -->
                <div id="wrapper-specific-time" class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label class="block text-[9px] font-bold text-neutral-400 mb-1.5 uppercase tracking-widest font-sans">Tanggal (Date)</label>
                        <input type="date" id="p-date" value="${defaultDate}" class="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-black border border-black dark:border-white rounded-none focus:outline-none dark:text-white">
                    </div>
                    <div class="space-y-1">
                        <label class="block text-[9px] font-bold text-neutral-400 mb-1.5 uppercase tracking-widest font-sans">Waktu (Time)</label>
                        <input type="time" id="p-time" value="${defaultTime}" class="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-black border border-black dark:border-white rounded-none focus:outline-none dark:text-white">
                    </div>
                </div>

                <!-- 4. Time Zone Section -->
                <div class="relative space-y-1" id="timezone-autocomplete-container">
                    <label class="block text-[9px] font-bold text-neutral-400 mb-1.5 uppercase tracking-widest font-sans">Zona Waktu (Time Zone)</label>
                    <div class="relative">
                        <input type="text" id="p-timezone-search" placeholder="Cari zona waktu (Cth: Jakarta, UTC)..." class="w-full px-3 py-2 text-xs bg-white dark:bg-black border border-black dark:border-white rounded-none focus:outline-none dark:text-white font-medium" autocomplete="off">
                        <input type="hidden" id="p-timezone" value="">
                        <!-- Dropdown list -->
                        <div id="p-timezone-list" class="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-950 border border-black dark:border-white rounded-none max-h-48 overflow-y-auto hidden divide-y divide-neutral-200 dark:divide-neutral-800"></div>
                    </div>
                </div>

                <!-- 5. Location Section with on-demand search -->
                <div class="space-y-1">
                    <label class="block text-[9px] font-bold text-neutral-400 uppercase tracking-widest font-sans">Lokasi / Kota (Location)</label>
                    <div class="flex gap-2">
                        <input type="text" id="p-location" value="${isEdit ? persona.name || "" : ""}" placeholder="Cari kota, tempat ibadah... (Nominatim)" class="flex-1 px-3 py-2 text-xs bg-white dark:bg-black border border-black dark:border-white rounded-none focus:outline-none dark:text-white font-medium">
                        <button type="button" id="p-search-btn" class="px-3.5 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 border border-black dark:border-white font-bold text-[10px] uppercase tracking-wider rounded-none transition-all flex items-center gap-1 shrink-0">
                            <i data-feather="search" class="w-3.5 h-3.5"></i> <span>Cari</span>
                        </button>
                    </div>
                    <div id="p-search-error" class="text-[10px] text-rose-500 hidden font-semibold"></div>
                    <div id="p-search-results" class="mt-2 border border-black dark:border-white rounded-none max-h-36 overflow-y-auto hidden bg-neutral-50 dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-800"></div>
                </div>

                <!-- 6 & 7. Latitude & Longitude Section -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label class="block text-[9px] font-bold text-neutral-400 mb-1.5 uppercase tracking-widest font-sans">Latitude</label>
                        <input type="number" step="any" min="-90" max="90" id="p-lat" value="${isEdit ? persona.lat : ""}" placeholder="-6.2088" class="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-black border border-black dark:border-white rounded-none focus:outline-none dark:text-white">
                    </div>
                    <div class="space-y-1">
                        <label class="block text-[9px] font-bold text-neutral-400 mb-1.5 uppercase tracking-widest font-sans">Longitude</label>
                        <input type="number" step="any" min="-180" max="180" id="p-lng" value="${isEdit ? persona.lng : ""}" placeholder="106.8456" class="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-black border border-black dark:border-white rounded-none focus:outline-none dark:text-white">
                    </div>
                </div>

                <!-- 8. Elevation Section -->
                <div class="space-y-1">
                    <label class="block text-[9px] font-bold text-neutral-400 mb-1.5 uppercase tracking-widest font-sans">Elevasi (meter)</label>
                    <input type="number" step="any" id="p-elevation" value="${defaultElevation}" placeholder="Elevasi tempat (meter)" class="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-black border border-black dark:border-white rounded-none focus:outline-none dark:text-white">
                </div>
                
                <div class="text-[10px] text-neutral-500 bg-[#f5f5f5] dark:bg-neutral-900 p-3 rounded-none border border-black dark:border-white flex items-center gap-2 leading-normal">
                    <i data-feather="info" class="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400 shrink-0"></i>
                    <span>TIPS: klik area peta langsung untuk otomatis mengisi Latitude, Longitude, Elevasi, dan Nama Lokasi.</span>
                </div>
            </div>

            <button id="save-persona" class="w-full py-3 bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-black rounded-none text-xs uppercase tracking-widest font-extrabold transition mt-3 shrink-0 border border-black dark:border-white">
                ${isEdit ? "SIMPAN PERUBAHAN" : "SIMPAN PERSONA BARU"}
            </button>
        </div>
    `;

  // Populate Time Zones with UTC offset label alphabetically using Luxon
  let timezones = [];
  try {
    timezones = Intl.supportedValuesOf("timeZone");
  } catch (e) {
    timezones = [
      "UTC",
      "Asia/Jakarta",
      "Asia/Riyadh",
      "America/New_York",
      "Europe/London",
      "Asia/Tokyo",
      "Australia/Sydney",
      "Europe/Paris",
    ];
  }
  if (!timezones.includes("UTC")) {
    timezones.unshift("UTC");
  }

  const { DateTime, IANAZone } = window.luxon || {};

  const tzOptions = timezones.map((tz) => {
    let label = tz;
    let offsetSearchStr = "";
    if (DateTime) {
      try {
        const dt = DateTime.now().setZone(tz);
        const offsetInMinutes = dt.offset;
        const hours = Math.floor(Math.abs(offsetInMinutes) / 60);
        const mins = Math.abs(offsetInMinutes) % 60;
        const sign = offsetInMinutes >= 0 ? "+" : "-";
        const offsetStr =
          mins === 0
            ? `${sign}${hours}`
            : `${sign}${hours}:${mins.toString().padStart(2, "0")}`;
        label = `[${offsetStr}] ${tz}`;
        offsetSearchStr = offsetStr;
      } catch (e) {
        console.error("Format error for tz", tz, e);
      }
    }
    return {
      tz,
      label,
      offsetSearchStr,
    };
  });

  const searchInput = document.getElementById("p-timezone-search");
  const hiddenTzInput = document.getElementById("p-timezone");
  const resultsContainer = document.getElementById("p-timezone-list");

  // Prefill the search input and hidden input
  const initialTzOption = tzOptions.find(
    (opt) => opt.tz === defaultTimezone,
  ) || { tz: defaultTimezone, label: defaultTimezone };
  if (searchInput && hiddenTzInput) {
    searchInput.value = initialTzOption.label;
    hiddenTzInput.value = initialTzOption.tz;
  }

  function filterTimezones(query) {
    if (!resultsContainer) return;
    query = query.toLowerCase().trim();
    const matches = tzOptions.filter((opt) => {
      return (
        opt.tz.toLowerCase().includes(query) ||
        opt.label.toLowerCase().includes(query) ||
        (opt.offsetSearchStr &&
          opt.offsetSearchStr.toLowerCase().includes(query))
      );
    });

    resultsContainer.innerHTML = "";
    if (matches.length === 0) {
      resultsContainer.innerHTML = `<div class="p-3 text-xs text-slate-400 text-center font-mono">Tidak ada zona waktu yang cocok</div>`;
      return;
    }

    matches.forEach((match) => {
      const row = document.createElement("div");
      row.className =
        "p-3 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-700 dark:text-slate-300 font-mono transition-colors";
      row.innerText = match.label;
      row.addEventListener("click", () => {
        if (searchInput && hiddenTzInput) {
          searchInput.value = match.label;
          hiddenTzInput.value = match.tz;
        }
        resultsContainer.classList.add("hidden");
      });
      resultsContainer.appendChild(row);
    });
  }

  if (searchInput) {
    searchInput.addEventListener("focus", () => {
      filterTimezones(searchInput.value);
      resultsContainer?.classList.remove("hidden");
    });

    searchInput.addEventListener("input", (e) => {
      filterTimezones(e.target.value);
      resultsContainer?.classList.remove("hidden");
    });
  }

  const outsideClickListener = (e) => {
    if (
      searchInput &&
      resultsContainer &&
      !searchInput.contains(e.target) &&
      !resultsContainer.contains(e.target)
    ) {
      resultsContainer.classList.add("hidden");
    }
  };
  document.addEventListener("click", outsideClickListener);

  // Dynamic Time Mode Switching & Toggling Visibility
  const isRealTimeVal = isEdit
    ? persona.isRealTime !== false && (!persona.date || !persona.time)
    : true;
  let currentIsRealTime = isRealTimeVal;

  const btnRealtime = document.getElementById("btn-mode-realtime");
  const btnManual = document.getElementById("btn-mode-manual");
  const wrapperSpecific = document.getElementById("wrapper-specific-time");

  function updateTimeModeUI() {
    if (currentIsRealTime) {
      btnRealtime.className =
        "py-1.5 px-3 rounded-lg text-xs font-bold text-center transition-all focus:outline-none select-none bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-800/50 cursor-pointer";
      btnManual.className =
        "py-1.5 px-3 rounded-lg text-xs font-semibold text-center transition-all focus:outline-none select-none text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer";
      if (wrapperSpecific) {
        wrapperSpecific.style.display = "none";
      }
    } else {
      btnManual.className =
        "py-1.5 px-3 rounded-lg text-xs font-bold text-center transition-all focus:outline-none select-none bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-800/50 cursor-pointer";
      btnRealtime.className =
        "py-1.5 px-3 rounded-lg text-xs font-semibold text-center transition-all focus:outline-none select-none text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer";
      if (wrapperSpecific) {
        wrapperSpecific.style.display = "grid";
      }
    }
  }

  if (btnRealtime && btnManual) {
    btnRealtime.addEventListener("click", () => {
      currentIsRealTime = true;
      updateTimeModeUI();
    });

    btnManual.addEventListener("click", () => {
      currentIsRealTime = false;
      updateTimeModeUI();
    });

    updateTimeModeUI();
  }

  window.feather.replace();
  modal.classList.remove("hidden");

  function checkRateLimit() {
    const now = Date.now();
    const diff = now - lastNominatimRequestTime;
    if (diff < 1100) {
      const remaining = ((1100 - diff) / 1000).toFixed(1);
      showError(`Harap tunggu ${remaining} detik sebelum me-request.`);
      return false;
    }
    lastNominatimRequestTime = now;
    return true;
  }

  function showError(msg) {
    const el = document.getElementById("p-search-error");
    if (msg) {
      el.innerText = msg;
      el.classList.remove("hidden");
    } else {
      el.classList.add("hidden");
    }
  }

  async function fetchElevation(lat, lng) {
    const elevInput = document.getElementById("p-elevation");
    if (!elevInput) return;
    elevInput.placeholder = "Memuat elevasi...";
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`,
      );
      const data = await res.json();
      if (data && data.elevation && data.elevation.length > 0) {
        elevInput.value = Math.round(data.elevation[0]);
      } else {
        elevInput.placeholder = "Gagal (isi manual)";
      }
    } catch (e) {
      console.error("Gagal mendapat elevasi", e);
      elevInput.placeholder = "Gagal (isi manual)";
    }
  }

  async function searchLocation() {
    showError("");
    const query = document.getElementById("p-location").value.trim();
    if (!query) {
      showError("Silakan masukkan kata kunci pencarian lokasi.");
      return;
    }

    if (!checkRateLimit()) return;

    const resultsContainer = document.getElementById("p-search-results");
    resultsContainer.innerHTML = `<div class="p-3 text-xs text-slate-400 font-mono text-center">Mencari...</div>`;
    resultsContainer.classList.remove("hidden");

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=id`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "DOF-ASTRO/1.0",
          "Accept-Language": "id",
        },
      });
      const data = await res.json();

      if (!data || data.length === 0) {
        resultsContainer.innerHTML = `<div class="p-3 text-xs text-rose-400 font-mono text-center">Lokasi tidak ditemukan.</div>`;
        return;
      }

      resultsContainer.innerHTML = "";
      data.forEach((item) => {
        const row = document.createElement("div");
        row.className =
          "p-2 text-xs hover:bg-slate-150 dark:hover:bg-slate-800 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors";
        const displayName = item.display_name;
        const shortName =
          displayName.split(",")[0] +
          (displayName.split(",")[1] ? ", " + displayName.split(",")[1] : "");

        row.innerHTML = `<div class="font-semibold truncate">${displayName}</div><div class="text-[10px] text-slate-450 mt-0.5 font-mono">LAT: ${parseFloat(item.lat).toFixed(4)} | LNG: ${parseFloat(item.lon).toFixed(4)}</div>`;

        row.addEventListener("click", () => {
          document.getElementById("p-location").value = shortName;
          const latVal = parseFloat(item.lat);
          const lngVal = parseFloat(item.lon);
          document.getElementById("p-lat").value = latVal;
          document.getElementById("p-lng").value = lngVal;
          resultsContainer.classList.add("hidden");

          fetchElevation(latVal, lngVal);
        });
        resultsContainer.appendChild(row);
      });
    } catch (e) {
      console.error(e);
      resultsContainer.innerHTML = `<div class="p-3 text-xs text-rose-500 text-center font-semibold">Gagal memuat hasil pencarian.</div>`;
    }
  }

  async function reverseGeocode(lat, lng) {
    showError("");
    if (isNaN(lat) || isNaN(lng)) return;

    if (!checkRateLimit()) return;

    const locInput = document.getElementById("p-location");
    if (locInput) {
      locInput.value = "Mendeteksi lokasi...";
    }

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=id`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "DOF-ASTRO/1.0",
          "Accept-Language": "id",
        },
      });
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(",");
        const simplified = parts[0] + (parts[1] ? ", " + parts[1].trim() : "");
        if (locInput) {
          locInput.value = simplified;
        }
      } else if (locInput) {
        locInput.value = `Koordinat (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      }
    } catch (e) {
      console.error(e);
      if (locInput) {
        locInput.value = "Tidak diketahui";
      }
    }
  }

  // Map click dynamic integration
  const mapClickedHandler = async (e) => {
    const latVal = parseFloat(e.detail.lat);
    const lngVal = parseFloat(e.detail.lng);

    const latInput = document.getElementById("p-lat");
    const lngInput = document.getElementById("p-lng");
    if (latInput && lngInput) {
      latInput.value = latVal.toFixed(6);
      lngInput.value = lngVal.toFixed(6);

      fetchElevation(latVal, lngVal);
      reverseGeocode(latVal, lngVal);
    }
  };
  window.addEventListener("map-clicked", mapClickedHandler);

  function closeModal() {
    modal.classList.add("hidden");
    window.removeEventListener("map-clicked", mapClickedHandler);
    document.removeEventListener("click", outsideClickListener);
  }

  document
    .getElementById("p-search-btn")
    .addEventListener("click", searchLocation);
  document.getElementById("p-location").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchLocation();
    }
  });

  document.getElementById("close-modal").addEventListener("click", closeModal);

  document.getElementById("save-persona").addEventListener("click", () => {
    const label = document.getElementById("p-label").value.trim() || "Lokasi";
    const locationVal =
      document.getElementById("p-location").value.trim() || "Tidak Diketahui";
    const lat = parseFloat(document.getElementById("p-lat").value);
    const lng = parseFloat(document.getElementById("p-lng").value);
    const elevation =
      parseFloat(document.getElementById("p-elevation").value) || 0;
    const timezone =
      (document.getElementById("p-timezone")?.value || "").trim() || "UTC";

    let date = null;
    let time = null;
    if (!currentIsRealTime) {
      date = document.getElementById("p-date").value;
      time = document.getElementById("p-time").value;
      if (!date || !time) {
        showError("Tanggal dan waktu harus diisi dalam mode Manual.");
        return;
      }
    }

    if (isNaN(lat) || lat < -90 || lat > 90) {
      showError("Latitude harus berkisar antara -90 s/d 90.");
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      showError("Longitude harus berkisar antara -180 s/d 180.");
      return;
    }

    const { DateTime, IANAZone } = window.luxon || {};
    if (IANAZone && !IANAZone.isValidZone(timezone)) {
      showError("Zona waktu tidak valid. Silakan pilih dari dropdown.");
      return;
    }

    if (isEdit && persona) {
      persona.label = label;
      persona.name = locationVal;
      persona.lat = lat;
      persona.lng = lng;
      persona.timezone = timezone;
      persona.isRealTime = currentIsRealTime;
      persona.date = date;
      persona.time = time;
      persona.elevation = elevation;
    } else {
      const newId = "p_" + Date.now();
      state.personas.push({
        id: newId,
        label,
        name: locationVal,
        lat,
        lng,
        timezone,
        isRealTime: currentIsRealTime,
        date,
        time,
        elevation,
      });
      state.selectedPersonaId = newId;
    }

    // Sync with global customDate state
    if (currentIsRealTime) {
      state.isRealTime = true;
      state.customDate = new Date();
    } else {
      if (DateTime && date && time) {
        const rawLocal = `${date}T${time}`;
        const dt = DateTime.fromISO(rawLocal, { zone: timezone }).toUTC();
        if (dt.isValid) {
          state.customDate = dt.toJSDate();
          state.isRealTime = false;
        }
      }
    }

    closeModal();
    document.getElementById("sim-banner-wrapper")?.remove();
    updateTimeUI();
    renderBodies();
    updateMap();
  });
}

function renderTerrestrial() {
  const container = document.getElementById("terrestrial-list");
  if (!container) return;
  container.innerHTML = "";

  const activePersona =
    state.personas.find((p) => p.id === state.selectedPersonaId) ||
    state.personas[0];
  if (!activePersona) return;

  const items = ENTITIES.filter((e) => e.type === "TERRESTRIAL");

  items.forEach((item) => {
    const div = document.createElement("div");
    const borderHighlight =
      item.symbol === "TZ"
        ? "border-l-[4px] border-l-emerald-400 dark:border-l-emerald-500"
        : "border-l-[4px] border-l-rose-400 dark:border-l-rose-500";
    div.className = `w-full flex flex-col relative overflow-hidden border bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 ${borderHighlight} p-4 transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-900/50 select-none cursor-pointer rounded-none animate-fade-in`;
    div.id = `terrestrial-card-${item.id}`;

    const labelPersona = activePersona.label || activePersona.name || "Ka'bah";
    const subLabelFull = `${item.subLabel}${labelPersona}`;

    div.innerHTML = `
            <div class="w-full flex items-center justify-between gap-3">
                <div class="flex items-center gap-4">
                    <div class="w-11 h-11 border border-black bg-black text-white font-extrabold font-mono text-xs shrink-0 select-none flex items-center justify-center rounded-none shadow-none">
                        <span>${item.symbol}</span>
                    </div>
                    <div>
                        <h3 class="font-extrabold text-[11px] text-black dark:text-white leading-tight uppercase tracking-wider font-sans select-none">${item.label}</h3>
                        <p class="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium leading-none mt-1 select-none font-sans">${subLabelFull}</p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <button class="info-toggle-btn border border-black dark:border-white p-2 rounded-none text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors focus:outline-none cursor-pointer" title="Lihat Detail">
                        <i data-feather="info" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            </div>
            
            <div class="terrestrial-info w-full mt-3.5 pt-3.5 border-t border-black dark:border-white space-y-3 text-[11px] text-black dark:text-white hidden animate-fade-in font-sans">
                <div class="space-y-1.5" id="stats-${item.id}">
                    <div class="font-mono text-[10px] text-neutral-400">Loading ephemeris...</div>
                </div>
            </div>
        `;

    if (expandedEntities.has(item.id)) {
      const info = div.querySelector(".terrestrial-info");
      info.classList.remove("hidden");
    }

    div.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      e.preventDefault();
      const infoDiv = div.querySelector(".terrestrial-info");
      handleEntityClick(div, infoDiv, item.id);
    });

    container.appendChild(div);
  });
}

function renderCelestial() {
  const container = document.getElementById("celestial-list");
  if (!container) return;
  container.innerHTML = "";

  const activePersona =
    state.personas.find((p) => p.id === state.selectedPersonaId) ||
    state.personas[0];
  if (!activePersona) return;

  const items = ENTITIES.filter((e) => e.type === "CELESTIAL");

  items.forEach((item) => {
    const div = document.createElement("div");
    const borderHighlight =
      item.symbol === "CZ"
        ? "border-l-[4px] border-l-emerald-400 dark:border-l-emerald-500"
        : "border-l-[4px] border-l-rose-400 dark:border-l-rose-500";
    div.className = `w-full flex flex-col relative overflow-hidden border bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 ${borderHighlight} p-4 transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-900/50 select-none cursor-pointer rounded-none animate-fade-in`;
    div.id = `celestial-card-${item.id}`;

    const labelPersona = activePersona.label || activePersona.name || "Ka'bah";
    const subLabelFull = `${item.subLabel}${labelPersona}`;

    div.innerHTML = `
            <div class="w-full flex items-center justify-between gap-3">
                <div class="flex items-center gap-4">
                    <div class="w-11 h-11 border border-black bg-white text-black font-extrabold font-mono text-xs shrink-0 select-none flex items-center justify-center rounded-none shadow-none">
                        <span>${item.symbol}</span>
                    </div>
                    <div>
                        <h3 class="font-extrabold text-[11px] text-black dark:text-white leading-tight uppercase tracking-wider font-sans select-none">${item.label}</h3>
                        <p class="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium leading-none mt-1 select-none font-sans">${subLabelFull}</p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <button class="info-toggle-btn border border-black dark:border-white p-2 rounded-none text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors focus:outline-none cursor-pointer" title="Lihat Detail">
                        <i data-feather="info" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            </div>
            
            <div class="celestial-info w-full mt-3.5 pt-3.5 border-t border-black dark:border-white space-y-3 text-[11px] text-black dark:text-white hidden animate-fade-in font-sans">
                <div class="space-y-1.5" id="stats-${item.id}">
                    <div class="font-mono text-[10px] text-neutral-400">Loading ephemeris...</div>
                </div>
            </div>
        `;

    if (expandedEntities.has(item.id)) {
      const info = div.querySelector(".celestial-info");
      info.classList.remove("hidden");
    }

    div.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      e.preventDefault();
      const infoDiv = div.querySelector(".celestial-info");
      handleEntityClick(div, infoDiv, item.id);
    });

    container.appendChild(div);
  });
}

function renderBodies() {
  const container = document.getElementById("bodies-list");
  if (!container) return;
  container.innerHTML = "";

  const categories = [
    { label: "STAR", ids: ["Sun", "Sirius"] },
    { label: "SATELLITE - NATURAL", ids: ["Moon"] },
    {
      label: "PLANET",
      ids: [
        "Mercury",
        "Venus",
        "Mars",
        "Jupiter",
        "Saturn",
        "Uranus",
        "Neptune",
      ],
    },
    { label: "DWARF", ids: ["Pluto"] },
  ];

  categories.forEach((cat) => {
    const catWrapper = document.createElement("div");
    catWrapper.className = "w-full mb-4 last:mb-0";

    const header = document.createElement("h3");
    header.className =
      "text-[10px] font-extrabold text-black dark:text-white uppercase tracking-[0.2em] font-sans mb-3.5 border-b border-black dark:border-white pb-2";
    header.innerText = cat.label;
    catWrapper.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "grid grid-cols-1 gap-3.5";
    catWrapper.appendChild(grid);

    cat.ids.forEach((id) => {
      const b = ENTITIES.find((e) => e.id === id);
      if (!b) return;

      const isActive = state.activeBodies.has(b.id);
      const div = document.createElement("div");
      div.className = `w-full flex flex-col relative overflow-hidden border bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 p-4 transition-colors hover:bg-neutral-100/30 dark:hover:bg-neutral-900/30 select-none rounded-none ${isActive ? "opacity-100" : "opacity-60"}`;
      div.id = `body-card-${b.id}`;
      div.innerHTML = `
                <div class="w-full flex items-center justify-between gap-3">
                    <div class="flex items-center gap-4">
                        <div class="w-11 h-11 border border-black dark:border-white font-extrabold text-sm shrink-0 select-none flex items-center justify-center rounded-none shadow-none text-white" style="background-color: ${b.color};">
                            <span>${b.symbol}</span>
                        </div>
                        <div>
                            <h3 class="font-extrabold text-[11px] text-black dark:text-white leading-tight uppercase tracking-wider font-sans select-none">${b.label}</h3>
                            <p class="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium leading-none mt-1 select-none font-sans">${b.subLabel}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <button class="info-toggle-btn border border-black dark:border-white p-2 rounded-none text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors focus:outline-none cursor-pointer" title="Lihat Detail">
                            <i data-feather="info" class="w-3.5 h-3.5"></i>
                        </button>
                        <label class="relative inline-flex items-center cursor-pointer select-none">
                          <input type="checkbox" value="${b.id}" class="sr-only peer body-toggle-checkbox" ${isActive ? "checked" : ""}>
                          <div class="w-11 h-6 bg-[#d4d4d4] dark:bg-[#404040] peer-focus:outline-none rounded-none peer dark:border-neutral-700 peer-checked:after:translate-x-[20px] peer-checked:after:bg-white dark:peer-checked:after:bg-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-black dark:after:bg-white after:rounded-none after:h-[18px] after:w-[18px] after:transition-all peer-checked:bg-black dark:peer-checked:bg-white border border-black dark:border-white"></div>
                        </label>
                    </div>
                </div>
                <div class="body-info w-full mt-3.5 pt-3.5 border-t border-black dark:border-white space-y-3 text-[11px] text-black dark:text-white hidden animate-fade-in font-sans">
                    <div class="space-y-1.5" id="stats-${b.id}">
                        <div class="font-mono text-[10px] text-neutral-400">Loading ephemeris...</div>
                    </div>
                </div>
            `;

      div.addEventListener("click", (e) => {
        const toggleSwitch = e.target.closest("label");
        if (toggleSwitch) {
          e.preventDefault();
          state.activeBodies.has(b.id)
            ? state.activeBodies.delete(b.id)
            : state.activeBodies.add(b.id);
          renderBodies();
          updateMap();
          return;
        }

        if (e.target.closest("a")) return;
        e.preventDefault();
        const infoDiv = div.querySelector(".body-info");
        handleEntityClick(div, infoDiv, b.id);
      });

      if (expandedEntities.has(b.id)) {
        const info = div.querySelector(".body-info");
        info.classList.remove("hidden");
      }

      grid.appendChild(div);
    });

    container.appendChild(catWrapper);
  });

  renderTerrestrial();
  renderCelestial();
  if (window.feather) {
    window.feather.replace();
  }
  updateBodyStats();
}

function updateTimeUI() {
  const { DateTime } = window.luxon || {};
  const banner = document.getElementById("simulation-banner");
  if (!banner) return;

  // Determine current active persona
  const currentPersona =
    state.personas.find((p) => p.id === state.selectedPersonaId) ||
    state.personas[0];
  const activeTz = currentPersona.timezone || "UTC";
  const activeTzLabel = `${currentPersona.label || "Persona"} (${activeTz})`;

  // Format local time
  let localTimeStr = "--";
  if (DateTime) {
    try {
      localTimeStr = DateTime.fromJSDate(state.customDate)
        .setZone(activeTz)
        .toFormat("yyyy-MM-dd EEEE HH:mm:ss")
        .toUpperCase();
    } catch (err) {
      localTimeStr = state.customDate
        .toISOString()
        .replace("T", " ")
        .substring(0, 19);
    }
  } else {
    localTimeStr = state.customDate
      .toISOString()
      .replace("T", " ")
      .substring(0, 19);
  }

  // Determine coordinate display
  const latDir = currentPersona.lat >= 0 ? "LU" : "LS";
  const lngDir = currentPersona.lng >= 0 ? "BT" : "BB";
  const latStr = Math.abs(currentPersona.lat).toFixed(4) + "° " + latDir;
  const lngStr = Math.abs(currentPersona.lng).toFixed(4) + "° " + lngDir;

  // Playback speed label
  let speedLabel = "Jeda";
  if (state.isPlaying) {
    const directionWord = state.playDirection === "BACKWARD" ? "MUNDUR" : "MAJU";
    if (state.speed === 1) {
      speedLabel = `1 dtk / dtk (${directionWord})`;
    } else {
      const values = [
        { unit: "Hari", val: 86400 },
        { unit: "Jam", val: 3600 },
        { unit: "Menit", val: 60 },
      ];
      let remainingSpeed = state.speed;
      let parts = [];
      for (const item of values) {
        if (remainingSpeed >= item.val) {
          const count = Math.floor(remainingSpeed / item.val);
          parts.push(`${count} ${item.unit}`);
          remainingSpeed %= item.val;
        }
      }
      if (remainingSpeed > 0 || parts.length === 0) {
        parts.push(`${remainingSpeed} Detik`);
      }
      speedLabel = `${parts.join(" ")} / dtk (${directionWord})`;
    }
  }

  let scrubberMax = 86400;
  let scrubberLabel = "24 JAM";
  let scrubberStep = 300;

  if (state.speed <= 1) {
    scrubberMax = 300;
    scrubberLabel = "5 MENIT";
    scrubberStep = 5;
  } else if (state.speed <= 60) {
    scrubberMax = 3600;
    scrubberLabel = "1 JAM";
    scrubberStep = Math.max(1, Math.round(state.speed));
  } else if (state.speed <= 1800) {
    scrubberMax = 86400;
    scrubberLabel = "24 JAM";
    scrubberStep = Math.max(1, Math.round(state.speed));
  } else if (state.speed <= 3650) {
    scrubberMax = 86400;
    scrubberLabel = "24 JAM";
    scrubberStep = Math.max(1, Math.round(state.speed));
  } else if (state.speed <= 86400) {
    scrubberMax = 2592000;
    scrubberLabel = "30 HARI";
    scrubberStep = Math.max(1, Math.round(state.speed));
  } else {
    scrubberMax = 31536000;
    scrubberLabel = "365 HARI";
    scrubberStep = Math.max(1, Math.round(state.speed));
  }

  let initialDateTimeIso = "";
  if (state.timeSourceMode === "MANUAL") {
    if (DateTime) {
      try {
        initialDateTimeIso = DateTime.fromJSDate(state.customDate)
          .setZone(activeTz)
          .toFormat("yyyy-MM-dd'T'HH:mm");
      } catch (err) {
        initialDateTimeIso = state.customDate.toISOString().slice(0, 16);
      }
    } else {
      initialDateTimeIso = state.customDate.toISOString().slice(0, 16);
    }
  }

  let wrapper = document.getElementById("sim-banner-wrapper");
  if (!wrapper) {
    banner.className = "block mt-6 mb-6 animate-fade-in";
    banner.innerHTML = `
        <div id="sim-banner-wrapper" class="bg-[#f5f5f5] dark:bg-neutral-900 border-2 border-black dark:border-white rounded-none flex flex-col overflow-hidden shadow-none transition-all duration-300">
            <!-- Row 1: Header / Status Bar -->
            <div class="p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 text-[11px] border-b border-black dark:border-white bg-[#fafafa] dark:bg-neutral-950">
                <div class="flex items-center gap-2 shrink-0 select-none">
                    <span class="flex h-2.5 w-2.5 relative">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-none bg-black dark:bg-white opacity-75"></span>
                        <span class="relative inline-flex rounded-none h-2.5 w-2.5 bg-black dark:bg-white"></span>
                    </span>
                    <span class="font-black text-black dark:text-white uppercase tracking-[0.2em] font-sans text-[10px]" id="sim-banner-status-label">
                        ${state.timeMachineEnabled ? "SIMULASI TIME MACHINE AKTIF" : "SINKRONISASI REAL-TIME AKTIF"}
                    </span>
                </div>
                <div class="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] text-neutral-600 dark:text-neutral-300 leading-normal select-none font-bold">
                    <div>ZONA: <span id="sim-banner-tz" class="text-black dark:text-white uppercase tracking-wider">${activeTzLabel}</span></div>
                    <div>WAKTU LOKAL: <span id="sim-banner-time" class="text-black dark:text-white tracking-widest">${localTimeStr}</span></div>
                    ${state.timeMachineEnabled ? `<div>KECEPATAN NOMINAL: <span id="sim-banner-speed" class="text-black dark:text-white bg-white dark:bg-black border border-black dark:border-white px-2 py-0.5 rounded-none tracking-widest">${speedLabel}</span></div>` : ""}
                </div>
            </div>

            <!-- Row 2: Unified Control Deck -->
            <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-black">
                <!-- Panel Kiri: Persona / Lokasi -->
                <div class="space-y-3.5 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 pb-6 md:pb-0 md:pr-6 flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-center select-none mb-2">
                            <label class="text-[10px] font-black text-black dark:text-white uppercase tracking-[0.2em] font-sans flex items-center gap-1.5">
                                <i data-feather="user" class="w-3.5 h-3.5"></i> PILIH PERSONA / LOKASI
                            </label>
                        </div>
                        
                        <div class="flex flex-col sm:flex-row gap-2">
                            <!-- Dropdown Selector of Personas -->
                            <select id="sim-persona-select" class="flex-1 bg-white dark:bg-black border border-black dark:border-white px-3 py-2 text-xs font-bold tracking-wide font-sans text-black dark:text-white uppercase focus:outline-none cursor-pointer rounded-none border-solid transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900 font-bold">
                                ${state.personas
                                  .map(
                                    (p) => `
                                    <option value="${p.id}" ${state.selectedPersonaId === p.id ? "selected" : ""}>
                                        ${p.label} — ${p.name.split(",")[0]}
                                    </option>
                                `,
                                  )
                                  .join("")}
                            </select>
                            
                            <!-- Action Buttons: Tambah / Ubah / Hapus Persona -->
                            <div class="flex gap-1.5 shrink-0">
                                <button id="sim-add-persona-btn" class="px-3 py-2 bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all font-bold text-xs uppercase tracking-wider rounded-none flex items-center gap-1" title="Tambah Persona Baru">
                                    <i data-feather="plus" class="w-3 h-3"></i> <span class="hidden sm:inline">TAMBAH</span>
                                </button>
                                <button id="sim-edit-persona-btn" class="px-3 py-2 bg-white dark:bg-black text-black dark:text-white border border-black dark:border-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all font-bold text-xs uppercase tracking-wider rounded-none flex items-center gap-1" title="Ubah Persona Aktif">
                                    <i data-feather="edit-2" class="w-3 h-3"></i> <span class="hidden sm:inline">UBAH</span>
                                </button>
                                ${
                                  state.personas.length > 1
                                    ? `
                                <button id="sim-delete-persona-btn" class="px-2.5 py-2 text-neutral-400 hover:text-red-500 dark:hover:text-red-400 border border-neutral-200 dark:border-neutral-800 hover:border-red-500 dark:hover:border-red-500 transition-all rounded-none flex items-center justify-center cursor-pointer" title="Hapus Persona Aktif">
                                    <i data-feather="trash-2" class="w-3.5 h-3.5"></i>
                                </button>
                                `
                                    : ""
                                }
                            </div>
                        </div>
                    </div>

                    <!-- Current Persona Coordinate/Elevation details badge -->
                    <div id="sim-persona-details" class="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 bg-[#f5f5f5]/75 dark:bg-neutral-900/40 p-2.5 border border-neutral-200 dark:border-neutral-850 flex flex-wrap justify-between items-center gap-2 select-none mt-3">
                        <span class="font-bold" id="sim-persona-loc-span">📍 ${currentPersona.name || "Koordinat"} (${latStr}, ${lngStr})</span>
                        ${currentPersona.elevation !== undefined ? `<span class="font-extrabold text-black dark:text-white" id="sim-persona-elev-span">ELEVA: ${currentPersona.elevation}M</span>` : ""}
                    </div>
                </div>

                <!-- Panel Kanan: Simulasi / Waktu -->
                <div class="space-y-4 flex flex-col justify-between">
                    <div class="flex justify-between items-center select-none">
                        <label class="text-[10px] font-black text-black dark:text-white uppercase tracking-[0.2em] font-sans flex items-center gap-1.5">
                            <i data-feather="clock" class="w-3.5 h-3.5"></i> SIMULASI TIME MACHINE
                        </label>
                        
                        <div class="flex items-center gap-2 select-none">
                            ${
                              state.timeMachineEnabled
                                ? `
                                <button id="NOW" class="w-9 h-9 bg-[#f5f5f5] dark:bg-neutral-900 text-black dark:text-white border border-black dark:border-white transition-all duration-300 rounded-none flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer shrink-0">
                                    <i data-feather="rotate-ccw" class="w-3.5 h-3.5"></i>
                                </button>
                                `
                                : ""
                            }
                            <!-- Realtime toggle switch button/checkbox -->
                            <div class="flex items-center gap-2 cursor-pointer select-none" id="sim-realtime-toggle-trigger">
                                ${
                                  state.timeMachineEnabled
                                    ? `
                                    <div class="px-5 h-9 bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white font-black text-xs tracking-[0.150em] transition-all duration-300 rounded-none shadow-sm flex items-center justify-center gap-1.5 min-w-[72px] hover:bg-neutral-900 dark:hover:bg-neutral-100">
                                        <span class="w-1.5 h-1.5 bg-white dark:bg-black rounded-full inline-block animate-pulse"></span> ON
                                    </div>
                                `
                                    : `
                                    <div class="px-5 h-9 bg-transparent text-neutral-400 dark:text-neutral-500 border border-neutral-300 dark:border-neutral-800 font-black text-xs tracking-[0.150em] transition-all duration-300 rounded-none flex items-center justify-center gap-1.5 min-w-[72px] hover:bg-neutral-50/50 dark:hover:bg-neutral-950/50 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white">
                                        <span class="w-1.5 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full inline-block"></span> OFF
                                    </div>
                                `
                                }
                            </div>
                        </div>
                    </div>

                    <div id="sim-time-controls-container" class="flex-1 flex flex-col justify-center">
                    ${
                      !state.timeMachineEnabled
                        ? `
                        <!-- Realtime active state placeholder -->
                        <div class="flex-1 flex flex-col items-center justify-center text-center p-3 border border-dashed border-neutral-300 dark:border-neutral-800 bg-[#f5f5f5]/30 dark:bg-neutral-900/10 min-h-[75px]">
                            <p class="text-[10px] text-neutral-500 dark:text-neutral-400 font-sans tracking-wide">
                                Sistem disinkronkan dengan waktu nyata dunia saat ini.
                                <br/>Ubah tombol Simulasi menjadi <span class="font-bold text-black dark:text-white">ON</span> untuk mengaktifkan mesin waktu.
                            </p>
                        </div>
                    `
                        : `
                        <!-- Simulation Controls interface -->
                        <div class="space-y-4">
                            <!-- Pemilihan Sumber Waktu: MANUAL vs REAL-TIME -->
                            <div class="flex flex-col gap-1.5">
                                <span class="text-[9px] font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block font-sans">1. SUMBER WAKTU (TIME SOURCE)</span>
                                <div class="grid grid-cols-2 gap-2">
                                    <button id="sim-source-manual" class="h-9 text-[10px] font-extrabold uppercase tracking-wider border rounded-none transition-all flex items-center justify-center gap-1 cursor-pointer ${state.timeSourceMode === 'MANUAL' ? 'bg-black dark:bg-white text-white dark:text-black border-transparent' : 'bg-transparent border-black dark:border-white text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'}" title="Manual Persona Clock">
                                        <i data-feather="user" class="w-3.5 h-3.5"></i> MANUAL (PERSONA)
                                    </button>
                                    <button id="sim-source-realtime" class="h-9 text-[10px] font-extrabold uppercase tracking-wider border rounded-none transition-all flex items-center justify-center gap-1 cursor-pointer ${state.timeSourceMode === 'REAL-TIME' ? 'bg-black dark:bg-white text-white dark:text-black border-transparent' : 'bg-transparent border-black dark:border-white text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'}" title="Real-time World Clock">
                                        <i data-feather="clock" class="w-3.5 h-3.5"></i> REAL-TIME
                                    </button>
                                </div>
                            </div>

                            <!-- Datetime picker only for MANUAL mode -->
                            ${
                              state.timeSourceMode === "MANUAL"
                                ? `
                            <div class="flex items-center gap-2 bg-[#f9f9f9] dark:bg-neutral-950 p-2 border border-dashed border-neutral-300 dark:border-neutral-800">
                                <span class="text-[9px] font-mono font-bold text-neutral-400 select-none uppercase tracking-wider">SET MANUAL:</span>
                                <input type="datetime-local" id="sim-custom-time" value="${initialDateTimeIso}" class="flex-1 text-[10px] font-mono bg-white dark:bg-black border border-black dark:border-white p-1 font-bold text-black dark:text-white focus:outline-none rounded-none h-7">
                            </div>
                            `
                                : ""
                            }

                            <!-- Mode Interval: N / C -->
                            <div class="flex flex-col gap-1.5">
                                <span class="text-[9px] font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block font-sans">2. PILIH INTERVAL [N/C]</span>
                                <div class="flex items-center gap-3">
                                    <!-- Mode Toggle button group -->
                                    <div class="flex items-center gap-0.5 bg-[#f5f5f5] dark:bg-neutral-900 p-0.5 border border-black dark:border-white overflow-hidden rounded-none shadow-sm shrink-0">
                                        <button type="button" id="sim-mode-n" class="text-[10px] font-mono font-black px-4 py-1.5 transition-all cursor-pointer rounded-none ${state.timeMachineMode === "N" ? "bg-black dark:bg-white text-white dark:text-black" : "text-neutral-500 hover:text-black dark:hover:text-white"}" title="Normal Mode (1s = 1s)">N</button>
                                        <button type="button" id="sim-mode-c" class="text-[10px] font-mono font-black px-4 py-1.5 transition-all cursor-pointer rounded-none ${state.timeMachineMode === "C" ? "bg-black dark:bg-white text-white dark:text-black" : "text-neutral-500 hover:text-black dark:hover:text-white"}" title="Custom Mode">C</button>
                                    </div>
                                    
                                    <!-- Options details -->
                                    <div class="flex-1 flex items-center">
                                        ${
                                          state.timeMachineMode === "N"
                                            ? `
                                            <span class="text-[10px] font-mono font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest select-none whitespace-nowrap leading-none">
                                                NORMAL (1 DETIK / DETIK)
                                            </span>
                                        `
                                            : `
                                            <div class="flex items-center gap-1.5 w-full">
                                                <input type="number" id="sim-custom-speed-val" min="1" step="1" value="${state.customSpeedValue}" class="w-14 bg-white dark:bg-black border border-black dark:border-white px-2 py-0.5 text-center text-xs font-bold font-mono text-black dark:text-white focus:outline-none rounded-none h-8">
                                                <select id="sim-custom-speed-unit" class="flex-1 bg-white dark:bg-black border border-black dark:border-white px-1.5 py-0.5 text-[10px] font-bold font-sans uppercase tracking-wider text-black dark:text-white cursor-pointer focus:outline-none rounded-none h-8 font-bold">
                                                    <option value="1" ${state.customSpeedUnit === 1 ? "selected" : ""}>DETIK</option>
                                                    <option value="60" ${state.customSpeedUnit === 60 ? "selected" : ""}>MENIT</option>
                                                    <option value="3600" ${state.customSpeedUnit === 3600 ? "selected" : ""}>JAM</option>
                                                    <option value="86400" ${state.customSpeedUnit === 86400 ? "selected" : ""}>HARI</option>
                                                </select>
                                                <span class="text-[9px] font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider whitespace-nowrap">/ dtk</span>
                                            </div>
                                        `
                                        }
                                    </div>
                                </div>
                            </div>

                            <!-- Play/Pause & Backward/Forward Options Group -->
                            <div class="flex flex-col gap-2 pt-1 border-t border-neutral-250 dark:border-neutral-800 mt-2">
                                <span class="text-[9px] font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block font-sans">
                                    3. KONTROL JALAN & ARAH
                                </span>
                                <div class="flex flex-col gap-2">
                                    <button id="sim-btn-play" class="w-full h-9 text-[10px] font-black uppercase tracking-widest bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 flex justify-center items-center cursor-pointer transition-colors border border-transparent rounded-none">
                                        ${
                                          state.isPlaying
                                            ? `<i data-feather="pause" class="w-3.5 h-3.5 mr-1.5"></i> JEDA / PAUSE`
                                            : `<i data-feather="play" class="w-3.5 h-3.5 mr-1.5"></i> PUTAR / PLAY`
                                        }
                                    </button>
                                    
                                    <div class="grid grid-cols-2 gap-2">
                                        <button id="sim-dir-backward" class="h-9 text-[10px] font-extrabold uppercase tracking-wider border rounded-none transition-all flex items-center justify-center gap-1.5 cursor-pointer ${state.playDirection === "BACKWARD" ? "bg-black dark:bg-white text-white dark:text-black border-transparent" : "bg-transparent border-black dark:border-white text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900"}" title="Time Machine Backward Play">
                                            <i data-feather="chevrons-left" class="w-4 h-4"></i> BACKWARD (MUNDUR)
                                        </button>
                                        <button id="sim-dir-forward" class="h-9 text-[10px] font-extrabold uppercase tracking-wider border rounded-none transition-all flex items-center justify-center gap-1.5 cursor-pointer ${state.playDirection === "FORWARD" ? "bg-black dark:bg-white text-white dark:text-black border-transparent" : "bg-transparent border-black dark:border-white text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900"}" title="Time Machine Forward Play">
                                            FORWARD (MAJU) <i data-feather="chevrons-right" class="w-4 h-4"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `
                    }
                    </div>
                </div>
            </div>
        </div>
        `;
    wrapper = document.getElementById("sim-banner-wrapper");
    if (window.feather) window.feather.replace();

    // ------------------ EVENT LISTENERS FOR UNIFIED DECK ------------------

    // Persona Selection
    const personaSelect = document.getElementById("sim-persona-select");
    personaSelect?.addEventListener("change", (e) => {
      state.selectedPersonaId = e.target.value;
      const selectedP = state.personas.find(
        (p) => p.id === state.selectedPersonaId,
      );
      if (selectedP) {
        if (state.timeMachineEnabled) {
          if (state.timeSourceMode === "MANUAL") {
            state.customDate = getPersonaAnchorTime(selectedP);
          }
        } else {
          state.customDate = new Date();
        }
      }
      document.getElementById("sim-banner-wrapper")?.remove();
      updateBodies();
      updateMap();
      updateTimeUI();
    });

    // Add Persona Action
    const addPersonaBtn = document.getElementById("sim-add-persona-btn");
    addPersonaBtn?.addEventListener("click", () => {
      showPersonaModal();
    });

    // Edit Persona Action
    const editPersonaBtn = document.getElementById("sim-edit-persona-btn");
    editPersonaBtn?.addEventListener("click", () => {
      showPersonaModal(state.selectedPersonaId);
    });

    // Delete Persona Action
    const deletePersonaBtn = document.getElementById("sim-delete-persona-btn");
    deletePersonaBtn?.addEventListener("click", () => {
      if (state.personas.length <= 1) return;
      state.personas = state.personas.filter(
        (p) => p.id !== state.selectedPersonaId,
      );
      const fallbackP = state.personas[0];
      state.selectedPersonaId = fallbackP.id;

      if (state.timeMachineEnabled) {
        if (state.timeSourceMode === "MANUAL") {
          state.customDate = getPersonaAnchorTime(fallbackP);
        }
      } else {
        state.customDate = new Date();
      }
      document.getElementById("sim-banner-wrapper")?.remove();
      updateBodies();
      updateMap();
      updateTimeUI();
    });

    // SIMULASI TIME MACHINE ON/OFF Toggle
    const realtimeToggleTrigger = document.getElementById(
      "sim-realtime-toggle-trigger",
    );
    realtimeToggleTrigger?.addEventListener("click", () => {
      state.timeMachineEnabled = !state.timeMachineEnabled;
      state.isRealTime = !state.timeMachineEnabled;
      state.isPlaying = false;
      
      if (state.timeMachineEnabled) {
        state.timeSourceMode = "MANUAL";
        const activeP =
          state.personas.find((p) => p.id === state.selectedPersonaId) ||
          state.personas[0];
        state.customDate = getPersonaAnchorTime(activeP);
      } else {
        state.customDate = new Date();
      }

      document.getElementById("sim-banner-wrapper")?.remove();
      updateTimeUI();
      updateMap();
    });

    // Time Source Mode MANUAL Click
    const sourceManualBtn = document.getElementById("sim-source-manual");
    sourceManualBtn?.addEventListener("click", () => {
      state.timeSourceMode = "MANUAL";
      const activeP =
        state.personas.find((p) => p.id === state.selectedPersonaId) ||
        state.personas[0];
      state.customDate = getPersonaAnchorTime(activeP);

      document.getElementById("sim-banner-wrapper")?.remove();
      updateTimeUI();
      updateMap();
    });

    // Time Source Mode REALTIME Click
    const sourceRealtimeBtn = document.getElementById("sim-source-realtime");
    sourceRealtimeBtn?.addEventListener("click", () => {
      state.timeSourceMode = "REAL-TIME";
      state.customDate = new Date();

      document.getElementById("sim-banner-wrapper")?.remove();
      updateTimeUI();
      updateMap();
    });

    // Play Pause Action
    const btnPlay = document.getElementById("sim-btn-play");
    btnPlay?.addEventListener("click", () => {
      state.isPlaying = !state.isPlaying;
      document.getElementById("sim-banner-wrapper")?.remove();
      updateTimeUI();
    });

    // Direction backward click
    const dirBackwardBtn = document.getElementById("sim-dir-backward");
    dirBackwardBtn?.addEventListener("click", () => {
      state.playDirection = "BACKWARD";
      document.getElementById("sim-banner-wrapper")?.remove();
      updateTimeUI();
    });

    // Direction forward click
    const dirForwardBtn = document.getElementById("sim-dir-forward");
    dirForwardBtn?.addEventListener("click", () => {
      state.playDirection = "FORWARD";
      document.getElementById("sim-banner-wrapper")?.remove();
      updateTimeUI();
    });

    // Reset Action
    const btnNow = document.getElementById("NOW");
    btnNow?.addEventListener("click", () => {
      if (state.timeSourceMode === "MANUAL") {
        const activeP =
          state.personas.find((p) => p.id === state.selectedPersonaId) ||
          state.personas[0];
        state.customDate = getPersonaAnchorTime(activeP);
      } else {
        state.customDate = new Date();
      }
      document.getElementById("sim-banner-wrapper")?.remove();
      updateTimeUI();
      updateMap();
    });

    // Time machine mode / speed selection listeners
    const btnModeN = document.getElementById("sim-mode-n");
    btnModeN?.addEventListener("click", () => {
      state.timeMachineMode = "N";
      state.speed = 1;
      document.getElementById("sim-banner-wrapper")?.remove();
      updateTimeUI();
    });

    const btnModeC = document.getElementById("sim-mode-c");
    btnModeC?.addEventListener("click", () => {
      state.timeMachineMode = "C";
      state.speed = state.customSpeedValue * state.customSpeedUnit;
      document.getElementById("sim-banner-wrapper")?.remove();
      updateTimeUI();
    });

    const inputCustomSpeedVal = document.getElementById("sim-custom-speed-val");
    inputCustomSpeedVal?.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      state.customSpeedValue = isNaN(val) || val < 1 ? 1 : val;
      state.speed = state.customSpeedValue * state.customSpeedUnit;
      // update details live
      const speedSpan = document.getElementById("sim-banner-speed");
      if (speedSpan) {
        speedSpan.innerText = speedLabel;
      }
    });

    const selectCustomSpeedUnit = document.getElementById(
      "sim-custom-speed-unit",
    );
    selectCustomSpeedUnit?.addEventListener("change", (e) => {
      state.customSpeedUnit = parseInt(e.target.value);
      state.speed = state.customSpeedValue * state.customSpeedUnit;
      document.getElementById("sim-banner-wrapper")?.remove();
      updateTimeUI();
    });

    // Datetime-local picker
    const datetimePicker = document.getElementById("sim-custom-time");
    datetimePicker?.addEventListener("change", (e) => {
      if (e.target.value) {
        const activeP =
          state.personas.find((p) => p.id === state.selectedPersonaId) ||
          state.personas[0];
        const zone = activeP.timezone || "UTC";
        if (DateTime) {
          const dt = DateTime.fromISO(e.target.value, { zone }).toUTC();
          if (dt.isValid) {
            state.customDate = dt.toJSDate();
          }
        } else {
          state.customDate = new Date(e.target.value + "Z");
        }
        updateMap();
        updateTimeUI();
      }
    });
  } else {
    // Wrapper already exists. Update dynamic values swiftly to avoid full DOM flicker
    const tzSpan = document.getElementById("sim-banner-tz");
    const timeSpan = document.getElementById("sim-banner-time");
    const speedSpan = document.getElementById("sim-banner-speed");
    const statusLabel = document.getElementById("sim-banner-status-label");

    if (tzSpan) tzSpan.innerText = activeTzLabel;
    if (timeSpan) timeSpan.innerText = localTimeStr;
    if (speedSpan && state.timeMachineEnabled) speedSpan.innerText = speedLabel;
    if (statusLabel) {
      statusLabel.innerText = state.timeMachineEnabled
        ? "SIMULASI TIME MACHINE AKTIF"
        : "SINKRONISASI REAL-TIME AKTIF";
    }

    // Persona select dropdown
    const personaSelect = document.getElementById("sim-persona-select");
    if (personaSelect && document.activeElement !== personaSelect) {
      if (personaSelect.value !== state.selectedPersonaId) {
        personaSelect.value = state.selectedPersonaId;
      }
    }

    // Location & elevation details
    const locSpan = document.getElementById("sim-persona-loc-span");
    const elevSpan = document.getElementById("sim-persona-elev-span");
    if (locSpan)
      locSpan.innerText = `📍 ${currentPersona.name || "Koordinat"} (${latStr}, ${lngStr})`;
    if (elevSpan && currentPersona.elevation !== undefined) {
      elevSpan.innerText = `ELEVA: ${currentPersona.elevation}M`;
    }

    // Datetime Picker input
    const customTimeInput = document.getElementById("sim-custom-time");
    if (
      customTimeInput &&
      state.timeMachineEnabled &&
      state.timeSourceMode === "MANUAL" &&
      document.activeElement !== customTimeInput
    ) {
      let isoString = "";
      if (DateTime) {
        isoString = DateTime.fromJSDate(state.customDate)
          .setZone(activeTz)
          .toFormat("yyyy-MM-dd'T'HH:mm");
      } else {
        isoString = state.customDate.toISOString().slice(0, 16);
      }
      if (customTimeInput.value !== isoString) {
        customTimeInput.value = isoString;
      }
    }
  }

  // Interactive Scrubber section attached directly at the bottom
  if (state.timeMachineEnabled) {
    let scrubberBlock = document.getElementById("sim-combined-scrubber-block");
    if (!scrubberBlock && wrapper) {
      scrubberBlock = document.createElement("div");
      scrubberBlock.id = "sim-combined-scrubber-block";
      scrubberBlock.className =
        "p-3.5 bg-[#fafafa] dark:bg-neutral-950 border-t border-black dark:border-white flex flex-col gap-2 relative transition-all";
      scrubberBlock.innerHTML = `
                 <div class="flex justify-between items-center px-1">
                    <label class="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block font-sans">Time Scrubber</label>
                    <span class="text-[9px] font-mono bg-black dark:bg-white px-1.5 py-0.5 rounded-none text-white dark:text-black font-extrabold" id="banner-scrubber-indicator">GESER</span>
                </div>
                <div class="flex items-center gap-4">
                    <button id="banner-step-backward" class="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-transparent border border-black dark:border-white text-black dark:text-white rounded-none cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all" title="Langkah Mundur">
                        <i data-feather="chevron-left" class="w-4 h-4"></i>
                    </button>
                    <div class="flex-1 flex flex-col relative w-full group py-3">
                        <div class="text-[9px] text-neutral-400 dark:text-neutral-500 font-sans font-bold tracking-widest flex justify-between absolute top-0 w-full pointer-events-none">
                            <span id="banner-scrub-min">-${scrubberLabel}</span>
                            <span class="text-neutral-300 dark:text-neutral-700 font-medium font-bold">|</span>
                            <span id="banner-scrub-max">+${scrubberLabel}</span>
                        </div>
                        <input type="range" id="banner-time-scrubber" min="-${scrubberMax}" max="${scrubberMax}" value="0" step="${scrubberStep}" class="w-full mt-1.5 h-1.5 accent-black dark:accent-white bg-neutral-200 dark:bg-neutral-850 rounded-none appearance-none cursor-pointer">
                    </div>
                    <button id="banner-step-forward" class="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-transparent border border-black dark:border-white text-black dark:text-white rounded-none cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all" title="Langkah Maju">
                        <i data-feather="chevron-right" class="w-4 h-4"></i>
                    </button>
                </div>
            `;
      wrapper.appendChild(scrubberBlock);
      if (window.feather) window.feather.replace();

      // Set up scrubber logic
      let scrubberBaseTime = null;
      const scrubber = document.getElementById("banner-time-scrubber");
      const scrubberIndicator = document.getElementById(
        "banner-scrubber-indicator",
      );

      const resetScrubber = () => {
        scrubberBaseTime = null;
        if (scrubber) scrubber.value = 0;
        if (scrubberIndicator) scrubberIndicator.innerText = "GESER";
      };

      if (scrubber) {
        scrubber.addEventListener("input", (e) => {
          if (!scrubberBaseTime) scrubberBaseTime = state.customDate.getTime();

          const offsetSecs = parseInt(e.target.value);
          state.customDate = new Date(scrubberBaseTime + offsetSecs * 1000);

          const absSecs = Math.abs(offsetSecs);
          const d = Math.floor(absSecs / 86400);
          const h = Math.floor((absSecs % 86400) / 3600);
          const m = Math.floor((absSecs % 3600) / 60);

          let timePieces = [];
          if (d > 0) timePieces.push(d + "h");
          if (h > 0) timePieces.push(h + "j");
          if (m > 0 || (d === 0 && h === 0 && absSecs > 0))
            timePieces.push(m + "m");

          let displayName =
            offsetSecs === 0
              ? "GESER"
              : (offsetSecs > 0 ? "+" : "-") + timePieces.join(" ");
          if (scrubberIndicator) scrubberIndicator.innerText = displayName;

          updateTimeUI();
          updateMap();
        });

        scrubber.addEventListener("change", resetScrubber);
        scrubber.addEventListener("mouseup", resetScrubber);
        scrubber.addEventListener("touchend", resetScrubber);
      }

      document
        .getElementById("banner-step-backward")
        ?.addEventListener("click", () => {
          state.customDate = new Date(
            state.customDate.getTime() - state.speed * 1000,
          );
          updateTimeUI();
          updateMap();
        });

      document
        .getElementById("banner-step-forward")
        ?.addEventListener("click", () => {
          state.customDate = new Date(
            state.customDate.getTime() + state.speed * 1000,
          );
          updateTimeUI();
          updateMap();
        });
    } else if (scrubberBlock) {
      // If scrubber block exists, update values
      const scrubber = document.getElementById("banner-time-scrubber");
      const minLabel = document.getElementById("banner-scrub-min");
      const maxLabel = document.getElementById("banner-scrub-max");

      if (scrubber && document.activeElement !== scrubber) {
        if (parseInt(scrubber.max) !== scrubberMax) {
          scrubber.min = -scrubberMax;
          scrubber.max = scrubberMax;
          scrubber.step = scrubberStep;
          if (minLabel) minLabel.innerText = `-${scrubberLabel}`;
          if (maxLabel) maxLabel.innerText = `+${scrubberLabel}`;
        }
      }
    }
  } else {
    const scrubberBlock = document.getElementById(
      "sim-combined-scrubber-block",
    );
    if (scrubberBlock) scrubberBlock.remove();
  }

  updatePersonaTimeBadges();
}

function updatePersonaTimeBadges() {
  if (state.currentTab !== "location") return;
  const { DateTime } = window.luxon || {};
  if (!DateTime) return;
  state.personas.forEach((p) => {
    const badge = document.getElementById(`p-time-badge-${p.id}`);
    if (badge && p.timezone) {
      try {
        const dt = DateTime.fromJSDate(state.customDate).setZone(p.timezone);
        const offsetInMinutes = dt.offset;
        const hours = Math.floor(Math.abs(offsetInMinutes) / 60);
        const mins = Math.abs(offsetInMinutes) % 60;
        const sign = offsetInMinutes >= 0 ? "+" : "-";
        const offsetStr =
          mins === 0
            ? `${sign}${hours}`
            : `${sign}${hours}:${mins.toString().padStart(2, "0")}`;
        const localStr =
          dt.toFormat("HH:mm:ss") + " [" + offsetStr + "] (" + p.timezone + ")";
        if (badge.innerText !== localStr) {
          badge.innerText = localStr;
        }
      } catch (e) {
        console.error("Failed badge update", e);
      }
    }
  });
}

const conjunctionCache = {};

function predictConjunction(bodyStr, startFromDate, activePersona, isZenith) {
  if (!activePersona) return null;
  const targetLat = isZenith ? activePersona.lat : -activePersona.lat;

  const startMs = startFromDate.getTime();

  // We can't really cache effectively with a dynamic startFromDate unless we key by startFromDate day,
  // but running it takes very few ms, so we just run it. We look forward 366 days.
  const dayOffsets = 366;
  const decCache = [];

  for (let d = 0; d <= dayOffsets; d++) {
    // Sample at noon UTC each day to get general declination trend
    const testDate = new Date(startMs + d * 24 * 3600 * 1000);
    const stats =
      typeof getBodyStats === "function"
        ? getBodyStats(bodyStr, testDate, null)
        : null;
    decCache.push(stats ? stats.dec : 0);
  }

  let bestDayIndex = -1;
  let exactCrossingFound = false;

  // Look for a crossing looking FORWARD
  for (let d = 0; d < dayOffsets; d++) {
    const diff1 = decCache[d] - targetLat;
    const diff2 = decCache[d + 1] - targetLat;
    if (diff1 * diff2 <= 0) {
      exactCrossingFound = true;
      bestDayIndex = d;
      break;
    }
  }

  let targetDay;
  if (exactCrossingFound) {
    const diff1 = Math.abs(decCache[bestDayIndex] - targetLat);
    const diff2 = Math.abs(decCache[bestDayIndex + 1] - targetLat);
    let fraction = 0;
    if (diff1 + diff2 > 0) {
      fraction = diff1 / (diff1 + diff2);
    }
    targetDay = new Date(
      startMs + (bestDayIndex + fraction) * 24 * 3600 * 1000,
    );
  } else {
    // Fallback if no exact crossing is found (e.g. body declination doesn't reach persona lat)
    let minDiff = 180;
    for (let d = 0; d < dayOffsets; d++) {
      const diff = Math.abs(decCache[d] - targetLat);
      if (diff < minDiff) {
        minDiff = diff;
        bestDayIndex = d;
      }
    }
    targetDay = new Date(startMs + bestDayIndex * 24 * 3600 * 1000);
  }

  // We now have targetDay. We find the exact time of transit (Hour Angle = 0 or 180) on that day.
  // Start at local midnight of that targetDay UTC to span a 24-hour test.
  const baseDate = new Date(
    Date.UTC(
      targetDay.getUTCFullYear(),
      targetDay.getUTCMonth(),
      targetDay.getUTCDate(),
      0,
      0,
      0,
    ),
  );

  let minDiffH = 360;
  let bestHourOffset = 0;
  for (let h = 0; h < 48; h++) {
    // Span 48 hours to be safe around targetDay
    const testDate = new Date(baseDate.getTime() + h * 3600 * 1000);
    const stats =
      typeof getBodyStats === "function"
        ? getBodyStats(bodyStr, testDate, activePersona)
        : null;
    if (stats) {
      const ha = stats.hourAngle; // -180 to 180
      const targetHA = isZenith ? 0 : ha >= 0 ? 180 : -180;
      let diff = Math.abs(ha - targetHA);
      if (diff > 180) diff = 360 - diff; // normalize

      if (diff < minDiffH) {
        // If we are evaluating the exact very first hour and it's behind startFromDate, we skip?
        // Wait, we want the final date to be STRICTLY > startFromDate.
        if (testDate.getTime() >= startMs) {
          minDiffH = diff;
          bestHourOffset = h;
        }
      }
    }
  }

  let minDiffM = 360;
  let bestMinuteOffset = 0;
  for (let m = 0; m < 60; m++) {
    const testDate = new Date(
      baseDate.getTime() + bestHourOffset * 3600 * 1000 + m * 60 * 1000,
    );
    const stats =
      typeof getBodyStats === "function"
        ? getBodyStats(bodyStr, testDate, activePersona)
        : null;
    if (stats) {
      const ha = stats.hourAngle;
      const targetHA = isZenith ? 0 : ha >= 0 ? 180 : -180;
      let diff = Math.abs(ha - targetHA);
      if (diff > 180) diff = 360 - diff;

      if (diff < minDiffM && testDate.getTime() > startMs) {
        minDiffM = diff;
        bestMinuteOffset = m;
      }
    }
  }

  let finalDate = new Date(
    baseDate.getTime() +
      bestHourOffset * 3600 * 1000 +
      bestMinuteOffset * 60 * 1000,
  );

  // Safety check: if the best hour angle difference is large (> 15 degrees, approx 1 hour),
  // it means the true transit happened BEFORE startMs today, and we just picked the boundary.
  // In that case, we should find the next event by skipping 24 hours ahead.
  if (minDiffM > 15) {
    return predictConjunction(
      bodyStr,
      new Date(startMs + 24 * 3600 * 1000),
      activePersona,
      isZenith,
    );
  }

  return finalDate;
}

function updateBodyStats() {
  const activePersona =
    state.personas.find((p) => p.id === state.selectedPersonaId) ||
    state.personas[0];
  const reqConfig = { zodiac: state.zodiacConfig, coord: state.coordConfig };

  BODIES.forEach((b) => {
    const infoDiv = document.querySelector(`#body-card-${b.id} .body-info`);
    if (infoDiv && !infoDiv.classList.contains("hidden")) {
      const stats =
        typeof getBodyStats === "function"
          ? getBodyStats(b.id, state.customDate, activePersona, reqConfig)
          : null;
      if (stats) {
        const statsContainer = document.getElementById(`stats-${b.id}`);
        if (statsContainer) {
          statsContainer.innerHTML = generateStatsTableHTML(stats, true, b.id);
        }
      }
    }
  });

  if (typeof updatePersonaStats === "function") {
    updatePersonaStats();
  }
}

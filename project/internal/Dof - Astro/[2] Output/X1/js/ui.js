// js/ui.js

let lastNominatimRequestTime = 0;

function showSubjectModal(editSubjectId = null) {
  const isEdit = editSubjectId !== null;
  const subject = isEdit
    ? state.subjects.find((s) => s.id === editSubjectId)
    : null;

  const modal = document.getElementById("subject-modal");

  const d = new Date();
  const defaultDate =
    isEdit && subject.date ? subject.date : d.toISOString().split("T")[0];
  const defaultTime =
    isEdit && subject.time ? subject.time : d.toTimeString().slice(0, 5);
  const defaultTimezone = isEdit
    ? subject.timezone
    : Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const defaultElevation = isEdit
    ? subject.elevation !== undefined
      ? subject.elevation
      : ""
    : "";

  modal.innerHTML = `
        <div class="bg-white dark:bg-neutral-950 p-6 rounded-none w-full max-w-md mx-4 border border-black dark:border-white animate-fade-in relative overflow-hidden max-h-[90vh] flex flex-col">
            <div class="absolute top-0 left-0 w-full h-[3px] bg-black dark:bg-white"></div>
            <div class="flex justify-between items-center mb-5 shrink-0">
                <h2 class="font-extrabold uppercase text-black dark:text-white tracking-widest text-[12px] font-sans">${isEdit ? "Edit Lokasi / Subject" : "Tambah Lokasi"}</h2>
                <button id="close-modal" class="text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors border border-black dark:border-white p-1.5 rounded-none"><i data-feather="x" class="w-3.5 h-3.5"></i></button>
            </div>
            
            <div class="space-y-4 overflow-y-auto flex-1 pr-1 pb-1 scrollbar-none scrollbar-thin">
                <!-- 1. Label Section -->
                <div class="space-y-1">
                    <label class="block text-[9px] font-bold text-neutral-400 mb-1.5 uppercase tracking-widest font-sans">Label Subject</label>
                    <input type="text" id="p-label" value="${isEdit ? subject.label || "" : ""}" placeholder="Cth: Rumah, Kantor, Masjid" class="w-full px-3 py-2 text-xs bg-white dark:bg-black border border-black dark:border-white rounded-none focus:outline-none dark:text-white font-medium">
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
                        <input type="text" id="p-location" value="${isEdit ? subject.name || "" : ""}" placeholder="Cari kota, tempat ibadah... (Nominatim)" class="flex-1 px-3 py-2 text-xs bg-white dark:bg-black border border-black dark:border-white rounded-none focus:outline-none dark:text-white font-medium">
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
                        <input type="number" step="any" min="-90" max="90" id="p-lat" value="${isEdit ? subject.lat : ""}" placeholder="-6.2088" class="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-black border border-black dark:border-white rounded-none focus:outline-none dark:text-white">
                    </div>
                    <div class="space-y-1">
                        <label class="block text-[9px] font-bold text-neutral-400 mb-1.5 uppercase tracking-widest font-sans">Longitude</label>
                        <input type="number" step="any" min="-180" max="180" id="p-lng" value="${isEdit ? subject.lng : ""}" placeholder="106.8456" class="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-black border border-black dark:border-white rounded-none focus:outline-none dark:text-white">
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

            <button id="save-subject" class="w-full py-3 bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-black rounded-none text-xs uppercase tracking-widest font-extrabold transition mt-3 shrink-0 border border-black dark:border-white">
                ${isEdit ? "SIMPAN PERUBAHAN" : "SIMPAN SUBJECT BARU"}
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
    ? subject.isRealTime !== false && (!subject.date || !subject.time)
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
        resultsContainer.innerHTML = `<div class="p-3 text-xs text-rose-450 font-mono text-center">Lokasi tidak ditemukan.</div>`;
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

  document.getElementById("save-subject").addEventListener("click", () => {
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

    if (isEdit && subject) {
      subject.label = label;
      subject.name = locationVal;
      subject.lat = lat;
      subject.lng = lng;
      subject.timezone = timezone;
      subject.isRealTime = currentIsRealTime;
      subject.date = date;
      subject.time = time;
      subject.elevation = elevation;
    } else {
      const newId = "s_" + Date.now();
      state.subjects.push({
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
      state.selectedSubjectId = newId;
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

  const activeSubject =
    state.subjects.find((s) => s.id === state.selectedSubjectId) ||
    state.subjects[0];
  if (!activeSubject) return;

  const items = ENTITIES.filter((e) => e.type === "TERRESTRIAL");

  items.forEach((item) => {
    const isActive = state.activeBodies.has(item.id);
    const div = document.createElement("div");
    const borderHighlight =
      item.symbol === "TZ"
        ? "border-l-[4px] border-l-emerald-400 dark:border-l-emerald-500"
        : "border-l-[4px] border-l-rose-400 dark:border-l-rose-500";
    div.className = `w-full flex flex-col relative overflow-hidden border bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 ${borderHighlight} p-4 transition-colors hover:bg-neutral-100/55 dark:hover:bg-neutral-900/55 select-none cursor-pointer rounded-none animate-fade-in ${isActive ? "opacity-100" : "opacity-60"}`;
    div.id = `terrestrial-card-${item.id}`;

    const labelSubject = activeSubject.label || activeSubject.name || "Subject";
    const subLabelFull = `${item.subLabel}${labelSubject}`;

    div.innerHTML = `
            <div class="w-full flex items-center justify-between gap-3">
                <div class="flex items-center gap-4">
                    <div class="w-11 h-11 rounded-full border-2 ${item.symbol === "TZ" ? "bg-white text-slate-950 border-slate-950" : "bg-slate-950 dark:bg-white text-white dark:text-slate-950 border-white dark:border-slate-950"} font-extrabold font-mono text-xs shrink-0 select-none flex items-center justify-center shadow-md">
                        <span>${item.symbol}</span>
                    </div>
                    <div>
                        <h3 class="font-extrabold text-[11px] text-black dark:text-white leading-tight uppercase tracking-wider font-sans select-none">${item.label}</h3>
                        <p class="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium leading-none mt-1 select-none font-sans">${subLabelFull}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button class="info-toggle-btn border border-black dark:border-white p-2 rounded-none text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors focus:outline-none cursor-pointer" title="Lihat Detail">
                        <i data-feather="info" class="w-3.5 h-3.5"></i>
                    </button>
                    <div class="card-toggle-trigger cursor-pointer select-none" data-id="${item.id}">
                        ${
                          isActive
                            ? `
                            <div class="px-2.5 h-8 bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white font-black text-[10px] tracking-wider transition-all duration-300 rounded-none shadow-sm flex items-center justify-center gap-1 min-w-[56px] hover:bg-neutral-900 dark:hover:bg-neutral-100">
                                <span class="w-1 h-1 bg-white dark:bg-black rounded-full inline-block animate-pulse"></span> ON
                            </div>
                        `
                            : `
                            <div class="px-2.5 h-8 bg-transparent text-neutral-400 dark:text-neutral-500 border border-neutral-300 dark:border-neutral-800 font-black text-[10px] tracking-wider transition-all duration-300 rounded-none flex items-center justify-center gap-1 min-w-[56px] hover:bg-neutral-50/50 dark:hover:bg-neutral-950/50 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white">
                                <span class="w-1 h-1 bg-neutral-300 dark:bg-neutral-750 rounded-full inline-block"></span> OFF
                            </div>
                        `
                        }
                    </div>
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
      const toggleSwitch = e.target.closest(".card-toggle-trigger");
      if (toggleSwitch) {
        e.preventDefault();
        state.activeBodies.has(item.id)
          ? state.activeBodies.delete(item.id)
          : state.activeBodies.add(item.id);
        renderBodies();
        updateMap();
        return;
      }

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

  const activeSubject =
    state.subjects.find((s) => s.id === state.selectedSubjectId) ||
    state.subjects[0];
  if (!activeSubject) return;

  const items = ENTITIES.filter((e) => e.type === "CELESTIAL");

  items.forEach((item) => {
    const isActive = state.activeBodies.has(item.id);
    const div = document.createElement("div");
    const borderHighlight =
      item.symbol === "CZ"
        ? "border-l-[4px] border-l-emerald-400 dark:border-l-emerald-500"
        : "border-l-[4px] border-l-rose-400 dark:border-l-rose-500";
    div.className = `w-full flex flex-col relative overflow-hidden border bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 ${borderHighlight} p-4 transition-colors hover:bg-neutral-100/55 dark:hover:bg-neutral-900/55 select-none cursor-pointer rounded-none animate-fade-in ${isActive ? "opacity-100" : "opacity-60"}`;
    div.id = `celestial-card-${item.id}`;

    const labelSubject = activeSubject.label || activeSubject.name || "Subject";
    const subLabelFull = `${item.subLabel}${labelSubject}`;

    div.innerHTML = `
            <div class="w-full flex items-center justify-between gap-3">
                <div class="flex items-center gap-4">
                    <div class="w-11 h-11 rounded-full border-2 ${item.symbol === "CZ" ? "bg-white text-slate-950 border-slate-950" : "bg-slate-950 dark:bg-white text-white dark:text-slate-950 border-white dark:border-slate-950"} font-extrabold font-mono text-xs shrink-0 select-none flex items-center justify-center shadow-md">
                        <span>${item.symbol}</span>
                    </div>
                    <div>
                        <h3 class="font-extrabold text-[11px] text-black dark:text-white leading-tight uppercase tracking-wider font-sans select-none">${item.label}</h3>
                        <p class="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium leading-none mt-1 select-none font-sans">${subLabelFull}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button class="info-toggle-btn border border-black dark:border-white p-2 rounded-none text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors focus:outline-none cursor-pointer" title="Lihat Detail">
                        <i data-feather="info" class="w-3.5 h-3.5"></i>
                    </button>
                    <div class="card-toggle-trigger cursor-pointer select-none" data-id="${item.id}">
                        ${
                          isActive
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
                    </div>
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
      const toggleSwitch = e.target.closest(".card-toggle-trigger");
      if (toggleSwitch) {
        e.preventDefault();
        state.activeBodies.has(item.id)
          ? state.activeBodies.delete(item.id)
          : state.activeBodies.add(item.id);
        renderBodies();
        updateMap();
        return;
      }

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
      div.className = `w-full flex flex-col relative overflow-hidden border bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 p-4 transition-colors hover:bg-neutral-100/35 dark:hover:bg-neutral-900/35 select-none rounded-none ${isActive ? "opacity-100" : "opacity-60"}`;
      div.id = `body-card-${b.id}`;
      div.innerHTML = `
                <div class="w-full flex items-center justify-between gap-3">
                    <div class="flex items-center gap-4">
                        <div class="w-11 h-11 rounded-full border-2 border-neutral-950 dark:border-white font-extrabold text-sm shrink-0 select-none flex items-center justify-center shadow-md text-white" style="background-color: ${b.color};">
                            <span>${b.symbol}</span>
                        </div>
                        <div>
                            <h3 class="font-extrabold text-[11px] text-black dark:text-white leading-tight uppercase tracking-wider font-sans select-none">${b.label}</h3>
                            <p class="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium leading-none mt-1 select-none font-sans">${b.subLabel}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button class="info-toggle-btn border border-black dark:border-white p-2 rounded-none text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors focus:outline-none cursor-pointer" title="Lihat Detail">
                            <i data-feather="info" class="w-3.5 h-3.5"></i>
                        </button>
                        <div class="card-toggle-trigger cursor-pointer select-none" data-id="${b.id}">
                            ${
                              isActive
                                ? `
                                <div class="px-2.5 h-8 bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white font-black text-[10px] tracking-wider transition-all duration-300 rounded-none shadow-sm flex items-center justify-center gap-1 min-w-[56px] hover:bg-neutral-900 dark:hover:bg-neutral-100">
                                    <span class="w-1.5 h-1.5 bg-white dark:bg-black rounded-full inline-block animate-pulse"></span> ON
                                </div>
                            `
                                : `
                                <div class="px-2.5 h-8 bg-transparent text-neutral-400 dark:text-neutral-500 border border-neutral-300 dark:border-neutral-800 font-black text-[10px] tracking-wider transition-all duration-300 rounded-none flex items-center justify-center gap-1 min-w-[56px] hover:bg-neutral-50/50 dark:hover:bg-neutral-950/50 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white">
                                    <span class="w-1.5 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full inline-block"></span> OFF
                                </div>
                            `
                            }
                        </div>
                    </div>
                </div>
                <div class="body-info w-full mt-3.5 pt-3.5 border-t border-black dark:border-white space-y-3 text-[11px] text-black dark:text-white hidden animate-fade-in font-sans">
                    <div class="space-y-1.5" id="stats-${b.id}">
                        <div class="font-mono text-[10px] text-neutral-400">Loading ephemeris...</div>
                    </div>
                </div>
            `;

      div.addEventListener("click", (e) => {
        const toggleSwitch = e.target.closest(".card-toggle-trigger");
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
  if (
    typeof updateAspectMatrices === "function" &&
    state.mapMode === "MATRIX"
  ) {
    updateAspectMatrices();
  }
}

function updateTimeUI() {
  const { DateTime } = window.luxon || {};
  const banner = document.getElementById("simulation-banner");
  if (!banner) return;

  // Determine current active subject
  const currentSubject =
    state.subjects.find((s) => s.id === state.selectedSubjectId) ||
    state.subjects[0];
  const activeTz = currentSubject.timezone || "UTC";
  const activeTzLabel = `${currentSubject.label || "Subject"} (${activeTz})`;

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
  const latDir = currentSubject.lat >= 0 ? "LU" : "LS";
  const lngDir = currentSubject.lng >= 0 ? "BT" : "BB";
  const latStr = Math.abs(currentSubject.lat).toFixed(4) + "° " + latDir;
  const lngStr = Math.abs(currentSubject.lng).toFixed(4) + "° " + lngDir;

  // Playback speed label
  let speedLabel = "Jeda";
  if (state.isPlaying) {
    const directionWord =
      state.playDirection === "BACKWARD" ? "MUNDUR" : "MAJU";
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
            <div class="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-[11px] border-b border-black dark:border-white bg-[#fafafa] dark:bg-neutral-950">
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
                <!-- Panel Kiri: Subject / Lokasi -->
                <div class="space-y-3.5 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 pb-6 md:pb-0 md:pr-6 flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-center select-none mb-2">
                            <label class="text-[10px] font-black text-black dark:text-white uppercase tracking-[0.2em] font-sans flex items-center gap-1.5">
                                <i data-feather="user" class="w-3.5 h-3.5"></i> PILIH SUBJECT / LOKASI
                            </label>
                        </div>
                        
                        <div class="flex flex-col sm:flex-row gap-2">
                            <!-- Dropdown Selector of Subjects -->
                            <select id="sim-subject-select" class="flex-1 bg-white dark:bg-black border border-black dark:border-white px-3 py-2 text-xs font-bold tracking-wide font-sans text-black dark:text-white uppercase focus:outline-none cursor-pointer rounded-none border-solid transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900 font-bold">
                                ${state.subjects
                                  .map(
                                    (s) => `
                                    <option value="${s.id}" ${state.selectedSubjectId === s.id ? "selected" : ""}>
                                        ${s.label} — ${s.name.split(",")[0]}
                                    </option>
                                `,
                                  )
                                  .join("")}
                            </select>
                            
                            <!-- Action Buttons: Tambah / Ubah / Hapus Subject -->
                            <div class="flex gap-1.5 shrink-0">
                                <button id="sim-add-subject-btn" class="px-3 py-2 bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all font-bold text-xs uppercase tracking-wider rounded-none flex items-center gap-1" title="Tambah Subject Baru">
                                    <i data-feather="plus" class="w-3 h-3"></i> <span class="hidden sm:inline">TAMBAH</span>
                                </button>
                                <button id="sim-edit-subject-btn" class="px-3 py-2 bg-white dark:bg-black text-black dark:text-white border border-black dark:border-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all font-bold text-xs uppercase tracking-wider rounded-none flex items-center gap-1" title="Ubah Subject Aktif">
                                    <i data-feather="edit-2" class="w-3 h-3"></i> <span class="hidden sm:inline">UBAH</span>
                                </button>
                                ${
                                  state.subjects.length > 1
                                    ? `
                                <button id="sim-delete-subject-btn" class="px-2.5 py-2 text-neutral-400 hover:text-red-500 dark:hover:text-red-400 border border-neutral-200 dark:border-neutral-800 hover:border-red-500 dark:hover:border-red-500 transition-all rounded-none flex items-center justify-center cursor-pointer" title="Hapus Subject Aktif">
                                    <i data-feather="trash-2" class="w-3.5 h-3.5"></i>
                                </button>
                                `
                                    : ""
                                }
                            </div>
                        </div>
                    </div>

                    <!-- Current Subject Coordinate/Elevation details badge -->
                    <div id="sim-subject-details" class="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 bg-[#f5f5f5]/75 dark:bg-neutral-900/40 p-2.5 border border-neutral-200 dark:border-neutral-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 select-none mt-3 w-full">
                        <span class="font-bold break-all sm:break-normal max-w-full block" id="sim-subject-loc-span">📍 ${currentSubject.name || "Koordinat"} (${latStr}, ${lngStr})</span>
                        ${currentSubject.elevation !== undefined ? `<span class="font-extrabold text-black dark:text-white mt-1 sm:mt-0 shrink-0" id="sim-subject-elev-span">ELEVA: ${currentSubject.elevation}M</span>` : ""}
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
                                    <button id="sim-source-manual" class="h-9 text-[10px] font-extrabold uppercase tracking-wider border rounded-none transition-all flex items-center justify-center gap-1 cursor-pointer ${state.timeSourceMode === "MANUAL" ? "bg-black dark:bg-white text-white dark:text-black border-transparent" : "bg-transparent border-black dark:border-white text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900"}" title="Manual Subject Clock">
                                        <i data-feather="user" class="w-3.5 h-3.5"></i> MANUAL (SUBJECT)
                                    </button>
                                    <button id="sim-source-realtime" class="h-9 text-[10px] font-extrabold uppercase tracking-wider border rounded-none transition-all flex items-center justify-center gap-1 cursor-pointer ${state.timeSourceMode === "REAL-TIME" ? "bg-black dark:bg-white text-white dark:text-black border-transparent" : "bg-transparent border-black dark:border-white text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900"}" title="Real-time World Clock">
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

    // Subject Selection
    const subjectSelect = document.getElementById("sim-subject-select");
    subjectSelect?.addEventListener("change", (e) => {
      state.selectedSubjectId = e.target.value;
      const selectedS = state.subjects.find(
        (s) => s.id === state.selectedSubjectId,
      );
      if (selectedS) {
        if (state.timeMachineEnabled) {
          if (state.timeSourceMode === "MANUAL") {
            state.customDate = getSubjectAnchorTime(selectedS);
          }
        } else {
          state.customDate = new Date();
        }
      }
      document.getElementById("sim-banner-wrapper")?.remove();
      renderBodies();
      updateMap();
      updateTimeUI();
    });

    // Add Subject Action
    const addSubjectBtn = document.getElementById("sim-add-subject-btn");
    addSubjectBtn?.addEventListener("click", () => {
      showSubjectModal();
    });

    // Edit Subject Action
    const editSubjectBtn = document.getElementById("sim-edit-subject-btn");
    editSubjectBtn?.addEventListener("click", () => {
      showSubjectModal(state.selectedSubjectId);
    });

    // Delete Subject Action
    const deleteSubjectBtn = document.getElementById("sim-delete-subject-btn");
    deleteSubjectBtn?.addEventListener("click", () => {
      if (state.subjects.length <= 1) return;
      state.subjects = state.subjects.filter(
        (s) => s.id !== state.selectedSubjectId,
      );
      const fallbackS = state.subjects[0];
      state.selectedSubjectId = fallbackS.id;

      if (state.timeMachineEnabled) {
        if (state.timeSourceMode === "MANUAL") {
          state.customDate = getSubjectAnchorTime(fallbackS);
        }
      } else {
        state.customDate = new Date();
      }
      document.getElementById("sim-banner-wrapper")?.remove();
      renderBodies();
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
        const activeS =
          state.subjects.find((s) => s.id === state.selectedSubjectId) ||
          state.subjects[0];
        state.customDate = getSubjectAnchorTime(activeS);
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
      const activeS =
        state.subjects.find((s) => s.id === state.selectedSubjectId) ||
        state.subjects[0];
      state.customDate = getSubjectAnchorTime(activeS);

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
        const activeS =
          state.subjects.find((s) => s.id === state.selectedSubjectId) ||
          state.subjects[0];
        state.customDate = getSubjectAnchorTime(activeS);
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
        const activeS =
          state.subjects.find((s) => s.id === state.selectedSubjectId) ||
          state.subjects[0];
        const zone = activeS.timezone || "UTC";
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

    // Subject select dropdown
    const subjectSelect = document.getElementById("sim-subject-select");
    if (subjectSelect && document.activeElement !== subjectSelect) {
      if (subjectSelect.value !== state.selectedSubjectId) {
        subjectSelect.value = state.selectedSubjectId;
      }
    }

    // Location & elevation details
    const locSpan = document.getElementById("sim-subject-loc-span");
    const elevSpan = document.getElementById("sim-subject-elev-span");
    if (locSpan)
      locSpan.innerText = `📍 ${currentSubject.name || "Koordinat"} (${latStr}, ${lngStr})`;
    if (elevSpan && currentSubject.elevation !== undefined) {
      elevSpan.innerText = `ELEVA: ${currentSubject.elevation}M`;
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

          if (typeof gameLoop === "function") {
            gameLoop();
          } else {
            updateTimeUI();
            updateMap();
          }
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
          if (typeof gameLoop === "function") {
            gameLoop();
          } else {
            updateTimeUI();
            updateMap();
          }
        });

      document
        .getElementById("banner-step-forward")
        ?.addEventListener("click", () => {
          state.customDate = new Date(
            state.customDate.getTime() + state.speed * 1000,
          );
          if (typeof gameLoop === "function") {
            gameLoop();
          } else {
            updateTimeUI();
            updateMap();
          }
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

  updateSubjectTimeBadges();
}

function updateSubjectTimeBadges() {
  if (state.currentTab !== "location") return;
  const { DateTime } = window.luxon || {};
  if (!DateTime) return;
  state.subjects.forEach((s) => {
    const badge = document.getElementById(`s-time-badge-${s.id}`);
    if (badge && s.timezone) {
      try {
        const dt = DateTime.fromJSDate(state.customDate).setZone(s.timezone);
        const offsetInMinutes = dt.offset;
        const hours = Math.floor(Math.abs(offsetInMinutes) / 60);
        const mins = Math.abs(offsetInMinutes) % 60;
        const sign = offsetInMinutes >= 0 ? "+" : "-";
        const offsetStr =
          mins === 0
            ? `${sign}${hours}`
            : `${sign}${hours}:${mins.toString().padStart(2, "0")}`;
        const localStr =
          dt.toFormat("HH:mm:ss") + " [" + offsetStr + "] (" + s.timezone + ")";
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

function predictConjunction(bodyStr, startFromDate, activeSubject, isZenith) {
  if (!activeSubject) return null;

  // Clean, high-performance daily cache key
  const dayTimestamp = Date.UTC(
    startFromDate.getUTCFullYear(),
    startFromDate.getUTCMonth(),
    startFromDate.getUTCDate()
  );
  const cacheKey = `${bodyStr}_${dayTimestamp}_${activeSubject.id}_${isZenith}`;
  if (conjunctionCache[cacheKey]) {
    return conjunctionCache[cacheKey];
  }

  const targetLat = isZenith ? activeSubject.lat : -activeSubject.lat;

  const startMs = startFromDate.getTime();

  // We look forward 366 days.
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
    // Fallback if no exact crossing is found (e.g. body declination doesn't reach subject lat)
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
        ? getBodyStats(bodyStr, testDate, activeSubject)
        : null;
    if (stats) {
      const ha = stats.hourAngle; // -180 to 180
      const targetHA = isZenith ? 0 : ha >= 0 ? 180 : -180;
      let diff = Math.abs(ha - targetHA);
      if (diff > 180) diff = 360 - diff; // normalize

      if (diff < minDiffH) {
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
        ? getBodyStats(bodyStr, testDate, activeSubject)
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
    const nextResult = predictConjunction(
      bodyStr,
      new Date(startMs + 24 * 3600 * 1000),
      activeSubject,
      isZenith,
    );
    conjunctionCache[cacheKey] = nextResult;
    return nextResult;
  }

  conjunctionCache[cacheKey] = finalDate;
  return finalDate;
}

let bodyStatsUpdateTick = 0;

function updateBodyStats() {
  const activeSubject =
    state.subjects.find((s) => s.id === state.selectedSubjectId) ||
    state.subjects[0];
  const reqConfig = { zodiac: state.zodiacConfig, coord: state.coordConfig };

  // Skip intensive text card DOM updates during rapid playback to maximize FPS and prevent layout thrashing
  const isFastPlayback = state.timeMachineEnabled && state.isPlaying;
  if (isFastPlayback) {
    bodyStatsUpdateTick++;
    if (bodyStatsUpdateTick % 5 !== 0) {
      if (typeof updateSubjectStats === "function") {
        updateSubjectStats();
      }
      return;
    }
  }

  BODIES.forEach((b) => {
    const infoDiv = document.querySelector(`#body-card-${b.id} .body-info`);
    if (infoDiv && !infoDiv.classList.contains("hidden")) {
      const stats =
        typeof getBodyStats === "function"
          ? getBodyStats(b.id, state.customDate, activeSubject, reqConfig)
          : null;
      if (stats) {
        const statsContainer = document.getElementById(`stats-${b.id}`);
        if (statsContainer) {
          statsContainer.innerHTML = generateStatsTableHTML(stats, true, b.id);
        }
      }
    }
  });

  if (typeof updateSubjectStats === "function") {
    updateSubjectStats();
  }

  if (typeof updateIndicators === "function") {
    updateIndicators();
  }
}

/**
 * Renders the list of aspects inside column 2 (Identity Aspects).
 */
function renderAspectsConfig() {
  const listContainer = document.getElementById("aspects-list-container");
  if (!listContainer) return;

  const aspects = getAspectsList();
  if (aspects.length === 0) {
    listContainer.innerHTML = `
      <div class="border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/15 p-6 text-center select-none rounded-none">
        <p class="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono uppercase tracking-wider mb-1">No Aspects Profiles</p>
        <p class="text-[11px] text-neutral-400 dark:text-neutral-500 font-sans">Click + ADD ASPECT to configure a custom geometry.</p>
      </div>
    `;
    return;
  }

  let html = "";
  aspects.forEach((aspect) => {
    html +=
      typeof generateAspectCardHTML === "function"
        ? generateAspectCardHTML(aspect)
        : "";
  });

  listContainer.innerHTML = html;

  // Replace Feather Icons in this new HTML
  if (window.feather) window.feather.replace();

  // Wire up events dynamically
  listContainer.querySelectorAll(".aspect-toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const aspectsList = getAspectsList();
      const found = aspectsList.find((a) => a.id === id);
      if (found) {
        found.enabled = !found.enabled;
        saveAspectsList(aspectsList);
        renderAspectsConfig();

        // Trigger global updates for aspects matrices & map representations
        if (typeof renderAspectMatrices === "function") renderAspectMatrices();
        if (typeof updateMap === "function") updateMap();
      }
    });
  });

  listContainer.querySelectorAll(".aspect-edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const aspectsList = getAspectsList();
      const found = aspectsList.find((a) => a.id === id);
      if (found) {
        const formPanel = document.getElementById("add-aspect-form-panel");
        const form = document.getElementById("add-aspect-form");

        // Populate the form with the aspect data
        document.getElementById("new-aspect-id").value = found.id;
        document.getElementById("new-aspect-name").value = found.name;
        document.getElementById("new-aspect-angle").value = found.angle;
        document.getElementById("new-aspect-orb").value = found.orb;
        document.getElementById("new-aspect-symbol").value = found.symbol;
        document.getElementById("new-aspect-color").value = found.color;
        document.getElementById("new-aspect-sentiment").value =
          found.sentiment || "";
        document.getElementById("new-aspect-score").value =
          found.score !== undefined ? found.score : "";

        // Disable ID field for editing (or set a data attribute for tracking)
        form.dataset.editId = found.id;

        const titleEl = formPanel.querySelector("h3");
        if (titleEl) titleEl.innerText = "Edit Aspect Profile";
        const saveBtn = document.getElementById("save-aspect-btn");
        if (saveBtn) saveBtn.innerText = "Update Profile";

        // Show panel
        formPanel.classList.remove("hidden");
        // Scroll to form if needed
        formPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  });

  listContainer.querySelectorAll(".aspect-delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      let aspectsList = getAspectsList();
      aspectsList = aspectsList.filter((a) => a.id !== id);
      saveAspectsList(aspectsList);
      renderAspectsConfig();

      // Trigger global updates
      if (typeof renderAspectMatrices === "function") renderAspectMatrices();
      if (typeof updateMap === "function") updateMap();
    });
  });
}

/**
 * Initializes listeners for adding aspects & panel visibility toggling.
 */
function initAspectsConfig() {
  const addBtn = document.getElementById("add-aspect-btn");
  const cancelBtn = document.getElementById("cancel-aspect-btn");
  const formPanel = document.getElementById("add-aspect-form-panel");
  const form = document.getElementById("add-aspect-form");
  const saveBtn = document.getElementById("save-aspect-btn");



  // Redesigned HEX Color Picker Controls Sync
  const colorInput = document.getElementById("new-aspect-color");
  const colorPicker = document.getElementById("new-aspect-color-picker");
  const swatch = document.getElementById("color-preview-swatch");
  if (colorInput && colorPicker && swatch) {
    const updateColorUI = (val) => {
      let hex = val.toUpperCase();
      if (hex && !hex.startsWith("#")) {
        hex = "#" + hex;
      }
      if (/^#[0-9A-F]{6}$/i.test(hex)) {
        swatch.style.backgroundColor = hex;
        colorPicker.value = hex.toLowerCase();
      }
    };

    colorInput.addEventListener("input", (e) => {
      let val = e.target.value;
      if (val && !val.startsWith("#")) {
        val = "#" + val;
        e.target.value = val;
      }
      updateColorUI(val);
    });

    colorPicker.addEventListener("input", (e) => {
      colorInput.value = e.target.value.toUpperCase();
    });

    const descriptorColor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
    Object.defineProperty(colorInput, "value", {
      get() {
        return descriptorColor.get.call(this);
      },
      set(val) {
        descriptorColor.set.call(this, val);
        updateColorUI(val);
      },
      configurable: true
    });

    if (form) {
      form.addEventListener("reset", () => {
        setTimeout(() => {
          updateColorUI("#06B6D4");
        }, 0);
      });
    }

    // Initial sync
    updateColorUI(colorInput.value || "#06B6D4");
  }

  if (addBtn && formPanel) {
    addBtn.addEventListener("click", () => {
      if (!formPanel.classList.contains("hidden")) {
        formPanel.classList.add("hidden");
      } else {
        form.reset();
        delete form.dataset.editId;
        const titleEl = formPanel.querySelector("h3");
        if (titleEl) titleEl.innerText = "New Aspect Profile";
        if (saveBtn) saveBtn.innerText = "Save Profile";
        formPanel.classList.remove("hidden");
      }
    });
  }

  if (cancelBtn && formPanel) {
    cancelBtn.addEventListener("click", () => {
      formPanel.classList.add("hidden");
      form.reset();
      delete form.dataset.editId;
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const idInput = document.getElementById("new-aspect-id");
      const nameInput = document.getElementById("new-aspect-name");
      const angleInput = document.getElementById("new-aspect-angle");
      const orbInput = document.getElementById("new-aspect-orb");
      const symbolInput = document.getElementById("new-aspect-symbol");
      const colorInput = document.getElementById("new-aspect-color");
      const sentimentInput = document.getElementById("new-aspect-sentiment");
      const scoreInput = document.getElementById("new-aspect-score");

      const id = idInput.value.trim().toUpperCase();
      const name = nameInput.value.trim();
      const angle = parseFloat(angleInput.value);
      const orb = parseFloat(orbInput.value);
      const symbol = symbolInput.value.trim();
      const color = colorInput.value;
      const sentiment = sentimentInput.value;
      const score =
        scoreInput.value !== "" ? parseFloat(scoreInput.value) : undefined;

      // Validation
      if (!id || !name || isNaN(angle) || isNaN(orb) || !symbol) {
        alert("Mohon isi seluruh kolom input dengan valid!");
        return;
      }

      if (angle < 0 || angle > 185) {
        alert("Sudut aspek harus berada di antara 0 dan 185 derajat!");
        return;
      }

      if (orb <= 0 || orb > 15) {
        alert("Batas toleransi Orb harus di antara 0.1° dan 15°!");
        return;
      }

      const aspectsList = getAspectsList();
      const editingId = form.dataset.editId;

      if (editingId) {
        // Edit mode
        const existingIndex = aspectsList.findIndex((a) => a.id === editingId);
        if (existingIndex !== -1) {
          // Allow changing ID if the new ID doesn't conflict with *another* aspect
          if (id !== editingId && aspectsList.some((a) => a.id === id)) {
            alert(
              `ID Aspek '${id}' sudah terdaftar! Harap gunakan ID identik yang unik.`,
            );
            return;
          }

          aspectsList[existingIndex] = {
            ...aspectsList[existingIndex],
            id: id,
            name: name,
            angle: angle,
            symbol: symbol,
            color: color,
            orb: orb,
            sentiment: sentiment,
            score: score,
          };
        }
      } else {
        // Add mode
        const exists = aspectsList.some((a) => a.id === id);
        if (exists) {
          alert(
            `ID Aspek '${id}' sudah terdaftar! Harap gunakan ID identik yang unik.`,
          );
          return;
        }

        const newAspect = {
          id: id,
          name: name,
          angle: angle,
          symbol: symbol,
          color: color,
          orb: orb,
          sentiment: sentiment,
          score: score,
          enabled: true,
          isCore: false,
        };

        aspectsList.push(newAspect);
      }

      saveAspectsList(aspectsList);

      // Clear and hide
      form.reset();
      delete form.dataset.editId;
      formPanel.classList.add("hidden");

      // Rerender and sync
      renderAspectsConfig();

      if (typeof renderAspectMatrices === "function") renderAspectMatrices();
      if (typeof updateMap === "function") updateMap();
    });
  }

  // Initial Render
  renderAspectsConfig();

  // Initialize Horizon configuration controls
  initHorizonConfig();

  // Initialize Anomalies configuration controls
  if (typeof initAnomaliesConfig === "function") {
    initAnomaliesConfig();
  }
}

/**
 * Initializes controls for manual input of horizon limit and hysteresis margin.
 */
function initHorizonConfig() {
  const thresholdInput = document.getElementById("horizon-threshold-input");
  const hysteresisInput = document.getElementById("horizon-hysteresis-input");

  if (!thresholdInput || !hysteresisInput) return;

  // Set initial inputs from global state (which load from localStorage)
  thresholdInput.value = state.horizonThreshold !== undefined ? state.horizonThreshold : 0.0;
  hysteresisInput.value = state.horizonHysteresis !== undefined ? state.horizonHysteresis : 0.0;

  // Listener helper for changes
  const handleHorizonChange = () => {
    let tVal = parseFloat(thresholdInput.value);
    let hVal = parseFloat(hysteresisInput.value);

    // Guard NaN
    if (isNaN(tVal)) tVal = 0.0;
    if (isNaN(hVal)) hVal = 0.0;

    // Boundaries check
    if (tVal < -90) tVal = -90;
    if (tVal > 90) tVal = 90;
    if (hVal < 0) hVal = 0.0;
    if (hVal > 10) hVal = 10.0;

    // Update global state
    state.horizonThreshold = tVal;
    state.horizonHysteresis = hVal;

    // Save to localStorage
    localStorage.setItem("horizon_threshold", tVal.toString());
    localStorage.setItem("horizon_hysteresis", hVal.toString());

    // Reset the cached state map in js/identity.js for immediate effect
    if (typeof window.resetHorizonStateCache === "function") {
      window.resetHorizonStateCache();
    }

    // Refresh UI elements
    if (typeof updateMap === "function") updateMap();
    if (typeof renderAspectMatrices === "function") renderAspectMatrices();
    if (typeof updateBodyStats === "function") updateBodyStats();
  };

  thresholdInput.addEventListener("input", handleHorizonChange);
  hysteresisInput.addEventListener("input", handleHorizonChange);
}

/**
 * Renders the list of customizable Anomalies inside column 2 (Identity Anomalies).
 */
function renderAnomaliesConfig() {
  const angleContainer = document.getElementById("anomalies-angle-list-container");
  const aspectContainer = document.getElementById("anomalies-aspect-list-container");
  if (!angleContainer || !aspectContainer) return;

  const anomalies = (typeof getAnomaliesList === "function") ? getAnomaliesList() : [];
  
  let angleHtml = "";
  let aspectHtml = "";

  anomalies.forEach((anomaly) => {
    const html = (typeof generateAnomalyCardHTML === "function") ? generateAnomalyCardHTML(anomaly) : "";
    if (anomaly.category === "ANGLE") {
      angleHtml += html;
    } else {
      aspectHtml += html;
    }
  });

  angleContainer.innerHTML = angleHtml || `
    <div class="border border-dashed border-neutral-300 dark:border-neutral-800 p-4 text-center text-neutral-400 dark:text-neutral-500 font-mono text-[9px] uppercase">
      No Angle Anomalies
    </div>
  `;

  aspectContainer.innerHTML = aspectHtml || `
    <div class="border border-dashed border-neutral-300 dark:border-neutral-800 p-4 text-center text-neutral-400 dark:text-neutral-500 font-mono text-[9px] uppercase">
      No Aspect Anomalies
    </div>
  `;

  // Replace Feather Icons in this new HTML
  if (window.feather) window.feather.replace();

  // Wire up Edit button handlers
  document.querySelectorAll(".anomaly-edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-key");
      const list = (typeof getAnomaliesList === "function") ? getAnomaliesList() : [];
      const found = list.find((a) => a.key === key);
      if (found) {
        const formPanel = document.getElementById("anomaly-edit-panel");
        const form = document.getElementById("anomaly-edit-form");

        // Populate fields
        document.getElementById("anomaly-edit-key").value = found.key;
        document.getElementById("anomaly-edit-id").value = found.id;
        document.getElementById("anomaly-edit-name").value = found.name;
        document.getElementById("anomaly-edit-orb").value = found.orb;
        document.getElementById("anomaly-edit-symbol").value = found.symbol;
        document.getElementById("anomaly-edit-sentiment").value = found.sentiment || "[=]";
        document.getElementById("anomaly-edit-score").value = found.score !== undefined ? found.score : "";
        document.getElementById("anomaly-edit-color").value = found.color;

        // Custom Swatch Preview update
        const swatch = document.getElementById("anomaly-color-preview-swatch");
        const colorPicker = document.getElementById("anomaly-edit-color-picker");
        if (swatch && colorPicker) {
          swatch.style.backgroundColor = found.color;
          colorPicker.value = found.color.toLowerCase();
        }

        // Title text config
        const titleEl = document.getElementById("anomaly-edit-title");
        if (titleEl) titleEl.innerText = `Edit Profile Anomali: ${found.key}`;

        // Show panel
        formPanel.classList.remove("hidden");
        formPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  });

  // Wire up Toggle button handlers
  document.querySelectorAll(".anomaly-toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-key");
      const list = (typeof getAnomaliesList === "function") ? getAnomaliesList() : [];
      const foundIdx = list.findIndex((a) => a.key === key);
      if (foundIdx !== -1) {
        list[foundIdx].enabled = (list[foundIdx].enabled !== false) ? false : true;
        if (typeof saveAnomaliesList === "function") {
          saveAnomaliesList(list);
        }
        renderAnomaliesConfig();
        // Trigger updates
        if (typeof updateIndicators === "function") {
          updateIndicators();
        }
        if (typeof renderAspectMatrices === "function") {
          renderAspectMatrices();
        }
        if (typeof updateMap === "function") {
          updateMap();
        }
        if (typeof updateBodyStats === "function") {
          updateBodyStats();
        }
      }
    });
  });
}

/**
 * Initializes form submission listeners, reset buttons, and sync for dynamic Anomalies configuration.
 */
function initAnomaliesConfig() {
  const formPanel = document.getElementById("anomaly-edit-panel");
  const form = document.getElementById("anomaly-edit-form");
  const cancelBtn = document.getElementById("anomaly-cancel-btn");
  const updateBtn = document.getElementById("anomaly-update-btn");

  if (!formPanel || !form) return;

  // HEX Color Picker Sync Controls
  const colorInput = document.getElementById("anomaly-edit-color");
  const colorPicker = document.getElementById("anomaly-edit-color-picker");
  const swatch = document.getElementById("anomaly-color-preview-swatch");
  
  if (colorInput && colorPicker && swatch) {
    const updateAnomalyColorUI = (val) => {
      let hex = val.toUpperCase();
      if (hex && !hex.startsWith("#")) {
        hex = "#" + hex;
      }
      if (/^#[0-9A-F]{6}$/i.test(hex)) {
        swatch.style.backgroundColor = hex;
        colorPicker.value = hex.toLowerCase();
      }
    };

    colorInput.addEventListener("input", (e) => {
      let val = e.target.value;
      if (val && !val.startsWith("#")) {
        val = "#" + val;
        e.target.value = val;
      }
      updateAnomalyColorUI(val);
    });

    colorPicker.addEventListener("input", (e) => {
      const val = e.target.value.toUpperCase();
      colorInput.value = val;
      swatch.style.backgroundColor = val;
    });
  }

  // Cancel Handler
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      form.reset();
      formPanel.classList.add("hidden");
    });
  }

  // Update Handler
  if (updateBtn) {
    updateBtn.addEventListener("click", () => {
      const key = document.getElementById("anomaly-edit-key").value;
      if (!key) return;

      const list = (typeof getAnomaliesList === "function") ? getAnomaliesList() : [];
      const existingIdx = list.findIndex((a) => a.key === key);
      if (existingIdx === -1) return;

      const id = document.getElementById("anomaly-edit-id").value.trim().toUpperCase();
      const name = document.getElementById("anomaly-edit-name").value.trim();
      const orb = parseFloat(document.getElementById("anomaly-edit-orb").value);
      const symbol = document.getElementById("anomaly-edit-symbol").value.trim();
      const sentiment = document.getElementById("anomaly-edit-sentiment").value;
      const score = parseFloat(document.getElementById("anomaly-edit-score").value || "0");
      const color = document.getElementById("anomaly-edit-color").value.trim().toUpperCase();

      if (!id || !name || isNaN(orb) || !symbol || !color) {
        alert("Mohon isi semua field wajib dengan benar!");
        return;
      }

      list[existingIdx] = {
        ...list[existingIdx],
        id,
        name,
        orb,
        symbol,
        sentiment,
        score,
        color
      };

      if (typeof saveAnomaliesList === "function") {
        saveAnomaliesList(list);
      }

      // Reset and hide form
      form.reset();
      formPanel.classList.add("hidden");

      // Reload config & trigger calculations
      renderAnomaliesConfig();
      if (typeof updateIndicators === "function") updateIndicators();
      else if (typeof updateAnomalies === "function") updateAnomalies();
      
      if (typeof renderAspectMatrices === "function") renderAspectMatrices();
      if (typeof updateMap === "function") updateMap();
    });
  }

  // Initial render of Anomalies lists
  renderAnomaliesConfig();
}

// getAnomalyEntityBadge has been migrated to indicator.js

/**
 * Calculates and renders all six categories of celestial anomalies for a specific matrix type
 */
function calculateAnomaliesForMatrix(matrixType, badgeElementId, listElementId) {
  // Redirect to new indicators module
  const mapBadge = {
    "anomaly-badge-general": "indicator-badge-general",
    "anomaly-badge-zenith": "indicator-badge-zenith",
    "anomaly-badge-nadir": "indicator-badge-nadir"
  };
  const mapList = {
    "anomaly-list-general": "indicator-list-general",
    "anomaly-list-zenith": "indicator-list-zenith",
    "anomaly-list-nadir": "indicator-list-nadir"
  };
  const newBadgeId = mapBadge[badgeElementId] || badgeElementId;
  const newListId = mapList[listElementId] || listElementId;
  if (typeof calculateIndicatorsForMatrix === "function") {
    calculateIndicatorsForMatrix(matrixType, newBadgeId, newListId);
    return;
  }

  const listEl = document.getElementById(listElementId);
  const badgeEl = document.getElementById(badgeElementId);

  if (!listEl) return;

  const activeEntities = ENTITIES.filter((item) => state.activeBodies.has(item.id));
  if (activeEntities.length < 2) {
    listEl.innerHTML = `
      <div class="w-full text-center py-6 text-neutral-400 dark:text-neutral-500 font-sans text-[11px] border border-dashed border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-950/20">
        Pilih minimal 2 benda aktif untuk kalkulasi anomali.
      </div>
    `;
    if (badgeEl) {
      badgeEl.innerText = "0 DETECTED";
      badgeEl.className = "font-mono text-[9px] px-2 py-0.5 rounded-none bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest leading-none";
    }
    return;
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
        console.error("Error creating identity for anomaly calculations:", e);
      }
    }
  }

  function findSharedEntity(id1, id2) {
    const set1 = new Set([id1.entityA.id, id1.entityB.id]);
    if (set1.has(id2.entityA.id)) return id2.entityA;
    if (set1.has(id2.entityB.id)) return id2.entityB;
    return null;
  }

  // A1: Same standard decimal integer degree (disjoint)
  const a1Anomalies = [];
  const hashA1 = new Set();
  for (let i = 0; i < identitiesList.length; i++) {
    const id1 = identitiesList[i];
    const rounded1 = Math.round(id1.theta);
    for (let j = i + 1; j < identitiesList.length; j++) {
      const id2 = identitiesList[j];
      const rounded2 = Math.round(id2.theta);
      if (rounded1 === rounded2) {
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
            a1Anomalies.push({ id1, id2, deg: rounded1 });
          }
        }
      }
    }
  }

  // A2: Anchored same integer degree (exactly 1 shared element)
  const a2Anomalies = [];
  const hashA2 = new Set();
  for (let i = 0; i < identitiesList.length; i++) {
    const id1 = identitiesList[i];
    const rounded1 = Math.round(id1.theta);
    for (let j = i + 1; j < identitiesList.length; j++) {
      const id2 = identitiesList[j];
      const rounded2 = Math.round(id2.theta);
      if (rounded1 === rounded2) {
        const anchor = findSharedEntity(id1, id2);
        if (anchor) {
          const sortedAll = [id1.entityA.id, id1.entityB.id, id2.entityA.id, id2.entityB.id].sort().join('-');
          const key = `${sortedAll}@anchor:${anchor.id}`;
          if (!hashA2.has(key)) {
            hashA2.add(key);
            const other1 = id1.entityA.id === anchor.id ? id1.entityB : id1.entityA;
            const other2 = id2.entityA.id === anchor.id ? id2.entityB : id2.entityA;
            a2Anomalies.push({ id1, id2, anchor, other1, other2, deg: rounded1 });
          }
        }
      }
    }
  }

  // A3: Disjoint, same official aspect
  const a3Anomalies = [];
  const hashA3 = new Set();
  for (let i = 0; i < identitiesList.length; i++) {
    const id1 = identitiesList[i];
    if (!id1.aspect) continue;
    for (let j = i + 1; j < identitiesList.length; j++) {
      const id2 = identitiesList[j];
      if (!id2.aspect) continue;
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
            a3Anomalies.push({ id1, id2, aspect: id1.aspect });
          }
        }
      }
    }
  }

  // A4: Anchored, different official aspects
  const a4Anomalies = [];
  const hashA4 = new Set();
  for (let i = 0; i < identitiesList.length; i++) {
    const id1 = identitiesList[i];
    if (!id1.aspect) continue;
    for (let j = i + 1; j < identitiesList.length; j++) {
      const id2 = identitiesList[j];
      if (!id2.aspect) continue;
      if (id1.aspect.id !== id2.aspect.id) {
        const anchor = findSharedEntity(id1, id2);
        if (anchor) {
          const sortedAll = [id1.entityA.id, id1.entityB.id, id2.entityA.id, id2.entityB.id].sort().join('-');
          const key = `${sortedAll}@anchor:${anchor.id}`;
          if (!hashA4.has(key)) {
            hashA4.add(key);
            const other1 = id1.entityA.id === anchor.id ? id1.entityB : id1.entityA;
            const other2 = id2.entityA.id === anchor.id ? id2.entityB : id2.entityA;
            a4Anomalies.push({ id1, id2, anchor, other1, other2, aspect1: id1.aspect, aspect2: id2.aspect });
          }
        }
      }
    }
  }

  // A5: Anchored, same official aspect
  const a5Anomalies = [];
  const hashA5 = new Set();
  for (let i = 0; i < identitiesList.length; i++) {
    const id1 = identitiesList[i];
    if (!id1.aspect) continue;
    for (let j = i + 1; j < identitiesList.length; j++) {
      const id2 = identitiesList[j];
      if (!id2.aspect) continue;
      if (id1.aspect.id === id2.aspect.id) {
        const anchor = findSharedEntity(id1, id2);
        if (anchor) {
          const sortedAll = [id1.entityA.id, id1.entityB.id, id2.entityA.id, id2.entityB.id].sort().join('-');
          const key = `${sortedAll}@anchor:${anchor.id}@aspect:${id1.aspect.id}`;
          if (!hashA5.has(key)) {
            hashA5.add(key);
            const other1 = id1.entityA.id === anchor.id ? id1.entityB : id1.entityA;
            const other2 = id2.entityA.id === anchor.id ? id2.entityB : id2.entityA;
            a5Anomalies.push({ id1, id2, anchor, other1, other2, aspect: id1.aspect });
          }
        }
      }
    }
  }

  // A6: Three-body triangular cycle of same aspects
  const a6Anomalies = [];
  const hashA6 = new Set();
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
          if (idenAB.aspect.id === idenBC.aspect.id && idenBC.aspect.id === idenAC.aspect.id) {
            const key = [bodyA.id, bodyB.id, bodyC.id].sort().join('-') + `@aspect:${idenAB.aspect.id}`;
            if (!hashA6.has(key)) {
              hashA6.add(key);
              a6Anomalies.push({
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

  // A0: Single Identity forming an official aspect
  const a0Anomalies = [];
  identitiesList.forEach((iden) => {
    if (iden.aspect) {
      a0Anomalies.push(iden);
    }
  });

  const a0Htmls = [];
  a0Anomalies.forEach((iden) => {
    const deviationVal = iden.theta - iden.aspect.angle;
    const formattedDev = (deviationVal >= 0 ? "+" : "") + deviationVal.toFixed(1);

    a0Htmls.push(`
      <div class="hover:bg-neutral-50/25 dark:hover:bg-neutral-900/10 p-2.5 border border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col gap-2 transition-colors bg-white/50 dark:bg-black/40">
        <div class="flex items-center justify-between">
          <span class="text-[8px] font-bold font-mono tracking-wider text-neutral-400 dark:text-neutral-500">
            IDENTITY ASPECT
          </span>
          <span class="inline-flex items-center gap-1 text-[9.5px] font-extrabold font-sans uppercase" style="color: ${iden.aspect.color};">
            <span>${iden.aspect.symbol}</span>
            <span>${iden.aspect.id}</span>
          </span>
        </div>
        <div class="flex flex-col gap-1.5 font-sans">
          <div class="flex items-center justify-between gap-1 flex-wrap">
            <div class="flex items-center gap-1">
              ${getAnomalyEntityBadge(iden.entityA.id)} <span class="text-neutral-400 dark:text-neutral-600 font-bold">─</span> ${getAnomalyEntityBadge(iden.entityB.id)}
            </div>
            <span class="font-mono text-[9.5px] font-extrabold text-black dark:text-white">${formattedDev}°</span>
          </div>
          <div class="text-[8.5px] font-mono text-neutral-400 dark:text-neutral-500 leading-none">
            ANGLE: ${iden.theta.toFixed(1)}°
          </div>
        </div>
      </div>
    `);
  });

  const a1Htmls = [];
  a1Anomalies.forEach(({ id1, id2, deg }) => {
    a1Htmls.push(`
      <div class="hover:bg-neutral-50/25 dark:hover:bg-neutral-900/10 p-2.5 border border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col gap-2 transition-colors bg-white/50 dark:bg-black/40">
        <div class="flex items-center justify-between">
          <span class="text-[8px] font-bold font-mono tracking-wider text-neutral-400 dark:text-neutral-500">
            OCCURRENCE
          </span>
          <span class="text-[10px] font-black font-mono text-black dark:text-white">
            ${deg}°
          </span>
        </div>
        <div class="flex flex-col gap-1.5 font-sans">
          <div class="flex items-center gap-1.5 flex-wrap">
            ${getAnomalyEntityBadge(id1.entityA.id)} <span class="text-neutral-400 dark:text-neutral-600 font-bold">─</span> ${getAnomalyEntityBadge(id1.entityB.id)} <span class="font-mono text-[9px] text-neutral-500 dark:text-neutral-400">(${id1.theta.toFixed(1)}°)</span>
          </div>
          <div class="flex items-center gap-1.5 flex-wrap">
            ${getAnomalyEntityBadge(id2.entityA.id)} <span class="text-neutral-400 dark:text-neutral-600 font-bold">─</span> ${getAnomalyEntityBadge(id2.entityB.id)} <span class="font-mono text-[9px] text-neutral-500 dark:text-neutral-400">(${id2.theta.toFixed(1)}°)</span>
          </div>
        </div>
      </div>
    `);
  });

  const a2Htmls = [];
  a2Anomalies.forEach(({ id1, id2, anchor, other1, other2, deg }) => {
    a2Htmls.push(`
      <div class="hover:bg-neutral-50/25 dark:hover:bg-neutral-900/10 p-2.5 border border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col gap-2 transition-colors bg-white/50 dark:bg-black/40">
        <div class="flex items-center justify-between">
          <span class="text-[8px] font-bold font-mono tracking-wider text-neutral-400 dark:text-neutral-500">
            OCCURRENCE
          </span>
          <span class="text-[10px] font-black font-mono text-black dark:text-white">
            ${deg}°
          </span>
        </div>
        <div class="flex flex-col gap-1.5 font-sans">
          <div class="text-[9px] text-neutral-500 font-mono flex items-center gap-1.5 uppercase font-bold tracking-wider">
            <span>ANCHOR:</span> ${getAnomalyEntityBadge(anchor.id)}
          </div>
          <div class="flex flex-col gap-1 pl-2.5 border-l border-neutral-200 dark:border-neutral-800">
            <div class="flex items-center gap-1.5 flex-wrap">
              ${getAnomalyEntityBadge(other1.id)} <span class="text-neutral-400 dark:text-neutral-600">─</span> <span class="font-mono text-[9px] text-neutral-550">(${id1.theta.toFixed(1)}°)</span>
            </div>
            <div class="flex items-center gap-1.5 flex-wrap">
              ${getAnomalyEntityBadge(other2.id)} <span class="text-neutral-400 dark:text-neutral-600">─</span> <span class="font-mono text-[9px] text-neutral-550">(${id2.theta.toFixed(1)}°)</span>
            </div>
          </div>
        </div>
      </div>
    `);
  });

  const a3Htmls = [];
  a3Anomalies.forEach(({ id1, id2, aspect }) => {
    a3Htmls.push(`
      <div class="hover:bg-neutral-50/25 dark:hover:bg-neutral-900/10 p-2.5 border border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col gap-2 transition-colors bg-white/50 dark:bg-black/40">
        <div class="flex items-center justify-between">
          <span class="text-[8px] font-bold font-mono tracking-wider text-neutral-400 dark:text-neutral-500">
            OCCURRENCE
          </span>
          <span class="inline-flex items-center gap-1 text-[9.5px] font-extrabold font-sans uppercase" style="color: ${aspect.color};">
            <span>${aspect.symbol}</span>
            <span>${aspect.id}</span>
          </span>
        </div>
        <div class="flex flex-col gap-1.5 font-sans">
          <div class="flex items-center gap-1.5 flex-wrap">
            ${getAnomalyEntityBadge(id1.entityA.id)} <span class="text-neutral-400 dark:text-neutral-600 font-bold">─</span> ${getAnomalyEntityBadge(id1.entityB.id)} <span class="font-mono text-[9px] text-neutral-500">(${id1.theta.toFixed(1)}° • dev ${id1.aspect ? id1.aspect.deviation.toFixed(1) : 0}°)</span>
          </div>
          <div class="flex items-center gap-1.5 flex-wrap">
            ${getAnomalyEntityBadge(id2.entityA.id)} <span class="text-neutral-400 dark:text-neutral-600 font-bold">─</span> ${getAnomalyEntityBadge(id2.entityB.id)} <span class="font-mono text-[9px] text-neutral-500">(${id2.theta.toFixed(1)}° • dev ${id2.aspect ? id2.aspect.deviation.toFixed(1) : 0}°)</span>
          </div>
        </div>
      </div>
    `);
  });

  const a4Htmls = [];
  a4Anomalies.forEach(({ id1, id2, anchor, other1, other2, aspect1, aspect2 }) => {
    a4Htmls.push(`
      <div class="hover:bg-neutral-50/25 dark:hover:bg-neutral-900/10 p-2.5 border border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col gap-2 transition-colors bg-white/50 dark:bg-black/40">
        <div class="flex items-center justify-between">
          <span class="text-[8px] font-bold font-mono tracking-wider text-neutral-400 dark:text-neutral-500">
            OCCURRENCE
          </span>
          <span class="text-[8px] font-bold font-mono text-neutral-400 uppercase tracking-widest">
            MIXED
          </span>
        </div>
        <div class="flex flex-col gap-1.5 font-sans">
          <div class="text-[9px] text-neutral-500 font-mono flex items-center gap-1.5 uppercase font-bold tracking-wider">
            <span>ANCHOR:</span> ${getAnomalyEntityBadge(anchor.id)}
          </div>
          <div class="flex flex-col gap-1.5 pl-2.5 border-l border-neutral-200 dark:border-neutral-800">
            <div class="flex items-center gap-1.5 flex-wrap justify-between pr-1">
              <div class="flex items-center gap-1">${getAnomalyEntityBadge(other1.id)} <span class="font-mono text-[9px] text-neutral-400">(${id1.theta.toFixed(1)}°)</span></div>
              <span class="inline-flex items-center gap-0.5 text-[9px] font-extrabold" style="color: ${aspect1.color}; font-family: monospace;">
                <span>${aspect1.symbol}</span>
                <span>${aspect1.id}</span>
              </span>
            </div>
            <div class="flex items-center gap-1.5 flex-wrap justify-between pr-1 border-t border-dashed border-neutral-100 dark:border-neutral-900/20 pt-1">
              <div class="flex items-center gap-1">${getAnomalyEntityBadge(other2.id)} <span class="font-mono text-[9px] text-neutral-400">(${id2.theta.toFixed(1)}°)</span></div>
              <span class="inline-flex items-center gap-0.5 text-[9px] font-extrabold" style="color: ${aspect2.color}; font-family: monospace;">
                <span>${aspect2.symbol}</span>
                <span>${aspect2.id}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    `);
  });

  const a5Htmls = [];
  a5Anomalies.forEach(({ id1, id2, anchor, other1, other2, aspect }) => {
    a5Htmls.push(`
      <div class="hover:bg-neutral-50/25 dark:hover:bg-neutral-900/10 p-2.5 border border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col gap-2 transition-colors bg-white/50 dark:bg-black/40">
        <div class="flex items-center justify-between">
          <span class="text-[8px] font-bold font-mono tracking-wider text-neutral-400 dark:text-neutral-500">
            OCCURRENCE
          </span>
          <span class="inline-flex items-center gap-1 text-[9.5px] font-extrabold font-sans uppercase" style="color: ${aspect.color};">
            <span>${aspect.symbol}</span>
            <span>${aspect.id}</span>
          </span>
        </div>
        <div class="flex flex-col gap-1.5 font-sans">
          <div class="text-[9px] text-neutral-500 font-mono flex items-center gap-1.5 uppercase font-bold tracking-wider">
            <span>ANCHOR:</span> ${getAnomalyEntityBadge(anchor.id)}
          </div>
          <div class="flex flex-col gap-1 pl-2.5 border-l border-neutral-200 dark:border-neutral-800">
            <div class="flex items-center gap-1.5 flex-wrap">
              ${getAnomalyEntityBadge(other1.id)} <span class="text-neutral-400 dark:text-neutral-600">─</span> <span class="font-mono text-[9px] text-neutral-500">(${id1.theta.toFixed(1)}°)</span>
            </div>
            <div class="flex items-center gap-1.5 flex-wrap">
              ${getAnomalyEntityBadge(other2.id)} <span class="text-neutral-400 dark:text-neutral-600">─</span> <span class="font-mono text-[9px] text-neutral-500">(${id2.theta.toFixed(1)}°)</span>
            </div>
          </div>
        </div>
      </div>
    `);
  });

  const a6Htmls = [];
  a6Anomalies.forEach(({ bodyA, bodyB, bodyC, aspect, idenAB, idenBC, idenAC }) => {
    a6Htmls.push(`
      <div class="hover:bg-neutral-50/25 dark:hover:bg-neutral-900/10 p-2.5 border border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col gap-2.5 transition-colors bg-white/50 dark:bg-black/40">
        <div class="flex items-center justify-between">
          <span class="text-[8px] font-bold font-mono tracking-wider text-neutral-400 dark:text-neutral-500">
            TRIANGULAR LOCK
          </span>
          <span class="inline-flex items-center gap-1 text-[9.5px] font-extrabold font-sans uppercase" style="color: ${aspect.color};">
            <span>${aspect.symbol}</span>
            <span>${aspect.id}</span>
          </span>
        </div>
        <div class="flex flex-col gap-1 font-sans pl-2.5 border-l" style="border-color: ${aspect.color}; font-family: sans-serif;">
          <div class="flex items-center gap-1 flex-wrap">
            ${getAnomalyEntityBadge(bodyA.id)} <span class="text-neutral-400 dark:text-neutral-600 font-bold">─</span> ${getAnomalyEntityBadge(bodyB.id)} <span class="font-mono text-[8.5px] text-neutral-400">(${idenAB.theta.toFixed(1)}°)</span>
          </div>
          <div class="flex items-center gap-1 flex-wrap">
            ${getAnomalyEntityBadge(bodyB.id)} <span class="text-neutral-400 dark:text-neutral-600 font-bold">─</span> ${getAnomalyEntityBadge(bodyC.id)} <span class="font-mono text-[8.5px] text-neutral-400">(${idenBC.theta.toFixed(1)}°)</span>
          </div>
          <div class="flex items-center gap-1 flex-wrap">
            ${getAnomalyEntityBadge(bodyA.id)} <span class="text-neutral-400 dark:text-neutral-600 font-bold">─</span> ${getAnomalyEntityBadge(bodyC.id)} <span class="font-mono text-[8.5px] text-neutral-400">(${idenAC.theta.toFixed(1)}°)</span>
          </div>
        </div>
      </div>
    `);
  });

  const totalCount = a0Anomalies.length + a1Anomalies.length + a2Anomalies.length + a3Anomalies.length + a4Anomalies.length + a5Anomalies.length + a6Anomalies.length;
  if (badgeEl) {
    badgeEl.innerText = `${totalCount} DETECTED`;
    if (totalCount > 0) {
      badgeEl.className = "font-mono text-[9px] px-2 py-0.5 rounded-none bg-emerald-500 text-white font-bold uppercase tracking-widest leading-none";
    } else {
      badgeEl.className = "font-mono text-[9px] px-2 py-0.5 rounded-none bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-widest leading-none";
    }
  }

  function makeBoxHTML(categoryCode, label, items) {
    const contentHtml = items.length > 0
      ? `<div class="space-y-2 pb-1">${items.join('\n')}</div>`
      : `
        <div class="h-full flex flex-col items-center justify-center text-center py-10 text-neutral-400 dark:text-neutral-500 font-mono text-[9px] uppercase tracking-widest select-none bg-neutral-50/50 dark:bg-neutral-950/20 border border-dashed border-neutral-200 dark:border-neutral-800">
          <span>─ 0 detected ─</span>
        </div>
      `;

    return `
      <div class="border-2 border-black dark:border-white bg-white dark:bg-neutral-950 p-4 shadow-none flex flex-col h-[320px] w-[280px] sm:w-[320px] shrink-0 transition-all relative">
        <div class="flex items-center justify-between border-b-2 border-black dark:border-white pb-2 mb-3 shrink-0">
          <div class="flex items-baseline gap-2">
            <span class="text-[20px] font-black font-sans leading-none text-black dark:text-white">${categoryCode}</span>
            <span class="text-[8px] font-mono leading-none tracking-widest border border-black dark:border-white px-1.5 py-0.5 text-black dark:text-white uppercase whitespace-nowrap bg-neutral-100 dark:bg-neutral-900 font-bold">
              ${label}
            </span>
          </div>
          <span class="font-mono text-[9px] min-w-5 h-5 flex items-center justify-center rounded-none border ${items.length > 0 ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white font-bold' : 'text-neutral-400 dark:text-neutral-600 border-neutral-205 dark:border-neutral-805'}">
            ${items.length}
          </span>
        </div>
        <div class="flex-1 overflow-y-auto space-y-2 pr-1 fancy-scrollbar" style="scrollbar-width: thin;">
          ${contentHtml}
        </div>
      </div>
    `;
  }

  const boxesHtml = [
    makeBoxHTML("A0", "IDENTITY ASPECT", a0Htmls),
    makeBoxHTML("A1", "SAME VALUE DEGREE", a1Htmls),
    makeBoxHTML("A2", "ANCHORED SAME DEGREE", a2Htmls),
    makeBoxHTML("A3", "SAME ASPECT PAIR", a3Htmls),
    makeBoxHTML("A4", "ANCHORED MIXED ASPECT", a4Htmls),
    makeBoxHTML("A5", "ANCHORED SAME ASPECT", a5Htmls),
    makeBoxHTML("A6", "TRIANGULAR LOCK", a6Htmls)
  ].join('\n');

  listEl.innerHTML = boxesHtml;
}

/**
 * Main anomalies update triggers for all three matrices
 */
function updateAnomalies() {
  if (typeof updateIndicators === "function") {
    updateIndicators();
  }
}


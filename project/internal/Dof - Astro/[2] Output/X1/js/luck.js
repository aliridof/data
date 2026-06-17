// js/luck.js

/**
 * Calculates the Astrology-based Astronomy Luck Score for a specific date and subject.
 * Utilizes real-time planetary coordinates (Jupiter, Venus, Sun, Moon)
 * and calculates alignments, altitudes, and aspect separations.
 * 
 * @param {Date} date - Evaluation date.
 * @returns {Object} { score: number, breakdown: Array }
 */
function calculateLuckScore(date) {
  try {
    const activeSubject = state.subjects.find((s) => s.id === state.selectedSubjectId) || state.subjects[0];
    const reqConfig = { zodiac: state.zodiacConfig, coord: state.coordConfig };
    
    let jupStats = null;
    let venStats = null;
    let sunStats = null;
    let moonStats = null;
    
    if (typeof getBodyStats === "function") {
      jupStats = getBodyStats("Jupiter", date, activeSubject, reqConfig);
      venStats = getBodyStats("Venus", date, activeSubject, reqConfig);
      sunStats = getBodyStats("Sun", date, activeSubject, reqConfig);
      moonStats = getBodyStats("Moon", date, activeSubject, reqConfig);
    }
    
    let score = 20; // Baseline luck score
    let breakdown = [];
    
    // 1. Jupiter Position & Altitude (The Great Benefic - Planet of Expansion/Luck)
    if (jupStats) {
      if (jupStats.alt > 0) {
        if (jupStats.alt >= 75) {
          score += 35;
          breakdown.push({
            label: "Jupiter Puncak Zenith (+35%)",
            desc: `Jupiter berada tinggi tegak lurus di belahan langit atas dengan altitudo ${jupStats.alt.toFixed(1)}°`
          });
        } else {
          let points = Math.round(15 + (jupStats.alt / 75) * 15);
          score += points;
          breakdown.push({
            label: `Jupiter di Horizon Atas (+${points}%)`,
            desc: `Planet keberuntungan utama berada di atas horizon dengan altitudo ${jupStats.alt.toFixed(1)}°`
          });
        }
      } else {
        breakdown.push({
          label: "Jupiter di Horizon Bawah (+0%)",
          desc: "Pengaruh meridian Jupiter terlindung di belahan bumi berlawanan"
        });
      }
    }
    
    // 2. Venus Position & Altitude (The Lesser Benefic - Harmony & Wealth)
    if (venStats) {
      if (venStats.alt > 0) {
        if (venStats.alt >= 75) {
          score += 25;
          breakdown.push({
            label: "Venus Puncak Zenith (+25%)",
            desc: `Planet kemakmuran sejajar dengan Zenith meridian aktif dengan altitudo ${venStats.alt.toFixed(1)}°`
          });
        } else {
          let points = Math.round(10 + (venStats.alt / 75) * 10);
          score += points;
          breakdown.push({
            label: `Venus di Horizon Atas (+${points}%)`,
            desc: `Venus menyinari koordinat lokal dari horizon dengan altitudo ${venStats.alt.toFixed(1)}°`
          });
        }
      } else {
        breakdown.push({
          label: "Venus di Horizon Bawah (+0%)",
          desc: "Venus berada di bawah horizon"
        });
      }
    }
    
    // 3. Ecliptic Aspect Resonance (Harmonious Astrological Angles)
    if (jupStats && venStats) {
      let diff = Math.abs(jupStats.lon - venStats.lon);
      let sep = diff > 180 ? 360 - diff : diff;
      
      if (sep <= 8) {
        score += 15;
        breakdown.push({
          label: "Konjungsi Agung Jupiter-Venus (+15%)",
          desc: `Posisi sejajar presisi dengan pemisahan hanya ${sep.toFixed(1)}° (Resonansi puncak kelimpahan)`
        });
      } else if (Math.abs(sep - 120) <= 8) {
        score += 15;
        breakdown.push({
          label: "Trine Harmonis Jupiter-Venus (+15%)",
          desc: `Aspek lancar segitiga emas dengan pemisahan ${sep.toFixed(1)}° (Aliran sinergi positif)`
        });
      } else if (Math.abs(sep - 60) <= 6) {
        score += 10;
        breakdown.push({
          label: "Sextile Jupiter-Venus (+10%)",
          desc: `Sudut 60 derajat dengan pemisahan ${sep.toFixed(1)}° mendatangkan peluang aktif`
        });
      }
    }
    
    if (jupStats && sunStats) {
      let diff = Math.abs(jupStats.lon - sunStats.lon);
      let sep = diff > 180 ? 360 - diff : diff;
      
      if (sep <= 8) {
        score += 10;
        breakdown.push({
          label: "Matahari-Jupiter Cazimi (+10%)",
          desc: `Matahari bersatu dengan Jupiter pada pemisahan ${sep.toFixed(1)}° (Kekuatan diri & kesuksesan)`
        });
      } else if (Math.abs(sep - 120) <= 8) {
        score += 10;
        breakdown.push({
          label: "Trine Matahari-Jupiter (+10%)",
          desc: `Aspek trine emas mengalirkan energi vitalitas tinggi (Pemisahan ${sep.toFixed(1)}°)`
        });
      }
    }
    
    if (venStats && moonStats) {
      let diff = Math.abs(venStats.lon - moonStats.lon);
      let sep = diff > 180 ? 360 - diff : diff;
      
      if (sep <= 8) {
        score += 5;
        breakdown.push({
          label: "Konjungsi Bulan-Venus (+5%)",
          desc: `Sinergi emosi dan keindahan dengan pemisahan ${sep.toFixed(1)}°`
        });
      } else if (Math.abs(sep - 120) <= 8) {
        score += 5;
        breakdown.push({
          label: "Trine Bulan-Venus (+5%)",
          desc: `Aspek keseimbangan sosial dan kenyamanan emosional (Pemisahan ${sep.toFixed(1)}°)`
        });
      }
    }
    
    // 4. Diurnal vs Nocturnal Sect (Astro-Sect Harmony)
    if (sunStats) {
      const isDay = sunStats.alt > 0;
      if (isDay && jupStats && jupStats.alt > 0) {
        score += 10;
        breakdown.push({
          label: "Diurnal Sect Match (Yupiter Siang) (+10%)",
          desc: "Matahari di atas horizon meningkatkan efektivitas energi pelindung Yupiter"
        });
      } else if (!isDay && venStats && venStats.alt > 0) {
        score += 10;
        breakdown.push({
          label: "Nocturnal Sect Match (Venus Malam) (+10%)",
          desc: "Malam hari memperkuat pancaran keindahan dan kenyamanan takdir Venus"
        });
      }
    }
    
    // Clamp score safely
    score = Math.max(10, Math.min(100, score));
    
    return { score, breakdown };
  } catch (err) {
    console.error("Kesalahan penghitungan Luck Score:", err);
    return { score: 50, breakdown: [{ label: "Baseline Statis", desc: "Sistem astronomi memuat posisi planet..." }] };
  }
}

// Default zoom mode represents "macro" or "micro"
if (typeof state !== 'undefined') {
  if (!state.luckZoomMode) state.luckZoomMode = "macro";
  if (typeof state.showGaussianPeak === 'undefined') state.showGaussianPeak = true;
} else if (typeof state === 'undefined') {
  window.state = { luckZoomMode: "macro", showGaussianPeak: true };
}

/**
 * Toggles the level of timeline zoom.
 * @param {string} mode - "macro" (48 Hours) or "micro" (6 Hours, 10-Min detailed check)
 */
function toggleLuckZoom(mode) {
  state.luckZoomMode = mode;
  updateLuckMode();
}

/**
 * Toggles the Gaussian Peak Fit feature on the micro tab.
 */
function toggleGaussianPeak() {
  state.showGaussianPeak = !state.showGaussianPeak;
  updateLuckMode();
}

/**
 * Generates the Luck Mode dashboard layout and triggers projection calculations.
 */
function updateLuckMode() {
  const container = document.getElementById("luck-container");
  if (!container) return;
  
  const activeSubject = state.subjects.find((s) => s.id === state.selectedSubjectId) || state.subjects[0];
  const { DateTime } = window.luxon || {};
  
  // 1. Calculate active state score
  const activeLuck = calculateLuckScore(state.customDate);
  
  // Format subject local time
  let formattedTime = state.customDate.toLocaleTimeString();
  let formattedDate = state.customDate.toLocaleDateString();
  if (DateTime && activeSubject.timezone) {
    const dt = DateTime.fromJSDate(state.customDate).setZone(activeSubject.timezone);
    if (dt.isValid) {
      formattedTime = dt.toFormat("HH:mm:ss");
      formattedDate = dt.toFormat("dd LLL yyyy");
    }
  }
  
  // Determine color and class based on score
  let badgeLabel = "LOW DENSITY";
  let badgeColorClass = "border-neutral-400 text-neutral-500 bg-neutral-100/50 dark:bg-neutral-900/30";
  let textColorClass = "text-neutral-500 dark:text-neutral-400";
  
  if (activeLuck.score >= 80) {
    badgeLabel = "ASTRONOMICAL PEAK LUCK";
    badgeColorClass = "border-amber-400 text-amber-500 bg-amber-500/10";
    textColorClass = "text-amber-500";
  } else if (activeLuck.score >= 60) {
    badgeLabel = "HIGH RESONANCE";
    badgeColorClass = "border-emerald-400 text-emerald-500 bg-emerald-500/10";
    textColorClass = "text-emerald-500";
  } else if (activeLuck.score >= 40) {
    badgeLabel = "MODERATE FLOW";
    badgeColorClass = "border-blue-400 text-blue-500 bg-blue-500/10";
    textColorClass = "text-blue-500";
  }

  // Calculate Projection Points
  // Macro: 48 hours, 1 hour steps
  // Micro: 6 hours (36 steps of 10 minutes)
  const isMicro = state.luckZoomMode === "micro";
  const numSteps = isMicro ? 36 : 48;
  const stepMs = isMicro ? 10 * 60 * 1000 : 60 * 60 * 1000; // 10 mins vs 1 hour
  
  const timelinePoints = [];
  const baseTime = state.customDate.getTime();
  let peakPoint = { time: baseTime, score: -1, index: 0 };
  
  for (let i = 0; i < numSteps; i++) {
    const projDate = new Date(baseTime + i * stepMs);
    const projLuck = calculateLuckScore(projDate);
    
    let displayLabel = "";
    if (DateTime && activeSubject.timezone) {
      const dtProj = DateTime.fromJSDate(projDate).setZone(activeSubject.timezone);
      displayLabel = isMicro ? dtProj.toFormat("HH:mm") : dtProj.toFormat("dd LLL, HH:00");
    } else {
      displayLabel = isMicro 
        ? projDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        : projDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    timelinePoints.push({
      time: projDate.getTime(),
      score: projLuck.score,
      label: displayLabel
    });
    
    if (projLuck.score > peakPoint.score) {
      peakPoint = {
        time: projDate.getTime(),
        score: projLuck.score,
        label: displayLabel,
        index: i
      };
    }
  }

  // Build the Stock Line Chart coordinates
  const svgW = 500;
  const svgH = 155;
  const padX = 20;
  const padY = 20;
  const chartW = svgW - 2 * padX;
  const chartH = svgH - 2 * padY;
  
  // Calculate continuous path "d" coordinates
  const linePoints = timelinePoints.map((pt, idx) => {
    const x = padX + (idx / (numSteps - 1)) * chartW;
    const y = (svgH - padY) - (pt.score / 100) * chartH;
    return { x, y, score: pt.score, time: pt.time, label: pt.label };
  });

  // Calculate Gaussian peak interpolation on MICRO zoom mode
  let gaussianPeakInfo = null;
  let gaussianCurvePath = "";
  let gaussX = 0;
  let gaussY = 0;

  if (isMicro && state.showGaussianPeak) {
    const peakIdx = peakPoint.index;
    let i_mid = peakIdx;
    if (peakIdx === 0) {
      i_mid = 1;
    } else if (peakIdx === numSteps - 1) {
      i_mid = numSteps - 2;
    }

    if (i_mid > 0 && i_mid < numSteps - 1) {
      const y0 = Math.max(1, timelinePoints[i_mid - 1].score);
      const y1 = Math.max(1, timelinePoints[i_mid].score);
      const y2 = Math.max(1, timelinePoints[i_mid + 1].score);

      const L0 = Math.log(y0);
      const L1 = Math.log(y1);
      const L2 = Math.log(y2);

      const a_coeff = (L0 - 2 * L1 + L2) / 2;
      const b_coeff = (L2 - L0) / 2;
      const c_coeff = L1;

      if (a_coeff < 0) {
        const dx = -b_coeff / (2 * a_coeff);
        if (Math.abs(dx) <= 1.5) {
          const i_true = i_mid + dx;
          const y_true = Math.min(100, Math.max(0, Math.exp(c_coeff - (b_coeff * b_coeff) / (4 * a_coeff))));
          const trueTimeMs = baseTime + i_true * stepMs;
          const trueDate = new Date(trueTimeMs);
          
          let trueLabel = "";
          if (DateTime && activeSubject.timezone) {
            const dtTrue = DateTime.fromJSDate(trueDate).setZone(activeSubject.timezone);
            trueLabel = dtTrue.toFormat("HH:mm:ss");
          } else {
            trueLabel = trueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
          }

          gaussX = padX + (i_true / (numSteps - 1)) * chartW;
          gaussY = (svgH - padY) - (y_true / 100) * chartH;

          const sigma = Math.min(10, Math.max(1, Math.sqrt(-1 / (2 * a_coeff))));
          const stdDevMin = sigma * 10;
          const ciStartTimeMs = trueTimeMs - 36 * 60 * 1000;
          const ciEndTimeMs = trueTimeMs + 36 * 60 * 1000;
          const ciStartDate = new Date(ciStartTimeMs);
          const ciEndDate = new Date(ciEndTimeMs);
          
          let ciStartLabel = "";
          let ciEndLabel = "";
          if (typeof DateTime !== "undefined" && DateTime && activeSubject.timezone) {
            const dtStart = DateTime.fromJSDate(ciStartDate).setZone(activeSubject.timezone);
            const dtEnd = DateTime.fromJSDate(ciEndDate).setZone(activeSubject.timezone);
            ciStartLabel = dtStart.toFormat("HH:mm");
            ciEndLabel = dtEnd.toFormat("HH:mm");
          } else {
            const opt = { hour: '2-digit', minute: '2-digit', hour12: false };
            ciStartLabel = ciStartDate.toLocaleTimeString([], opt);
            ciEndLabel = ciEndDate.toLocaleTimeString([], opt);
          }

          const ciLeftIdx = Math.max(0, i_true - 3.6);
          const ciRightIdx = Math.min(numSteps - 1, i_true + 3.6);
          const ciLeftX = padX + (ciLeftIdx / (numSteps - 1)) * chartW;
          const ciRightX = padX + (ciRightIdx / (numSteps - 1)) * chartW;
          
          gaussianPeakInfo = {
            index: i_true,
            score: y_true,
            time: trueTimeMs,
            label: trueLabel,
            sigma: sigma,
            stdDevMin: stdDevMin,
            ciStartTimeMs: ciStartTimeMs,
            ciEndTimeMs: ciEndTimeMs,
            ciStartLabel: ciStartLabel,
            ciEndLabel: ciEndLabel,
            ciLeftX: ciLeftX,
            ciRightX: ciRightX
          };

          const curvePoints = [];
          const startIdx = Math.max(0, i_true - 2.5 * sigma);
          const endIdx = Math.min(numSteps - 1, i_true + 2.5 * sigma);
          
          for (let step = 0; step <= 50; step++) {
            const currIdx = startIdx + (step / 50) * (endIdx - startIdx);
            const val = y_true * Math.exp(-Math.pow(currIdx - i_true, 2) / (2 * sigma * sigma));
            const xCoord = padX + (currIdx / (numSteps - 1)) * chartW;
            const yCoord = (svgH - padY) - (val / 100) * chartH;
            curvePoints.push({ x: xCoord, y: yCoord });
          }

          if (curvePoints.length > 0) {
            gaussianCurvePath = `M ${curvePoints[0].x} ${curvePoints[0].y} ` + curvePoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
          }
        }
      }
    }
  }

  // Polyline path d string
  let lineD = "";
  if (linePoints.length > 0) {
    lineD = `M ${linePoints[0].x} ${linePoints[0].y} ` + linePoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
  }

  // Area path d string (closes at the bottom)
  const areaD = lineD ? `${lineD} L ${linePoints[linePoints.length - 1].x} ${svgH - padY} L ${linePoints[0].x} ${svgH - padY} Z` : "";

  // Render Horizontal Reference Grid Y values (Score 25%, 50%, 75%)
  const y25 = (svgH - padY) - 0.25 * chartH;
  const y50 = (svgH - padY) - 0.5 * chartH;
  const y75 = (svgH - padY) - 0.75 * chartH;

  // Compute Y-boundary positions for the color bands (Red, Gray, Green zones)
  const y0 = svgH - padY;
  const y40 = y0 - 0.4 * chartH;
  const y70 = y0 - 0.7 * chartH;
  const y100 = padY;

  // Highlights / Active marker coordinate
  const currentPt = linePoints[0];
  const peakPt = linePoints[peakPoint.index];

  // Render Interactive Hover hotspots (vertical invisible trigger slices)
  const stepWidth = chartW / (numSteps - 1);
  const hotspotsHTML = linePoints.map((pt, idx) => {
    const isCurrent = idx === 0;
    const isPeak = pt.time === peakPoint.time;
    let hoverColor = "hover:stroke-neutral-350 dark:hover:stroke-neutral-800";
    if (isCurrent) hoverColor = "hover:stroke-black dark:hover:stroke-white";
    else if (isPeak) hoverColor = "hover:stroke-amber-400";

    return `
      <g class="group/hotspot cursor-pointer" onclick="jumpTimeMachineToLuck(${pt.time})">
        <!-- Vertical guide line on hover -->
        <line 
          x1="${pt.x}" y1="${padY}" 
          x2="${pt.x}" y2="${svgH - padY}" 
          stroke="currentColor" 
          stroke-width="1.5" 
          class="text-neutral-300 dark:text-neutral-800 opacity-0 group-hover/hotspot:opacity-100 transition-opacity pointer-events-none" 
          stroke-dasharray="2 2"
        />
        <!-- Hover indicator circle -->
        <circle 
          cx="${pt.x}" cy="${pt.y}" 
          r="4.5" 
          class="${isPeak ? "fill-amber-500" : isCurrent ? "fill-black dark:fill-white" : "fill-emerald-500"} opacity-0 group-hover/hotspot:opacity-100 transition-opacity pointer-events-none"
        />
        <!-- Broad invisible interactive rectangle -->
        <rect 
          x="${pt.x - stepWidth / 2}" 
          y="${padY}" 
          width="${stepWidth}" 
          height="${chartH}" 
          fill="transparent"
          class="cursor-pointer"
        />
        <title>${pt.label} | Luck: ${pt.score}% ${isCurrent ? "(SEKARANG)" : isPeak ? "(PEAK LUCK)" : ""}\nKlik untuk kunci waktu ini</title>
      </g>
    `;
  }).join("");

  // Populate active kosmologi alignments
  let breakdownRowsHTML = activeLuck.breakdown.map((b) => `
    <div class="border-b border-dashed border-neutral-200 dark:border-neutral-850 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-1">
      <div class="space-y-0.5">
        <div class="text-[11px] font-black uppercase tracking-wider text-black dark:text-white">${b.label}</div>
        <div class="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">${b.desc}</div>
      </div>
      <span class="text-[10px] font-mono font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 shrink-0 self-start md:self-auto leading-none uppercase tracking-widest mt-1 md:mt-0">ACTIVE</span>
    </div>
  `).join("");

  if (activeLuck.breakdown.length === 0) {
    breakdownRowsHTML = `
      <div class="py-8 text-center text-[11px] text-neutral-400 dark:text-neutral-500 font-sans border border-dashed border-neutral-200 dark:border-neutral-800">
        Menghitung konvergensi meridian langit... Geser mesin waktu utama di atas untuk menyelaraskan altitudo planet.
      </div>
    `;
  }

  // Draw the entire content structure
  container.innerHTML = `
    <!-- Top Row: Stock Grid Dashboard -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Column 1: Current Score Card -->
      <div class="lg:col-span-1 border-2 border-black dark:border-white bg-white dark:bg-black p-6 flex flex-col justify-between relative overflow-hidden">
        <div>
          <div class="flex items-center justify-between mb-4">
            <span class="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400 font-mono">
              LUCK INDEX ACTIVE
            </span>
            <div class="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
          </div>
          
          <div class="my-6 text-center">
            <span class="text-7xl md:text-8xl font-black font-sans tracking-tighter text-black dark:text-white">
              ${activeLuck.score}<span class="text-3xl font-extrabold">%</span>
            </span>
            <div class="${badgeColorClass} border px-2.5 py-1 text-[9px] font-black tracking-[0.2em] uppercase max-w-max mx-auto mt-4 leading-none select-none">
              ${badgeLabel}
            </div>
          </div>

          <!-- Gaussian Peak Info Card on Micro Mode -->
          ${gaussianPeakInfo ? `
            <div class="mt-4 border border-amber-500 bg-amber-500/5 p-3.5 space-y-3 text-left relative overflow-hidden transition-all select-none">
              <div class="absolute -right-3 -bottom-3 opacity-10 pointer-events-none transition-transform">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="text-amber-500" stroke-width="1.5">
                  <path d="M3 20h18M3 20a7 7 0 0 1 14 0M10 20a4 4 0 0 1 4-4v-1a3 3 0 0 1 6 0v5" />
                </svg>
              </div>
              
              <!-- Title -->
              <div class="flex items-center gap-1.5 text-amber-500">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span class="text-[9px] font-black uppercase tracking-wider font-mono">Statistical Gaussian Fit</span>
              </div>
              
              <!-- Peak and local time -->
              <div class="space-y-1">
                <div class="flex items-baseline justify-between">
                  <span class="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">TRUE PEAK</span>
                  <span class="text-[20px] font-black text-amber-500 tracking-tight leading-none">
                    ${gaussianPeakInfo.score.toFixed(2)}%
                  </span>
                </div>
                
                <div onclick="jumpTimeMachineToLuck(${gaussianPeakInfo.time})" class="text-[9px] font-mono border border-amber-500/30 hover:border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:text-black dark:text-amber-400 hover:bg-amber-500 hover:text-black dark:hover:bg-amber-500 dark:hover:text-black cursor-pointer px-2 py-1 text-center font-black transition-all">
                  LOMPAT KE PUNCAK (${gaussianPeakInfo.label})
                </div>
              </div>
              
              <!-- Standard Deviation -->
              <div class="border-t border-dashed border-amber-500/20 pt-2 space-y-1">
                <div class="flex justify-between items-center text-[9px] font-mono text-neutral-400 dark:text-neutral-500">
                  <span>STANDAR DEVIASI (&sigma;)</span>
                  <span class="text-black dark:text-white font-extrabold">&plusmn; ${gaussianPeakInfo.stdDevMin.toFixed(1)} MENIT</span>
                </div>
                <div class="text-[8px] text-neutral-400 dark:text-neutral-500 leading-normal">
                  Menunjukkan rentang persebaran astronomis dari sumbu keberuntungan.
                </div>
              </div>
              
              <!-- Confidence Interval (Golden Resonance Window) -->
              <div class="border-t border-dashed border-amber-500/20 pt-2 space-y-1 bg-amber-500/10 -mx-3.5 -mb-3.5 p-3.5">
                <div class="flex justify-between items-center text-[9px] font-mono text-amber-700 dark:text-amber-300">
                  <span class="font-black">GOLDEN WINDOW (95% CI)</span>
                  <span class="font-black text-[10px]">72 MENIT</span>
                </div>
                <div class="text-[9.5px] font-mono font-extrabold text-black dark:text-white flex justify-between">
                  <span>${gaussianPeakInfo.ciStartLabel} s.d ${gaussianPeakInfo.ciEndLabel}</span>
                  <span class="text-amber-500 text-[8px] tracking-wider">&plusmn; 36 MENIT</span>
                </div>
                <div class="text-[8px] text-neutral-500 dark:text-neutral-400 leading-normal pt-1 italic">
                  Interval keberuntungan maksimal terjaga pada rentang 5% puncak tertinggi ini (36 menit sebelum dan setelah).
                </div>
              </div>
            </div>
          ` : ""}
        </div>

        <div class="border-t border-neutral-100 dark:border-neutral-900 pt-5 space-y-2">
          <div class="text-[9px] uppercase font-bold tracking-widest text-neutral-500 dark:text-neutral-400 font-mono">
            SUBJECT COORDINATE
          </div>
          <div class="text-[11px] font-extrabold text-black dark:text-white uppercase truncate">
            ${activeSubject.name || activeSubject.label}
          </div>
          <div class="text-[9.5px] font-mono text-neutral-400 dark:text-neutral-500 flex justify-between">
            <span>LAT: ${activeSubject.lat.toFixed(4)}°</span>
            <span>LNG: ${activeSubject.lng.toFixed(4)}°</span>
          </div>
        </div>
      </div>

      <!-- Columns 2-3: Stock Terminal TradingView-Style Line Chart -->
      <div class="lg:col-span-2 border-2 border-black dark:border-white bg-white dark:bg-black p-6 flex flex-col justify-between relative overflow-hidden">
        
        <!-- Header Controls for Chart Window -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 gap-3">
          <div>
            <h3 class="text-[11px] font-black uppercase tracking-widest text-black dark:text-white flex items-center gap-2">
              <span class="w-2.5 h-2.5 bg-black dark:bg-white inline-block"></span>
              <span>PASUT KEBERUNTUNGAN (STOCKS LINE CHART)</span>
            </h3>
            <p class="text-[9px] text-neutral-400 dark:text-neutral-500 mt-0.5 font-bold uppercase tracking-wider">
              Arahkan & klik titik garis untuk berlayar menembus rentang waktu
            </p>
          </div>

          <!-- Macro vs Micro zoom controls + Gaussian peak toggle inside clean block -->
          <div class="flex flex-wrap items-center gap-2 select-none self-start sm:self-auto">
            <div class="flex items-center border border-black dark:border-white p-0.5 bg-neutral-50 dark:bg-neutral-950">
              <button 
                onclick="toggleLuckZoom('macro')"
                class="px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer rounded-none ${!isMicro ? "bg-black dark:bg-white text-white dark:text-black" : "text-neutral-500 hover:text-black dark:hover:text-white"}"
              >
                MACRO (48J)
              </button>
              <button 
                onclick="toggleLuckZoom('micro')"
                class="px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer rounded-none ${isMicro ? "bg-black dark:bg-white text-white dark:text-black" : "text-neutral-500 hover:text-black dark:hover:text-white"}"
              >
                MICRO (6J)
              </button>
            </div>

            ${isMicro ? `
              <button 
                onclick="toggleGaussianPeak()"
                class="border border-black dark:border-white px-2.5 py-1.5 text-[9.5px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-2 ${state.showGaussianPeak ? "bg-amber-500 text-black border-amber-500" : "bg-neutral-50 dark:bg-neutral-950 text-neutral-500 hover:text-black dark:hover:text-white"}"
              >
                <span class="w-1.5 h-1.5 rounded-full ${state.showGaussianPeak ? "bg-black animate-pulse" : "bg-neutral-400"}"></span>
                <span>GAUSSIAN PEAK FIT: ${state.showGaussianPeak ? "ACTIVE" : "DISABLED"}</span>
              </button>
            ` : ""}
          </div>
        </div>

        <!-- High-Precision Responsive SVG Graph Canvas -->
        <div class="w-full bg-neutral-50 dark:bg-neutral-950 border border-black dark:border-white my-4 p-2 relative shadow-inner">
          <svg viewBox="0 0 ${svgW} ${svgH}" class="w-full h-full overflow-visible">
            <defs>
              <!-- Glowing area gradient -->
              <linearGradient id="luckGridGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#10b981" stop-opacity="0.25" />
                <stop offset="100%" stop-color="#10b981" stop-opacity="0.00" />
              </linearGradient>
              <!-- Glowing Gaussian Confidence Band background -->
              <linearGradient id="gaussBandGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.01" />
                <stop offset="50%" stop-color="#f59e0b" stop-opacity="0.18" />
                <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.01" />
              </linearGradient>
            </defs>

            <!-- Background Luck Zones (Red, Gray, Green) -->
            <!-- Green Zone (Above 70%): Highly Auspicious Alignment -->
            <rect x="${padX}" y="${y100}" width="${chartW}" height="${y70 - y100}" class="fill-emerald-500/10 dark:fill-emerald-950/20" pointer-events-none="true" />
            
            <!-- Gray Zone (40% - 70%): Neutral / Moderate Resonance -->
            <rect x="${padX}" y="${y70}" width="${chartW}" height="${y40 - y70}" class="fill-neutral-200/40 dark:fill-neutral-900/30" pointer-events-none="true" />
            
            <!-- Red Zone (Below 40%): Subdued / Challenging Configurations -->
            <rect x="${padX}" y="${y40}" width="${chartW}" height="${y0 - y40}" class="fill-red-500/10 dark:fill-red-950/20" pointer-events-none="true" />

            <!-- Grid Level Lines -->
            <line x1="${padX}" y1="${y75}" x2="${svgW - padX}" y2="${y75}" stroke="currentColor" class="text-neutral-200 dark:text-neutral-900" stroke-width="1" stroke-dasharray="3 3" />
            <text x="${svgW - padX + 2}" y="${y75 + 3}" class="text-[8px] font-mono fill-neutral-400 dark:fill-neutral-600 font-black">75%</text>

            <line x1="${padX}" y1="${y50}" x2="${svgW - padX}" y2="${y50}" stroke="currentColor" class="text-neutral-200 dark:text-neutral-900" stroke-width="1" stroke-dasharray="3 3" />
            <text x="${svgW - padX + 2}" y="${y50 + 3}" class="text-[8px] font-mono fill-neutral-400 dark:fill-neutral-600 font-black">50%</text>

            <line x1="${padX}" y1="${y25}" x2="${svgW - padX}" y2="${y25}" stroke="currentColor" class="text-neutral-200 dark:text-neutral-900" stroke-width="1" stroke-dasharray="3 3" />
            <text x="${svgW - padX + 2}" y="${y25 + 3}" class="text-[8px] font-mono fill-neutral-400 dark:fill-neutral-600 font-black">25%</text>

            <!-- Gaussian Confidence Band Overlay (72-Mins High-Resonance Golden Range) -->
            ${gaussianPeakInfo ? `
              <rect 
                x="${gaussianPeakInfo.ciLeftX}" 
                y="${padY}" 
                width="${gaussianPeakInfo.ciRightX - gaussianPeakInfo.ciLeftX}" 
                height="${chartH}" 
                fill="url(#gaussBandGrad)" 
                class="pointer-events-none" 
              />
              <line x1="${gaussianPeakInfo.ciLeftX}" y1="${padY}" x2="${gaussianPeakInfo.ciLeftX}" y2="${svgH - padY}" stroke="#f59e0b" stroke-width="0.75" stroke-dasharray="1 2" opacity="0.6" class="pointer-events-none" />
              <line x1="${gaussianPeakInfo.ciRightX}" y1="${padY}" x2="${gaussianPeakInfo.ciRightX}" y2="${svgH - padY}" stroke="#f59e0b" stroke-width="0.75" stroke-dasharray="1 2" opacity="0.6" class="pointer-events-none" />
            ` : ""}

            <!-- Line Area Fill first to sit underneath boundaries -->
            <path d="${areaD}" fill="url(#luckGridGrad)" class="pointer-events-none" />

            <!-- Solid Stock Line -->
            <path d="${lineD}" fill="none" stroke="currentColor" class="text-emerald-500 dark:text-emerald-400 pointer-events-none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />

            <!-- Gaus Peak Trendline Overlay -->
            ${gaussianPeakInfo ? `
              <!-- Fitted continuous Gaussian curve -->
              <path d="${gaussianCurvePath}" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.85" class="pointer-events-none" />
              
              <!-- Draw precise drop alignment line to time axis -->
              <line x1="${gaussX}" y1="${gaussY}" x2="${gaussX}" y2="${svgH - padY}" stroke="#f59e0b" stroke-width="1" stroke-dasharray="2 1" opacity="0.7" class="pointer-events-none" />

              <!-- Blinking concentric pulse circle for True Peak -->
              <circle cx="${gaussX}" cy="${gaussY}" r="7" class="stroke-amber-400 fill-none animate-[ping_1.5s_infinite] pointer-events-none" stroke-width="1.2" />
              <circle cx="${gaussX}" cy="${gaussY}" r="4.5" class="fill-amber-500 stroke-white dark:stroke-black pointer-events-none" stroke-width="1" />
              
              <!-- Interactive metadata label on SVG -->
              <g class="pointer-events-none">
                <!-- Drop shadow backing filter -->
                <rect x="${gaussX - 45}" y="${gaussY - 18}" width="90" height="12" fill="black" stroke="#f59e0b" stroke-width="1" opacity="0.95" rx="1.5" />
                <text x="${gaussX}" y="${gaussY - 9.5}" text-anchor="middle" class="text-[7.5px] font-mono font-black fill-amber-400 tracking-wider">TRUE PEAK: ${gaussianPeakInfo.score.toFixed(1)}%</text>
              </g>
            ` : ""}

            <!-- Active Anchor Pointer Dot -->
            <circle cx="${currentPt.x}" cy="${currentPt.y}" r="5" class="fill-black dark:fill-white stroke-white dark:stroke-black pointer-events-none" stroke-width="1.5" />

            <!-- Peak Anchor Dot -->
            <circle cx="${peakPt.x}" cy="${peakPt.y}" r="4.5" class="fill-amber-500 stroke-black dark:stroke-white pointer-events-none" stroke-width="1" />

            <!-- Interactive hotspots slice overlay -->
            ${hotspotsHTML}
          </svg>
        </div>

        <!-- Axis Timestamps representation -->
        <div class="flex justify-between items-center text-[8.5px] font-mono tracking-wider font-extrabold text-neutral-400 dark:text-neutral-500 border-t border-neutral-150 dark:border-neutral-900 pt-3 uppercase">
          <span>${linePoints[0].label} (SEKARANG)</span>
          <span>${linePoints[Math.floor(numSteps / 2)].label} (TENGAL)</span>
          <span>${linePoints[numSteps - 1].label} (+${isMicro ? "6 Jam" : "48 Jam"})</span>
        </div>
      </div>
    </div>

    <!-- Active Cosmic alignments details -->
    <div class="border-2 border-black dark:border-white bg-white dark:bg-black p-6">
      <h3 class="text-[11px] font-black uppercase tracking-widest text-black dark:text-white border-b border-black dark:border-white pb-3 flex items-center gap-2">
        <span class="w-2.5 h-2.5 bg-black dark:bg-white inline-block"></span>
        <span>RESONANSI ALIRAN KOSMIS AKTIF</span>
      </h3>
      <div id="luck-breakdown-container" class="divide-y divide-neutral-200 dark:divide-neutral-800">
        ${breakdownRowsHTML}
      </div>
    </div>
  `;

  // Apply Feather icons replacement
  if (typeof feather === "object" && typeof feather.replace === "function") {
    feather.replace();
  }
}

/**
 * Triggers state change to jump the custom date of the Time Machine to a targeted Millisecond Timestamp.
 * Automatically activates Time Machine mode to load and visualize the coordinates.
 * 
 * @param {number} timestamp - The millisecond representation of the chosen hour.
 */
function jumpTimeMachineToLuck(timestamp) {
  state.customDate = new Date(timestamp);
  state.timeMachineEnabled = true;
  state.isRealTime = false;
  
  // Update browser datetime value if the element is bound and exists
  const customTimePicker = document.getElementById("sim-custom-time");
  if (customTimePicker) {
    const localIso = new Date(state.customDate.getTime() - state.customDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    customTimePicker.value = localIso;
  }

  // Reload main loop to render maps, markers, and calculators
  if (typeof gameLoop === "function") {
    gameLoop();
  }
}

// Bind handlers globally
window.calculateLuckScore = calculateLuckScore;
window.updateLuckMode = updateLuckMode;
window.jumpTimeMachineToLuck = jumpTimeMachineToLuck;
window.toggleLuckZoom = toggleLuckZoom;
window.toggleGaussianPeak = toggleGaussianPeak;

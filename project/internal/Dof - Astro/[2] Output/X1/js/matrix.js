// js/matrix.js

const ABBREVIATIONS = {
  "terrestrial-zenith": "TZ",
  "terrestrial-nadir": "TN",
  "celestial-zenith": "CZ",
  "celestial-nadir": "CN",
  Sun: "SOL",
  Moon: "LUN",
  Mercury: "MER",
  Venus: "VEN",
  Mars: "MAR",
  Jupiter: "JUP",
  Saturn: "SAT",
  Uranus: "URA",
  Neptune: "NEP",
  Pluto: "PLU",
  Sirius: "SIR",
};

function getMatrixHeaderHTML(entity) {
  const abbrev =
    ABBREVIATIONS[entity.id] || entity.id.substring(0, 3).toUpperCase();
  const symbol = entity.symbol;
  const isZenith = entity.id.includes("zenith");
  const isNadir = entity.id.includes("nadir");

  let markerHTML = "";
  if (isZenith) {
    markerHTML = `<div class="w-[22px] h-[22px] rounded-full border bg-white text-slate-950 border-slate-950 font-black font-mono text-[9px] flex items-center justify-center shadow-xs shrink-0 select-none">
            <span>${symbol}</span>
        </div>`;
  } else if (isNadir) {
    markerHTML = `<div class="w-[22px] h-[22px] rounded-full border border-white dark:border-slate-950 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-black font-mono text-[9px] flex items-center justify-center shadow-xs shrink-0 select-none">
            <span>${symbol}</span>
        </div>`;
  } else {
    // Celestial body object
    markerHTML = `<div class="w-[22px] h-[22px] rounded-full border border-neutral-950 dark:border-white font-black font-mono text-[9.5px] flex items-center justify-center shadow-xs shrink-0 select-none text-white" style="background-color: ${entity.color || "#64748b"};">
            <span>${symbol}</span>
        </div>`;
  }

  return `<div class="flex flex-col items-center justify-center gap-1.5 py-1 select-none">
        ${markerHTML}
        <span class="text-[9px] font-bold font-mono tracking-wider text-neutral-600 dark:text-neutral-400 uppercase">${abbrev}</span>
    </div>`;
}

function generateMatrixHTML(matrixType) {
  const items = ENTITIES.filter((item) => state.activeBodies.has(item.id)); // Filtered dynamically using activeBodies
  let html = "";

  // Determine the active mode for this matrixType: ANGLE or ASPECT
  let mode = "ANGLE";
  if (matrixType === "ZENITH") {
    mode = state.matrixModeZenith || "ANGLE";
  } else if (matrixType === "NADIR") {
    mode = state.matrixModeNadir || "ANGLE";
  } else {
    mode = state.matrixModeGeneral || "ANGLE";
  }

  // Column Headers
  html +=
    '<thead><tr class="divide-x divide-neutral-200 dark:divide-neutral-800 border-b border-black dark:border-white">';

  // Top Left First Cell (0,0)
  if (matrixType === "ZENITH") {
    html += `<th class="w-[90px] min-w-[90px] px-3 py-3 text-center bg-white dark:bg-black text-[10px] font-black tracking-widest font-sans border-r border-black dark:border-white uppercase text-black dark:text-white">
            ZENITH
        </th>`;
  } else if (matrixType === "NADIR") {
    html += `<th class="w-[90px] min-w-[90px] px-3 py-3 text-center bg-black dark:bg-white text-white dark:text-black text-[10px] font-black tracking-widest font-sans border-r border-black dark:border-white uppercase">
            NADIR
        </th>`;
  } else {
    html += `<th class="w-[90px] min-w-[90px] px-3 py-3 text-center bg-white dark:bg-black text-[10px] font-black tracking-widest font-sans border-r border-black dark:border-white uppercase text-black dark:text-white">
            MATRIX
        </th>`;
  }

  // The rest of the column headers
  items.forEach((item, index) => {
    const headerBadge = getMatrixHeaderHTML(item);
    html += `<th data-matrix-col="${index}" class="w-[80px] min-w-[80px] text-center bg-neutral-50/70 dark:bg-neutral-950/70 py-1 font-semibold leading-none transition-colors duration-150">
            ${headerBadge}
        </th>`;
  });
  html += "</tr></thead>";

  // Data Rows
  html += '<tbody class="divide-y divide-neutral-200 dark:divide-neutral-800">';

  items.forEach((rowItem, rowIndex) => {
    html +=
      '<tr class="divide-x divide-neutral-200 dark:divide-neutral-800 transition-colors hover:bg-neutral-50/20 dark:hover:bg-neutral-900/10">';

    // Row Title (Header Column)
    const rowHeaderBadge = getMatrixHeaderHTML(rowItem);
    html += `<td data-matrix-row="${rowIndex}" class="w-[90px] min-w-[90px] bg-neutral-50/70 dark:bg-neutral-950/70 text-center font-bold border-r border-black dark:border-white py-1.5 shrink-0 select-none transition-colors duration-150">
            ${rowHeaderBadge}
        </td>`;

    // Grid intersections
    items.forEach((colItem, colIndex) => {
      const isDiagonal = rowIndex === colIndex;
      if (isDiagonal) {
        const diagonalBadge = getMatrixHeaderHTML(rowItem);
        html += `<td data-col="${colIndex}" data-row="${rowIndex}" class="matrix-cell w-[80px] min-w-[80px] p-1 bg-neutral-100 dark:bg-neutral-900 text-center scale-95 transition-all cursor-pointer">
                    ${diagonalBadge}
                </td>`;
      } else {
        const isUpper = rowIndex < colIndex;
        const isLower = rowIndex > colIndex;

        let isKosong = false;
        if (matrixType === "ZENITH" && isLower) {
          isKosong = true;
        } else if (matrixType === "NADIR" && isUpper) {
          isKosong = true;
        }

        if (isKosong) {
          html += `<td data-col="${colIndex}" data-row="${rowIndex}" class="w-[80px] min-w-[80px] bg-neutral-50/40 dark:bg-neutral-950/40 select-none pointer-events-none"></td>`;
        } else {
          let cellContent = "-";
          let cellClass =
            "matrix-cell w-[80px] min-w-[80px] p-2 text-center font-mono text-[10px] select-none cursor-pointer transition-colors duration-100 hover:bg-neutral-100/50 dark:hover:bg-neutral-900/30 text-neutral-350 dark:text-neutral-750";
          let cellStyle = "";

          try {
            const identity = new Identity(rowItem, colItem, state.customDate);

            let isEligible = false;
            if (matrixType === "ZENITH") {
              isEligible = identity.isZenithZone;
            } else if (matrixType === "NADIR") {
              isEligible = identity.isNadirZone;
            } else if (matrixType === "MATRIX") {
              const isCrossDome =
                identity.isZenithSideA !== identity.isZenithSideB;
              if (isCrossDome) {
                if (isUpper && identity.isZenithSideA) {
                  isEligible = true;
                } else if (isLower && identity.isNadirSideA) {
                  isEligible = true;
                }
              }
            }

            if (identity.statsA && identity.statsB && isEligible) {
              const theta = identity.theta;

              if (mode === "ANGLE") {
                cellContent = `
                                    <div class="flex flex-col items-center justify-center select-none leading-none">
                                        <span class="text-[10px] font-bold text-neutral-800 dark:text-neutral-200">${theta.toFixed(1)}°</span>
                                    </div>
                                `;
                cellClass =
                  "matrix-cell w-[80px] min-w-[80px] p-2 text-center font-mono leading-none select-none cursor-pointer transition-colors duration-100 hover:bg-neutral-100/50 dark:hover:bg-neutral-900/40 text-neutral-600 dark:text-neutral-300";
              } else {
                // ASPECT Mode
                const aspect = identity.aspect;
                if (aspect) {
                  cellContent = `
                                        <div class="flex flex-col items-center justify-center gap-0.5 select-none leading-none">
                                            <span class="text-xs font-extrabold flex items-center gap-0.5 mb-0.5 tracking-tighter shadow-3xs" style="color: ${aspect.color};">
                                                <span class="text-xs leading-none mr-0.5">${aspect.symbol}</span>
                                                <span class="text-[8px] leading-none uppercase font-black">${aspect.id}</span>
                                            </span>
                                            <span class="text-[9.5px] font-bold text-neutral-800 dark:text-neutral-200">${theta.toFixed(1)}°</span>
                                            <span class="text-[8px] text-neutral-400 dark:text-neutral-500 font-semibold font-mono">dev ${aspect.deviation.toFixed(1)}°</span>
                                        </div>
                                    `;
                  cellClass =
                    "matrix-cell w-[80px] min-w-[80px] p-1.5 text-center font-sans border-t border-b select-none cursor-pointer transition-all duration-100 transform hover:scale-102 hover:shadow-2xs";
                  cellStyle = `background-color: ${aspect.color}0f; border-color: ${aspect.color}40;`;
                } else {
                  // Empty / faded dash indicator for no aspect in aspect mode
                  cellContent = `
                                        <div class="flex items-center justify-center select-none font-mono text-[10px] text-neutral-200 dark:text-neutral-800/40">-</div>
                                    `;
                  cellClass =
                    "matrix-cell w-[80px] min-w-[80px] p-2 text-center select-none opacity-20 pointer-events-none";
                }
              }
            } else {
              // Blocked (crossed dome or not matching current matrix criteria)
              cellContent = `
                                <div class="flex items-center justify-center select-none font-mono text-[10px] text-neutral-200/50 dark:text-neutral-800/40">✕</div>
                            `;
              cellClass =
                "matrix-cell w-[80px] min-w-[80px] p-2 text-center bg-neutral-550/5 dark:bg-neutral-50/5 select-none cursor-not-allowed opacity-40";
            }
          } catch (err) {
            console.error("Error calculating matrix cell:", err);
          }

          html += `<td data-col="${colIndex}" data-row="${rowIndex}" class="${cellClass}" ${cellStyle ? `style="${cellStyle}"` : ""}>
                        ${cellContent}
                    </td>`;
        }
      }
    });

    html += "</tr>";
  });

  html += "</tbody>";
  return html;
}

function setupMatrixHover(table) {
  let activeRowHeader = null;
  let activeColHeader = null;
  let activeCell = null;

  table.addEventListener("mousemove", (e) => {
    const cell = e.target.closest("td.matrix-cell");
    if (cell === activeCell) return;

    // Clean up previous highlights
    if (activeRowHeader) {
      activeRowHeader.classList.add(
        "bg-neutral-50/70",
        "dark:bg-neutral-950/70",
      );
      activeRowHeader.classList.remove(
        "bg-neutral-200/90",
        "dark:bg-neutral-800/95",
        "text-neutral-900",
        "dark:text-neutral-50",
      );
      activeRowHeader = null;
    }
    if (activeColHeader) {
      activeColHeader.classList.add(
        "bg-neutral-50/70",
        "dark:bg-neutral-950/70",
      );
      activeColHeader.classList.remove(
        "bg-neutral-200/90",
        "dark:bg-neutral-800/95",
        "text-neutral-900",
        "dark:text-neutral-50",
      );
      activeColHeader = null;
    }
    if (activeCell) {
      activeCell.classList.remove(
        "ring-1",
        "ring-inset",
        "ring-neutral-400",
        "dark:ring-neutral-500",
        "bg-neutral-100/50",
        "dark:bg-neutral-900/30",
      );
      activeCell = null;
    }

    if (!cell) return;

    activeCell = cell;
    const colIndex = cell.getAttribute("data-col");
    const rowIndex = cell.getAttribute("data-row");

    if (colIndex !== null && rowIndex !== null) {
      // Find headers
      const rowHeader = table.querySelector(
        `td[data-matrix-row="${rowIndex}"]`,
      );
      const colHeader = table.querySelector(
        `th[data-matrix-col="${colIndex}"]`,
      );

      if (rowHeader) {
        rowHeader.classList.remove(
          "bg-neutral-50/70",
          "dark:bg-neutral-950/70",
        );
        rowHeader.classList.add(
          "bg-neutral-200/90",
          "dark:bg-neutral-800/95",
          "text-neutral-900",
          "dark:text-neutral-50",
        );
        activeRowHeader = rowHeader;
      }
      if (colHeader) {
        colHeader.classList.remove(
          "bg-neutral-50/70",
          "dark:bg-neutral-950/70",
        );
        colHeader.classList.add(
          "bg-neutral-200/90",
          "dark:bg-neutral-800/95",
          "text-neutral-900",
          "dark:text-neutral-50",
        );
        activeColHeader = colHeader;
      }

      // Highlight the exact hovered cell slightly
      cell.classList.add(
        "ring-1",
        "ring-inset",
        "ring-neutral-400",
        "dark:ring-neutral-500",
        "bg-neutral-100/50",
        "dark:bg-neutral-900/30",
      );
    }
  });

  table.addEventListener("mouseleave", () => {
    if (activeRowHeader) {
      activeRowHeader.classList.add(
        "bg-neutral-50/70",
        "dark:bg-neutral-950/70",
      );
      activeRowHeader.classList.remove(
        "bg-neutral-200/90",
        "dark:bg-neutral-800/95",
        "text-neutral-900",
        "dark:text-neutral-50",
      );
      activeRowHeader = null;
    }
    if (activeColHeader) {
      activeColHeader.classList.add(
        "bg-neutral-50/70",
        "dark:bg-neutral-950/70",
      );
      activeColHeader.classList.remove(
        "bg-neutral-200/90",
        "dark:bg-neutral-800/95",
        "text-neutral-900",
        "dark:text-neutral-50",
      );
      activeColHeader = null;
    }
    if (activeCell) {
      activeCell.classList.remove(
        "ring-1",
        "ring-inset",
        "ring-neutral-400",
        "dark:ring-neutral-500",
        "bg-neutral-100/50",
        "dark:bg-neutral-900/30",
      );
      activeCell = null;
    }
  });
}

let tabsInitialized = false;

function setupMatrixTabs() {
  if (tabsInitialized) return;
  tabsInitialized = true;

  const configs = [
    { type: "general", stateKey: "matrixModeGeneral" },
    { type: "zenith", stateKey: "matrixModeZenith" },
    { type: "nadir", stateKey: "matrixModeNadir" },
  ];

  configs.forEach((cfg) => {
    const angleBtn = document.getElementById(`tab-${cfg.type}-angle`);
    const aspectBtn = document.getElementById(`tab-${cfg.type}-aspect`);

    if (angleBtn) {
      angleBtn.addEventListener("click", () => {
        state[cfg.stateKey] = "ANGLE";
        updateTabVisuals();
        renderAspectMatrices();
      });
    }
    if (aspectBtn) {
      aspectBtn.addEventListener("click", () => {
        state[cfg.stateKey] = "ASPECT";
        updateTabVisuals();
        renderAspectMatrices();
      });
    }
  });
}

function updateTabVisuals() {
  if (!state.matrixModeGeneral) state.matrixModeGeneral = "ANGLE";
  if (!state.matrixModeZenith) state.matrixModeZenith = "ANGLE";
  if (!state.matrixModeNadir) state.matrixModeNadir = "ANGLE";

  const configs = [
    { type: "general", val: state.matrixModeGeneral },
    { type: "zenith", val: state.matrixModeZenith },
    { type: "nadir", val: state.matrixModeNadir },
  ];

  configs.forEach((cfg) => {
    const bgActive = [
      "bg-black",
      "dark:bg-white",
      "text-white",
      "dark:text-black",
    ];
    const bgInactive = [
      "text-neutral-500",
      "dark:text-neutral-400",
      "hover:text-black",
      "dark:hover:text-white",
    ];

    const angleBtn = document.getElementById(`tab-${cfg.type}-angle`);
    const aspectBtn = document.getElementById(`tab-${cfg.type}-aspect`);

    if (angleBtn) {
      angleBtn.classList.remove(...bgActive, ...bgInactive);
      if (cfg.val === "ANGLE") {
        angleBtn.classList.add(...bgActive);
      } else {
        angleBtn.classList.add(...bgInactive);
      }
    }

    if (aspectBtn) {
      aspectBtn.classList.remove(...bgActive, ...bgInactive);
      if (cfg.val === "ASPECT") {
        aspectBtn.classList.add(...bgActive);
      } else {
        aspectBtn.classList.add(...bgInactive);
      }
    }
  });
}

function renderAspectMatrices() {
  setupMatrixTabs();
  updateTabVisuals();

  const generalTable = document.getElementById("matrix-general-table");
  const zenithTable = document.getElementById("matrix-zenith-table");
  const nadirTable = document.getElementById("matrix-nadir-table");

  if (generalTable) {
    generalTable.style.tableLayout = "fixed";
    generalTable.innerHTML = generateMatrixHTML("MATRIX");
    setupMatrixHover(generalTable);
  }
  if (zenithTable) {
    zenithTable.style.tableLayout = "fixed";
    zenithTable.innerHTML = generateMatrixHTML("ZENITH");
    setupMatrixHover(zenithTable);
  }
  if (nadirTable) {
    nadirTable.style.tableLayout = "fixed";
    nadirTable.innerHTML = generateMatrixHTML("NADIR");
    setupMatrixHover(nadirTable);
  }

  if (typeof updateIndicators === "function") {
    updateIndicators();
  }
}

function updateAspectMatrices() {
  updateMatrixCells("MATRIX", document.getElementById("matrix-general-table"));
  updateMatrixCells("ZENITH", document.getElementById("matrix-zenith-table"));
  updateMatrixCells("NADIR", document.getElementById("matrix-nadir-table"));

  if (typeof updateIndicators === "function") {
    updateIndicators();
  }
}

function updateMatrixCells(matrixType, tableElement) {
  if (!tableElement || !tableElement.innerHTML.trim()) return;

  const items = ENTITIES.filter((item) => state.activeBodies.has(item.id));
  let mode = "ANGLE";
  if (matrixType === "ZENITH") {
    mode = state.matrixModeZenith || "ANGLE";
  } else if (matrixType === "NADIR") {
    mode = state.matrixModeNadir || "ANGLE";
  } else {
    mode = state.matrixModeGeneral || "ANGLE";
  }

  // It's possible the list of bodies changed, if so, we should do a full render
  // Let's check table size
  const currentRows = tableElement.querySelectorAll("tbody tr");
  if (currentRows.length !== items.length) {
    tableElement.innerHTML = generateMatrixHTML(matrixType);
    setupMatrixHover(tableElement);
    return;
  }

  const cells = tableElement.querySelectorAll("td[data-col][data-row]");
  cells.forEach((cell) => {
    const colIndex = parseInt(cell.getAttribute("data-col"));
    const rowIndex = parseInt(cell.getAttribute("data-row"));

    const isDiagonal = rowIndex === colIndex;
    if (isDiagonal) return;

    const isUpper = rowIndex < colIndex;
    const isLower = rowIndex > colIndex;

    let isKosong = false;
    if (matrixType === "ZENITH" && isLower) {
      isKosong = true;
    } else if (matrixType === "NADIR" && isUpper) {
      isKosong = true;
    }

    if (isKosong) return;

    const rowItem = items[rowIndex];
    const colItem = items[colIndex];
    if (!rowItem || !colItem) return;

    let cellContent = "-";
    let cellClass =
      "matrix-cell w-[80px] min-w-[80px] p-2 text-center font-mono text-[10px] select-none cursor-pointer transition-colors duration-100 hover:bg-neutral-100/50 dark:hover:bg-neutral-900/30 text-neutral-350 dark:text-neutral-750";
    let cellStyle = "";
    let dataSignature = "";

    // Preserve hover outlines
    const isActiveHover = cell.classList.contains("ring-1");

    try {
      const identity = new Identity(rowItem, colItem, state.customDate);

      let isEligible = false;
      if (matrixType === "ZENITH") {
        isEligible = identity.isZenithZone;
      } else if (matrixType === "NADIR") {
        isEligible = identity.isNadirZone;
      } else if (matrixType === "MATRIX") {
        const isCrossDome = identity.isZenithSideA !== identity.isZenithSideB;
        if (isCrossDome) {
          if (isUpper && identity.isZenithSideA) {
            isEligible = true;
          } else if (isLower && identity.isNadirSideA) {
            isEligible = true;
          }
        }
      }

      if (identity.statsA && identity.statsB && isEligible) {
        const theta = identity.theta;

        if (mode === "ANGLE") {
          dataSignature = `angle-${theta.toFixed(1)}`;
          cellContent = `
                        <div class="flex flex-col items-center justify-center select-none leading-none">
                            <span class="text-[10px] font-bold text-neutral-800 dark:text-neutral-200">${theta.toFixed(1)}°</span>
                        </div>
                    `;
          cellClass =
            "matrix-cell w-[80px] min-w-[80px] p-2 text-center font-mono leading-none select-none cursor-pointer transition-colors duration-100 hover:bg-neutral-100/50 dark:hover:bg-neutral-900/40 text-neutral-600 dark:text-neutral-300";
        } else {
          const aspect = identity.aspect;
          if (aspect) {
            dataSignature = `aspect-${aspect.id}-${theta.toFixed(1)}-${aspect.deviation.toFixed(1)}`;
            cellContent = `
                            <div class="flex flex-col items-center justify-center gap-0.5 select-none leading-none">
                                <span class="text-xs font-extrabold flex items-center gap-0.5 mb-0.5 tracking-tighter shadow-3xs" style="color: ${aspect.color};">
                                    <span class="text-xs leading-none mr-0.5">${aspect.symbol}</span>
                                    <span class="text-[8px] leading-none uppercase font-black">${aspect.id}</span>
                                </span>
                                <span class="text-[9.5px] font-bold text-neutral-800 dark:text-neutral-200">${theta.toFixed(1)}°</span>
                                <span class="text-[8px] text-neutral-400 dark:text-neutral-500 font-semibold font-mono">dev ${aspect.deviation.toFixed(1)}°</span>
                            </div>
                        `;
            cellClass =
              "matrix-cell w-[80px] min-w-[80px] p-1.5 text-center font-sans border-t border-b select-none cursor-pointer transition-all duration-100 transform hover:scale-102 hover:shadow-2xs";
            cellStyle = `background-color: ${aspect.color}0f; border-color: ${aspect.color}40;`;
          } else {
            dataSignature = "aspect-none";
            cellContent = `
                            <div class="flex items-center justify-center select-none font-mono text-[10px] text-neutral-200 dark:text-neutral-800/40">-</div>
                        `;
            cellClass =
              "matrix-cell w-[80px] min-w-[80px] p-2 text-center select-none opacity-20 pointer-events-none";
          }
        }
      } else {
        dataSignature = "blocked";
        cellContent = `
                    <div class="flex items-center justify-center select-none font-mono text-[10px] text-neutral-200/50 dark:text-neutral-800/40">✕</div>
                `;
        cellClass =
          "matrix-cell w-[80px] min-w-[80px] p-2 text-center bg-neutral-550/5 dark:bg-neutral-50/5 select-none cursor-not-allowed opacity-40";
      }
    } catch (err) {
      dataSignature = "error";
      console.error("Error updating matrix cell:", err);
    }

    if (isActiveHover) {
      cellClass +=
        " ring-1 ring-inset ring-neutral-400 dark:ring-neutral-500 bg-neutral-100/50 dark:bg-neutral-900/30";
    }

    const currentClass = cell.className.replace(/\s*flash-update/g, "");
    const currentSignature = cell.getAttribute("data-signature");

    if (currentSignature !== dataSignature || currentClass !== cellClass) {
      cell.setAttribute("data-signature", dataSignature);
      cell.className = cellClass;
      cell.innerHTML = cellContent;
      if (cellStyle) {
        cell.style.cssText = cellStyle;
      } else {
        cell.removeAttribute("style");
      }

      // Add flash effect
      cell.classList.remove("flash-update");
      void cell.offsetWidth; // trigger reflow
      cell.classList.add("flash-update");
    }
  });
}

/**
 * Generates helper badges for the target entity with support for Zenith/Nadir nodes
 */
function getIndicatorEntityBadge(entityId) {
  const entity = ENTITIES.find(e => e.id === entityId);
  if (!entity) return `<span class="font-mono text-[9.5px]">${entityId}</span>`;
  const bgStyle = entity.color ? `background-color: ${entity.color};` : 'background-color: #64748b;';
  let badgeClass = "w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 select-none";
  if (entityId.includes("-zenith")) {
    badgeClass = "w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-black font-mono text-black dark:text-white bg-slate-100 dark:bg-neutral-900 border border-black dark:border-white shrink-0 select-none";
  } else if (entityId.includes("-nadir")) {
    badgeClass = "w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-black font-mono text-white dark:text-black bg-neutral-950 dark:bg-white border border-white dark:border-black shrink-0 select-none";
  }

  return `
    <span class="inline-flex items-center gap-1.5 px-1.5 py-0.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/30">
      <span class="${badgeClass}" style="${!entityId.includes("-zenith") && !entityId.includes("-nadir") ? bgStyle : ''}">
        ${entity.symbol}
      </span>
      <span class="font-bold text-[9.5px] uppercase tracking-wider text-black dark:text-white font-sans">${entity.label || entityId}</span>
    </span>
  `;
}

/**
 * Calculates and renders all indicator categories for a specific matrix type using the data from identity.js
 */
function calculateIndicatorsForMatrix(matrixType, badgeElementId, listAngleElementId, listAspectElementId) {
  const badgeEl = document.getElementById(badgeElementId);

  // Backward compatibility check
  let listAngleEl, listAspectEl;
  if (!listAspectElementId) {
    const mapList = {
      "indicator-list-general": ["indicator-list-general-angle", "indicator-list-general-aspect"],
      "indicator-list-zenith": ["indicator-list-zenith-angle", "indicator-list-zenith-aspect"],
      "indicator-list-nadir": ["indicator-list-nadir-angle", "indicator-list-nadir-aspect"],
      "anomaly-list-general": ["indicator-list-general-angle", "indicator-list-general-aspect"],
      "anomaly-list-zenith": ["indicator-list-zenith-angle", "indicator-list-zenith-aspect"],
      "anomaly-list-nadir": ["indicator-list-nadir-angle", "indicator-list-nadir-aspect"]
    };
    if (mapList[listAngleElementId]) {
      listAngleEl = document.getElementById(mapList[listAngleElementId][0]);
      listAspectEl = document.getElementById(mapList[listAngleElementId][1]);
    } else {
      listAngleEl = document.getElementById(listAngleElementId);
    }
  } else {
    listAngleEl = document.getElementById(listAngleElementId);
    listAspectEl = document.getElementById(listAspectElementId);
  }

  if (!listAngleEl && !listAspectEl) return;

  const data = getIndicatorsData(matrixType);
  if (!data) {
    const emptyMsg = `
      <div class="w-full text-center py-6 text-neutral-400 dark:text-neutral-500 font-sans text-[11px] border border-dashed border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-950/20">
        Pilih minimal 2 benda aktif untuk kalkulasi indikator.
      </div>
    `;
    if (listAngleEl) listAngleEl.innerHTML = emptyMsg;
    if (listAspectEl) listAspectEl.innerHTML = emptyMsg;
    if (badgeEl) {
      badgeEl.innerText = "0 DETECTED";
      badgeEl.className = "font-mono text-[9px] px-2 py-0.5 rounded-none bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest leading-none";
    }
    return;
  }

  const {
    activeEntities,
    identitiesList,
    a1Indicators,
    a2Indicators,
    a3Indicators,
    s0Indicators,
    s1Indicators,
    s2Indicators,
    s3Indicators
  } = data;

  // ==========================================
  // X0: ALL DEGREE (Normal Angle Engine)
  // ==========================================
  const x0Indicators = [...identitiesList].sort((a, b) => a.theta - b.theta);

  // ========================================================
  // RENDER HTML TEMPLATES FOR CARDS
  // ========================================================

  // X0 — ALL DEGREE HTML Output
  const x0Htmls = [];
  x0Indicators.forEach((iden) => {
    x0Htmls.push(`
      <div class="hover:bg-neutral-50/25 dark:hover:bg-neutral-900/10 p-2.5 border border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col gap-1.5 transition-colors bg-white/50 dark:bg-black/40">
        <div class="flex items-center justify-between">
          <span class="text-[8px] font-bold font-mono tracking-wider text-neutral-400 dark:text-neutral-500">
            OBSERVED ANGLE
          </span>
          <span class="font-mono text-[9.5px] font-extrabold text-black dark:text-white">
            ${iden.theta.toFixed(1)}°
          </span>
        </div>
        <div class="flex flex-col gap-1 font-sans">
          <div class="flex items-center gap-1 flex-wrap">
            ${getIndicatorEntityBadge(iden.entityA.id)} <span class="text-neutral-400 dark:text-neutral-600 font-bold">─</span> ${getIndicatorEntityBadge(iden.entityB.id)}
          </div>
          ${iden.aspect ? `
            <div class="text-[8.5px] font-mono leading-none flex items-center gap-1.5 mt-1" style="color: ${iden.aspect.color};">
              <span class="font-bold">${iden.aspect.symbol} ${iden.aspect.id}</span>
              <span class="text-neutral-400 dark:text-neutral-500 font-normal">dev ${(iden.theta - iden.aspect.angle).toFixed(1)}°</span>
            </div>
          ` : `
            <div class="text-[8px] font-mono text-neutral-400 dark:text-neutral-600 leading-none mt-1 uppercase">
              No resonance aspect active
            </div>
          `}
        </div>
      </div>
    `);
  });

  // A1 — SAME VALUE DEGREE HTML Output
  const a1Htmls = [];
  a1Indicators.forEach(({ id1, id2, deg }) => {
    a1Htmls.push(`
      <div class="hover:bg-neutral-50/25 dark:hover:bg-neutral-900/10 p-2.5 border border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col gap-2 transition-colors bg-white/50 dark:bg-black/40">
        <div class="flex items-center justify-between">
          <span class="text-[8px] font-bold font-mono tracking-wider text-neutral-400 dark:text-neutral-500">
            RESONANT COINCIDENCE
          </span>
          <span class="text-[10px] font-black font-mono text-black dark:text-white">
            ${deg}°
          </span>
        </div>
        <div class="flex flex-col gap-1.5 font-sans">
          <div class="flex items-center gap-1.5 flex-wrap">
            ${getIndicatorEntityBadge(id1.entityA.id)} <span class="text-neutral-400 dark:text-neutral-600 font-bold">─</span> ${getIndicatorEntityBadge(id1.entityB.id)} <span class="font-mono text-[9px] text-neutral-500 dark:text-neutral-400">(${id1.theta.toFixed(1)}°)</span>
          </div>
          <div class="flex items-center gap-1.5 flex-wrap">
            ${getIndicatorEntityBadge(id2.entityA.id)} <span class="text-neutral-400 dark:text-neutral-600 font-bold">─</span> ${getIndicatorEntityBadge(id2.entityB.id)} <span class="font-mono text-[9px] text-neutral-500 dark:text-neutral-400">(${id2.theta.toFixed(1)}°)</span>
          </div>
        </div>
      </div>
    `);
  });

  // A2 — ANCHORED SAME DEGREE HTML Output
  const a2Htmls = [];
  a2Indicators.forEach(({ id1, id2, anchor, other1, other2, deg }) => {
    a2Htmls.push(`
      <div class="hover:bg-neutral-50/25 dark:hover:bg-neutral-900/10 p-2.5 border border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col gap-2 transition-colors bg-white/50 dark:bg-black/40">
        <div class="flex items-center justify-between">
          <span class="text-[8px] font-bold font-mono tracking-wider text-neutral-400 dark:text-neutral-500">
            ANCHORED SYMMETRY
          </span>
          <span class="text-[10px] font-black font-mono text-black dark:text-white">
            ${deg}°
          </span>
        </div>
        <div class="flex flex-col gap-1.5 font-sans">
          <div class="text-[9px] text-neutral-500 font-mono flex items-center gap-1.5 uppercase font-bold tracking-wider">
            <span>ANCHOR:</span> ${getIndicatorEntityBadge(anchor.id)}
          </div>
          <div class="flex flex-col gap-1 pl-2.5 border-l border-neutral-200 dark:border-neutral-800">
            <div class="flex items-center gap-1.5 flex-wrap">
              ${getIndicatorEntityBadge(other1.id)} <span class="text-neutral-400 dark:text-neutral-600">─</span> <span class="font-mono text-[9px] text-neutral-500">(${id1.theta.toFixed(1)}°)</span>
            </div>
            <div class="flex items-center gap-1.5 flex-wrap">
              ${getIndicatorEntityBadge(other2.id)} <span class="text-neutral-400 dark:text-neutral-600">─</span> <span class="font-mono text-[9px] text-neutral-500">(${id2.theta.toFixed(1)}°)</span>
            </div>
          </div>
        </div>
      </div>
    `);
  });

  // A3 — SAME ASPECT PAIR HTML Output
  const a3Htmls = [];
  a3Indicators.forEach(({ id1, id2, aspect }) => {
    a3Htmls.push(`
      <div class="hover:bg-neutral-50/25 dark:hover:bg-neutral-900/10 p-2.5 border border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col gap-2 transition-colors bg-white/50 dark:bg-black/40">
        <div class="flex items-center justify-between">
          <span class="text-[8px] font-bold font-mono tracking-wider text-neutral-400 dark:text-neutral-500">
            DUAL SPECIFIED ASPECT
          </span>
          <span class="inline-flex items-center gap-1 text-[9.5px] font-extrabold font-sans uppercase" style="color: ${aspect.color};">
            <span>${aspect.symbol}</span>
            <span>${aspect.id}</span>
          </span>
        </div>
        <div class="flex flex-col gap-1.5 font-sans">
          <div class="flex items-center gap-1.5 flex-wrap">
            ${getIndicatorEntityBadge(id1.entityA.id)} <span class="text-neutral-400 dark:text-neutral-600 font-bold">─</span> ${getIndicatorEntityBadge(id1.entityB.id)} <span class="font-mono text-[9px] text-neutral-500">(${id1.theta.toFixed(1)}°)</span>
          </div>
          <div class="flex items-center gap-1.5 flex-wrap">
            ${getIndicatorEntityBadge(id2.entityA.id)} <span class="text-neutral-400 dark:text-neutral-600 font-bold">─</span> ${getIndicatorEntityBadge(id2.entityB.id)} <span class="font-mono text-[9px] text-neutral-500">(${id2.theta.toFixed(1)}°)</span>
          </div>
        </div>
      </div>
    `);
  });

  // S0 — IDENTITY ASPECT HTML Output
  const s0Htmls = [];
  s0Indicators.forEach((iden) => {
    const deviationVal = iden.theta - iden.aspect.angle;
    const formattedDev = (deviationVal >= 0 ? "+" : "") + deviationVal.toFixed(1);

    s0Htmls.push(`
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
              ${getIndicatorEntityBadge(iden.entityA.id)} <span class="text-neutral-400 dark:text-neutral-600 font-bold">─</span> ${getIndicatorEntityBadge(iden.entityB.id)}
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

  // S1 — ANCHORED MIXED ASPECT HTML Output
  const s1Htmls = [];
  s1Indicators.forEach(({ id1, id2, anchor, other1, other2, aspect1, aspect2 }) => {
    s1Htmls.push(`
      <div class="hover:bg-neutral-50/25 dark:hover:bg-neutral-900/10 p-2.5 border border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col gap-2 transition-colors bg-white/50 dark:bg-black/40">
        <div class="flex items-center justify-between">
          <span class="text-[8px] font-bold font-mono tracking-wider text-neutral-400 dark:text-neutral-500">
            DIVERGENT RESONANCE
          </span>
          <span class="text-[8px] font-bold font-mono text-neutral-400 uppercase tracking-widest">
            MIXED
          </span>
        </div>
        <div class="flex flex-col gap-1.5 font-sans">
          <div class="text-[9px] text-neutral-500 font-mono flex items-center gap-1.5 uppercase font-bold tracking-wider">
            <span>ANCHOR:</span> ${getIndicatorEntityBadge(anchor.id)}
          </div>
          <div class="flex flex-col gap-1.5 pl-2.5 border-l border-neutral-200 dark:border-neutral-800">
            <div class="flex items-center gap-1.5 flex-wrap justify-between pr-1">
              <div class="flex items-center gap-1">${getIndicatorEntityBadge(other1.id)} <span class="font-mono text-[9px] text-neutral-400">(${id1.theta.toFixed(1)}°)</span></div>
              <span class="inline-flex items-center gap-0.5 text-[9px] font-extrabold" style="color: ${aspect1.color}; font-family: monospace;">
                <span>${aspect1.symbol}</span>
                <span>${aspect1.id}</span>
              </span>
            </div>
            <div class="flex items-center gap-1.5 flex-wrap justify-between pr-1 border-t border-dashed border-neutral-100 dark:border-neutral-900/20 pt-1">
              <div class="flex items-center gap-1">${getIndicatorEntityBadge(other2.id)} <span class="font-mono text-[9px] text-neutral-400">(${id2.theta.toFixed(1)}°)</span></div>
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

  // S2 — ANCHORED SAME ASPECT HTML Output
  const s2Htmls = [];
  s2Indicators.forEach(({ id1, id2, anchor, other1, other2, aspect }) => {
    s2Htmls.push(`
      <div class="hover:bg-neutral-50/25 dark:hover:bg-neutral-900/10 p-2.5 border border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col gap-2 transition-colors bg-white/50 dark:bg-black/40">
        <div class="flex items-center justify-between">
          <span class="text-[8px] font-bold font-mono tracking-wider text-neutral-400 dark:text-neutral-500">
            RESONANCE REPETITION
          </span>
          <span class="inline-flex items-center gap-1 text-[9.5px] font-extrabold font-sans uppercase" style="color: ${aspect.color};">
            <span>${aspect.symbol}</span>
            <span>${aspect.id}</span>
          </span>
        </div>
        <div class="flex flex-col gap-1.5 font-sans">
          <div class="text-[9px] text-neutral-500 font-mono flex items-center gap-1.5 uppercase font-bold tracking-wider">
            <span>ANCHOR:</span> ${getIndicatorEntityBadge(anchor.id)}
          </div>
          <div class="flex flex-col gap-1 pl-2.5 border-l border-neutral-200 dark:border-neutral-800">
            <div class="flex items-center gap-1.5 flex-wrap">
              ${getIndicatorEntityBadge(other1.id)} <span class="text-neutral-400 dark:text-neutral-600">─</span> <span class="font-mono text-[9px] text-neutral-500">(${id1.theta.toFixed(1)}°)</span>
            </div>
            <div class="flex items-center gap-1.5 flex-wrap">
              ${getIndicatorEntityBadge(other2.id)} <span class="text-neutral-400 dark:text-neutral-600">─</span> <span class="font-mono text-[9px] text-neutral-500">(${id2.theta.toFixed(1)}°)</span>
            </div>
          </div>
        </div>
      </div>
    `);
  });

  // S3 — TRIANGULAR LOCK HTML Output
  const s3Htmls = [];
  s3Indicators.forEach(({ bodyA, bodyB, bodyC, aspect, idenAB, idenBC, idenAC }) => {
    s3Htmls.push(`
      <div class="hover:bg-neutral-50/25 dark:hover:bg-neutral-900/10 p-2.5 border border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col gap-2.5 transition-colors bg-white/50 dark:bg-black/40">
        <div class="flex items-center justify-between">
          <span class="text-[8px] font-bold font-mono tracking-wider text-neutral-400 dark:text-neutral-500">
            CLOSED LOOP THREE-BODY
          </span>
          <span class="inline-flex items-center gap-1 text-[9.5px] font-extrabold font-sans uppercase" style="color: ${aspect.color};">
            <span>${aspect.symbol}</span>
            <span>${aspect.id}</span>
          </span>
        </div>
        <div class="flex flex-col gap-1 font-sans pl-2.5 border-l" style="border-color: ${aspect.color}; font-family: sans-serif;">
          <div class="flex items-center gap-1 flex-wrap">
            ${getIndicatorEntityBadge(bodyA.id)} <span class="text-neutral-400 dark:text-neutral-600 font-bold">─</span> ${getIndicatorEntityBadge(bodyB.id)} <span class="font-mono text-[8.5px] text-neutral-400">(${idenAB.theta.toFixed(1)}°)</span>
          </div>
          <div class="flex items-center gap-1 flex-wrap">
            ${getIndicatorEntityBadge(bodyB.id)} <span class="text-neutral-400 dark:text-neutral-600 font-bold">─</span> ${getIndicatorEntityBadge(bodyC.id)} <span class="font-mono text-[8.5px] text-neutral-400">(${idenBC.theta.toFixed(1)}°)</span>
          </div>
          <div class="flex items-center gap-1 flex-wrap">
            ${getIndicatorEntityBadge(bodyA.id)} <span class="text-neutral-400 dark:text-neutral-600 font-bold">─</span> ${getIndicatorEntityBadge(bodyC.id)} <span class="font-mono text-[8.5px] text-neutral-400">(${idenAC.theta.toFixed(1)}°)</span>
          </div>
        </div>
      </div>
    `);
  });

  // Calculate Total Elements Detected (excluding X0 Engine as requested)
  const totalCount = a1Indicators.length + a2Indicators.length + a3Indicators.length + s0Indicators.length + s1Indicators.length + s2Indicators.length + s3Indicators.length;
  if (badgeEl) {
    badgeEl.innerText = `${totalCount}`;
    if (totalCount > 0) {
      badgeEl.className = "font-mono text-[9px] px-2 py-0.5 rounded-none bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white font-bold uppercase tracking-widest leading-none";
    } else {
      badgeEl.className = "font-mono text-[9px] px-2 py-0.5 rounded-none bg-transparent border border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-600 font-bold uppercase tracking-widest leading-none";
    }
  }

  // Visual layout sizing module containing local scroll
  function makeBoxHTML(categoryCode, label, items) {
    const contentHtml = items.length > 0
      ? `<div class="space-y-2 pb-1">${items.join('\n')}</div>`
      : `
        <div class="h-full flex flex-col items-center justify-center text-center py-10 text-neutral-400 dark:text-neutral-500 font-mono text-[9px] uppercase tracking-widest select-none bg-neutral-50/50 dark:bg-neutral-900/10 border border-dashed border-neutral-200 dark:border-neutral-800">
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
          <span class="font-mono text-[9px] min-w-5 h-5 flex items-center justify-center rounded-none border ${items.length > 0 ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white font-bold' : 'text-neutral-400 dark:text-neutral-600 border-neutral-200 dark:border-neutral-800'}">
            ${items.length}
          </span>
        </div>
        <div class="flex-1 overflow-y-auto space-y-2 pr-1 fancy-scrollbar" style="scrollbar-width: thin;">
          ${contentHtml}
        </div>
      </div>
    `;
  }

  const anomaliesList = (typeof getAnomaliesList === "function") ? getAnomaliesList() : [];
  const a1Config = anomaliesList.find(a => a.key === "A1") || { id: "A1", name: "SAME VALUE DEGREE" };
  const a2Config = anomaliesList.find(a => a.key === "A2") || { id: "A2", name: "ANCHORED SAME DEGREE" };
  const a3Config = anomaliesList.find(a => a.key === "A3") || { id: "S1", name: "SAME ASPECT PAIR" };
  const s1Config = anomaliesList.find(a => a.key === "S1") || { id: "S2", name: "ANCHORED MIXED ASPECT" };
  const s2Config = anomaliesList.find(a => a.key === "S2") || { id: "S3", name: "ANCHORED SAME ASPECT" };
  const s3Config = anomaliesList.find(a => a.key === "S3") || { id: "S4", name: "TRIANGULAR LOCK" };

  // Compose Angle boxes (A1, A2)
  const angleBoxesHtml = [
    makeBoxHTML(a1Config.id, a1Config.name, a1Htmls),
    makeBoxHTML(a2Config.id, a2Config.name, a2Htmls)
  ].join('\n');

  // Compose Aspect boxes (S0, S1, S2, S3, S4)
  const aspectBoxesHtml = [
    makeBoxHTML("S0", "IDENTITY ASPECT", s0Htmls),
    makeBoxHTML(a3Config.id, a3Config.name, a3Htmls),
    makeBoxHTML(s1Config.id, s1Config.name, s1Htmls),
    makeBoxHTML(s2Config.id, s2Config.name, s2Htmls),
    makeBoxHTML(s3Config.id, s3Config.name, s3Htmls)
  ].join('\n');

  if (listAngleEl && listAspectEl) {
    listAngleEl.innerHTML = angleBoxesHtml;
    listAspectEl.innerHTML = aspectBoxesHtml;
  } else if (listAngleEl) {
    listAngleEl.innerHTML = [angleBoxesHtml, aspectBoxesHtml].join('\n');
  }
}

/**
 * Main indicators update triggers for all three matrices (Zenith, Nadir, General Matrix)
 */
function updateIndicators() {
  const activeSubject =
    state.subjects.find((s) => s.id === state.selectedSubjectId) ||
    state.subjects[0];
  if (!activeSubject) return;

  calculateIndicatorsForMatrix("MATRIX", "indicator-badge-general", "indicator-list-general-angle", "indicator-list-general-aspect");
  calculateIndicatorsForMatrix("ZENITH", "indicator-badge-zenith", "indicator-list-zenith-angle", "indicator-list-zenith-aspect");
  calculateIndicatorsForMatrix("NADIR", "indicator-badge-nadir", "indicator-list-nadir-angle", "indicator-list-nadir-aspect");
}

// Global scope hooks for backward compatibility
window.getIndicatorEntityBadge = getIndicatorEntityBadge;
window.calculateIndicatorsForMatrix = calculateIndicatorsForMatrix;
window.updateIndicators = updateIndicators;

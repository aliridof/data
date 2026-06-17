// js/app.js
function gameLoop() {
  if (!state.timeMachineEnabled) {
    state.customDate = new Date();
  }

  updateMap();
  updateTimeUI();
  updateBodyStats();

  if (
    typeof updateAspectMatrices === "function" &&
    state.mapMode === "MATRIX"
  ) {
    updateAspectMatrices();
  }

  if (
    typeof updateLuckMode === "function" &&
    state.mapMode === "LUCK"
  ) {
    updateLuckMode();
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // Initialize Swiss Ephemeris WASM module
  await initAstro();

  initMap();
  renderBodies();

  if (typeof initAspectsConfig === "function") {
    initAspectsConfig();
  }

  const storageResetBtn = document.getElementById("storage-reset");
  if (storageResetBtn) {
    storageResetBtn.addEventListener("click", () => {
      if (
        confirm(
          "Kamu yakin ingin menghapus semua data (Clear Storage) dan memuat ulang?",
        )
      ) {
        localStorage.clear();
        window.location.reload();
      }
    });
  }

  // Interval for regular 1-second ticks
  setInterval(() => {
    if (!state.timeMachineEnabled) {
      gameLoop();
    }
  }, 1000);

  // Low-latency high-frequency interval for smooth playback multiplier logic
  setInterval(() => {
    if (state.timeMachineEnabled && state.isPlaying) {
      const direction = state.playDirection === "BACKWARD" ? -1 : 1;
      state.customDate = new Date(
        state.customDate.getTime() + direction * state.speed * 100,
      );
      gameLoop();
    }
  }, 100);

  // Boot up
  gameLoop();
});

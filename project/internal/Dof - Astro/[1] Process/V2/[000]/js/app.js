// js/app.js
function gameLoop() {
    if (!state.timeMachineEnabled) {
        state.customDate = new Date();
    }
    
    updateMap();
    updateTimeUI();
    updateBodyStats();
}

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Swiss Ephemeris WASM module
    await initAstro();

    initMap();
    renderBodies();

    // Interval for regular 1-second ticks
    setInterval(() => {
        if (!state.timeMachineEnabled) {
            gameLoop();
        }
    }, 1000);
    
    // Low-latency high-frequency interval for smooth playback multiplier logic
    setInterval(() => {
        if (state.timeMachineEnabled && state.isPlaying) {
            const direction = state.playDirection === 'BACKWARD' ? -1 : 1;
            state.customDate = new Date(state.customDate.getTime() + (direction * state.speed * 100));
            gameLoop();
        }
    }, 100);
    
    // Boot up
    gameLoop();
});


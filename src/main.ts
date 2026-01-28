/**
 * Particle Emergence - Main Entry Point
 */

import { createInitialState, loadGame, applyOfflineProgress, saveGame } from './core/state';
import { createGameLoop } from './core/gameLoop';
import { render, setGameLoop } from './ui/renderer';
import { initEventDelegation } from './ui/eventDelegation';
import { formatTime } from './utils/format';

// Initialize the game
function init(): void {
  console.log('Particle Emergence - Initializing...');

  // Try to load saved game
  let state = loadGame();
  const now = Date.now();

  if (state) {
    // Calculate offline progress
    const offlineTime = now - state.lastTick;
    if (offlineTime > 1000) {
      state = applyOfflineProgress(state, now);
      const displayTime = formatTime(offlineTime);
      console.log(`Applied ${displayTime} of offline progress`);

      // Show offline progress notification
      setTimeout(() => {
        showOfflineNotification(offlineTime);
      }, 500);
    }
  } else {
    // New game
    state = createInitialState();
    console.log('Starting new game');
  }

  // Update session start time
  state.stats.sessionStart = now;

  // Create game loop
  const gameLoop = createGameLoop(state, render);
  setGameLoop(gameLoop);

  // Initialize event delegation (attaches event listeners once)
  initEventDelegation();

  // Start the loop
  gameLoop.start();

  // Save on page unload
  window.addEventListener('beforeunload', () => {
    saveGame(gameLoop.getState());
  });

  // Initial render
  render(gameLoop.getState());

  console.log('Game initialized successfully');
}

function showOfflineNotification(offlineTime: number): void {
  const displayTime = formatTime(offlineTime);

  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 25px;
    background: #1a1a25;
    border: 1px solid #4a9eff;
    border-radius: 8px;
    color: #e8e8f0;
    font-family: monospace;
    font-size: 14px;
    z-index: 10000;
    animation: fadeIn 0.3s ease;
  `;
  notification.innerHTML = `
    <strong>Welcome back!</strong><br>
    <span style="color: #a0a0b0;">You were away for ${displayTime}</span><br>
    <span style="color: #4aff7a;">Offline progress applied (60% efficiency)</span>
  `;

  // Add fade-in animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeOut {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(-10px); }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(notification);

  // Remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

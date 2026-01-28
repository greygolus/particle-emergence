/**
 * Stats Tab
 * Uses create/update pattern for efficient DOM updates
 */

import { GameState } from '../../types';
import { formatNumber, formatTime } from '../../utils/format';
import { setText } from '../uiUpdater';

let lastTab = '';

export function renderStatsTab(container: HTMLElement, state: GameState): void {
  const needsCreate = !container.querySelector('.stats-tab') || lastTab !== 'stats';

  if (needsCreate) {
    createStatsTab(container, state);
    lastTab = 'stats';
  } else {
    updateStatsTab(container, state);
  }
}

function createStatsTab(container: HTMLElement, _state: GameState): void {
  let html = `
    <div class="tab-content stats-tab">
      <section class="card">
        <h2>Session Statistics</h2>
        <div class="stats-grid">
          <div class="stat">
            <span class="label">Session Time:</span>
            <span class="value" data-bind="stats-session-time"></span>
          </div>
          <div class="stat">
            <span class="label">Total Play Time:</span>
            <span class="value" data-bind="stats-play-time"></span>
          </div>
        </div>
      </section>

      <section class="card">
        <h2>Currency Statistics</h2>
        <div class="stats-grid">
          <div class="stat">
            <span class="label">Total Pq Earned:</span>
            <span class="value" data-bind="stats-pq-earned"></span>
          </div>
          <div class="stat">
            <span class="label">Total Pl Earned:</span>
            <span class="value" data-bind="stats-pl-earned"></span>
          </div>
          <div class="stat">
            <span class="label">Total Energy Produced:</span>
            <span class="value" data-bind="stats-energy-produced"></span>
          </div>
        </div>
      </section>

      <section class="card">
        <h2>Collider Statistics</h2>
        <div class="stats-grid">
          <div class="stat">
            <span class="label">Total Collider Runs:</span>
            <span class="value" data-bind="stats-collider-runs"></span>
          </div>
          <div class="stat">
            <span class="label">Upgrade Successes:</span>
            <span class="value" data-bind="stats-upgrade-successes"></span>
          </div>
          <div class="stat">
            <span class="label">Success Rate:</span>
            <span class="value" data-bind="stats-success-rate"></span>
          </div>
          <div class="stat">
            <span class="label">Exotic Events:</span>
            <span class="value" data-bind="stats-exotic-events"></span>
          </div>
        </div>
      </section>

      <section class="card">
        <h2>Production Statistics</h2>
        <div class="stats-grid">
          <div class="stat">
            <span class="label">Total Annihilations:</span>
            <span class="value" data-bind="stats-annihilations"></span>
          </div>
          <div class="stat">
            <span class="label">Protons Built:</span>
            <span class="value" data-bind="stats-protons-built"></span>
          </div>
          <div class="stat">
            <span class="label">Neutrons Built:</span>
            <span class="value" data-bind="stats-neutrons-built"></span>
          </div>
          <div class="stat">
            <span class="label">Atom Units Built:</span>
            <span class="value" data-bind="stats-atoms-built"></span>
          </div>
        </div>
      </section>

      <section class="card">
        <h2>Progression Statistics</h2>
        <div class="stats-grid">
          <div class="stat">
            <span class="label">Current Level:</span>
            <span class="value" data-bind="stats-current-level"></span>
          </div>
          <div class="stat">
            <span class="label">Highest Level:</span>
            <span class="value" data-bind="stats-highest-level"></span>
          </div>
          <div class="stat">
            <span class="label">Total Emerges:</span>
            <span class="value" data-bind="stats-total-emerges"></span>
          </div>
          <div class="stat">
            <span class="label">Elements Unlocked:</span>
            <span class="value" data-bind="stats-elements-unlocked"></span>
          </div>
        </div>
      </section>

      <section class="card">
        <h2>Current Resources</h2>
        <div class="stats-grid">
          <div class="stat">
            <span class="label">Pq:</span>
            <span class="value" data-bind="stats-pq"></span>
          </div>
          <div class="stat">
            <span class="label">Pl:</span>
            <span class="value" data-bind="stats-pl"></span>
          </div>
          <div class="stat">
            <span class="label">Energy:</span>
            <span class="value" data-bind="stats-energy"></span>
          </div>
          <div class="stat">
            <span class="label">Debris:</span>
            <span class="value" data-bind="stats-debris"></span>
          </div>
          <div class="stat">
            <span class="label">Automation Chips:</span>
            <span class="value" data-bind="stats-chips"></span>
          </div>
        </div>
      </section>

      <section class="card danger-zone">
        <h2>Danger Zone</h2>
        <p class="warning">These actions cannot be undone!</p>
        <div class="danger-buttons">
          <button class="btn btn-danger" data-action="hard-reset">
            Hard Reset (Delete All Progress)
          </button>
        </div>
      </section>
    </div>
  `;

  container.innerHTML = html;
}

function updateStatsTab(container: HTMLElement, state: GameState): void {
  const sessionTime = Date.now() - state.stats.sessionStart;

  // Session stats
  setText(container, 'stats-session-time', formatTime(sessionTime));
  setText(container, 'stats-play-time', formatTime(state.stats.playTime));

  // Currency stats
  setText(container, 'stats-pq-earned', formatNumber(state.stats.totalPqEarned));
  setText(container, 'stats-pl-earned', formatNumber(state.stats.totalPlEarned));
  setText(container, 'stats-energy-produced', formatNumber(state.stats.totalEnergyProduced));

  // Collider stats
  setText(container, 'stats-collider-runs', formatNumber(state.stats.totalColliderRuns));
  setText(container, 'stats-upgrade-successes', formatNumber(state.stats.totalUpgradeSuccesses));
  const successRate = state.stats.totalColliderRuns > 0
    ? ((state.stats.totalUpgradeSuccesses / state.stats.totalColliderRuns) * 100).toFixed(1)
    : '0';
  setText(container, 'stats-success-rate', `${successRate}%`);
  setText(container, 'stats-exotic-events', formatNumber(state.stats.totalExoticEvents));

  // Production stats
  setText(container, 'stats-annihilations', formatNumber(state.stats.totalAnnihilations));
  setText(container, 'stats-protons-built', formatNumber(state.stats.totalProtonsBuilt));
  setText(container, 'stats-neutrons-built', formatNumber(state.stats.totalNeutronsBuilt));
  setText(container, 'stats-atoms-built', formatNumber(state.stats.totalAtomsBuilt));

  // Progression stats
  setText(container, 'stats-current-level', `E${state.currentEmergentLevel}`);
  setText(container, 'stats-highest-level', `E${state.highestEmergentLevel}`);
  setText(container, 'stats-total-emerges', String(state.stats.totalEmerges));
  setText(container, 'stats-elements-unlocked', String(state.stats.elementsUnlocked));

  // Current resources
  setText(container, 'stats-pq', formatNumber(state.pq));
  setText(container, 'stats-pl', formatNumber(state.pl));
  setText(container, 'stats-energy', formatNumber(state.energy));
  setText(container, 'stats-debris', formatNumber(state.debris));
  setText(container, 'stats-chips', formatNumber(state.automation.chips));
}

/**
 * Forces Tab - Boson management
 * Uses create/update pattern for efficient DOM updates
 */

import { GameState } from '../../types';
import { formatNumber, formatPercent } from '../../utils/format';
import { BALANCE } from '../../config/balance';
import { canRunBosonCollider } from '../../systems/collider';
import { setText, setDisabled, setVisible, setClass } from '../uiUpdater';

let lastTab = '';
let lastBosonModeUnlocked = false;

export function renderForcesTab(container: HTMLElement, state: GameState): void {
  const needsCreate = !container.querySelector('.forces-tab') ||
    lastTab !== 'forces' ||
    lastBosonModeUnlocked !== state.colliderUpgrades.bosonModeUnlocked;

  if (needsCreate) {
    createForcesTab(container, state);
    lastTab = 'forces';
    lastBosonModeUnlocked = state.colliderUpgrades.bosonModeUnlocked;
  } else {
    updateForcesTab(container, state);
  }
}

function createForcesTab(container: HTMLElement, state: GameState): void {
  const cfg = BALANCE.forces;

  let html = `
    <div class="tab-content forces-tab">
      <section class="card">
        <h2>Fundamental Forces</h2>
        <p class="hint">Bosons are the carriers of fundamental forces. Collect them to enhance your capabilities.</p>

        <div class="boson-inventory-large">
          <div class="boson-card">
            <h3>W+ Boson</h3>
            <div class="boson-count" data-bind="boson-wp-count"></div>
            <p class="boson-effect">+${formatPercent(cfg.wBosonDecayBonus)} decay speed per boson</p>
            <p class="boson-current">Current bonus: <span data-bind="boson-wp-bonus"></span></p>
          </div>

          <div class="boson-card">
            <h3>W- Boson</h3>
            <div class="boson-count" data-bind="boson-wm-count"></div>
            <p class="boson-effect">+${formatPercent(cfg.wBosonDecayBonus)} decay speed per boson</p>
            <p class="boson-current">Current bonus: <span data-bind="boson-wm-bonus"></span></p>
          </div>

          <div class="boson-card">
            <h3>Z0 Boson</h3>
            <div class="boson-count" data-bind="boson-z0-count"></div>
            <p class="boson-effect">+${formatPercent(cfg.zBosonStabilityBonus)} stability per boson</p>
            <p class="boson-current">Current bonus: <span data-bind="boson-z0-bonus"></span></p>
          </div>

          <div class="boson-card higgs">
            <h3>Higgs Boson</h3>
            <div class="boson-count" data-bind="boson-higgs-count"></div>
            <p class="boson-effect">+${formatPercent(cfg.higgsEfficiencyBonus)} heavy fusion efficiency per boson</p>
            <p class="boson-current">Current bonus: <span data-bind="boson-higgs-bonus"></span></p>
          </div>
        </div>
      </section>

      <section class="card boson-collider">
        <h2>Boson Collider</h2>
        <p class="hint">High-energy collisions to produce force carrier bosons</p>

        <div class="collider-cost">
          <div class="cost-item" data-bind="boson-cost-pq">
            <span class="label">Pq:</span>
            <span class="value">${formatNumber(cfg.bosonCollider.pqCost)}</span>
          </div>
          <div class="cost-item" data-bind="boson-cost-pl">
            <span class="label">Pl:</span>
            <span class="value">${formatNumber(cfg.bosonCollider.plCost)}</span>
          </div>
          <div class="cost-item" data-bind="boson-cost-energy">
            <span class="label">Energy:</span>
            <span class="value">${formatNumber(cfg.bosonCollider.energyCost)}</span>
          </div>
        </div>

        <div class="collider-stats">
          <div class="stat">
            <span class="label">Boson Chance:</span>
            <span class="value">${formatPercent(cfg.bosonCollider.baseBosonChance)}</span>
          </div>
          <div class="stat">
            <span class="label">Boson Weights:</span>
            <span class="value">W+: 30% | W-: 30% | Z0: 25% | H: 15%</span>
          </div>
        </div>

        <button class="btn btn-large" data-bind="run-boson-btn" data-action="run-boson-collider">
          <span data-bind="run-boson-text">Run Boson Collider</span>
        </button>

        <p class="hint">On failure, receive photons, gluons, and debris instead.</p>
      </section>

      <section class="card">
        <h2>Force Applications</h2>
        <div class="force-info">
          <div class="force-item">
            <h4>Weak Force (W±)</h4>
            <p>W bosons enable and accelerate radioactive decay processes, allowing you to transmute elements along decay chains.</p>
          </div>
          <div class="force-item">
            <h4>Neutral Current (Z0)</h4>
            <p>Z bosons improve stability in all assembly and fusion operations, reducing waste and improving efficiency.</p>
          </div>
          <div class="force-item">
            <h4>Higgs Field (H)</h4>
            <p>The Higgs boson grants mass to particles and improves heavy element fusion efficiency, making it easier to fuse elements beyond the iron peak.</p>
          </div>
        </div>
      </section>

      <section class="card" data-bind="unlock-boson-section" style="display: none;">
        <h2>Unlock Boson Mode</h2>
        <p>Purchase Boson Mode to enable boson production in the Lab collider.</p>
        <button class="btn btn-large" data-bind="unlock-boson-btn" data-action="unlock-boson-mode">
          Unlock Boson Mode (10,000 Pq + 5,000 Pl)
        </button>
      </section>
    </div>
  `;

  container.innerHTML = html;
}

function updateForcesTab(container: HTMLElement, state: GameState): void {
  const cfg = BALANCE.forces;
  const canRun = canRunBosonCollider(state);

  // Boson counts and bonuses
  setText(container, 'boson-wp-count', formatNumber(state.bosons['W+']));
  setText(container, 'boson-wp-bonus', `+${formatPercent(state.bosons['W+'] * cfg.wBosonDecayBonus)}`);

  setText(container, 'boson-wm-count', formatNumber(state.bosons['W-']));
  setText(container, 'boson-wm-bonus', `+${formatPercent(state.bosons['W-'] * cfg.wBosonDecayBonus)}`);

  setText(container, 'boson-z0-count', formatNumber(state.bosons.Z0));
  setText(container, 'boson-z0-bonus', `+${formatPercent(state.bosons.Z0 * cfg.zBosonStabilityBonus)}`);

  setText(container, 'boson-higgs-count', formatNumber(state.bosons.higgs));
  setText(container, 'boson-higgs-bonus', `+${formatPercent(state.bosons.higgs * cfg.higgsEfficiencyBonus)}`);

  // Cost requirements
  setClass(container, 'boson-cost-pq', 'met', state.pq >= cfg.bosonCollider.pqCost);
  setClass(container, 'boson-cost-pq', 'unmet', state.pq < cfg.bosonCollider.pqCost);
  setClass(container, 'boson-cost-pl', 'met', state.pl >= cfg.bosonCollider.plCost);
  setClass(container, 'boson-cost-pl', 'unmet', state.pl < cfg.bosonCollider.plCost);
  setClass(container, 'boson-cost-energy', 'met', state.energy >= cfg.bosonCollider.energyCost);
  setClass(container, 'boson-cost-energy', 'unmet', state.energy < cfg.bosonCollider.energyCost);

  // Run button
  setDisabled(container, 'run-boson-btn', !canRun.canRun);
  setText(container, 'run-boson-text', canRun.canRun ? 'Run Boson Collider' : canRun.reason ?? '');

  // Unlock section
  if (!state.colliderUpgrades.bosonModeUnlocked) {
    setVisible(container, 'unlock-boson-section', true);
    setDisabled(container, 'unlock-boson-btn', state.pq < 10000 || state.pl < 5000);
  } else {
    setVisible(container, 'unlock-boson-section', false);
  }
}

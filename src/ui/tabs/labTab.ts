/**
 * Lab Tab - Main production hub
 * Uses create/update pattern for efficient DOM updates
 */

import { GameState } from '../../types';
import { formatNumber, formatPercent, formatRate } from '../../utils/format';
import { BALANCE } from '../../config/balance';
import {
  getQuarkURate, getQuarkDRate, getPqFactor,
  getLeptonERate, getLeptonNuRate, getPlFactor,
  getPrecisionBonus
} from '../../core/state';
import {
  QUARK_RATE_UPGRADE, QUARK_EFFICIENCY_UPGRADE,
  LEPTON_RATE_UPGRADE, PRECISION_UPGRADE,
  getUpgradeCost, getBuyCount, canAffordUpgrade
} from '../../systems/upgrades';
import {
  canRunCollider, canRunBosonCollider,
  canUnlockTier3, getTier2ParticleCount
} from '../../systems/collider';
import { getAnnihilatableCount, AnnihilationPair } from '../../systems/annihilation';
import {
  setText, setDisabled, setActive, setChecked, setInputValue, setVisible, setClass
} from '../uiUpdater';

// Track last known emergent level to detect structural changes
let lastEmergentLevel = -1;
let lastTab = '';

/**
 * Creates the initial DOM structure for the lab tab
 */
export function createLabTab(container: HTMLElement, state: GameState): void {
  lastEmergentLevel = state.currentEmergentLevel;
  lastTab = 'lab';

  let html = '<div class="tab-content lab-tab">';

  // Quark Harvester (always visible)
  html += createQuarkHarvester(state);

  // Lepton Harvester (E1+)
  if (state.currentEmergentLevel >= 1) {
    html += createLeptonHarvester(state);
  }

  // Collider (E2+)
  if (state.currentEmergentLevel >= 2) {
    html += createCollider(state);
  }

  // Antimatter (E4+)
  if (state.currentEmergentLevel >= 4) {
    html += createAntimatter(state);
  }

  // Inventory
  html += createInventory(state);

  html += '</div>';
  container.innerHTML = html;
}

/**
 * Updates only the dynamic values in the lab tab
 */
export function updateLabTab(container: HTMLElement, state: GameState): void {
  // If emergent level changed, we need a full re-render (structure changed)
  if (state.currentEmergentLevel !== lastEmergentLevel) {
    createLabTab(container, state);
    return;
  }

  updateQuarkHarvester(container, state);

  if (state.currentEmergentLevel >= 1) {
    updateLeptonHarvester(container, state);
  }

  if (state.currentEmergentLevel >= 2) {
    updateCollider(container, state);
  }

  if (state.currentEmergentLevel >= 4) {
    updateAntimatter(container, state);
  }

  updateInventory(container, state);
}

/**
 * Render function - creates or updates depending on state
 */
export function renderLabTab(container: HTMLElement, state: GameState): void {
  // Check if we need to create from scratch
  const needsCreate = !container.querySelector('.lab-tab') ||
    lastEmergentLevel !== state.currentEmergentLevel ||
    lastTab !== 'lab';

  if (needsCreate) {
    createLabTab(container, state);
  } else {
    updateLabTab(container, state);
  }
}

// ============= QUARK HARVESTER =============

function createQuarkHarvester(state: GameState): string {
  const canSwitch = state.currentEmergentLevel >= 4;

  return `
    <section class="card">
      <h2>Quark Harvester</h2>
      <div class="harvester-stats">
        <div class="stat">
          <span class="label">u rate:</span>
          <span class="value" data-bind="quark-u-rate"></span>
        </div>
        <div class="stat">
          <span class="label">d rate:</span>
          <span class="value" data-bind="quark-d-rate"></span>
        </div>
        <div class="stat">
          <span class="label">Pq factor:</span>
          <span class="value" data-bind="pq-factor"></span>
        </div>
        <div class="stat">
          <span class="label">Pq rate:</span>
          <span class="value highlight" data-bind="pq-rate"></span>
        </div>
      </div>

      ${canSwitch ? `
        <div class="polarity-control">
          <span class="label">Mode: <span data-bind="quark-polarity-mode"></span></span>
          <button class="btn" data-bind="quark-polarity-btn" data-action="toggle-quark-polarity">
            <span data-bind="quark-polarity-text"></span>
          </button>
        </div>
      ` : ''}

      <div class="upgrades">
        <button class="upgrade-btn" data-bind="quark-rate-btn" data-action="buy-quark-rate">
          <span class="upgrade-name" data-bind="quark-rate-name"></span>
          <span class="upgrade-desc">${QUARK_RATE_UPGRADE.description}</span>
          <span class="upgrade-cost" data-bind="quark-rate-cost"></span>
        </button>
        <button class="upgrade-btn" data-bind="quark-eff-btn" data-action="buy-quark-eff">
          <span class="upgrade-name" data-bind="quark-eff-name"></span>
          <span class="upgrade-desc">${QUARK_EFFICIENCY_UPGRADE.description}</span>
          <span class="upgrade-cost" data-bind="quark-eff-cost"></span>
        </button>
      </div>
    </section>
  `;
}

function updateQuarkHarvester(container: HTMLElement, state: GameState): void {
  const uRate = getQuarkURate(state);
  const dRate = getQuarkDRate(state);
  const pqFactor = getPqFactor(state);
  const pqRate = (uRate + dRate) * pqFactor;

  const buyCount = getBuyCount(state, QUARK_RATE_UPGRADE);
  const rateCost = getUpgradeCost(QUARK_RATE_UPGRADE, state.quarkUpgrades.quarkRate);
  const effCost = getUpgradeCost(QUARK_EFFICIENCY_UPGRADE, state.quarkUpgrades.quarkEfficiency);
  const canBuyRate = canAffordUpgrade(state, QUARK_RATE_UPGRADE, buyCount);
  const canBuyEff = canAffordUpgrade(state, QUARK_EFFICIENCY_UPGRADE, buyCount);

  setText(container, 'quark-u-rate', formatRate(uRate));
  setText(container, 'quark-d-rate', formatRate(dRate));
  setText(container, 'pq-factor', `${formatNumber(pqFactor, 2)}x`);
  setText(container, 'pq-rate', formatRate(pqRate));

  setText(container, 'quark-rate-name', `${QUARK_RATE_UPGRADE.name} (Lv ${state.quarkUpgrades.quarkRate})`);
  setText(container, 'quark-rate-cost', `${formatNumber(rateCost)} Pq`);
  setDisabled(container, 'quark-rate-btn', !canBuyRate);

  setText(container, 'quark-eff-name', `${QUARK_EFFICIENCY_UPGRADE.name} (Lv ${state.quarkUpgrades.quarkEfficiency})`);
  setText(container, 'quark-eff-cost', `${formatNumber(effCost)} Pq`);
  setDisabled(container, 'quark-eff-btn', !canBuyEff);

  // Polarity controls (E4+)
  if (state.currentEmergentLevel >= 4) {
    const polarity = state.harvesters.quarkPolarity;
    const cooldown = state.harvesters.quarkSwitchCooldown;
    const canSwitch = cooldown <= 0;

    setText(container, 'quark-polarity-mode', polarity === 'matter' ? 'Matter' : 'Antimatter');
    setText(container, 'quark-polarity-text', cooldown > 0 ? `Cooldown ${Math.ceil(cooldown / 1000)}s` : 'Switch Polarity');
    setDisabled(container, 'quark-polarity-btn', !canSwitch);
  }
}

// ============= LEPTON HARVESTER =============

function createLeptonHarvester(state: GameState): string {
  const canSwitch = state.currentEmergentLevel >= 4;

  return `
    <section class="card">
      <h2>Lepton Harvester</h2>
      <div class="harvester-stats">
        <div class="stat">
          <span class="label">e- rate:</span>
          <span class="value" data-bind="lepton-e-rate"></span>
        </div>
        <div class="stat">
          <span class="label">ve rate:</span>
          <span class="value" data-bind="lepton-nu-rate"></span>
        </div>
        <div class="stat">
          <span class="label">Pl factor:</span>
          <span class="value" data-bind="pl-factor"></span>
        </div>
        <div class="stat">
          <span class="label">Pl rate:</span>
          <span class="value highlight" data-bind="pl-rate"></span>
        </div>
      </div>

      ${canSwitch ? `
        <div class="polarity-control">
          <span class="label">Mode: <span data-bind="lepton-polarity-mode"></span></span>
          <button class="btn" data-bind="lepton-polarity-btn" data-action="toggle-lepton-polarity">
            <span data-bind="lepton-polarity-text"></span>
          </button>
        </div>
      ` : ''}

      <div class="upgrades">
        <button class="upgrade-btn" data-bind="lepton-rate-btn" data-action="buy-lepton-rate">
          <span class="upgrade-name" data-bind="lepton-rate-name"></span>
          <span class="upgrade-desc">${LEPTON_RATE_UPGRADE.description}</span>
          <span class="upgrade-cost" data-bind="lepton-rate-cost"></span>
        </button>
        <button class="upgrade-btn" data-bind="precision-btn" data-action="buy-precision">
          <span class="upgrade-name" data-bind="precision-name"></span>
          <span class="upgrade-desc">${PRECISION_UPGRADE.description}</span>
          <span class="upgrade-cost" data-bind="precision-cost"></span>
        </button>
      </div>
    </section>
  `;
}

function updateLeptonHarvester(container: HTMLElement, state: GameState): void {
  const eRate = getLeptonERate(state);
  const nuRate = getLeptonNuRate(state);
  const plFactor = getPlFactor(state);
  const plRate = (eRate + nuRate) * plFactor;

  const buyCount = getBuyCount(state, LEPTON_RATE_UPGRADE);
  const rateCost = getUpgradeCost(LEPTON_RATE_UPGRADE, state.leptonUpgrades.leptonRate);
  const precCost = getUpgradeCost(PRECISION_UPGRADE, state.leptonUpgrades.precision);
  const canBuyRate = canAffordUpgrade(state, LEPTON_RATE_UPGRADE, buyCount);
  const canBuyPrec = canAffordUpgrade(state, PRECISION_UPGRADE, buyCount);

  setText(container, 'lepton-e-rate', formatRate(eRate));
  setText(container, 'lepton-nu-rate', formatRate(nuRate));
  setText(container, 'pl-factor', `${formatNumber(plFactor, 2)}x`);
  setText(container, 'pl-rate', formatRate(plRate));

  setText(container, 'lepton-rate-name', `${LEPTON_RATE_UPGRADE.name} (Lv ${state.leptonUpgrades.leptonRate})`);
  setText(container, 'lepton-rate-cost', `${formatNumber(rateCost)} Pl`);
  setDisabled(container, 'lepton-rate-btn', !canBuyRate);

  setText(container, 'precision-name', `${PRECISION_UPGRADE.name} (Lv ${state.leptonUpgrades.precision})`);
  setText(container, 'precision-cost', `${formatNumber(precCost)} Pl`);
  setDisabled(container, 'precision-btn', !canBuyPrec);

  // Polarity controls (E4+)
  if (state.currentEmergentLevel >= 4) {
    const polarity = state.harvesters.leptonPolarity;
    const cooldown = state.harvesters.leptonSwitchCooldown;
    const canSwitch = cooldown <= 0;

    setText(container, 'lepton-polarity-mode', polarity === 'matter' ? 'Matter' : 'Antimatter');
    setText(container, 'lepton-polarity-text', cooldown > 0 ? `Cooldown ${Math.ceil(cooldown / 1000)}s` : 'Switch Polarity');
    setDisabled(container, 'lepton-polarity-btn', !canSwitch);
  }
}

// ============= COLLIDER =============

function createCollider(state: GameState): string {
  const canT3 = state.currentEmergentLevel >= 3;
  const showBosonMode = state.colliderUpgrades.bosonModeUnlocked;

  return `
    <section class="card">
      <h2>Particle Collider <span data-bind="overdrive-indicator"></span></h2>

      <div class="collider-controls">
        <div class="tier-select">
          <span class="label">Tier:</span>
          <button class="btn" data-bind="tier2-btn" data-action="set-tier-2">T2</button>
          <span data-bind="tier3-container" style="display: inline;">
            <button class="btn" data-bind="tier3-btn" data-action="set-tier-3" style="display: none;">T3</button>
          </span>
          ${canT3 ? `
            <button class="btn" data-bind="unlock-tier3-btn" data-action="unlock-tier-3">
              <span data-bind="unlock-tier3-text"></span>
            </button>
          ` : ''}
        </div>

        <div class="mode-select">
          <span class="label">Channel:</span>
          <button class="btn" data-bind="mode-quark-btn" data-action="set-mode-quark">Quark</button>
          <button class="btn" data-bind="mode-lepton-btn" data-action="set-mode-lepton">Lepton</button>
        </div>

        ${state.currentEmergentLevel >= 4 ? `
          <div class="matter-select">
            <span class="label">Matter:</span>
            <button class="btn" data-bind="matter-btn" data-action="set-matter-mode">Matter</button>
            <button class="btn" data-bind="antimatter-btn" data-action="set-antimatter-mode">Anti</button>
          </div>
        ` : ''}

        ${showBosonMode ? `
          <div class="boson-mode">
            <label>
              <input type="checkbox" data-bind="boson-checkbox" data-action="toggle-boson-mode">
              Boson Mode
            </label>
          </div>
        ` : ''}
      </div>

      <div class="precision-slider">
        <label>
          <span data-bind="precision-spend-label">Precision Spend: 0 Pl</span>
          <input type="range" data-bind="precision-slider" data-action="set-precision" min="0" max="100" value="0" step="1">
        </label>
      </div>

      <div class="collider-stats">
        <div class="stat">
          <span class="label">Cost:</span>
          <span class="value" data-bind="collider-cost"></span>
        </div>
        <div class="stat" data-bind="upgrade-chance-container">
          <span class="label">Upgrade Chance:</span>
          <span class="value" data-bind="upgrade-chance"></span>
        </div>
        <div class="stat" data-bind="pity-container">
          <span class="label">Pity:</span>
          <span class="value" data-bind="pity-value"></span>
        </div>
        <div class="stat" data-bind="boson-chance-container" style="display: none;">
          <span class="label">Boson Chance:</span>
          <span class="value" data-bind="boson-chance"></span>
        </div>
      </div>

      <button class="btn btn-large" data-bind="run-collider-btn" data-action="run-collider">
        <span data-bind="run-collider-text">Run Collider</span>
      </button>

      <div class="debris-exchange" data-bind="debris-container" style="display: none;">
        <span class="label">Debris: <span data-bind="debris-count"></span></span>
        <button class="btn btn-small" data-action="debris-to-pq">→ Pq</button>
        <button class="btn btn-small" data-action="debris-to-pl">→ Pl</button>
        <button class="btn btn-small" data-action="debris-to-energy">→ E</button>
        <button class="btn btn-small" data-action="debris-to-pity">→ Pity</button>
      </div>
    </section>
  `;
}

function updateCollider(container: HTMLElement, state: GameState): void {
  const tier = state.collider.tier;
  const mode = state.collider.mode;
  const matterMode = state.collider.matterMode;
  const precSpend = state.collider.precisionSpend;
  const pity = state.collider.pity;
  const isBosonMode = state.collider.isBosonMode && state.colliderUpgrades.bosonModeUnlocked;

  const cfg = tier === 2 ? BALANCE.colliderT2 : BALANCE.colliderT3;
  const maxPrec = tier === 2 ? BALANCE.colliderT2.maxPrecisionSpend : BALANCE.colliderT3.maxPrecisionSpend;

  let baseChance = cfg.baseUpgradeChance;
  baseChance += precSpend * cfg.precisionBonusPerPl;
  baseChance += getPrecisionBonus(state);

  const pityThreshold = tier === 2
    ? BALANCE.colliderT2.basePityThreshold - precSpend * BALANCE.colliderT2.pityReductionPerPl
    : 15;

  const canRun = isBosonMode ? canRunBosonCollider(state) : canRunCollider(state, tier);
  const t2Count = getTier2ParticleCount(state);
  const canUnlockT3Now = !state.colliderUpgrades.tier3Unlocked && canUnlockTier3(state);

  const overdrive = state.tempBuffs.colliderOverdrive.active;

  // Overdrive indicator
  setText(container, 'overdrive-indicator', overdrive ? '⚡ OVERDRIVE' : '');

  // Tier buttons
  setActive(container, 'tier2-btn', tier === 2);

  // Tier 3 button visibility
  const tier3Btn = container.querySelector('[data-bind="tier3-btn"]') as HTMLElement;
  if (tier3Btn) {
    if (state.colliderUpgrades.tier3Unlocked) {
      tier3Btn.style.display = '';
      setActive(container, 'tier3-btn', tier === 3);
    } else {
      tier3Btn.style.display = 'none';
    }
  }

  // Unlock T3 button
  if (state.currentEmergentLevel >= 3 && !state.colliderUpgrades.tier3Unlocked) {
    setText(container, 'unlock-tier3-text', `Unlock T3 (${t2Count}/${BALANCE.colliderT3.tier2ParticleGate})`);
    setDisabled(container, 'unlock-tier3-btn', !canUnlockT3Now);
    setClass(container, 'unlock-tier3-btn', 'highlight', canUnlockT3Now);
    setVisible(container, 'unlock-tier3-btn', true);
  } else {
    setVisible(container, 'unlock-tier3-btn', false);
  }

  // Mode buttons
  setActive(container, 'mode-quark-btn', mode === 'quark');
  setActive(container, 'mode-lepton-btn', mode === 'lepton');

  // Matter mode buttons (E4+)
  if (state.currentEmergentLevel >= 4) {
    setActive(container, 'matter-btn', matterMode === 'matter');
    setActive(container, 'antimatter-btn', matterMode === 'antimatter');
  }

  // Boson mode checkbox
  if (state.colliderUpgrades.bosonModeUnlocked) {
    setChecked(container, 'boson-checkbox', isBosonMode);
  }

  // Precision slider
  setText(container, 'precision-spend-label', `Precision Spend: ${precSpend} Pl`);
  setAttr(container, 'precision-slider', 'max', String(maxPrec));
  setInputValue(container, 'precision-slider', precSpend);

  // Cost display
  let costText: string;
  if (isBosonMode) {
    costText = `${BALANCE.forces.bosonCollider.pqCost} Pq + ${BALANCE.forces.bosonCollider.plCost} Pl + ${BALANCE.forces.bosonCollider.energyCost} E`;
  } else {
    costText = `${tier === 2 ? BALANCE.colliderT2.baseCost : BALANCE.colliderT3.baseCost} Pq${tier === 3 ? ` + ${BALANCE.colliderT3.energyCost} E` : ''}`;
  }
  setText(container, 'collider-cost', costText);

  // Stats visibility based on boson mode
  setVisible(container, 'upgrade-chance-container', !isBosonMode);
  setVisible(container, 'pity-container', !isBosonMode);
  setVisible(container, 'boson-chance-container', isBosonMode);

  if (!isBosonMode) {
    setText(container, 'upgrade-chance', formatPercent(Math.min(baseChance, 1)));
    setText(container, 'pity-value', `${Math.floor(pity)}/${Math.floor(pityThreshold)}`);
  } else {
    setText(container, 'boson-chance', formatPercent(BALANCE.forces.bosonCollider.baseBosonChance));
  }

  // Run button
  setDisabled(container, 'run-collider-btn', !canRun.canRun);
  setText(container, 'run-collider-text', canRun.canRun ? (isBosonMode ? 'Run Boson Collider' : 'Run Collider') : canRun.reason);

  // Debris
  const hasDebris = state.debris > 0;
  setVisible(container, 'debris-container', hasDebris);
  if (hasDebris) {
    setText(container, 'debris-count', formatNumber(state.debris));
  }
}

function setAttr(container: HTMLElement, bindKey: string, attr: string, value: string): void {
  const el = container.querySelector(`[data-bind="${bindKey}"]`);
  if (el && el.getAttribute(attr) !== value) {
    el.setAttribute(attr, value);
  }
}

// ============= ANTIMATTER =============

function createAntimatter(state: GameState): string {
  return `
    <section class="card">
      <h2>Annihilation Chamber</h2>
      <p class="hint">Convert matter + antimatter pairs to Energy and photons</p>

      <div class="annihilation-grid" data-bind="annihilation-grid">
        ${createAnnihilationPairs(state)}
      </div>
    </section>
  `;
}

function createAnnihilationPairs(state: GameState): string {
  const pairs: { id: AnnihilationPair; name: string }[] = [
    { id: 'electron', name: 'e-/e+' },
    { id: 'u_quark', name: 'u/ū' },
    { id: 'd_quark', name: 'd/d̄' },
  ];

  if (state.matter.s > 0 || state.antimatter.s_bar > 0) {
    pairs.push({ id: 's_quark', name: 's/s̄' });
  }
  if (state.matter.c > 0 || state.antimatter.c_bar > 0) {
    pairs.push({ id: 'c_quark', name: 'c/c̄' });
  }
  if (state.matter['mu-'] > 0 || state.antimatter['mu+'] > 0) {
    pairs.push({ id: 'muon', name: 'μ-/μ+' });
  }

  return pairs.map(p => `
    <div class="annihilation-pair">
      <span class="pair-name">${p.name}</span>
      <span class="pair-count" data-bind="pair-${p.id}-count">0 pairs</span>
      <button class="btn btn-small" data-bind="pair-${p.id}-x1" data-action="annihilate" data-pair="${p.id}" data-count="1">x1</button>
      <button class="btn btn-small" data-bind="pair-${p.id}-x10" data-action="annihilate" data-pair="${p.id}" data-count="10">x10</button>
      <button class="btn btn-small" data-bind="pair-${p.id}-max" data-action="annihilate" data-pair="${p.id}" data-count="max">Max</button>
    </div>
  `).join('');
}

function updateAntimatter(container: HTMLElement, state: GameState): void {
  const pairs: { id: AnnihilationPair; name: string }[] = [
    { id: 'electron', name: 'e-/e+' },
    { id: 'u_quark', name: 'u/ū' },
    { id: 'd_quark', name: 'd/d̄' },
  ];

  // Check if we need to add more pairs (structure change)
  const needsS = state.matter.s > 0 || state.antimatter.s_bar > 0;
  const needsC = state.matter.c > 0 || state.antimatter.c_bar > 0;
  const needsMu = state.matter['mu-'] > 0 || state.antimatter['mu+'] > 0;

  const hasS = container.querySelector('[data-bind="pair-s_quark-count"]') !== null;
  const hasC = container.querySelector('[data-bind="pair-c_quark-count"]') !== null;
  const hasMu = container.querySelector('[data-bind="pair-muon-count"]') !== null;

  // If pair visibility changed, re-render the grid
  if (needsS !== hasS || needsC !== hasC || needsMu !== hasMu) {
    const grid = container.querySelector('[data-bind="annihilation-grid"]');
    if (grid) {
      grid.innerHTML = createAnnihilationPairs(state);
    }
  }

  if (needsS) pairs.push({ id: 's_quark', name: 's/s̄' });
  if (needsC) pairs.push({ id: 'c_quark', name: 'c/c̄' });
  if (needsMu) pairs.push({ id: 'muon', name: 'μ-/μ+' });

  for (const p of pairs) {
    const available = getAnnihilatableCount(state, p.id);
    setText(container, `pair-${p.id}-count`, `${available} pairs`);
    setDisabled(container, `pair-${p.id}-x1`, available <= 0);
    setDisabled(container, `pair-${p.id}-x10`, available < 10);
    setDisabled(container, `pair-${p.id}-max`, available <= 0);
  }
}

// ============= INVENTORY =============

function createInventory(state: GameState): string {
  return `
    <section class="card inventory-card">
      <h2>Particle Inventory</h2>

      <div class="inventory-section">
        <h3>Matter</h3>
        <div class="inventory-grid">
          <div class="particle">
            <span class="name">u</span>
            <span class="count" data-bind="matter-u"></span>
          </div>
          <div class="particle">
            <span class="name">d</span>
            <span class="count" data-bind="matter-d"></span>
          </div>
          ${state.currentEmergentLevel >= 1 ? `
            <div class="particle">
              <span class="name">e-</span>
              <span class="count" data-bind="matter-e"></span>
            </div>
            <div class="particle">
              <span class="name">νe</span>
              <span class="count" data-bind="matter-ve"></span>
            </div>
          ` : ''}
          ${state.currentEmergentLevel >= 2 ? `
            <div class="particle tier2">
              <span class="name">s</span>
              <span class="count" data-bind="matter-s"></span>
            </div>
            <div class="particle tier2">
              <span class="name">c</span>
              <span class="count" data-bind="matter-c"></span>
            </div>
            <div class="particle tier2">
              <span class="name">μ-</span>
              <span class="count" data-bind="matter-mu"></span>
            </div>
            <div class="particle tier2">
              <span class="name">νμ</span>
              <span class="count" data-bind="matter-vmu"></span>
            </div>
          ` : ''}
          ${state.currentEmergentLevel >= 3 ? `
            <div class="particle tier3">
              <span class="name">b</span>
              <span class="count" data-bind="matter-b"></span>
            </div>
            <div class="particle tier3">
              <span class="name">t</span>
              <span class="count" data-bind="matter-t"></span>
            </div>
            <div class="particle tier3">
              <span class="name">τ-</span>
              <span class="count" data-bind="matter-tau"></span>
            </div>
            <div class="particle tier3">
              <span class="name">ντ</span>
              <span class="count" data-bind="matter-vtau"></span>
            </div>
          ` : ''}
        </div>
      </div>

      ${state.currentEmergentLevel >= 4 ? `
        <div class="inventory-section">
          <h3>Antimatter</h3>
          <div class="inventory-grid antimatter">
            <div class="particle"><span class="name">ū</span><span class="count" data-bind="anti-u"></span></div>
            <div class="particle"><span class="name">d̄</span><span class="count" data-bind="anti-d"></span></div>
            <div class="particle"><span class="name">e+</span><span class="count" data-bind="anti-e"></span></div>
            <div class="particle"><span class="name">ν̄e</span><span class="count" data-bind="anti-ve"></span></div>
            <div class="particle tier2" data-bind="anti-s-container" style="display: none;"><span class="name">s̄</span><span class="count" data-bind="anti-s"></span></div>
            <div class="particle tier2" data-bind="anti-c-container" style="display: none;"><span class="name">c̄</span><span class="count" data-bind="anti-c"></span></div>
            <div class="particle tier2" data-bind="anti-mu-container" style="display: none;"><span class="name">μ+</span><span class="count" data-bind="anti-mu"></span></div>
            <div class="particle tier2" data-bind="anti-vmu-container" style="display: none;"><span class="name">ν̄μ</span><span class="count" data-bind="anti-vmu"></span></div>
          </div>
        </div>
      ` : ''}

      <div class="inventory-section">
        <h3>Catalysts</h3>
        <div class="inventory-grid catalysts">
          <div class="particle">
            <span class="name">γ</span>
            <span class="count" data-bind="catalyst-photon"></span>
          </div>
          <div class="particle">
            <span class="name">g</span>
            <span class="count" data-bind="catalyst-gluon"></span>
          </div>
        </div>
      </div>

      ${state.currentEmergentLevel >= 5 ? `
        <div class="inventory-section">
          <h3>Composites</h3>
          <div class="inventory-grid composites">
            <div class="particle">
              <span class="name">p</span>
              <span class="count" data-bind="composite-proton"></span>
            </div>
            <div class="particle">
              <span class="name">n</span>
              <span class="count" data-bind="composite-neutron"></span>
            </div>
          </div>
        </div>
      ` : ''}

      ${state.currentEmergentLevel >= 6 ? `
        <div class="inventory-section">
          <h3>Atom Units</h3>
          <div class="inventory-grid">
            <div class="particle atom-unit">
              <span class="name">AU</span>
              <span class="count" data-bind="atom-units"></span>
            </div>
          </div>
        </div>
      ` : ''}

      ${state.forcesUnlocked ? `
        <div class="inventory-section">
          <h3>Bosons</h3>
          <div class="inventory-grid bosons">
            <div class="particle"><span class="name">W+</span><span class="count" data-bind="boson-wp"></span></div>
            <div class="particle"><span class="name">W-</span><span class="count" data-bind="boson-wm"></span></div>
            <div class="particle"><span class="name">Z0</span><span class="count" data-bind="boson-z0"></span></div>
            <div class="particle"><span class="name">H</span><span class="count" data-bind="boson-h"></span></div>
          </div>
        </div>
      ` : ''}
    </section>
  `;
}

function updateInventory(container: HTMLElement, state: GameState): void {
  // Matter
  setText(container, 'matter-u', formatNumber(state.matter.u));
  setText(container, 'matter-d', formatNumber(state.matter.d));

  if (state.currentEmergentLevel >= 1) {
    setText(container, 'matter-e', formatNumber(state.matter['e-']));
    setText(container, 'matter-ve', formatNumber(state.matter.ve));
  }

  if (state.currentEmergentLevel >= 2) {
    setText(container, 'matter-s', formatNumber(state.matter.s));
    setText(container, 'matter-c', formatNumber(state.matter.c));
    setText(container, 'matter-mu', formatNumber(state.matter['mu-']));
    setText(container, 'matter-vmu', formatNumber(state.matter.vmu));
  }

  if (state.currentEmergentLevel >= 3) {
    setText(container, 'matter-b', formatNumber(state.matter.b));
    setText(container, 'matter-t', formatNumber(state.matter.t));
    setText(container, 'matter-tau', formatNumber(state.matter['tau-']));
    setText(container, 'matter-vtau', formatNumber(state.matter.vtau));
  }

  // Antimatter
  if (state.currentEmergentLevel >= 4) {
    setText(container, 'anti-u', formatNumber(state.antimatter.u_bar));
    setText(container, 'anti-d', formatNumber(state.antimatter.d_bar));
    setText(container, 'anti-e', formatNumber(state.antimatter['e+']));
    setText(container, 'anti-ve', formatNumber(state.antimatter.ve_bar));

    // Show tier 2 antimatter if any exist
    const hasT2Anti = state.antimatter.s_bar > 0 || state.antimatter.c_bar > 0 ||
      state.antimatter['mu+'] > 0 || state.antimatter.vmu_bar > 0;
    setVisible(container, 'anti-s-container', hasT2Anti);
    setVisible(container, 'anti-c-container', hasT2Anti);
    setVisible(container, 'anti-mu-container', hasT2Anti);
    setVisible(container, 'anti-vmu-container', hasT2Anti);

    if (hasT2Anti) {
      setText(container, 'anti-s', formatNumber(state.antimatter.s_bar));
      setText(container, 'anti-c', formatNumber(state.antimatter.c_bar));
      setText(container, 'anti-mu', formatNumber(state.antimatter['mu+']));
      setText(container, 'anti-vmu', formatNumber(state.antimatter.vmu_bar));
    }
  }

  // Catalysts
  setText(container, 'catalyst-photon', formatNumber(state.catalysts.photon));
  setText(container, 'catalyst-gluon', formatNumber(state.catalysts.gluon));

  // Composites
  if (state.currentEmergentLevel >= 5) {
    setText(container, 'composite-proton', formatNumber(state.composites.proton));
    setText(container, 'composite-neutron', formatNumber(state.composites.neutron));
  }

  // Atom units
  if (state.currentEmergentLevel >= 6) {
    setText(container, 'atom-units', formatNumber(state.atomUnits));
  }

  // Bosons
  if (state.forcesUnlocked) {
    setText(container, 'boson-wp', formatNumber(state.bosons['W+']));
    setText(container, 'boson-wm', formatNumber(state.bosons['W-']));
    setText(container, 'boson-z0', formatNumber(state.bosons.Z0));
    setText(container, 'boson-h', formatNumber(state.bosons.higgs));
  }
}

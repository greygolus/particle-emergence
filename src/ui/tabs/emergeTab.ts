/**
 * Emerge Tab - Prestige system
 * Uses create/update pattern for efficient DOM updates
 */

import { GameState, EmergentLevel } from '../../types';
import { formatNumber, formatPercent } from '../../utils/format';
import { BALANCE } from '../../config/balance';
import {
  checkEmergeRequirements, getEmergeProgress,
  getEmergeLevelName, getEmergeLevelDescription, getEmergeRequirements
} from '../../systems/emerge';
import { setText, setDisabled, setProgress, setClass } from '../uiUpdater';

let lastTab = '';
let lastEmergentLevel = -1;

export function renderEmergeTab(container: HTMLElement, state: GameState): void {
  const needsCreate = !container.querySelector('.emerge-tab') ||
    lastTab !== 'emerge' ||
    lastEmergentLevel !== state.currentEmergentLevel;

  if (needsCreate) {
    createEmergeTab(container, state);
    lastTab = 'emerge';
    lastEmergentLevel = state.currentEmergentLevel;
  } else {
    updateEmergeTab(container, state);
  }
}

function createEmergeTab(container: HTMLElement, state: GameState): void {
  const nextLevel = (state.currentEmergentLevel + 1) as EmergentLevel;
  const canEmergeNext = nextLevel <= 6;

  let html = `
    <div class="tab-content emerge-tab">
      <section class="card">
        <h2>Current Level: <span data-bind="emerge-level-name">${getEmergeLevelName(state.currentEmergentLevel)}</span></h2>
        <p class="level-desc" data-bind="emerge-level-desc">${getEmergeLevelDescription(state.currentEmergentLevel)}</p>

        <div class="emerge-stats">
          <div class="stat">
            <span class="label">Highest Reached:</span>
            <span class="value" data-bind="emerge-highest">E${state.highestEmergentLevel}</span>
          </div>
          <div class="stat">
            <span class="label">Total Emerges:</span>
            <span class="value" data-bind="emerge-total">${state.stats.totalEmerges}</span>
          </div>
        </div>
      </section>

      ${canEmergeNext ? createEmergeRequirements(state, nextLevel) : createEndgame(state)}

      <section class="card">
        <h2>Emergence Overview</h2>
        <div class="emergence-tree">
          ${createEmergenceTree(state)}
        </div>
      </section>

      <section class="card">
        <h2>Reset Information</h2>
        <div class="reset-info">
          <h3>What Gets Reset:</h3>
          <ul>
            <li>Currencies (Pq, Pl, Energy)</li>
            <li>All particle inventories</li>
            <li>Run-based upgrades</li>
            <li>Temporary buffs</li>
            <li>Collider pity and state</li>
          </ul>

          <h3>What Persists:</h3>
          <ul>
            <li>Highest Emergent Level unlocked</li>
            <li>Automation modules and their levels</li>
            <li>Periodic Table progress (after permanent unlock)</li>
            <li>Permanent upgrades</li>
          </ul>
        </div>
      </section>
    </div>
  `;

  container.innerHTML = html;
}

function createEmergeRequirements(_state: GameState, targetLevel: EmergentLevel): string {
  const req = getEmergeRequirements(targetLevel);

  return `
    <section class="card emerge-requirements">
      <h2>Next: <span data-bind="emerge-next-name">${getEmergeLevelName(targetLevel)}</span></h2>
      <p class="level-desc" data-bind="emerge-next-desc">${getEmergeLevelDescription(targetLevel)}</p>

      <div class="progress-bar large">
        <div class="progress-fill" data-bind="emerge-progress" style="width: 0%"></div>
        <span class="progress-text" data-bind="emerge-progress-text">0%</span>
      </div>

      <div class="requirements-list">
        ${req.pq ? `
          <div class="req-item" data-bind="req-pq">
            <span class="label">Pq:</span>
            <span class="value" data-bind="req-pq-value"></span>
          </div>
        ` : ''}
        ${req.pl ? `
          <div class="req-item" data-bind="req-pl">
            <span class="label">Pl:</span>
            <span class="value" data-bind="req-pl-value"></span>
          </div>
        ` : ''}
        ${req.energy ? `
          <div class="req-item" data-bind="req-energy">
            <span class="label">Energy:</span>
            <span class="value" data-bind="req-energy-value"></span>
          </div>
        ` : ''}
        ${req.uQuarks ? `
          <div class="req-item" data-bind="req-u">
            <span class="label">u Quarks:</span>
            <span class="value" data-bind="req-u-value"></span>
          </div>
        ` : ''}
        ${req.dQuarks ? `
          <div class="req-item" data-bind="req-d">
            <span class="label">d Quarks:</span>
            <span class="value" data-bind="req-d-value"></span>
          </div>
        ` : ''}
        ${req.electrons ? `
          <div class="req-item" data-bind="req-e">
            <span class="label">Electrons:</span>
            <span class="value" data-bind="req-e-value"></span>
          </div>
        ` : ''}
        ${req.neutrinos ? `
          <div class="req-item" data-bind="req-nu">
            <span class="label">Neutrinos:</span>
            <span class="value" data-bind="req-nu-value"></span>
          </div>
        ` : ''}
        ${req.tier2Particles ? `
          <div class="req-item" data-bind="req-t2">
            <span class="label">Tier 2 Particles:</span>
            <span class="value" data-bind="req-t2-value"></span>
          </div>
        ` : ''}
        ${req.tier3Particles ? `
          <div class="req-item" data-bind="req-t3">
            <span class="label">Tier 3 Particles:</span>
            <span class="value" data-bind="req-t3-value"></span>
          </div>
        ` : ''}
        ${req.antimatterParticles ? `
          <div class="req-item" data-bind="req-anti">
            <span class="label">Antimatter:</span>
            <span class="value" data-bind="req-anti-value"></span>
          </div>
        ` : ''}
        ${req.protons ? `
          <div class="req-item" data-bind="req-proton">
            <span class="label">Protons:</span>
            <span class="value" data-bind="req-proton-value"></span>
          </div>
        ` : ''}
        ${req.neutrons ? `
          <div class="req-item" data-bind="req-neutron">
            <span class="label">Neutrons:</span>
            <span class="value" data-bind="req-neutron-value"></span>
          </div>
        ` : ''}
      </div>

      <button class="btn btn-large btn-emerge" data-bind="emerge-btn" data-action="emerge" data-level="${targetLevel}">
        <span data-bind="emerge-btn-text">Requirements not met</span>
      </button>

      <div class="missing-reqs" data-bind="emerge-missing" style="display: none;">
        <p>Missing:</p>
        <ul data-bind="emerge-missing-list"></ul>
      </div>
    </section>
  `;
}

function createEndgame(state: GameState): string {
  return `
    <section class="card emerge-endgame">
      <h2>Maximum Emergence Reached</h2>
      <p>You have reached the highest Emergent Level. Your goal now is to complete the Periodic Table!</p>

      <div class="endgame-stats">
        <div class="stat">
          <span class="label">Elements Unlocked:</span>
          <span class="value" data-bind="endgame-elements">${state.stats.elementsUnlocked} / 118</span>
        </div>
        <div class="stat">
          <span class="label">Periodic Table:</span>
          <span class="value" data-bind="endgame-ptable">${state.periodicTableUnlocked ? 'Permanently Unlocked' : 'Not Yet Permanent'}</span>
        </div>
      </div>

      <p class="hint" data-bind="endgame-hint" style="display: ${state.periodicTableUnlocked ? 'none' : 'block'};">
        Build ${BALANCE.atomBuilder.atomUnlockMilestone} Atom Units to permanently unlock the Periodic Table.
      </p>

      <button class="btn btn-large" data-action="restart-e6">
        Restart at E6 (Soft Reset)
      </button>
    </section>
  `;
}

function createEmergenceTree(state: GameState): string {
  const levels: EmergentLevel[] = [0, 1, 2, 3, 4, 5, 6];

  return levels.map(level => {
    const isUnlocked = level <= state.highestEmergentLevel;
    const isCurrent = level === state.currentEmergentLevel;

    return `
      <div class="emergence-node ${isUnlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}" data-bind="tree-node-${level}">
        <div class="node-marker">${isUnlocked ? '✓' : '○'}</div>
        <div class="node-info">
          <span class="node-name">${getEmergeLevelName(level)}</span>
          <span class="node-desc">${getEmergeLevelDescription(level)}</span>
        </div>
      </div>
    `;
  }).join('<div class="emergence-connector"></div>');
}

function updateEmergeTab(container: HTMLElement, state: GameState): void {
  const nextLevel = (state.currentEmergentLevel + 1) as EmergentLevel;
  const canEmergeNext = nextLevel <= 6;

  // Basic stats
  setText(container, 'emerge-highest', `E${state.highestEmergentLevel}`);
  setText(container, 'emerge-total', String(state.stats.totalEmerges));

  if (canEmergeNext) {
    updateEmergeRequirements(container, state, nextLevel);
  } else {
    updateEndgame(container, state);
  }
}

function updateEmergeRequirements(container: HTMLElement, state: GameState, targetLevel: EmergentLevel): void {
  const req = getEmergeRequirements(targetLevel);
  const check = checkEmergeRequirements(state, targetLevel);
  const progress = getEmergeProgress(state, targetLevel);

  // Progress bar
  setProgress(container, 'emerge-progress', progress);
  setText(container, 'emerge-progress-text', formatPercent(progress));

  // Requirements
  if (req.pq) {
    setClass(container, 'req-pq', 'met', state.pq >= req.pq);
    setClass(container, 'req-pq', 'unmet', state.pq < req.pq);
    setText(container, 'req-pq-value', `${formatNumber(state.pq)} / ${formatNumber(req.pq)}`);
  }
  if (req.pl) {
    setClass(container, 'req-pl', 'met', state.pl >= req.pl);
    setClass(container, 'req-pl', 'unmet', state.pl < req.pl);
    setText(container, 'req-pl-value', `${formatNumber(state.pl)} / ${formatNumber(req.pl)}`);
  }
  if (req.energy) {
    setClass(container, 'req-energy', 'met', state.energy >= req.energy);
    setClass(container, 'req-energy', 'unmet', state.energy < req.energy);
    setText(container, 'req-energy-value', `${formatNumber(state.energy)} / ${formatNumber(req.energy)}`);
  }
  if (req.uQuarks) {
    setClass(container, 'req-u', 'met', state.matter.u >= req.uQuarks);
    setClass(container, 'req-u', 'unmet', state.matter.u < req.uQuarks);
    setText(container, 'req-u-value', `${formatNumber(state.matter.u)} / ${formatNumber(req.uQuarks)}`);
  }
  if (req.dQuarks) {
    setClass(container, 'req-d', 'met', state.matter.d >= req.dQuarks);
    setClass(container, 'req-d', 'unmet', state.matter.d < req.dQuarks);
    setText(container, 'req-d-value', `${formatNumber(state.matter.d)} / ${formatNumber(req.dQuarks)}`);
  }
  if (req.electrons) {
    setClass(container, 'req-e', 'met', state.matter['e-'] >= req.electrons);
    setClass(container, 'req-e', 'unmet', state.matter['e-'] < req.electrons);
    setText(container, 'req-e-value', `${formatNumber(state.matter['e-'])} / ${formatNumber(req.electrons)}`);
  }
  if (req.neutrinos) {
    setClass(container, 'req-nu', 'met', state.matter.ve >= req.neutrinos);
    setClass(container, 'req-nu', 'unmet', state.matter.ve < req.neutrinos);
    setText(container, 'req-nu-value', `${formatNumber(state.matter.ve)} / ${formatNumber(req.neutrinos)}`);
  }
  if (req.tier2Particles) {
    const t2 = state.matter.s + state.matter.c + state.matter['mu-'] + state.matter.vmu;
    setClass(container, 'req-t2', 'met', t2 >= req.tier2Particles);
    setClass(container, 'req-t2', 'unmet', t2 < req.tier2Particles);
    setText(container, 'req-t2-value', `${formatNumber(t2)} / ${formatNumber(req.tier2Particles)}`);
  }
  if (req.tier3Particles) {
    const t3 = state.matter.b + state.matter.t + state.matter['tau-'] + state.matter.vtau;
    setClass(container, 'req-t3', 'met', t3 >= req.tier3Particles);
    setClass(container, 'req-t3', 'unmet', t3 < req.tier3Particles);
    setText(container, 'req-t3-value', `${formatNumber(t3)} / ${formatNumber(req.tier3Particles)}`);
  }
  if (req.antimatterParticles) {
    const anti = Object.values(state.antimatter).reduce((a, b) => a + b, 0);
    setClass(container, 'req-anti', 'met', anti >= req.antimatterParticles);
    setClass(container, 'req-anti', 'unmet', anti < req.antimatterParticles);
    setText(container, 'req-anti-value', `${formatNumber(anti)} / ${formatNumber(req.antimatterParticles)}`);
  }
  if (req.protons) {
    setClass(container, 'req-proton', 'met', state.composites.proton >= req.protons);
    setClass(container, 'req-proton', 'unmet', state.composites.proton < req.protons);
    setText(container, 'req-proton-value', `${formatNumber(state.composites.proton)} / ${formatNumber(req.protons)}`);
  }
  if (req.neutrons) {
    setClass(container, 'req-neutron', 'met', state.composites.neutron >= req.neutrons);
    setClass(container, 'req-neutron', 'unmet', state.composites.neutron < req.neutrons);
    setText(container, 'req-neutron-value', `${formatNumber(state.composites.neutron)} / ${formatNumber(req.neutrons)}`);
  }

  // Emerge button
  setDisabled(container, 'emerge-btn', !check.canEmerge);
  setText(container, 'emerge-btn-text', check.canEmerge ? `Emerge to E${targetLevel}` : 'Requirements not met');

  // Missing requirements
  const missingContainer = container.querySelector('[data-bind="emerge-missing"]') as HTMLElement;
  if (missingContainer) {
    if (!check.canEmerge && check.missing.length > 0) {
      missingContainer.style.display = '';
      const list = container.querySelector('[data-bind="emerge-missing-list"]');
      if (list) {
        list.innerHTML = check.missing.map(m => `<li>${m}</li>`).join('');
      }
    } else {
      missingContainer.style.display = 'none';
    }
  }
}

function updateEndgame(container: HTMLElement, state: GameState): void {
  setText(container, 'endgame-elements', `${state.stats.elementsUnlocked} / 118`);
  setText(container, 'endgame-ptable', state.periodicTableUnlocked ? 'Permanently Unlocked' : 'Not Yet Permanent');

  const hint = container.querySelector('[data-bind="endgame-hint"]') as HTMLElement;
  if (hint) {
    hint.style.display = state.periodicTableUnlocked ? 'none' : 'block';
  }
}

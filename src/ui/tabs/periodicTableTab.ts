/**
 * Periodic Table Tab
 * Uses create/update pattern for efficient DOM updates
 */

import { GameState } from '../../types';
import { formatNumber, formatTime } from '../../utils/format';
import { BALANCE } from '../../config/balance';
import { ELEMENTS, getElementByZ } from '../../config/elements';
import {
  canStartFusion, getFusionCost, canCraftLeadSample, canStartDecay,
  getElementsUnlockedCount, isPeriodicTableComplete
} from '../../systems/atoms';
import { setText, setDisabled, setProgress, setClass, setVisible, setHtml } from '../uiUpdater';

let lastTab = '';
let lastEmergentLevel = -1;
let lastFusionZ: number | null = null;
let lastLeadSampleCrafted = false;

export function renderPeriodicTableTab(container: HTMLElement, state: GameState): void {
  // Check for structural changes
  const fusionChanged = (state.activeFusion?.z ?? null) !== lastFusionZ;
  const leadCrafted = state.leadSample.crafted !== lastLeadSampleCrafted;

  const needsCreate = !container.querySelector('.periodic-table-tab') ||
    lastTab !== 'periodic-table' ||
    lastEmergentLevel !== state.currentEmergentLevel ||
    fusionChanged ||
    leadCrafted;

  if (needsCreate) {
    createPeriodicTableTab(container, state);
    lastTab = 'periodic-table';
    lastEmergentLevel = state.currentEmergentLevel;
    lastFusionZ = state.activeFusion?.z ?? null;
    lastLeadSampleCrafted = state.leadSample.crafted;
  } else {
    updatePeriodicTableTab(container, state);
  }
}

function createPeriodicTableTab(container: HTMLElement, state: GameState): void {
  const isComplete = isPeriodicTableComplete(state);
  const totalElements = ELEMENTS.length;

  let html = `
    <div class="tab-content periodic-table-tab">
      <section class="card">
        <h2>Periodic Table <span data-bind="ptable-complete">${isComplete ? '✓ COMPLETE!' : ''}</span></h2>
        <div class="ptable-stats">
          <div class="stat">
            <span class="label">Elements Unlocked:</span>
            <span class="value" data-bind="ptable-unlocked"></span>
          </div>
          <div class="stat">
            <span class="label">Atom Units:</span>
            <span class="value" data-bind="ptable-atoms"></span>
          </div>
          <div class="stat">
            <span class="label">Photons:</span>
            <span class="value" data-bind="ptable-photons"></span>
          </div>
          <div class="stat">
            <span class="label">Energy:</span>
            <span class="value" data-bind="ptable-energy"></span>
          </div>
        </div>
      </section>

      <section class="card fusion-panel" data-bind="fusion-panel">
        ${createFusionPanelContent(state)}
      </section>

      ${state.currentEmergentLevel >= 6 ? `
        <section class="card decay-panel" data-bind="decay-panel">
          ${createDecayPanelContent(state)}
        </section>
      ` : ''}

      <section class="card ptable-grid-container">
        <h3>Elements</h3>
        <div data-bind="ptable-grid">
          ${createPeriodicTableGrid(state)}
        </div>
      </section>
    </div>
  `;

  container.innerHTML = html;
}

function createFusionPanelContent(state: GameState): string {
  const nextUnlockable = state.elements.find(e => !e.unlocked && (e.z === 1 || state.elements.find(p => p.z === e.z - 1)?.unlocked));

  if (!nextUnlockable && !state.activeFusion) {
    return `
      <h3>Fusion</h3>
      <p>All fusible elements unlocked! Use decay for remaining elements.</p>
    `;
  }

  if (state.activeFusion) {
    const data = getElementByZ(state.activeFusion.z);
    const cost = getFusionCost(state.activeFusion.z, state);

    return `
      <h3>Fusion in Progress</h3>
      <div class="fusion-target">
        <span class="element-symbol">${data?.symbol}</span>
        <span class="element-name">${data?.name} (Z=${data?.z})</span>
      </div>
      <div class="progress-bar large">
        <div class="progress-fill" data-bind="fusion-progress" style="width: 0%"></div>
      </div>
      <div class="fusion-time" data-bind="fusion-time">Calculating...</div>
      <button class="btn btn-danger" data-action="cancel-fusion">Cancel Fusion</button>
    `;
  }

  // Show next fusible element
  const data = getElementByZ(nextUnlockable!.z);
  const cost = getFusionCost(nextUnlockable!.z, state);
  const isBeyondWall = nextUnlockable!.z > BALANCE.periodicTable.fusionWallZ;
  const isBeyondMax = nextUnlockable!.z > BALANCE.periodicTable.maxFusionZ;

  return `
    <h3>Fusion</h3>
    ${isBeyondMax ? `
      <p class="warning">Beyond fusion limit (Z>${BALANCE.periodicTable.maxFusionZ}). Use decay instead.</p>
    ` : ''}
    ${isBeyondWall && !isBeyondMax ? `
      <p class="warning">Beyond fusion wall - efficiency reduced!</p>
    ` : ''}

    <div class="fusion-target">
      <span class="element-symbol">${data?.symbol}</span>
      <span class="element-name">${data?.name} (Z=${data?.z})</span>
    </div>

    <div class="fusion-cost">
      <div class="cost-item" data-bind="fusion-cost-atoms">
        <span class="label">Atom Units:</span>
        <span class="value" data-bind="fusion-cost-atoms-value">${formatNumber(cost.atomUnits)}</span>
      </div>
      <div class="cost-item" data-bind="fusion-cost-photons">
        <span class="label">Photons:</span>
        <span class="value">${cost.photons}</span>
      </div>
      <div class="cost-item" data-bind="fusion-cost-energy">
        <span class="label">Energy:</span>
        <span class="value">${cost.energy}</span>
      </div>
      <div class="cost-item">
        <span class="label">Time:</span>
        <span class="value">${formatTime(cost.time)}</span>
      </div>
    </div>

    <button class="btn btn-large" data-bind="fusion-btn" data-action="start-fusion" data-z="${nextUnlockable!.z}">
      <span data-bind="fusion-btn-text">Fuse ${data?.symbol}</span>
    </button>
  `;
}

function createDecayPanelContent(state: GameState): string {
  const leadUnlocked = state.elements.find(e => e.z === 82)?.unlocked;

  if (!leadUnlocked) {
    return `
      <h3>Decay Path</h3>
      <p>Unlock Lead (Pb, Z=82) to enable decay path for heavy elements.</p>
    `;
  }

  if (!state.leadSample.crafted) {
    const cost = BALANCE.decay.leadSampleCost;

    return `
      <h3>Decay Path</h3>
      <p>Craft a Lead Sample to begin decay operations.</p>

      <div class="lead-sample-cost">
        <div class="cost-item" data-bind="lead-cost-energy">
          <span class="label">Energy:</span>
          <span class="value">${cost.energy}</span>
        </div>
        <div class="cost-item" data-bind="lead-cost-photons">
          <span class="label">Photons:</span>
          <span class="value">${cost.photons}</span>
        </div>
      </div>

      <button class="btn btn-large" data-bind="craft-lead-btn" data-action="craft-lead-sample">
        Craft Lead Sample
      </button>
    `;
  }

  // Show decay options
  const durability = state.leadSample.durability;
  const maxDurability = state.leadSample.maxDurability;

  // Find unlockable elements via decay
  const decayTargets = state.elements.filter(e => {
    if (e.unlocked) return false;
    if (e.z <= BALANCE.periodicTable.maxFusionZ) return false;
    const neighbors = [e.z - 1, e.z + 1, e.z - 2, e.z + 2];
    return neighbors.some(nz => state.elements.find(n => n.z === nz)?.unlocked);
  }).slice(0, 5);

  return `
    <h3>Decay Path</h3>

    <div class="lead-sample-status">
      <span class="label">Lead Sample Durability:</span>
      <span class="value" data-bind="lead-durability">${durability}/${maxDurability}</span>
      <div class="progress-bar">
        <div class="progress-fill" data-bind="lead-progress" style="width: ${(durability / maxDurability) * 100}%"></div>
      </div>
    </div>

    ${decayTargets.length > 0 ? `
      <div class="decay-targets" data-bind="decay-targets">
        <h4>Available Decay Targets</h4>
        ${decayTargets.map(target => {
          const data = getElementByZ(target.z);
          const sourceZ = target.z > 82 ? target.z - 1 : 82;
          const source = getElementByZ(sourceZ);

          return `
            <div class="decay-target" data-bind="decay-${target.z}">
              <span class="decay-path">${source?.symbol} → ${data?.symbol}</span>
              <span class="decay-info">Z=${target.z}</span>
              <button class="btn btn-small" data-bind="decay-btn-${target.z}"
                      data-action="start-decay" data-from="${sourceZ}" data-to="${target.z}">
                <span data-bind="decay-text-${target.z}">Decay</span>
              </button>
            </div>
          `;
        }).join('')}
      </div>
    ` : `
      <p>No elements available for decay. Unlock more elements via fusion first.</p>
    `}

    <div class="boson-inventory">
      <span>W+ Bosons: <span data-bind="boson-wp">${state.bosons['W+']}</span></span>
      <span>W- Bosons: <span data-bind="boson-wm">${state.bosons['W-']}</span></span>
    </div>
  `;
}

function createPeriodicTableGrid(state: GameState): string {
  const periods = 7;
  const groups = 18;

  let html = '<div class="ptable-grid">';

  // Create header row with group numbers
  html += '<div class="ptable-row header">';
  html += '<div class="ptable-cell empty"></div>';
  for (let g = 1; g <= groups; g++) {
    html += `<div class="ptable-cell group-label">${g}</div>`;
  }
  html += '</div>';

  // Create period rows
  for (let p = 1; p <= periods; p++) {
    html += `<div class="ptable-row period-${p}">`;
    html += `<div class="ptable-cell period-label">${p}</div>`;

    for (let g = 1; g <= groups; g++) {
      const element = ELEMENTS.find(e => e.period === p && e.group === g);

      if (element) {
        const stateEl = state.elements.find(e => e.z === element.z);
        const unlocked = stateEl?.unlocked || false;
        const inProgress = state.activeFusion?.z === element.z;

        html += `
          <div class="ptable-cell element ${unlocked ? 'unlocked' : ''} ${inProgress ? 'in-progress' : ''} ${element.category}"
               data-bind="element-${element.z}" data-z="${element.z}" title="${element.name} (Z=${element.z})">
            <span class="z">${element.z}</span>
            <span class="symbol">${element.symbol}</span>
          </div>
        `;
      } else {
        if (p === 6 && g === 3) {
          html += '<div class="ptable-cell la-marker" title="Lanthanides">La</div>';
        } else if (p === 7 && g === 3) {
          html += '<div class="ptable-cell ac-marker" title="Actinides">Ac</div>';
        } else {
          html += '<div class="ptable-cell empty"></div>';
        }
      }
    }

    html += '</div>';
  }

  // Lanthanides row
  html += '<div class="ptable-row lanthanides">';
  html += '<div class="ptable-cell period-label">La</div>';
  for (let z = 57; z <= 71; z++) {
    const element = ELEMENTS.find(e => e.z === z);
    if (element) {
      const stateEl = state.elements.find(e => e.z === element.z);
      const unlocked = stateEl?.unlocked || false;
      html += `
        <div class="ptable-cell element ${unlocked ? 'unlocked' : ''} lanthanide"
             data-bind="element-${element.z}" data-z="${element.z}" title="${element.name}">
          <span class="z">${element.z}</span>
          <span class="symbol">${element.symbol}</span>
        </div>
      `;
    }
  }
  html += '<div class="ptable-cell empty"></div>';
  html += '<div class="ptable-cell empty"></div>';
  html += '</div>';

  // Actinides row
  html += '<div class="ptable-row actinides">';
  html += '<div class="ptable-cell period-label">Ac</div>';
  for (let z = 89; z <= 103; z++) {
    const element = ELEMENTS.find(e => e.z === z);
    if (element) {
      const stateEl = state.elements.find(e => e.z === element.z);
      const unlocked = stateEl?.unlocked || false;
      html += `
        <div class="ptable-cell element ${unlocked ? 'unlocked' : ''} actinide"
             data-bind="element-${element.z}" data-z="${element.z}" title="${element.name}">
          <span class="z">${element.z}</span>
          <span class="symbol">${element.symbol}</span>
        </div>
      `;
    }
  }
  html += '<div class="ptable-cell empty"></div>';
  html += '<div class="ptable-cell empty"></div>';
  html += '</div>';

  html += '</div>';

  return html;
}

function updatePeriodicTableTab(container: HTMLElement, state: GameState): void {
  const unlockedCount = getElementsUnlockedCount(state);
  const totalElements = ELEMENTS.length;
  const isComplete = isPeriodicTableComplete(state);

  // Stats
  setText(container, 'ptable-complete', isComplete ? '✓ COMPLETE!' : '');
  setText(container, 'ptable-unlocked', `${unlockedCount}/${totalElements}`);
  setText(container, 'ptable-atoms', formatNumber(state.atomUnits));
  setText(container, 'ptable-photons', formatNumber(state.catalysts.photon));
  setText(container, 'ptable-energy', formatNumber(state.energy));

  // Update fusion panel
  updateFusionPanel(container, state);

  // Update decay panel
  if (state.currentEmergentLevel >= 6) {
    updateDecayPanel(container, state);
  }

  // Update element states in grid
  updateElementGrid(container, state);
}

function updateFusionPanel(container: HTMLElement, state: GameState): void {
  const nextUnlockable = state.elements.find(e => !e.unlocked && (e.z === 1 || state.elements.find(p => p.z === e.z - 1)?.unlocked));

  if (state.activeFusion) {
    // Update progress
    const cost = getFusionCost(state.activeFusion.z, state);
    const elapsed = Date.now() - state.activeFusion.startTime;
    const progress = Math.min(elapsed / cost.time, 1);
    const remaining = Math.max(0, cost.time - elapsed);

    setProgress(container, 'fusion-progress', progress);
    setText(container, 'fusion-time', `${formatTime(remaining)} remaining`);
  } else if (nextUnlockable) {
    const cost = getFusionCost(nextUnlockable.z, state);
    const check = canStartFusion(state, nextUnlockable.z);

    // Update cost colors
    setClass(container, 'fusion-cost-atoms', 'met', state.atomUnits >= cost.atomUnits);
    setClass(container, 'fusion-cost-atoms', 'unmet', state.atomUnits < cost.atomUnits);
    setClass(container, 'fusion-cost-photons', 'met', state.catalysts.photon >= cost.photons);
    setClass(container, 'fusion-cost-photons', 'unmet', state.catalysts.photon < cost.photons);
    setClass(container, 'fusion-cost-energy', 'met', state.energy >= cost.energy);
    setClass(container, 'fusion-cost-energy', 'unmet', state.energy < cost.energy);

    // Update button
    setDisabled(container, 'fusion-btn', !check.canStart);
    const data = getElementByZ(nextUnlockable.z);
    setText(container, 'fusion-btn-text', check.canStart ? `Fuse ${data?.symbol}` : check.reason ?? '');
  }
}

function updateDecayPanel(container: HTMLElement, state: GameState): void {
  const leadUnlocked = state.elements.find(e => e.z === 82)?.unlocked;

  if (!leadUnlocked) return;

  if (!state.leadSample.crafted) {
    const canCraft = canCraftLeadSample(state);
    const cost = BALANCE.decay.leadSampleCost;

    setClass(container, 'lead-cost-energy', 'met', state.energy >= cost.energy);
    setClass(container, 'lead-cost-energy', 'unmet', state.energy < cost.energy);
    setClass(container, 'lead-cost-photons', 'met', state.catalysts.photon >= cost.photons);
    setClass(container, 'lead-cost-photons', 'unmet', state.catalysts.photon < cost.photons);
    setDisabled(container, 'craft-lead-btn', !canCraft);
  } else {
    const durability = state.leadSample.durability;
    const maxDurability = state.leadSample.maxDurability;

    setText(container, 'lead-durability', `${durability}/${maxDurability}`);
    setProgress(container, 'lead-progress', durability / maxDurability);

    // Update decay target buttons
    const decayTargets = state.elements.filter(e => {
      if (e.unlocked) return false;
      if (e.z <= BALANCE.periodicTable.maxFusionZ) return false;
      const neighbors = [e.z - 1, e.z + 1, e.z - 2, e.z + 2];
      return neighbors.some(nz => state.elements.find(n => n.z === nz)?.unlocked);
    }).slice(0, 5);

    for (const target of decayTargets) {
      const sourceZ = target.z > 82 ? target.z - 1 : 82;
      const check = canStartDecay(state, sourceZ, target.z);
      setDisabled(container, `decay-btn-${target.z}`, !check.canStart);
      setText(container, `decay-text-${target.z}`, check.canStart ? 'Decay' : check.reason ?? '');
    }

    // Bosons
    setText(container, 'boson-wp', String(state.bosons['W+']));
    setText(container, 'boson-wm', String(state.bosons['W-']));
  }
}

function updateElementGrid(container: HTMLElement, state: GameState): void {
  // Update unlocked state for each element
  for (const element of ELEMENTS) {
    const stateEl = state.elements.find(e => e.z === element.z);
    const unlocked = stateEl?.unlocked || false;
    const inProgress = state.activeFusion?.z === element.z;

    const cell = container.querySelector(`[data-bind="element-${element.z}"]`);
    if (cell) {
      cell.classList.toggle('unlocked', unlocked);
      cell.classList.toggle('in-progress', inProgress);
    }
  }
}

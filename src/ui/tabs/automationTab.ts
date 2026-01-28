/**
 * Automation Tab
 * Uses create/update pattern for efficient DOM updates
 */

import { GameState } from '../../types';
import { formatNumber } from '../../utils/format';
import { BALANCE } from '../../config/balance';
import {
  AUTOMATION_MODULES, canMintChips, getMaxChipsMintable,
  canUnlockModule, canUpgradeModule, getModuleCost, AutomationModuleId
} from '../../systems/automation';
import { setText, setDisabled, setActive, setHtml } from '../uiUpdater';

let lastTab = '';
let lastEmergentLevel = -1;

export function renderAutomationTab(container: HTMLElement, state: GameState): void {
  const needsCreate = !container.querySelector('.automation-tab') ||
    lastTab !== 'automation' ||
    lastEmergentLevel !== state.currentEmergentLevel;

  if (needsCreate) {
    createAutomationTab(container, state);
    lastTab = 'automation';
    lastEmergentLevel = state.currentEmergentLevel;
  } else {
    updateAutomationTab(container, state);
  }
}

function createAutomationTab(container: HTMLElement, state: GameState): void {
  let html = `
    <div class="tab-content automation-tab">
      <section class="card">
        <h2>Automation Chips</h2>
        <p class="hint">Convert Energy into Automation Chips to unlock and upgrade automation modules.</p>

        <div class="chip-stats">
          <div class="stat">
            <span class="label">Chips:</span>
            <span class="value highlight" data-bind="auto-chips"></span>
          </div>
          <div class="stat">
            <span class="label">Energy:</span>
            <span class="value" data-bind="auto-energy"></span>
          </div>
          <div class="stat">
            <span class="label">Cost:</span>
            <span class="value">${BALANCE.automation.chipCost} E per chip</span>
          </div>
        </div>

        <div class="mint-buttons">
          <button class="btn" data-bind="mint-x1" data-action="mint-chips" data-count="1">Mint x1</button>
          <button class="btn" data-bind="mint-x10" data-action="mint-chips" data-count="10">Mint x10</button>
          <button class="btn" data-bind="mint-max" data-action="mint-chips" data-count="max">
            Mint Max (<span data-bind="mint-max-count">0</span>)
          </button>
        </div>
      </section>

      <section class="card">
        <h2>Automation Modules</h2>
        <div class="module-grid" data-bind="module-grid">
          ${createModulesHtml(state)}
        </div>
      </section>

      <section class="card">
        <h2>Automation Help</h2>
        <div class="help-text">
          <p><strong>Auto Harvester:</strong> Automatically purchases harvester upgrades when affordable. Higher levels increase purchase speed.</p>
          <p><strong>Auto Collider:</strong> Automatically runs the collider at set intervals. Higher levels reduce the interval.</p>
          <p><strong>Auto Polarity:</strong> Switches harvester polarity to maintain matter/antimatter ratio targets.</p>
          <p><strong>Auto Annihilate:</strong> Automatically annihilates pairs to maintain Energy targets.</p>
          <p><strong>Auto Assembly:</strong> Builds protons and neutrons automatically when resources are available.</p>
          <p><strong>Auto Atom:</strong> Builds atom units automatically when composites are available.</p>
          <p><strong>Auto Fusion:</strong> Queues and starts fusion for the next unlockable element.</p>
          <p><strong>Auto Decay:</strong> Uses decay to unlock elements beyond the fusion wall.</p>
        </div>
      </section>
    </div>
  `;

  container.innerHTML = html;
}

function createModulesHtml(state: GameState): string {
  return AUTOMATION_MODULES.map(module => {
    const moduleState = state.automation[module.id];
    const isAvailable = state.currentEmergentLevel >= module.requiredLevel;

    if (!isAvailable) {
      return `
        <div class="module-card locked" data-bind="module-${module.id}">
          <h3>${module.name}</h3>
          <p class="module-desc">${module.description}</p>
          <p class="module-lock">Requires E${module.requiredLevel}</p>
        </div>
      `;
    }

    if (!moduleState.unlocked) {
      return `
        <div class="module-card not-unlocked" data-bind="module-${module.id}">
          <h3>${module.name}</h3>
          <p class="module-desc">${module.description}</p>
          <button class="btn" data-bind="unlock-${module.id}" data-action="unlock-module" data-module="${module.id}">
            Unlock (<span data-bind="unlock-${module.id}-cost"></span> chips)
          </button>
        </div>
      `;
    }

    return `
      <div class="module-card unlocked" data-bind="module-${module.id}">
        <h3>${module.name}</h3>
        <p class="module-desc">${module.description}</p>
        <div class="module-level" data-bind="level-${module.id}">Level ${moduleState.level}</div>

        <div class="module-controls">
          <button class="btn btn-small" data-bind="toggle-${module.id}" data-action="toggle-module" data-module="${module.id}">
            <span data-bind="toggle-${module.id}-text">${moduleState.enabled ? 'Enabled' : 'Disabled'}</span>
          </button>
          <button class="btn btn-small" data-bind="upgrade-${module.id}" data-action="upgrade-module" data-module="${module.id}">
            Upgrade (<span data-bind="upgrade-${module.id}-cost"></span> chips)
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function updateAutomationTab(container: HTMLElement, state: GameState): void {
  const maxMintable = getMaxChipsMintable(state);

  // Chip stats
  setText(container, 'auto-chips', formatNumber(state.automation.chips));
  setText(container, 'auto-energy', formatNumber(state.energy));

  // Mint buttons
  setDisabled(container, 'mint-x1', !canMintChips(state, 1));
  setDisabled(container, 'mint-x10', !canMintChips(state, 10));
  setDisabled(container, 'mint-max', maxMintable <= 0);
  setText(container, 'mint-max-count', String(maxMintable));

  // Modules - check if structure changed (module unlocked)
  let structureChanged = false;
  for (const module of AUTOMATION_MODULES) {
    const moduleState = state.automation[module.id];
    const isAvailable = state.currentEmergentLevel >= module.requiredLevel;
    if (!isAvailable) continue;

    const card = container.querySelector(`[data-bind="module-${module.id}"]`);
    if (!card) continue;

    // Check if module was just unlocked (structure change)
    const wasNotUnlocked = card.classList.contains('not-unlocked');
    if (wasNotUnlocked && moduleState.unlocked) {
      structureChanged = true;
      break;
    }
  }

  if (structureChanged) {
    // Recreate module grid
    const grid = container.querySelector('[data-bind="module-grid"]');
    if (grid) {
      grid.innerHTML = createModulesHtml(state);
    }
  }

  // Update module values
  for (const module of AUTOMATION_MODULES) {
    const moduleState = state.automation[module.id];
    const isAvailable = state.currentEmergentLevel >= module.requiredLevel;
    if (!isAvailable) continue;

    if (!moduleState.unlocked) {
      const cost = getModuleCost(module, 0);
      setText(container, `unlock-${module.id}-cost`, String(cost));
      setDisabled(container, `unlock-${module.id}`, !canUnlockModule(state, module.id));
    } else {
      setText(container, `level-${module.id}`, `Level ${moduleState.level}`);
      setText(container, `toggle-${module.id}-text`, moduleState.enabled ? 'Enabled' : 'Disabled');
      setActive(container, `toggle-${module.id}`, moduleState.enabled);

      // Update enabled/disabled class on card
      const card = container.querySelector(`[data-bind="module-${module.id}"]`);
      if (card) {
        card.classList.toggle('enabled', moduleState.enabled);
        card.classList.toggle('disabled', !moduleState.enabled);
      }

      const nextCost = getModuleCost(module, moduleState.level);
      setText(container, `upgrade-${module.id}-cost`, String(nextCost));
      setDisabled(container, `upgrade-${module.id}`, !canUpgradeModule(state, module.id));
    }
  }
}

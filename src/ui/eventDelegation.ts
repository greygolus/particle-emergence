/**
 * Event Delegation System
 * Attach event listeners once and handle all actions via data attributes
 */

import { GameState, ExoticEventResult } from '../types';
import { BALANCE } from '../config/balance';
import {
  QUARK_RATE_UPGRADE, QUARK_EFFICIENCY_UPGRADE,
  LEPTON_RATE_UPGRADE, PRECISION_UPGRADE,
  STABILITY_UPGRADE, ELECTRON_EFFICIENCY_UPGRADE,
  getBuyCount, buyUpgrade
} from '../systems/upgrades';
import {
  runCollider, runBosonCollider, canRunCollider, canRunBosonCollider,
  unlockTier3, setColliderMode, setColliderTier,
  setColliderMatterMode, setPrecisionSpend, setBosonMode
} from '../systems/collider';
import { annihilate, getAnnihilatableCount, AnnihilationPair } from '../systems/annihilation';
import { buyDebrisUpgrade, DebrisUpgradeType } from '../systems/debris';
import { buildProton, buildNeutron, getMaxBuildable } from '../systems/assembly';
import { buildAtomUnits, getMaxAtomUnits, startFusion, cancelFusion, craftLeadSample, startDecay } from '../systems/atoms';
import { mintChips, getMaxChipsMintable, unlockModule, upgradeModule, toggleModule, AutomationModuleId } from '../systems/automation';
import { emerge } from '../systems/emerge';
import { saveGame, deleteGame } from '../core/state';
import { getGameLoop } from './renderer';

let initialized = false;

export function initEventDelegation(): void {
  if (initialized) return;
  initialized = true;

  const content = document.getElementById('content');
  if (content) {
    content.addEventListener('click', handleContentClick);
    content.addEventListener('change', handleContentChange);
    content.addEventListener('input', handleContentInput);
  }

  const footer = document.getElementById('footer');
  if (footer) {
    footer.addEventListener('click', handleFooterClick);
  }

  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.addEventListener('click', handleSidebarClick);
  }
}

function handleSidebarClick(e: MouseEvent): void {
  const target = e.target as HTMLElement;

  // Handle dev tools toggle
  const devToolsHeader = target.closest('[data-action="toggle-dev-tools"]');
  if (devToolsHeader) {
    const devTools = devToolsHeader.closest('.dev-tools');
    if (devTools) {
      devTools.classList.toggle('collapsed');
    }
    return;
  }

  // Handle dev tool actions
  const action = target.getAttribute('data-action');
  if (action?.startsWith('dev-')) {
    handleDevAction(action);
    return;
  }

  // Handle tab navigation
  const btn = target.closest('[data-tab]') as HTMLElement;
  if (!btn) return;

  const tab = btn.getAttribute('data-tab');
  if (tab) {
    updateState(s => ({ ...s, currentTab: tab as GameState['currentTab'] }));
  }
}

function handleDevAction(action: string): void {
  const loop = getGameLoop();
  if (!loop) return;

  switch (action) {
    case 'dev-set-e1':
    case 'dev-set-e2':
    case 'dev-set-e3':
    case 'dev-set-e4':
    case 'dev-set-e5':
    case 'dev-set-e6': {
      const level = parseInt(action.slice(-1)) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
      updateState(s => ({
        ...s,
        currentEmergentLevel: level,
        periodicTableUnlocked: level >= 6,
        forcesUnlocked: level >= 6,
        colliderUpgrades: {
          ...s.colliderUpgrades,
          tier3Unlocked: level >= 3,
        },
      }));
      break;
    }
    case 'dev-add-atoms':
      updateState(s => ({
        ...s,
        atomUnits: s.atomUnits + 250,
      }));
      break;
    case 'dev-everything-x10':
      updateState(s => {
        // Add +1 to everything then multiply by 10
        const addAndMultiply = (val: number) => (val + 1) * 10;
        return {
          ...s,
          pq: addAndMultiply(s.pq),
          pl: addAndMultiply(s.pl),
          energy: addAndMultiply(s.energy),
          debris: addAndMultiply(s.debris),
          atomUnits: addAndMultiply(s.atomUnits),
          matter: {
            u: addAndMultiply(s.matter.u),
            d: addAndMultiply(s.matter.d),
            'e-': addAndMultiply(s.matter['e-']),
            ve: addAndMultiply(s.matter.ve),
            s: addAndMultiply(s.matter.s),
            c: addAndMultiply(s.matter.c),
            'mu-': addAndMultiply(s.matter['mu-']),
            vmu: addAndMultiply(s.matter.vmu),
            b: addAndMultiply(s.matter.b),
            t: addAndMultiply(s.matter.t),
            'tau-': addAndMultiply(s.matter['tau-']),
            vtau: addAndMultiply(s.matter.vtau),
          },
          antimatter: {
            u_bar: addAndMultiply(s.antimatter.u_bar),
            d_bar: addAndMultiply(s.antimatter.d_bar),
            'e+': addAndMultiply(s.antimatter['e+']),
            ve_bar: addAndMultiply(s.antimatter.ve_bar),
            s_bar: addAndMultiply(s.antimatter.s_bar),
            c_bar: addAndMultiply(s.antimatter.c_bar),
            'mu+': addAndMultiply(s.antimatter['mu+']),
            vmu_bar: addAndMultiply(s.antimatter.vmu_bar),
            b_bar: addAndMultiply(s.antimatter.b_bar),
            t_bar: addAndMultiply(s.antimatter.t_bar),
            'tau+': addAndMultiply(s.antimatter['tau+']),
            vtau_bar: addAndMultiply(s.antimatter.vtau_bar),
          },
          catalysts: {
            photon: addAndMultiply(s.catalysts.photon),
            gluon: addAndMultiply(s.catalysts.gluon),
          },
          composites: {
            proton: addAndMultiply(s.composites.proton),
            neutron: addAndMultiply(s.composites.neutron),
          },
          bosons: {
            'W+': addAndMultiply(s.bosons['W+']),
            'W-': addAndMultiply(s.bosons['W-']),
            'Z0': addAndMultiply(s.bosons['Z0']),
            higgs: addAndMultiply(s.bosons.higgs),
          },
        };
      });
      break;
  }
}

function handleFooterClick(e: MouseEvent): void {
  const target = e.target as HTMLElement;
  const action = target.getAttribute('data-action');
  if (!action) return;

  const loop = getGameLoop();
  if (!loop) return;

  switch (action) {
    case 'save':
      saveGame(loop.getState());
      updateState(s => ({ ...s, lastSave: Date.now() }));
      break;
    case 'export':
      const data = btoa(JSON.stringify({ version: 1, state: loop.getState() }));
      navigator.clipboard.writeText(data).then(() => {
        alert('Save exported to clipboard!');
      });
      break;
    case 'import':
      const importData = prompt('Paste your save data:');
      if (importData) {
        try {
          const parsed = JSON.parse(atob(importData));
          loop.setState(parsed.state);
          alert('Save imported successfully!');
        } catch {
          alert('Invalid save data!');
        }
      }
      break;
    case 'buymode-x1':
      updateState(s => ({ ...s, buyMode: 'x1' }));
      break;
    case 'buymode-x10':
      updateState(s => ({ ...s, buyMode: 'x10' }));
      break;
    case 'buymode-xMax':
      updateState(s => ({ ...s, buyMode: 'xMax' }));
      break;
  }
}

function handleContentClick(e: MouseEvent): void {
  const target = e.target as HTMLElement;
  const btn = target.closest('[data-action]') as HTMLElement;
  if (!btn) return;

  // Prevent action if button is disabled
  if (btn.classList.contains('disabled')) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  const action = btn.getAttribute('data-action');
  if (!action) return;

  handleAction(action, btn);
}

function handleContentChange(e: Event): void {
  const target = e.target as HTMLInputElement;
  const action = target.getAttribute('data-action');
  if (!action) return;

  handleAction(action, target);
}

function handleContentInput(e: Event): void {
  const target = e.target as HTMLInputElement;
  const action = target.getAttribute('data-action');
  if (!action) return;

  // Only handle range inputs on input event
  if (target.type === 'range') {
    handleAction(action, target);
  }
}

function handleAction(action: string, element: HTMLElement): void {
  const loop = getGameLoop();
  if (!loop) return;

  switch (action) {
    // === UPGRADES ===
    case 'buy-quark-rate':
      updateState(s => {
        const count = getBuyCount(s, QUARK_RATE_UPGRADE);
        return buyUpgrade(s, QUARK_RATE_UPGRADE, count);
      });
      break;
    case 'buy-quark-eff':
      updateState(s => {
        const count = getBuyCount(s, QUARK_EFFICIENCY_UPGRADE);
        return buyUpgrade(s, QUARK_EFFICIENCY_UPGRADE, count);
      });
      break;
    case 'buy-lepton-rate':
      updateState(s => {
        const count = getBuyCount(s, LEPTON_RATE_UPGRADE);
        return buyUpgrade(s, LEPTON_RATE_UPGRADE, count);
      });
      break;
    case 'buy-precision':
      updateState(s => {
        const count = getBuyCount(s, PRECISION_UPGRADE);
        return buyUpgrade(s, PRECISION_UPGRADE, count);
      });
      break;
    case 'buy-stability':
      updateState(s => {
        const count = getBuyCount(s, STABILITY_UPGRADE);
        return buyUpgrade(s, STABILITY_UPGRADE, count);
      });
      break;
    case 'buy-electron-eff':
      updateState(s => {
        const count = getBuyCount(s, ELECTRON_EFFICIENCY_UPGRADE);
        return buyUpgrade(s, ELECTRON_EFFICIENCY_UPGRADE, count);
      });
      break;
    case 'buy-gluon-catalyst':
      updateState(s => {
        if (s.pl < BALANCE.assembly.gluonCatalystUnlockCost) return s;
        return {
          ...s,
          pl: s.pl - BALANCE.assembly.gluonCatalystUnlockCost,
          assemblyUpgrades: { ...s.assemblyUpgrades, gluonCatalyst: true },
        };
      });
      break;

    // === POLARITY ===
    case 'toggle-quark-polarity':
      updateState(s => {
        if (s.harvesters.quarkSwitchCooldown > 0) return s;
        return {
          ...s,
          harvesters: {
            ...s.harvesters,
            quarkPolarity: s.harvesters.quarkPolarity === 'matter' ? 'antimatter' : 'matter',
            quarkSwitchCooldown: BALANCE.antimatter.polaritySwitchCooldown,
          },
        };
      });
      break;
    case 'toggle-lepton-polarity':
      updateState(s => {
        if (s.harvesters.leptonSwitchCooldown > 0) return s;
        return {
          ...s,
          harvesters: {
            ...s.harvesters,
            leptonPolarity: s.harvesters.leptonPolarity === 'matter' ? 'antimatter' : 'matter',
            leptonSwitchCooldown: BALANCE.antimatter.polaritySwitchCooldown,
          },
        };
      });
      break;

    // === COLLIDER ===
    case 'set-tier-2':
      updateState(s => setColliderTier(s, 2));
      break;
    case 'set-tier-3':
      updateState(s => setColliderTier(s, 3));
      break;
    case 'unlock-tier-3':
      updateState(s => unlockTier3(s));
      break;
    case 'set-mode-quark':
      updateState(s => setColliderMode(s, 'quark'));
      break;
    case 'set-mode-lepton':
      updateState(s => setColliderMode(s, 'lepton'));
      break;
    case 'set-matter-mode':
      updateState(s => setColliderMatterMode(s, 'matter'));
      break;
    case 'set-antimatter-mode':
      updateState(s => setColliderMatterMode(s, 'antimatter'));
      break;
    case 'toggle-boson-mode':
      const checkbox = element as HTMLInputElement;
      updateState(s => setBosonMode(s, checkbox.checked));
      break;
    case 'set-precision':
      const slider = element as HTMLInputElement;
      const value = parseInt(slider.value, 10);
      updateState(s => setPrecisionSpend(s, value));
      break;
    case 'run-collider': {
      const loop = getGameLoop();
      if (!loop) break;
      const currentState = loop.getState();

      if (currentState.collider.isBosonMode && currentState.colliderUpgrades.bosonModeUnlocked) {
        const check = canRunBosonCollider(currentState);
        if (!check.canRun) break;
        const { newState } = runBosonCollider(currentState);
        updateState(() => newState);
      } else {
        const check = canRunCollider(currentState, currentState.collider.tier);
        if (!check.canRun) break;
        const { newState, result } = runCollider(currentState);
        updateState(() => newState);

        // Apply visual feedback to run button
        const btn = element;
        btn.classList.remove('collider-result-fail', 'collider-result-debris', 'collider-result-upgrade', 'collider-result-exotic');

        if (result.exoticEvent) {
          btn.classList.add('collider-result-exotic');
          showExoticPopup(result.exoticEvent);
        } else if (result.success) {
          btn.classList.add('collider-result-upgrade');
        } else if (result.debrisDrop > 0) {
          btn.classList.add('collider-result-debris');
        } else {
          btn.classList.add('collider-result-fail');
        }

        // Remove class after animation
        setTimeout(() => {
          btn.classList.remove('collider-result-fail', 'collider-result-debris', 'collider-result-upgrade', 'collider-result-exotic');
        }, 1000);
      }
      break;
    }

    // === DEBRIS SHOP ===
    case 'debris-upgrade': {
      const upgrade = element.getAttribute('data-upgrade') as DebrisUpgradeType;
      if (upgrade) {
        updateState(s => buyDebrisUpgrade(s, upgrade));
      }
      break;
    }

    // === ANNIHILATION ===
    case 'annihilate': {
      const pair = element.getAttribute('data-pair') as AnnihilationPair;
      updateState(s => {
        const max = getAnnihilatableCount(s, pair);
        let count = 1;
        // Use global buy mode
        if (s.buyMode === 'x10') count = Math.min(10, max);
        if (s.buyMode === 'xMax') count = max;
        if (count <= 0) return s;
        const { newState } = annihilate(s, pair, count);
        return newState;
      });
      break;
    }

    // === ASSEMBLY ===
    case 'build-proton': {
      const countStr = element.getAttribute('data-count');
      updateState(s => {
        const max = getMaxBuildable(s, 'proton');
        let count = 1;
        if (countStr === '10') count = Math.min(10, max);
        if (countStr === 'max') count = max;
        if (count <= 0) return s;
        const { newState } = buildProton(s, count);
        return newState;
      });
      break;
    }
    case 'build-neutron': {
      const countStr = element.getAttribute('data-count');
      updateState(s => {
        const max = getMaxBuildable(s, 'neutron');
        let count = 1;
        if (countStr === '10') count = Math.min(10, max);
        if (countStr === 'max') count = max;
        if (count <= 0) return s;
        const { newState } = buildNeutron(s, count);
        return newState;
      });
      break;
    }
    case 'build-atom': {
      const countStr = element.getAttribute('data-count');
      updateState(s => {
        const max = getMaxAtomUnits(s);
        let count = 1;
        if (countStr === '10') count = Math.min(10, max);
        if (countStr === 'max') count = max;
        if (count <= 0) return s;
        const { newState } = buildAtomUnits(s, count);
        return newState;
      });
      break;
    }

    // === PERIODIC TABLE ===
    case 'start-fusion': {
      const z = parseInt(element.getAttribute('data-z') || '0', 10);
      updateState(s => startFusion(s, z));
      break;
    }
    case 'cancel-fusion':
      updateState(s => cancelFusion(s));
      break;
    case 'craft-lead-sample':
      updateState(s => craftLeadSample(s));
      break;
    case 'start-decay': {
      const fromZ = parseInt(element.getAttribute('data-from') || '0', 10);
      const toZ = parseInt(element.getAttribute('data-to') || '0', 10);
      updateState(s => startDecay(s, fromZ, toZ));
      break;
    }

    // === FORCES ===
    case 'run-boson-collider':
      updateState(s => {
        const check = canRunBosonCollider(s);
        if (!check.canRun) return s;
        const { newState } = runBosonCollider(s);
        return newState;
      });
      break;
    case 'unlock-boson-mode':
      updateState(s => {
        if (s.pq < 10000 || s.pl < 5000) return s;
        return {
          ...s,
          pq: s.pq - 10000,
          pl: s.pl - 5000,
          colliderUpgrades: { ...s.colliderUpgrades, bosonModeUnlocked: true },
        };
      });
      break;

    // === AUTOMATION ===
    case 'mint-chips': {
      const countStr = element.getAttribute('data-count');
      updateState(s => {
        let count = 1;
        if (countStr === '10') count = 10;
        if (countStr === 'max') count = getMaxChipsMintable(s);
        return mintChips(s, count);
      });
      break;
    }
    case 'unlock-module': {
      const moduleId = element.getAttribute('data-module') as AutomationModuleId;
      updateState(s => unlockModule(s, moduleId));
      break;
    }
    case 'upgrade-module': {
      const moduleId = element.getAttribute('data-module') as AutomationModuleId;
      updateState(s => upgradeModule(s, moduleId));
      break;
    }
    case 'toggle-module': {
      const moduleId = element.getAttribute('data-module') as AutomationModuleId;
      updateState(s => toggleModule(s, moduleId));
      break;
    }

    // === EMERGE ===
    case 'emerge': {
      const level = parseInt(element.getAttribute('data-level') || '0', 10) as 0|1|2|3|4|5|6;
      if (confirm(`Are you sure you want to Emerge to E${level}? This will reset most progress.`)) {
        updateState(s => emerge(s, level));
      }
      break;
    }
    case 'restart-e6':
      if (confirm('Are you sure you want to restart at E6? This will reset currencies and inventories.')) {
        updateState(s => {
          const newState = { ...s };
          newState.pq = 0;
          newState.pl = 0;
          newState.energy = 0;
          newState.debris = 0;
          newState.atomUnits = 0;
          newState.matter = { u: 0, d: 0, 'e-': 0, ve: 0, s: 0, c: 0, 'mu-': 0, vmu: 0, b: 0, t: 0, 'tau-': 0, vtau: 0 };
          newState.antimatter = { u_bar: 0, d_bar: 0, 'e+': 0, ve_bar: 0, s_bar: 0, c_bar: 0, 'mu+': 0, vmu_bar: 0, b_bar: 0, t_bar: 0, 'tau+': 0, vtau_bar: 0 };
          newState.catalysts = { photon: 0, gluon: 0 };
          newState.composites = { proton: 0, neutron: 0 };
          newState.bosons = { 'W+': 0, 'W-': 0, Z0: 0, higgs: 0 };
          newState.quarkUpgrades = { quarkRate: 0, quarkEfficiency: 0 };
          newState.leptonUpgrades = { leptonRate: 0, precision: 0 };
          newState.assemblyUpgrades = { stability: 0, gluonCatalyst: false };
          newState.atomUpgrades = { electronEfficiency: 0 };
          newState.colliderUpgrades = { ...newState.colliderUpgrades, tier3Unlocked: false, catalystSlots: 0, gluonBoost: 0, photonBoost: 0 };
          newState.tempBuffs = { colliderOverdrive: { active: false, endTime: 0 } };
          newState.activeFusion = null;
          newState.activeDecay = null;
          if (!newState.periodicTableUnlocked) {
            newState.leadSample = { crafted: false, durability: 0, maxDurability: 100 };
          }
          return newState;
        });
      }
      break;

    // === STATS ===
    case 'hard-reset':
      if (confirm('Are you absolutely sure you want to delete ALL progress? This cannot be undone!')) {
        if (confirm('Really delete everything?')) {
          deleteGame();
          window.location.reload();
        }
      }
      break;
  }
}

function updateState(updater: (state: GameState) => GameState): void {
  const loop = getGameLoop();
  if (loop) {
    loop.updateState(updater);
  }
}

function showExoticPopup(event: ExoticEventResult): void {
  // Remove any existing popup
  const existing = document.querySelector('.exotic-popup');
  if (existing) existing.remove();

  // Create popup
  const popup = document.createElement('div');
  popup.className = 'exotic-popup';

  let typeText = '';
  let descText = '';

  switch (event.type) {
    case 'guaranteedUpgrade':
      typeText = '🎯 Guaranteed Upgrade!';
      descText = 'Your next collider run is guaranteed to succeed!';
      break;
    case 'catalystJackpot':
      typeText = '💎 Catalyst Jackpot!';
      descText = `You found ${event.rewards.photons ?? 0} photons and ${event.rewards.gluons ?? 0} gluons!`;
      break;
    case 'overdrive':
      typeText = '⚡ Overdrive!';
      descText = '2x collider speed for 30 seconds!';
      break;
  }

  popup.innerHTML = `
    <h3>✨ EXOTIC EVENT! ✨</h3>
    <p class="exotic-type">${typeText}</p>
    <p>${descText}</p>
  `;

  document.body.appendChild(popup);

  // Remove after 3 seconds
  setTimeout(() => {
    popup.style.animation = 'exotic-popup-in 0.3s ease-out reverse';
    setTimeout(() => popup.remove(), 300);
  }, 3000);
}

/**
 * Assembly Tab - Build protons, neutrons, and atom units
 * Uses create/update pattern for efficient DOM updates
 */

import { GameState } from '../../types';
import { formatNumber, formatPercent } from '../../utils/format';
import { BALANCE } from '../../config/balance';
import { getStability, getElectronCost } from '../../core/state';
import { canBuildProton, canBuildNeutron, getMaxBuildable } from '../../systems/assembly';
import { canBuildAtomUnits, getMaxAtomUnits } from '../../systems/atoms';
import { STABILITY_UPGRADE, ELECTRON_EFFICIENCY_UPGRADE, getUpgradeCost, canAffordUpgrade } from '../../systems/upgrades';
import { setText, setDisabled, setProgress, setVisible } from '../uiUpdater';

let lastEmergentLevel = -1;
let lastTab = '';

export function renderAssemblyTab(container: HTMLElement, state: GameState): void {
  const needsCreate = !container.querySelector('.assembly-tab') ||
    lastEmergentLevel !== state.currentEmergentLevel ||
    lastTab !== 'assembly';

  if (needsCreate) {
    createAssemblyTab(container, state);
    lastEmergentLevel = state.currentEmergentLevel;
    lastTab = 'assembly';
  } else {
    updateAssemblyTab(container, state);
  }
}

function createAssemblyTab(container: HTMLElement, state: GameState): void {
  const recipe = BALANCE.assembly;

  let html = `
    <div class="tab-content assembly-tab">
      <section class="card">
        <h2>Assembly Statistics <span class="info-btn" data-tooltip-info="assembly">i</span></h2>
        <div class="assembly-stats">
          <div class="stat">
            <span class="label">Stability:</span>
            <span class="value" data-bind="assembly-stability"></span>
          </div>
          <div class="stat">
            <span class="label">Electron Cost:</span>
            <span class="value" data-bind="assembly-electron-cost"></span>
          </div>
          <div class="stat">
            <span class="label">Gluon Catalyst:</span>
            <span class="value" data-bind="assembly-gluon-catalyst"></span>
          </div>
        </div>

        <div class="upgrades">
          <button class="upgrade-btn" data-bind="stability-btn" data-action="buy-stability">
            <span class="upgrade-name" data-bind="stability-name"></span>
            <span class="upgrade-desc">${STABILITY_UPGRADE.description}</span>
            <span class="upgrade-cost" data-bind="stability-cost"></span>
          </button>
          ${state.currentEmergentLevel >= 6 ? `
            <button class="upgrade-btn" data-bind="electron-eff-btn" data-action="buy-electron-eff">
              <span class="upgrade-name" data-bind="electron-eff-name"></span>
              <span class="upgrade-desc">${ELECTRON_EFFICIENCY_UPGRADE.description}</span>
              <span class="upgrade-cost" data-bind="electron-eff-cost"></span>
            </button>
          ` : ''}
          <button class="upgrade-btn" data-bind="gluon-catalyst-btn" data-action="buy-gluon-catalyst" style="display: none;">
            <span class="upgrade-name">Gluon Catalyst</span>
            <span class="upgrade-desc">30% chance gluons are not consumed</span>
            <span class="upgrade-cost">${formatNumber(BALANCE.assembly.gluonCatalystUnlockCost)} Pl</span>
          </button>
        </div>
      </section>

      <section class="card">
        <h2>Composite Assembly</h2>
        <div class="assembly-grid">
          <div class="assembly-item">
            <h3>Proton (p)</h3>
            <div class="recipe">
              <span>${recipe.protonRecipe.u}u + ${recipe.protonRecipe.d}d + ${recipe.protonRecipe.gluons}g</span>
            </div>
            <div class="inventory">
              <span>Have: <span data-bind="proton-count"></span></span>
              <span>Can build: <span data-bind="proton-max"></span></span>
            </div>
            <div class="build-buttons">
              <button class="btn" data-bind="proton-x1" data-action="build-proton" data-count="1">x1</button>
              <button class="btn" data-bind="proton-x10" data-action="build-proton" data-count="10">x10</button>
              <button class="btn" data-bind="proton-max" data-action="build-proton" data-count="max">Max</button>
            </div>
          </div>

          <div class="assembly-item">
            <h3>Neutron (n)</h3>
            <div class="recipe">
              <span>${recipe.neutronRecipe.u}u + ${recipe.neutronRecipe.d}d + ${recipe.neutronRecipe.gluons}g</span>
            </div>
            <div class="inventory">
              <span>Have: <span data-bind="neutron-count"></span></span>
              <span>Can build: <span data-bind="neutron-max"></span></span>
            </div>
            <div class="build-buttons">
              <button class="btn" data-bind="neutron-x1" data-action="build-neutron" data-count="1">x1</button>
              <button class="btn" data-bind="neutron-x10" data-action="build-neutron" data-count="10">x10</button>
              <button class="btn" data-bind="neutron-max" data-action="build-neutron" data-count="max">Max</button>
            </div>
          </div>
        </div>
      </section>

      ${state.currentEmergentLevel >= 6 ? `
        <section class="card">
          <h2>Atom Builder <span class="info-btn" data-tooltip-info="atomBuilder">i</span></h2>
          <div class="atom-builder">
            <div class="recipe">
              <span>1 Proton + 1 Neutron + <span data-bind="atom-electron-cost"></span> Electrons</span>
            </div>
            <div class="inventory">
              <span>Have: <span data-bind="atom-count"></span> Atom Units</span>
              <span>Can build: <span data-bind="atom-max"></span></span>
            </div>
            <div class="milestone-progress" data-bind="atom-milestone-container">
              <span data-bind="atom-milestone-text"></span>
              <div class="progress-bar">
                <div class="progress-fill" data-bind="atom-milestone-progress" style="width: 0%"></div>
              </div>
            </div>
            <div class="build-buttons">
              <button class="btn" data-bind="atom-x1" data-action="build-atom" data-count="1">x1</button>
              <button class="btn" data-bind="atom-x10" data-action="build-atom" data-count="10">x10</button>
              <button class="btn" data-bind="atom-max-btn" data-action="build-atom" data-count="max">Max</button>
            </div>
          </div>
        </section>
      ` : ''}

      <section class="card">
        <h2>Resources</h2>
        <div class="resource-grid">
          <div class="resource">
            <span class="name">u quarks:</span>
            <span class="count" data-bind="resource-u"></span>
          </div>
          <div class="resource">
            <span class="name">d quarks:</span>
            <span class="count" data-bind="resource-d"></span>
          </div>
          <div class="resource">
            <span class="name">electrons:</span>
            <span class="count" data-bind="resource-e"></span>
          </div>
          <div class="resource">
            <span class="name">gluons:</span>
            <span class="count" data-bind="resource-gluon"></span>
          </div>
        </div>
      </section>
    </div>
  `;

  container.innerHTML = html;
}

function updateAssemblyTab(container: HTMLElement, state: GameState): void {
  const stability = getStability(state);
  const electronCost = getElectronCost(state);
  const maxProtons = getMaxBuildable(state, 'proton');
  const maxNeutrons = getMaxBuildable(state, 'neutron');
  const maxAtoms = getMaxAtomUnits(state);

  // Stats
  setText(container, 'assembly-stability', formatPercent(stability));
  setText(container, 'assembly-electron-cost', `${electronCost} per atom`);
  setText(container, 'assembly-gluon-catalyst', state.assemblyUpgrades.gluonCatalyst ? 'Active (30% save)' : 'Inactive');

  // Stability upgrade
  setText(container, 'stability-name', `${STABILITY_UPGRADE.name} (Lv ${state.assemblyUpgrades.stability})`);
  setText(container, 'stability-cost', `${formatNumber(getUpgradeCost(STABILITY_UPGRADE, state.assemblyUpgrades.stability))} Pl`);
  setDisabled(container, 'stability-btn', !canAffordUpgrade(state, STABILITY_UPGRADE, 1));

  // Electron efficiency upgrade (E6+)
  if (state.currentEmergentLevel >= 6) {
    setText(container, 'electron-eff-name', `${ELECTRON_EFFICIENCY_UPGRADE.name} (Lv ${state.atomUpgrades.electronEfficiency})`);
    setText(container, 'electron-eff-cost', `${formatNumber(getUpgradeCost(ELECTRON_EFFICIENCY_UPGRADE, state.atomUpgrades.electronEfficiency))} Pl`);
    setDisabled(container, 'electron-eff-btn', !canAffordUpgrade(state, ELECTRON_EFFICIENCY_UPGRADE, 1));
  }

  // Gluon catalyst button
  const gluonBtn = container.querySelector('[data-bind="gluon-catalyst-btn"]') as HTMLElement;
  if (gluonBtn) {
    if (!state.assemblyUpgrades.gluonCatalyst) {
      gluonBtn.style.display = '';
      setDisabled(container, 'gluon-catalyst-btn', state.pl < BALANCE.assembly.gluonCatalystUnlockCost);
    } else {
      gluonBtn.style.display = 'none';
    }
  }

  // Proton
  setText(container, 'proton-count', formatNumber(state.composites.proton));
  setText(container, 'proton-max', String(maxProtons));
  setDisabled(container, 'proton-x1', !canBuildProton(state, 1));
  setDisabled(container, 'proton-x10', !canBuildProton(state, 10));
  setDisabled(container, 'proton-max', maxProtons <= 0);

  // Neutron
  setText(container, 'neutron-count', formatNumber(state.composites.neutron));
  setText(container, 'neutron-max', String(maxNeutrons));
  setDisabled(container, 'neutron-x1', !canBuildNeutron(state, 1));
  setDisabled(container, 'neutron-x10', !canBuildNeutron(state, 10));
  setDisabled(container, 'neutron-max', maxNeutrons <= 0);

  // Atoms (E6+)
  if (state.currentEmergentLevel >= 6) {
    setText(container, 'atom-electron-cost', String(electronCost));
    setText(container, 'atom-count', formatNumber(state.atomUnits));
    setText(container, 'atom-max', String(maxAtoms));
    setDisabled(container, 'atom-x1', !canBuildAtomUnits(state, 1));
    setDisabled(container, 'atom-x10', !canBuildAtomUnits(state, 10));
    setDisabled(container, 'atom-max-btn', maxAtoms <= 0);

    // Milestone progress
    if (!state.periodicTableUnlocked) {
      setVisible(container, 'atom-milestone-container', true);
      setText(container, 'atom-milestone-text', `Periodic Table Unlock: ${state.stats.totalAtomsBuilt}/${BALANCE.atomBuilder.atomUnlockMilestone}`);
      setProgress(container, 'atom-milestone-progress', state.stats.totalAtomsBuilt / BALANCE.atomBuilder.atomUnlockMilestone);
    } else {
      setVisible(container, 'atom-milestone-container', false);
    }
  }

  // Resources
  setText(container, 'resource-u', formatNumber(state.matter.u));
  setText(container, 'resource-d', formatNumber(state.matter.d));
  setText(container, 'resource-e', formatNumber(state.matter['e-']));
  setText(container, 'resource-gluon', formatNumber(state.catalysts.gluon));
}

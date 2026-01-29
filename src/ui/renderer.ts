/**
 * Main UI Renderer
 * Uses create/update pattern for efficient DOM updates
 */

import { GameState, TabId } from '../types';
import { formatNumber, formatRate } from '../utils/format';
import {
  getQuarkURate, getQuarkDRate, getPqFactor,
  getLeptonERate, getLeptonNuRate, getPlFactor
} from '../core/state';
import { GameLoop } from '../core/gameLoop';
import { setText, setActive, setVisible } from './uiUpdater';

// UI Component imports
import { renderLabTab } from './tabs/labTab';
import { renderAssemblyTab } from './tabs/assemblyTab';
import { renderPeriodicTableTab } from './tabs/periodicTableTab';
import { renderForcesTab } from './tabs/forcesTab';
import { renderAutomationTab } from './tabs/automationTab';
import { renderEmergeTab } from './tabs/emergeTab';
import { renderStatsTab } from './tabs/statsTab';

let gameLoop: GameLoop | null = null;

// Track render state
let lastTab: TabId | null = null;
let lastEmergentLevel = -1;
let headerCreated = false;
let sidebarCreated = false;
let footerCreated = false;

export function setGameLoop(loop: GameLoop): void {
  gameLoop = loop;
}

export function getGameLoop(): GameLoop | null {
  return gameLoop;
}

export function updateState(updater: (state: GameState) => GameState): void {
  if (gameLoop) {
    gameLoop.updateState(updater);
  }
}

export function render(state: GameState): void {
  // Detect structure changes
  const structureChanged = state.currentEmergentLevel !== lastEmergentLevel;

  if (structureChanged) {
    headerCreated = false;
    sidebarCreated = false;
  }

  renderHeader(state);
  renderSidebar(state);
  renderContent(state);
  renderFooter(state);

  lastEmergentLevel = state.currentEmergentLevel;
}

// ============= HEADER =============

function renderHeader(state: GameState): void {
  const container = document.getElementById('currencies');
  if (!container) return;

  if (!headerCreated || state.currentEmergentLevel !== lastEmergentLevel) {
    createHeader(container, state);
    headerCreated = true;
  }
  updateHeader(container, state);
}

function createHeader(container: HTMLElement, state: GameState): void {
  let html = `
    <div class="currency">
      <span class="currency-name">Pq</span>
      <span class="currency-value" data-bind="header-pq"></span>
      <span class="currency-rate" data-bind="header-pq-rate"></span>
    </div>
  `;

  if (state.currentEmergentLevel >= 1) {
    html += `
      <div class="currency">
        <span class="currency-name">Pl</span>
        <span class="currency-value" data-bind="header-pl"></span>
        <span class="currency-rate" data-bind="header-pl-rate"></span>
      </div>
    `;
  }

  if (state.currentEmergentLevel >= 2) {
    html += `
      <div class="currency">
        <span class="currency-name">Energy</span>
        <span class="currency-value" data-bind="header-energy"></span>
      </div>
    `;
  }

  html += `
    <div class="level-badge" data-bind="header-level"></div>
  `;

  container.innerHTML = html;
}

function updateHeader(container: HTMLElement, state: GameState): void {
  const pqRate = (getQuarkURate(state) + getQuarkDRate(state)) * getPqFactor(state);
  const plRate = state.currentEmergentLevel >= 1
    ? (getLeptonERate(state) + getLeptonNuRate(state)) * getPlFactor(state)
    : 0;

  setText(container, 'header-pq', formatNumber(state.pq));
  setText(container, 'header-pq-rate', formatRate(pqRate));

  if (state.currentEmergentLevel >= 1) {
    setText(container, 'header-pl', formatNumber(state.pl));
    setText(container, 'header-pl-rate', formatRate(plRate));
  }

  if (state.currentEmergentLevel >= 2) {
    setText(container, 'header-energy', formatNumber(state.energy));
  }

  setText(container, 'header-level', `E${state.currentEmergentLevel}`);
}

// ============= SIDEBAR =============

function renderSidebar(state: GameState): void {
  const container = document.getElementById('sidebar');
  if (!container) return;

  // Recreate sidebar if structure changed (tabs unlocked)
  const periodicTabExists = container.querySelector('[data-tab="periodic-table"]') !== null;
  const forcesTabExists = container.querySelector('[data-tab="forces"]') !== null;
  const needsRecreate = !sidebarCreated || state.currentEmergentLevel !== lastEmergentLevel ||
    state.periodicTableUnlocked !== periodicTabExists ||
    state.forcesUnlocked !== forcesTabExists;

  if (needsRecreate) {
    createSidebar(container, state);
    sidebarCreated = true;
  }
  updateSidebar(container, state);
}

function createSidebar(container: HTMLElement, state: GameState): void {
  const tabs: { id: TabId; name: string; unlocked: boolean }[] = [
    { id: 'lab', name: 'Lab', unlocked: true },
    { id: 'assembly', name: 'Assembly', unlocked: state.currentEmergentLevel >= 5 },
    { id: 'periodic-table', name: 'Periodic Table', unlocked: state.periodicTableUnlocked },
    { id: 'forces', name: 'Forces', unlocked: state.forcesUnlocked },
    { id: 'automation', name: 'Automation', unlocked: state.currentEmergentLevel >= 4 },
    { id: 'emerge', name: 'Emerge', unlocked: true },
    { id: 'stats', name: 'Stats', unlocked: true },
  ];

  const tabsHtml = tabs
    .filter(t => t.unlocked)
    .map(t => `
      <button
        class="nav-btn"
        data-bind="tab-${t.id}"
        data-tab="${t.id}"
      >
        ${t.name}
      </button>
    `)
    .join('');

  const devToolsHtml = `
    <div class="dev-tools">
      <div class="dev-tools-header" data-action="toggle-dev-tools">
        <span>Dev Tools</span>
        <span class="dev-tools-arrow" data-bind="dev-tools-arrow">▼</span>
      </div>
      <div class="dev-tools-content" data-bind="dev-tools-content">
        <div class="dev-tools-section">
          <span class="dev-label">Set Level:</span>
          <div class="dev-buttons">
            <button class="btn btn-tiny" data-action="dev-set-e1">E1</button>
            <button class="btn btn-tiny" data-action="dev-set-e2">E2</button>
            <button class="btn btn-tiny" data-action="dev-set-e3">E3</button>
            <button class="btn btn-tiny" data-action="dev-set-e4">E4</button>
            <button class="btn btn-tiny" data-action="dev-set-e5">E5</button>
            <button class="btn btn-tiny" data-action="dev-set-e6">E6</button>
          </div>
        </div>
        <div class="dev-tools-section">
          <button class="btn btn-small" data-action="dev-add-atoms">+250 Atoms</button>
        </div>
        <div class="dev-tools-section">
          <button class="btn btn-small dev-btn-gold" data-action="dev-everything-x10">(+1) ×10</button>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = tabsHtml + devToolsHtml;
}

function updateSidebar(container: HTMLElement, state: GameState): void {
  const tabs: TabId[] = ['lab', 'assembly', 'periodic-table', 'forces', 'automation', 'emerge', 'stats'];

  for (const tab of tabs) {
    setActive(container, `tab-${tab}`, state.currentTab === tab);
  }
}

// ============= CONTENT =============

function renderContent(state: GameState): void {
  const container = document.getElementById('content');
  if (!container) return;

  // Track tab changes for proper re-creation
  const tabChanged = lastTab !== state.currentTab;
  if (tabChanged) {
    lastTab = state.currentTab;
  }

  switch (state.currentTab) {
    case 'lab':
      renderLabTab(container, state);
      break;
    case 'assembly':
      renderAssemblyTab(container, state);
      break;
    case 'periodic-table':
      renderPeriodicTableTab(container, state);
      break;
    case 'forces':
      renderForcesTab(container, state);
      break;
    case 'automation':
      renderAutomationTab(container, state);
      break;
    case 'emerge':
      renderEmergeTab(container, state);
      break;
    case 'stats':
      renderStatsTab(container, state);
      break;
  }
}

// ============= FOOTER =============

function renderFooter(state: GameState): void {
  if (!footerCreated) {
    createFooter(state);
    footerCreated = true;
  }
  updateFooter(state);
}

function createFooter(state: GameState): void {
  const saveStatus = document.getElementById('save-status');
  if (saveStatus) {
    saveStatus.innerHTML = `
      <span>Last save: <span data-bind="footer-save-time"></span></span>
      <button data-action="save" class="btn btn-small">Save</button>
      <button data-action="export" class="btn btn-small">Export</button>
      <button data-action="import" class="btn btn-small">Import</button>
    `;
  }

  const buyMode = document.getElementById('buy-mode');
  if (buyMode) {
    buyMode.innerHTML = `
      <span>Buy: </span>
      <button class="btn btn-small" data-bind="buymode-x1" data-action="buymode-x1">x1</button>
      <button class="btn btn-small" data-bind="buymode-x10" data-action="buymode-x10">x10</button>
      <button class="btn btn-small" data-bind="buymode-xMax" data-action="buymode-xMax">Max</button>
    `;
  }
}

function updateFooter(state: GameState): void {
  const saveStatus = document.getElementById('save-status');
  if (saveStatus) {
    const lastSave = new Date(state.lastSave);
    setText(saveStatus, 'footer-save-time', lastSave.toLocaleTimeString());
  }

  const buyMode = document.getElementById('buy-mode');
  if (buyMode) {
    setActive(buyMode, 'buymode-x1', state.buyMode === 'x1');
    setActive(buyMode, 'buymode-x10', state.buyMode === 'x10');
    setActive(buyMode, 'buymode-xMax', state.buyMode === 'xMax');
  }
}

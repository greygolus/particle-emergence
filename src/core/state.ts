/**
 * Game State Management
 */

import { GameState, Element, EmergentLevel } from '../types';
import type { TabId, BuyMode } from '../types';
import { BALANCE } from '../config/balance';
import { ELEMENTS } from '../config/elements';
import { getLeptonBoostMultiplier, getDebrisSynergyBonus, getExtraPrecisionCap } from '../systems/debris';

const SAVE_KEY = 'particle_emergence_save';
const CURRENT_VERSION = 1;

export function createInitialState(): GameState {
  const elements: Element[] = ELEMENTS.map(e => ({
    z: e.z,
    symbol: e.symbol,
    name: e.name,
    unlocked: false,
    fusionProgress: 0,
    fusionStartTime: null,
  }));

  return {
    version: CURRENT_VERSION,
    lastSave: Date.now(),
    lastTick: Date.now(),

    // Currencies
    pq: BALANCE.currencies.startPq,
    pl: BALANCE.currencies.startPl,
    energy: BALANCE.currencies.startEnergy,

    debris: 0,
    atomUnits: 0,

    // Emergent level
    currentEmergentLevel: 0,
    highestEmergentLevel: 0,

    // Inventories
    matter: {
      u: 0, d: 0, 'e-': 0, ve: 0,
      s: 0, c: 0, 'mu-': 0, vmu: 0,
      b: 0, t: 0, 'tau-': 0, vtau: 0,
    },
    antimatter: {
      u_bar: 0, d_bar: 0, 'e+': 0, ve_bar: 0,
      s_bar: 0, c_bar: 0, 'mu+': 0, vmu_bar: 0,
      b_bar: 0, t_bar: 0, 'tau+': 0, vtau_bar: 0,
    },
    catalysts: { photon: 0, gluon: 0 },
    composites: { proton: 0, neutron: 0 },
    bosons: { 'W+': 0, 'W-': 0, Z0: 0, higgs: 0 },

    // Upgrades
    quarkUpgrades: { quarkRate: 0, quarkEfficiency: 0 },
    leptonUpgrades: { leptonRate: 0, precision: 0 },
    colliderUpgrades: {
      tier3Unlocked: false,
      catalystSlots: 0,
      gluonBoost: 0,
      photonBoost: 0,
      bosonModeUnlocked: false,
    },
    assemblyUpgrades: { stability: 0, gluonCatalyst: false },
    atomUpgrades: { electronEfficiency: 0 },

    permanentUpgrades: {},

    // Harvester state
    harvesters: {
      quarkPolarity: 'matter',
      leptonPolarity: 'matter',
      quarkSwitchCooldown: 0,
      leptonSwitchCooldown: 0,
    },

    // Collider state
    collider: {
      tier: 2,
      mode: 'quark',
      matterMode: 'matter',
      channel: 'u_to_s',  // Default channel
      precisionSpend: 0,
      pity: 0,
      slottedPhotons: 0,
      slottedGluons: 0,
      isBosonMode: false,
      cooldown: 0,
    },

    // Automation
    automation: {
      chips: 0,
      autoHarvester: { unlocked: false, enabled: false, level: 0, settings: {} },
      autoCollider: { unlocked: false, enabled: false, level: 0, settings: {} },
      autoPolarity: { unlocked: false, enabled: false, level: 0, settings: {} },
      autoAnnihilate: { unlocked: false, enabled: false, level: 0, settings: {} },
      autoAssembly: { unlocked: false, enabled: false, level: 0, settings: {} },
      autoAtom: { unlocked: false, enabled: false, level: 0, settings: {} },
      autoFusion: { unlocked: false, enabled: false, level: 0, settings: {} },
      autoDecay: { unlocked: false, enabled: false, level: 0, settings: {} },
    },

    // Periodic Table
    periodicTableUnlocked: false,
    elements,
    leadSample: { crafted: false, durability: 0, maxDurability: BALANCE.decay.leadSampleDurability },
    activeFusion: null,
    activeDecay: null,

    forcesUnlocked: false,

    // Debris shop upgrades (persist)
    debrisUpgrades: {
      energyAmplifier: 0,
      debrisSynergy: 0,
      leptonBoost: 0,
      precisionMastery: 0,
    },

    // Temp buffs
    tempBuffs: {
      colliderOverdrive: { active: false, endTime: 0 },
    },

    // Stats
    stats: {
      totalPqEarned: 0,
      totalPlEarned: 0,
      totalEnergyProduced: 0,
      totalColliderRuns: 0,
      totalUpgradeSuccesses: 0,
      totalExoticEvents: 0,
      totalEmerges: 0,
      totalAnnihilations: 0,
      totalProtonsBuilt: 0,
      totalNeutronsBuilt: 0,
      totalAtomsBuilt: 0,
      elementsUnlocked: 0,
      playTime: 0,
      sessionStart: Date.now(),
    },

    // UI
    currentTab: 'lab',
    buyMode: 'x1',
  };
}

export function saveGame(state: GameState): void {
  try {
    const saveData = {
      version: CURRENT_VERSION,
      state: { ...state, lastSave: Date.now() },
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  } catch (e) {
    console.error('Failed to save game:', e);
  }
}

export function loadGame(): GameState | null {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return null;

    const data = JSON.parse(saved);
    const state = migrateState(data);
    return state;
  } catch (e) {
    console.error('Failed to load game:', e);
    return null;
  }
}

function migrateState(data: { version: number; state: GameState }): GameState {
  let state = data.state;

  // Migration logic for future versions
  if (data.version < CURRENT_VERSION) {
    // Apply migrations here
    console.log(`Migrating save from v${data.version} to v${CURRENT_VERSION}`);
  }

  // Ensure all new properties exist
  const initial = createInitialState();

  // Deep merge with initial state to fill missing fields
  state = deepMerge(initial, state);
  state.version = CURRENT_VERSION;

  return state;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepMerge(base: any, override: any): any {
  const result = { ...base };

  for (const key in override) {
    if (Object.prototype.hasOwnProperty.call(override, key)) {
      const overrideValue = override[key];
      const baseValue = base[key];

      if (
        overrideValue !== null &&
        typeof overrideValue === 'object' &&
        !Array.isArray(overrideValue) &&
        baseValue !== null &&
        typeof baseValue === 'object' &&
        !Array.isArray(baseValue)
      ) {
        result[key] = deepMerge(baseValue, overrideValue);
      } else if (overrideValue !== undefined) {
        result[key] = overrideValue;
      }
    }
  }

  return result;
}

export function resetForEmerge(state: GameState, newLevel: EmergentLevel): GameState {
  const newState = { ...state };

  // Reset currencies
  newState.pq = 0;
  newState.pl = 0;
  newState.energy = 0;
  newState.debris = 0;
  newState.atomUnits = 0;

  // Reset inventories
  newState.matter = { u: 0, d: 0, 'e-': 0, ve: 0, s: 0, c: 0, 'mu-': 0, vmu: 0, b: 0, t: 0, 'tau-': 0, vtau: 0 };
  newState.antimatter = { u_bar: 0, d_bar: 0, 'e+': 0, ve_bar: 0, s_bar: 0, c_bar: 0, 'mu+': 0, vmu_bar: 0, b_bar: 0, t_bar: 0, 'tau+': 0, vtau_bar: 0 };
  newState.catalysts = { photon: 0, gluon: 0 };
  newState.composites = { proton: 0, neutron: 0 };
  newState.bosons = { 'W+': 0, 'W-': 0, Z0: 0, higgs: 0 };

  // Reset run-based upgrades
  newState.quarkUpgrades = { quarkRate: 0, quarkEfficiency: 0 };
  newState.leptonUpgrades = { leptonRate: 0, precision: 0 };
  newState.colliderUpgrades = {
    tier3Unlocked: false,
    catalystSlots: 0,
    gluonBoost: 0,
    photonBoost: 0,
    bosonModeUnlocked: false,
  };
  newState.assemblyUpgrades = { stability: 0, gluonCatalyst: false };
  newState.atomUpgrades = { electronEfficiency: 0 };

  // Reset harvester state
  newState.harvesters = {
    quarkPolarity: 'matter',
    leptonPolarity: 'matter',
    quarkSwitchCooldown: 0,
    leptonSwitchCooldown: 0,
  };

  // Reset collider state
  newState.collider = {
    tier: 2,
    mode: 'quark',
    matterMode: 'matter',
    channel: 'u_to_s',
    precisionSpend: 0,
    pity: 0,
    slottedPhotons: 0,
    slottedGluons: 0,
    isBosonMode: false,
    cooldown: 0,
  };

  // Reset temp buffs
  newState.tempBuffs = {
    colliderOverdrive: { active: false, endTime: 0 },
  };

  // Reset active fusion/decay
  newState.activeFusion = null;
  newState.activeDecay = null;

  // Reset lead sample if not yet permanent
  if (!newState.periodicTableUnlocked) {
    newState.leadSample = { crafted: false, durability: 0, maxDurability: BALANCE.decay.leadSampleDurability };
    // Reset element progress too
    newState.elements = newState.elements.map(e => ({
      ...e,
      unlocked: false,
      fusionProgress: 0,
      fusionStartTime: null,
    }));
  }

  // Update emergent level
  newState.currentEmergentLevel = newLevel;
  if (newLevel > newState.highestEmergentLevel) {
    newState.highestEmergentLevel = newLevel;
  }

  // Update stats
  newState.stats.totalEmerges++;

  return newState;
}

export function deleteGame(): void {
  localStorage.removeItem(SAVE_KEY);
}

export function applyOfflineProgress(state: GameState, now: number): GameState {
  const offlineTime = Math.min(
    now - state.lastTick,
    BALANCE.OFFLINE_CAP_HOURS * 60 * 60 * 1000
  );

  if (offlineTime < 1000) return state; // Less than 1 second, skip

  const efficiency = BALANCE.OFFLINE_EFFICIENCY;
  const seconds = (offlineTime / 1000) * efficiency;

  const newState = { ...state };

  // Apply harvester production
  if (newState.currentEmergentLevel >= 0) {
    const uRate = getQuarkURate(newState);
    const dRate = getQuarkDRate(newState);

    if (newState.harvesters.quarkPolarity === 'matter') {
      newState.matter.u += uRate * seconds;
      newState.matter.d += dRate * seconds;
    } else {
      newState.antimatter.u_bar += uRate * seconds;
      newState.antimatter.d_bar += dRate * seconds;
    }

    // Pq gain
    const pqGain = (uRate + dRate) * getPqFactor(newState) * seconds;
    newState.pq += pqGain;
    newState.stats.totalPqEarned += pqGain;
  }

  if (newState.currentEmergentLevel >= 1) {
    const eRate = getLeptonERate(newState);
    const nuRate = getLeptonNuRate(newState);

    if (newState.harvesters.leptonPolarity === 'matter') {
      newState.matter['e-'] += eRate * seconds;
      newState.matter.ve += nuRate * seconds;
    } else {
      newState.antimatter['e+'] += eRate * seconds;
      newState.antimatter.ve_bar += nuRate * seconds;
    }

    // Pl gain
    const plGain = (eRate + nuRate) * getPlFactor(newState) * seconds;
    newState.pl += plGain;
    newState.stats.totalPlEarned += plGain;
  }

  newState.lastTick = now;
  newState.stats.playTime += offlineTime;

  return newState;
}

// Helper functions for rates
export function getQuarkURate(state: GameState): number {
  const base = BALANCE.quarkHarvester.baseURate;
  const bonus = 1 + state.quarkUpgrades.quarkRate * BALANCE.quarkHarvester.quarkRateBonus;
  return base * bonus;
}

export function getQuarkDRate(state: GameState): number {
  const base = BALANCE.quarkHarvester.baseDRate;
  const bonus = 1 + state.quarkUpgrades.quarkRate * BALANCE.quarkHarvester.quarkRateBonus;
  return base * bonus;
}

export function getPqFactor(state: GameState): number {
  const base = BALANCE.quarkHarvester.basePqFactor;
  const bonus = 1 + state.quarkUpgrades.quarkEfficiency * BALANCE.quarkHarvester.quarkEfficiencyBonus;

  // Cross-synergy from Pl milestones (capped at 20%)
  let crossBonus = 1;
  if (state.pl >= 100) crossBonus += 0.05;
  if (state.pl >= 500) crossBonus += 0.05;
  if (state.pl >= 2000) crossBonus += 0.05;
  if (state.pl >= 10000) crossBonus += 0.05;
  crossBonus = Math.min(crossBonus, 1 + BALANCE.crossSynergyCap);

  // Debris synergy bonus (+X% Pq/s based on debris held)
  const debrisSynergy = 1 + getDebrisSynergyBonus(state);

  return base * bonus * crossBonus * debrisSynergy;
}

export function getLeptonERate(state: GameState): number {
  const base = BALANCE.leptonHarvester.baseERate;
  const bonus = 1 + state.leptonUpgrades.leptonRate * BALANCE.leptonHarvester.leptonRateBonus;
  const debrisBoost = getLeptonBoostMultiplier(state);
  return base * bonus * debrisBoost;
}

export function getLeptonNuRate(state: GameState): number {
  const base = BALANCE.leptonHarvester.baseNuERate;
  const bonus = 1 + state.leptonUpgrades.leptonRate * BALANCE.leptonHarvester.leptonRateBonus;
  const debrisBoost = getLeptonBoostMultiplier(state);
  return base * bonus * debrisBoost;
}

export function getPlFactor(state: GameState): number {
  const base = BALANCE.leptonHarvester.basePlFactor;

  // Cross-synergy from Pq milestones (capped at 20%)
  let crossBonus = 1;
  if (state.pq >= 1000) crossBonus += 0.05;
  if (state.pq >= 5000) crossBonus += 0.05;
  if (state.pq >= 25000) crossBonus += 0.05;
  if (state.pq >= 100000) crossBonus += 0.05;
  crossBonus = Math.min(crossBonus, 1 + BALANCE.crossSynergyCap);

  // Debris shop lepton boost also boosts Pl factor
  const debrisBoost = getLeptonBoostMultiplier(state);

  return base * crossBonus * debrisBoost;
}

export function getPrecisionBonus(state: GameState): number {
  return state.leptonUpgrades.precision * BALANCE.leptonHarvester.precisionBonus;
}

// Stability helper
export function getStability(state: GameState): number {
  const base = BALANCE.assembly.baseStability;
  const bonus = state.assemblyUpgrades.stability * BALANCE.assembly.stabilityBonus;

  // Z0 boson bonus
  const zBonus = state.bosons.Z0 * BALANCE.forces.zBosonStabilityBonus;

  return Math.min(base + bonus + zBonus, BALANCE.assembly.maxStability);
}

// Electron efficiency helper
export function getElectronCost(state: GameState): number {
  const base = BALANCE.atomBuilder.baseElectronCost;
  const reduction = state.atomUpgrades.electronEfficiency * BALANCE.atomBuilder.electronEfficiencyBonus;
  return Math.max(base - reduction, BALANCE.atomBuilder.minElectronCost);
}

// Set tab
export function setTab(state: GameState, tab: TabId): GameState {
  return { ...state, currentTab: tab };
}

// Set buy mode
export function setBuyMode(state: GameState, mode: BuyMode): GameState {
  return { ...state, buyMode: mode };
}

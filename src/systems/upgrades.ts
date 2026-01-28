/**
 * Upgrades System
 */

import { GameState, BuyMode } from '../types';
import { BALANCE } from '../config/balance';

export interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costScale: number;
  currency: 'pq' | 'pl' | 'energy';
  maxLevel?: number;
  getLevel: (state: GameState) => number;
  apply: (state: GameState) => GameState;
  isAvailable: (state: GameState) => boolean;
}

// Calculate cost for a specific level
export function getUpgradeCost(upgrade: UpgradeDef, level: number): number {
  return Math.ceil(upgrade.baseCost * Math.pow(upgrade.costScale, level));
}

// Calculate total cost for buying multiple levels
export function getBulkCost(upgrade: UpgradeDef, currentLevel: number, count: number): number {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += getUpgradeCost(upgrade, currentLevel + i);
  }
  return total;
}

// Calculate how many levels can be bought with current resources
export function getMaxBuyable(state: GameState, upgrade: UpgradeDef): number {
  const currentLevel = upgrade.getLevel(state);
  let currency = 0;

  switch (upgrade.currency) {
    case 'pq': currency = state.pq; break;
    case 'pl': currency = state.pl; break;
    case 'energy': currency = state.energy; break;
  }

  let count = 0;
  let totalCost = 0;

  while (true) {
    const nextCost = getUpgradeCost(upgrade, currentLevel + count);
    if (totalCost + nextCost > currency) break;
    if (upgrade.maxLevel && currentLevel + count >= upgrade.maxLevel) break;
    totalCost += nextCost;
    count++;
  }

  return count;
}

// Get buy count based on buy mode
export function getBuyCount(state: GameState, upgrade: UpgradeDef): number {
  switch (state.buyMode) {
    case 'x1': return 1;
    case 'x10': return 10;
    case 'xMax': return getMaxBuyable(state, upgrade);
  }
}

// Can afford upgrade
export function canAffordUpgrade(state: GameState, upgrade: UpgradeDef, count: number = 1): boolean {
  const currentLevel = upgrade.getLevel(state);
  if (upgrade.maxLevel && currentLevel + count > upgrade.maxLevel) return false;

  const cost = getBulkCost(upgrade, currentLevel, count);

  switch (upgrade.currency) {
    case 'pq': return state.pq >= cost;
    case 'pl': return state.pl >= cost;
    case 'energy': return state.energy >= cost;
  }
}

// Buy upgrade
export function buyUpgrade(state: GameState, upgrade: UpgradeDef, count: number = 1): GameState {
  if (!upgrade.isAvailable(state)) return state;
  if (!canAffordUpgrade(state, upgrade, count)) return state;

  const currentLevel = upgrade.getLevel(state);
  const cost = getBulkCost(upgrade, currentLevel, count);

  let newState = { ...state };

  // Deduct cost
  switch (upgrade.currency) {
    case 'pq':
      newState.pq -= cost;
      break;
    case 'pl':
      newState.pl -= cost;
      break;
    case 'energy':
      newState.energy -= cost;
      break;
  }

  // Apply upgrade multiple times
  for (let i = 0; i < count; i++) {
    newState = upgrade.apply(newState);
  }

  return newState;
}

// === UPGRADE DEFINITIONS ===

export const QUARK_RATE_UPGRADE: UpgradeDef = {
  id: 'quarkRate',
  name: 'Quark Rate',
  description: '+25% u and d quark production rate',
  baseCost: BALANCE.quarkHarvester.quarkRateBaseCost,
  costScale: BALANCE.quarkHarvester.quarkRateCostScale,
  currency: 'pq',
  getLevel: (state) => state.quarkUpgrades.quarkRate,
  apply: (state) => ({
    ...state,
    quarkUpgrades: {
      ...state.quarkUpgrades,
      quarkRate: state.quarkUpgrades.quarkRate + 1,
    },
  }),
  isAvailable: (state) => state.currentEmergentLevel >= 0,
};

export const QUARK_EFFICIENCY_UPGRADE: UpgradeDef = {
  id: 'quarkEfficiency',
  name: 'Quark Efficiency',
  description: '+10% Pq conversion factor',
  baseCost: BALANCE.quarkHarvester.quarkEfficiencyBaseCost,
  costScale: BALANCE.quarkHarvester.quarkEfficiencyCostScale,
  currency: 'pq',
  getLevel: (state) => state.quarkUpgrades.quarkEfficiency,
  apply: (state) => ({
    ...state,
    quarkUpgrades: {
      ...state.quarkUpgrades,
      quarkEfficiency: state.quarkUpgrades.quarkEfficiency + 1,
    },
  }),
  isAvailable: (state) => state.currentEmergentLevel >= 0,
};

export const LEPTON_RATE_UPGRADE: UpgradeDef = {
  id: 'leptonRate',
  name: 'Lepton Rate',
  description: '+25% e- and νe production rate',
  baseCost: BALANCE.leptonHarvester.leptonRateBaseCost,
  costScale: BALANCE.leptonHarvester.leptonRateCostScale,
  currency: 'pl',
  getLevel: (state) => state.leptonUpgrades.leptonRate,
  apply: (state) => ({
    ...state,
    leptonUpgrades: {
      ...state.leptonUpgrades,
      leptonRate: state.leptonUpgrades.leptonRate + 1,
    },
  }),
  isAvailable: (state) => state.currentEmergentLevel >= 1,
};

export const PRECISION_UPGRADE: UpgradeDef = {
  id: 'precision',
  name: 'Precision',
  description: '+1% collider upgrade chance',
  baseCost: BALANCE.leptonHarvester.precisionBaseCost,
  costScale: BALANCE.leptonHarvester.precisionCostScale,
  currency: 'pl',
  getLevel: (state) => state.leptonUpgrades.precision,
  apply: (state) => ({
    ...state,
    leptonUpgrades: {
      ...state.leptonUpgrades,
      precision: state.leptonUpgrades.precision + 1,
    },
  }),
  isAvailable: (state) => state.currentEmergentLevel >= 1,
};

export const STABILITY_UPGRADE: UpgradeDef = {
  id: 'stability',
  name: 'Stability',
  description: '+5% assembly efficiency',
  baseCost: 100,
  costScale: 1.25,
  currency: 'pl',
  getLevel: (state) => state.assemblyUpgrades.stability,
  apply: (state) => ({
    ...state,
    assemblyUpgrades: {
      ...state.assemblyUpgrades,
      stability: state.assemblyUpgrades.stability + 1,
    },
  }),
  isAvailable: (state) => state.currentEmergentLevel >= 5,
};

export const ELECTRON_EFFICIENCY_UPGRADE: UpgradeDef = {
  id: 'electronEfficiency',
  name: 'Electron Efficiency',
  description: '-5% electron cost per atom unit',
  baseCost: 500,
  costScale: 1.3,
  currency: 'pl',
  maxLevel: 12, // Can't go below 0.4 floor
  getLevel: (state) => state.atomUpgrades.electronEfficiency,
  apply: (state) => ({
    ...state,
    atomUpgrades: {
      ...state.atomUpgrades,
      electronEfficiency: state.atomUpgrades.electronEfficiency + 1,
    },
  }),
  isAvailable: (state) => state.currentEmergentLevel >= 6,
};

export const ALL_UPGRADES: UpgradeDef[] = [
  QUARK_RATE_UPGRADE,
  QUARK_EFFICIENCY_UPGRADE,
  LEPTON_RATE_UPGRADE,
  PRECISION_UPGRADE,
  STABILITY_UPGRADE,
  ELECTRON_EFFICIENCY_UPGRADE,
];

export function getUpgradeById(id: string): UpgradeDef | undefined {
  return ALL_UPGRADES.find(u => u.id === id);
}

/**
 * Atom Builder and Periodic Table System
 */

import { GameState, Element } from '../types';
import { BALANCE } from '../config/balance';
import { getElectronCost, getStability } from '../core/state';
import { ELEMENTS, getElementByZ } from '../config/elements';

export interface AtomBuildResult {
  success: boolean;
  produced: number;
  waste: number;
}

export function canBuildAtomUnits(state: GameState, count: number = 1): boolean {
  if (state.currentEmergentLevel < 6) return false;

  const electronCost = getElectronCost(state) * count;

  return state.composites.proton >= count &&
         state.composites.neutron >= count &&
         state.matter['e-'] >= electronCost;
}

export function buildAtomUnits(state: GameState, count: number = 1): { newState: GameState; result: AtomBuildResult } {
  if (!canBuildAtomUnits(state, count)) {
    return { newState: state, result: { success: false, produced: 0, waste: 0 } };
  }

  const newState = { ...state };
  const electronCost = getElectronCost(state);
  const stability = getStability(state);

  // Consume resources
  newState.composites = {
    ...newState.composites,
    proton: newState.composites.proton - count,
    neutron: newState.composites.neutron - count,
  };
  newState.matter = {
    ...newState.matter,
    'e-': newState.matter['e-'] - electronCost * count,
  };

  // Produce atom units with stability waste
  const produced = Math.max(1, Math.floor(count * stability));
  const waste = count - produced;

  newState.atomUnits += produced;
  newState.stats.totalAtomsBuilt += produced;

  // Check for periodic table permanent unlock
  if (!newState.periodicTableUnlocked && newState.stats.totalAtomsBuilt >= BALANCE.atomBuilder.atomUnlockMilestone) {
    newState.periodicTableUnlocked = true;
  }

  return {
    newState,
    result: {
      success: true,
      produced,
      waste,
    },
  };
}

export function getMaxAtomUnits(state: GameState): number {
  const electronCost = getElectronCost(state);

  const protonMax = Math.floor(state.composites.proton);
  const neutronMax = Math.floor(state.composites.neutron);
  const electronMax = Math.floor(state.matter['e-'] / electronCost);

  return Math.min(protonMax, neutronMax, electronMax);
}

// Fusion system
export interface FusionCost {
  atomUnits: number;
  photons: number;
  energy: number;
  time: number; // in ms
}

export function getFusionCost(z: number, state: GameState): FusionCost {
  const cfg = BALANCE.periodicTable;

  let atomCost = Math.ceil(cfg.fusionBaseCost * Math.pow(cfg.fusionCostScale, z));
  let time = cfg.fusionBaseTime * Math.pow(cfg.fusionTimeScale, z) * 1000;
  const photonCost = cfg.fusionPhotonCost(z);
  const energyCost = cfg.fusionEnergyCost(z);

  // Apply fusion wall penalty
  if (z > cfg.fusionWallZ) {
    time /= cfg.postWallEfficiencyDrop;
    atomCost = Math.ceil(atomCost * 1.5);
  }

  // Apply Higgs bonus
  const higgsBonus = 1 + state.bosons.higgs * BALANCE.forces.higgsEfficiencyBonus;
  time /= higgsBonus;

  return {
    atomUnits: atomCost,
    photons: photonCost,
    energy: energyCost,
    time: Math.ceil(time),
  };
}

export function canStartFusion(state: GameState, z: number): { canStart: boolean; reason?: string } {
  if (state.currentEmergentLevel < 6) {
    return { canStart: false, reason: 'Requires E6' };
  }
  if (!state.periodicTableUnlocked) {
    return { canStart: false, reason: 'Periodic table not unlocked' };
  }

  const element = state.elements.find(e => e.z === z);
  if (!element) {
    return { canStart: false, reason: 'Element not found' };
  }
  if (element.unlocked) {
    return { canStart: false, reason: 'Already unlocked' };
  }

  // Check prerequisites (must have previous element or Z=1)
  if (z > 1) {
    const prevElement = state.elements.find(e => e.z === z - 1);
    if (!prevElement?.unlocked) {
      return { canStart: false, reason: `Unlock ${getElementByZ(z - 1)?.symbol} first` };
    }
  }

  // Check fusion wall
  if (z > BALANCE.periodicTable.maxFusionZ) {
    return { canStart: false, reason: 'Beyond fusion limit - use decay' };
  }

  if (state.activeFusion) {
    return { canStart: false, reason: 'Fusion already in progress' };
  }

  const cost = getFusionCost(z, state);

  if (state.atomUnits < cost.atomUnits) {
    return { canStart: false, reason: `Need ${cost.atomUnits} Atom Units` };
  }
  if (state.catalysts.photon < cost.photons) {
    return { canStart: false, reason: `Need ${cost.photons} Photons` };
  }
  if (state.energy < cost.energy) {
    return { canStart: false, reason: `Need ${cost.energy} Energy` };
  }

  return { canStart: true };
}

export function startFusion(state: GameState, z: number): GameState {
  const check = canStartFusion(state, z);
  if (!check.canStart) return state;

  const cost = getFusionCost(z, state);
  const newState = { ...state };

  // Pay costs
  newState.atomUnits -= cost.atomUnits;
  newState.catalysts = {
    ...newState.catalysts,
    photon: newState.catalysts.photon - cost.photons,
  };
  newState.energy -= cost.energy;

  // Start fusion
  newState.activeFusion = {
    z,
    startTime: Date.now(),
  };

  // Update element
  const element = newState.elements.find(e => e.z === z);
  if (element) {
    element.fusionStartTime = Date.now();
    element.fusionProgress = 0;
  }

  return newState;
}

export function cancelFusion(state: GameState): GameState {
  if (!state.activeFusion) return state;

  const newState = { ...state };
  const element = newState.elements.find(e => e.z === state.activeFusion!.z);
  if (element) {
    element.fusionProgress = 0;
    element.fusionStartTime = null;
  }
  newState.activeFusion = null;

  // No refund on cancel

  return newState;
}

// Decay system for elements beyond fusion wall
export interface DecayCost {
  durability: number;
  energy: number;
  bosons: { type: 'W+' | 'W-' | 'Z0'; count: number };
}

export function canCraftLeadSample(state: GameState): boolean {
  if (!state.periodicTableUnlocked) return false;

  // Need Lead unlocked
  const lead = state.elements.find(e => e.z === 82);
  if (!lead?.unlocked) return false;

  if (state.leadSample.crafted) return false;

  const cost = BALANCE.decay.leadSampleCost;
  return state.energy >= cost.energy && state.catalysts.photon >= cost.photons;
}

export function craftLeadSample(state: GameState): GameState {
  if (!canCraftLeadSample(state)) return state;

  const cost = BALANCE.decay.leadSampleCost;
  const newState = { ...state };

  newState.energy -= cost.energy;
  newState.catalysts = {
    ...newState.catalysts,
    photon: newState.catalysts.photon - cost.photons,
  };

  newState.leadSample = {
    crafted: true,
    durability: BALANCE.decay.leadSampleDurability,
    maxDurability: BALANCE.decay.leadSampleDurability,
  };

  return newState;
}

export function getDecayCost(fromZ: number, toZ: number): DecayCost {
  const distance = Math.abs(fromZ - toZ);

  return {
    durability: BALANCE.decay.decayDurabilityCost * distance,
    energy: BALANCE.decay.decayEnergyCost * distance,
    bosons: {
      type: toZ < fromZ ? 'W-' : 'W+',
      count: BALANCE.decay.decayBosonCost,
    },
  };
}

export function canStartDecay(state: GameState, fromZ: number, toZ: number): { canStart: boolean; reason?: string } {
  if (!state.leadSample.crafted) {
    return { canStart: false, reason: 'Need Lead Sample' };
  }
  if (state.leadSample.durability <= 0) {
    return { canStart: false, reason: 'Lead Sample depleted' };
  }
  if (state.activeDecay) {
    return { canStart: false, reason: 'Decay already in progress' };
  }

  const fromElement = state.elements.find(e => e.z === fromZ);
  const toElement = state.elements.find(e => e.z === toZ);

  if (!fromElement?.unlocked) {
    return { canStart: false, reason: `Need ${getElementByZ(fromZ)?.symbol} unlocked` };
  }
  if (toElement?.unlocked) {
    return { canStart: false, reason: 'Target already unlocked' };
  }

  const cost = getDecayCost(fromZ, toZ);

  if (state.leadSample.durability < cost.durability) {
    return { canStart: false, reason: 'Not enough durability' };
  }
  if (state.energy < cost.energy) {
    return { canStart: false, reason: `Need ${cost.energy} Energy` };
  }

  const bosonCount = cost.bosons.type === 'W+'
    ? state.bosons['W+']
    : state.bosons['W-'];
  if (bosonCount < cost.bosons.count) {
    return { canStart: false, reason: `Need ${cost.bosons.count} ${cost.bosons.type}` };
  }

  return { canStart: true };
}

export function startDecay(state: GameState, fromZ: number, toZ: number): GameState {
  const check = canStartDecay(state, fromZ, toZ);
  if (!check.canStart) return state;

  const cost = getDecayCost(fromZ, toZ);
  const newState = { ...state };

  // Pay costs
  newState.energy -= cost.energy;
  newState.leadSample = {
    ...newState.leadSample,
    durability: newState.leadSample.durability - cost.durability,
  };

  if (cost.bosons.type === 'W+') {
    newState.bosons = { ...newState.bosons, 'W+': newState.bosons['W+'] - cost.bosons.count };
  } else {
    newState.bosons = { ...newState.bosons, 'W-': newState.bosons['W-'] - cost.bosons.count };
  }

  // Instant unlock for decay (simplified)
  const element = newState.elements.find(e => e.z === toZ);
  if (element) {
    element.unlocked = true;
    newState.stats.elementsUnlocked++;
  }

  return newState;
}

export function getElementsUnlockedCount(state: GameState): number {
  return state.elements.filter(e => e.unlocked).length;
}

export function isPeriodicTableComplete(state: GameState): boolean {
  return state.elements.every(e => e.unlocked);
}

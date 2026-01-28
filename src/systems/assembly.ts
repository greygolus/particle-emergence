/**
 * Assembly System - Build protons and neutrons from quarks
 */

import { GameState } from '../types';
import { BALANCE } from '../config/balance';
import { getStability } from '../core/state';

export interface AssemblyResult {
  success: boolean;
  produced: number;
  waste: number;
  gluonsConsumed: number;
}

export function canBuildProton(state: GameState, count: number = 1): boolean {
  if (state.currentEmergentLevel < 5) return false;

  const recipe = BALANCE.assembly.protonRecipe;
  const uNeeded = recipe.u * count;
  const dNeeded = recipe.d * count;
  const gluonsNeeded = state.assemblyUpgrades.gluonCatalyst ? 0 : recipe.gluons * count;

  return state.matter.u >= uNeeded &&
         state.matter.d >= dNeeded &&
         state.catalysts.gluon >= gluonsNeeded;
}

export function canBuildNeutron(state: GameState, count: number = 1): boolean {
  if (state.currentEmergentLevel < 5) return false;

  const recipe = BALANCE.assembly.neutronRecipe;
  const uNeeded = recipe.u * count;
  const dNeeded = recipe.d * count;
  const gluonsNeeded = state.assemblyUpgrades.gluonCatalyst ? 0 : recipe.gluons * count;

  return state.matter.u >= uNeeded &&
         state.matter.d >= dNeeded &&
         state.catalysts.gluon >= gluonsNeeded;
}

export function buildProton(state: GameState, count: number = 1): { newState: GameState; result: AssemblyResult } {
  if (!canBuildProton(state, count)) {
    return { newState: state, result: { success: false, produced: 0, waste: 0, gluonsConsumed: 0 } };
  }

  const newState = { ...state };
  const recipe = BALANCE.assembly.protonRecipe;
  const stability = getStability(state);

  // Calculate waste based on stability
  const wasteFactor = 1 - stability;

  // Consume quarks
  const uConsumed = recipe.u * count;
  const dConsumed = recipe.d * count;
  newState.matter = {
    ...newState.matter,
    u: newState.matter.u - uConsumed,
    d: newState.matter.d - dConsumed,
  };

  // Consume gluons (unless catalytic)
  let gluonsConsumed = 0;
  if (!state.assemblyUpgrades.gluonCatalyst) {
    gluonsConsumed = recipe.gluons * count;
    newState.catalysts = {
      ...newState.catalysts,
      gluon: newState.catalysts.gluon - gluonsConsumed,
    };
  } else {
    // Catalytic gluons - chance to not consume
    for (let i = 0; i < recipe.gluons * count; i++) {
      if (Math.random() > BALANCE.assembly.catalyticGluonChance) {
        gluonsConsumed++;
      }
    }
    newState.catalysts = {
      ...newState.catalysts,
      gluon: newState.catalysts.gluon - gluonsConsumed,
    };
  }

  // Produce protons with waste
  const produced = Math.floor(count * stability);
  const waste = count - produced;

  newState.composites = {
    ...newState.composites,
    proton: newState.composites.proton + produced,
  };

  newState.stats.totalProtonsBuilt += produced;

  return {
    newState,
    result: {
      success: true,
      produced,
      waste,
      gluonsConsumed,
    },
  };
}

export function buildNeutron(state: GameState, count: number = 1): { newState: GameState; result: AssemblyResult } {
  if (!canBuildNeutron(state, count)) {
    return { newState: state, result: { success: false, produced: 0, waste: 0, gluonsConsumed: 0 } };
  }

  const newState = { ...state };
  const recipe = BALANCE.assembly.neutronRecipe;
  const stability = getStability(state);

  // Calculate waste based on stability
  const wasteFactor = 1 - stability;

  // Consume quarks
  const uConsumed = recipe.u * count;
  const dConsumed = recipe.d * count;
  newState.matter = {
    ...newState.matter,
    u: newState.matter.u - uConsumed,
    d: newState.matter.d - dConsumed,
  };

  // Consume gluons (unless catalytic)
  let gluonsConsumed = 0;
  if (!state.assemblyUpgrades.gluonCatalyst) {
    gluonsConsumed = recipe.gluons * count;
    newState.catalysts = {
      ...newState.catalysts,
      gluon: newState.catalysts.gluon - gluonsConsumed,
    };
  } else {
    for (let i = 0; i < recipe.gluons * count; i++) {
      if (Math.random() > BALANCE.assembly.catalyticGluonChance) {
        gluonsConsumed++;
      }
    }
    newState.catalysts = {
      ...newState.catalysts,
      gluon: newState.catalysts.gluon - gluonsConsumed,
    };
  }

  // Produce neutrons with waste
  const produced = Math.floor(count * stability);
  const waste = count - produced;

  newState.composites = {
    ...newState.composites,
    neutron: newState.composites.neutron + produced,
  };

  newState.stats.totalNeutronsBuilt += produced;

  return {
    newState,
    result: {
      success: true,
      produced,
      waste,
      gluonsConsumed,
    },
  };
}

export function getMaxBuildable(state: GameState, type: 'proton' | 'neutron'): number {
  const recipe = type === 'proton' ? BALANCE.assembly.protonRecipe : BALANCE.assembly.neutronRecipe;

  const uMax = Math.floor(state.matter.u / recipe.u);
  const dMax = Math.floor(state.matter.d / recipe.d);
  const gluonMax = state.assemblyUpgrades.gluonCatalyst
    ? Infinity
    : Math.floor(state.catalysts.gluon / recipe.gluons);

  return Math.min(uMax, dMax, gluonMax);
}

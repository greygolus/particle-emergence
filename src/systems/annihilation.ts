/**
 * Annihilation System - Convert matter + antimatter pairs to Energy and photons
 */

import { GameState } from '../types';
import { BALANCE } from '../config/balance';

export type AnnihilationPair =
  | 'electron'   // e- + e+
  | 'u_quark'    // u + ū
  | 'd_quark'    // d + d̄
  | 's_quark'    // s + s̄
  | 'c_quark'    // c + c̄
  | 'b_quark'    // b + b̄
  | 't_quark'    // t + t̄
  | 'muon'       // μ- + μ+
  | 'tau';       // τ- + τ+

export interface AnnihilationResult {
  energy: number;
  photons: number;
  gluons: number;
  pityGained: number;
}

export function canAnnihilate(state: GameState, pair: AnnihilationPair, count: number = 1): boolean {
  if (state.currentEmergentLevel < 4) return false;

  switch (pair) {
    case 'electron':
      return state.matter['e-'] >= count && state.antimatter['e+'] >= count;
    case 'u_quark':
      return state.matter.u >= count && state.antimatter.u_bar >= count;
    case 'd_quark':
      return state.matter.d >= count && state.antimatter.d_bar >= count;
    case 's_quark':
      return state.matter.s >= count && state.antimatter.s_bar >= count;
    case 'c_quark':
      return state.matter.c >= count && state.antimatter.c_bar >= count;
    case 'b_quark':
      return state.matter.b >= count && state.antimatter.b_bar >= count;
    case 't_quark':
      return state.matter.t >= count && state.antimatter.t_bar >= count;
    case 'muon':
      return state.matter['mu-'] >= count && state.antimatter['mu+'] >= count;
    case 'tau':
      return state.matter['tau-'] >= count && state.antimatter['tau+'] >= count;
    default:
      return false;
  }
}

export function annihilate(state: GameState, pair: AnnihilationPair, count: number = 1): { newState: GameState; result: AnnihilationResult } {
  const newState = { ...state };
  const result: AnnihilationResult = {
    energy: 0,
    photons: 0,
    gluons: 0,
    pityGained: 0,
  };

  if (!canAnnihilate(state, pair, count)) {
    return { newState: state, result };
  }

  // Consume particles
  switch (pair) {
    case 'electron':
      newState.matter = { ...newState.matter, 'e-': newState.matter['e-'] - count };
      newState.antimatter = { ...newState.antimatter, 'e+': newState.antimatter['e+'] - count };
      result.energy = BALANCE.annihilation.electronPositron.energy * count;
      result.photons = BALANCE.annihilation.electronPositron.photons * count;
      break;
    case 'u_quark':
      newState.matter = { ...newState.matter, u: newState.matter.u - count };
      newState.antimatter = { ...newState.antimatter, u_bar: newState.antimatter.u_bar - count };
      result.energy = BALANCE.annihilation.quarkAntiquark.energy * count;
      result.photons = BALANCE.annihilation.quarkAntiquark.photons * count;
      break;
    case 'd_quark':
      newState.matter = { ...newState.matter, d: newState.matter.d - count };
      newState.antimatter = { ...newState.antimatter, d_bar: newState.antimatter.d_bar - count };
      result.energy = BALANCE.annihilation.quarkAntiquark.energy * count;
      result.photons = BALANCE.annihilation.quarkAntiquark.photons * count;
      break;
    case 's_quark':
    case 'c_quark':
      {
        const mKey = pair === 's_quark' ? 's' : 'c';
        const amKey = pair === 's_quark' ? 's_bar' : 'c_bar';
        newState.matter = { ...newState.matter, [mKey]: newState.matter[mKey] - count };
        newState.antimatter = { ...newState.antimatter, [amKey]: newState.antimatter[amKey] - count };
        result.energy = BALANCE.annihilation.tier2Annihilation.energy * count;
        result.photons = BALANCE.annihilation.tier2Annihilation.photons * count;
        // Gluon bonus chance
        for (let i = 0; i < count; i++) {
          if (Math.random() < BALANCE.annihilation.tier2Annihilation.gluonChance) {
            result.gluons += 1;
          }
        }
      }
      break;
    case 'muon':
      newState.matter = { ...newState.matter, 'mu-': newState.matter['mu-'] - count };
      newState.antimatter = { ...newState.antimatter, 'mu+': newState.antimatter['mu+'] - count };
      result.energy = BALANCE.annihilation.tier2Annihilation.energy * count;
      result.photons = BALANCE.annihilation.tier2Annihilation.photons * count;
      for (let i = 0; i < count; i++) {
        if (Math.random() < BALANCE.annihilation.tier2Annihilation.gluonChance) {
          result.gluons += 1;
        }
      }
      break;
    case 'b_quark':
    case 't_quark':
      {
        const mKey = pair === 'b_quark' ? 'b' : 't';
        const amKey = pair === 'b_quark' ? 'b_bar' : 't_bar';
        newState.matter = { ...newState.matter, [mKey]: newState.matter[mKey] - count };
        newState.antimatter = { ...newState.antimatter, [amKey]: newState.antimatter[amKey] - count };
        result.energy = BALANCE.annihilation.tier3Annihilation.energy * count;
        result.photons = BALANCE.annihilation.tier3Annihilation.photons * count;
        for (let i = 0; i < count; i++) {
          if (Math.random() < BALANCE.annihilation.tier3Annihilation.gluonChance) {
            result.gluons += 1;
          }
        }
      }
      break;
    case 'tau':
      newState.matter = { ...newState.matter, 'tau-': newState.matter['tau-'] - count };
      newState.antimatter = { ...newState.antimatter, 'tau+': newState.antimatter['tau+'] - count };
      result.energy = BALANCE.annihilation.tier3Annihilation.energy * count;
      result.photons = BALANCE.annihilation.tier3Annihilation.photons * count;
      for (let i = 0; i < count; i++) {
        if (Math.random() < BALANCE.annihilation.tier3Annihilation.gluonChance) {
          result.gluons += 1;
        }
      }
      break;
  }

  // Apply results
  newState.energy += result.energy;
  newState.catalysts = {
    ...newState.catalysts,
    photon: newState.catalysts.photon + result.photons,
    gluon: newState.catalysts.gluon + result.gluons,
  };

  // Update stats
  newState.stats.totalAnnihilations += count;
  newState.stats.totalEnergyProduced += result.energy;

  return { newState, result };
}

export function getAnnihilatableCount(state: GameState, pair: AnnihilationPair): number {
  switch (pair) {
    case 'electron':
      return Math.floor(Math.min(state.matter['e-'], state.antimatter['e+']));
    case 'u_quark':
      return Math.floor(Math.min(state.matter.u, state.antimatter.u_bar));
    case 'd_quark':
      return Math.floor(Math.min(state.matter.d, state.antimatter.d_bar));
    case 's_quark':
      return Math.floor(Math.min(state.matter.s, state.antimatter.s_bar));
    case 'c_quark':
      return Math.floor(Math.min(state.matter.c, state.antimatter.c_bar));
    case 'b_quark':
      return Math.floor(Math.min(state.matter.b, state.antimatter.b_bar));
    case 't_quark':
      return Math.floor(Math.min(state.matter.t, state.antimatter.t_bar));
    case 'muon':
      return Math.floor(Math.min(state.matter['mu-'], state.antimatter['mu+']));
    case 'tau':
      return Math.floor(Math.min(state.matter['tau-'], state.antimatter['tau+']));
    default:
      return 0;
  }
}

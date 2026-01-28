/**
 * Emerge System - Prestige/Reset mechanics
 */

import { GameState, EmergentLevel } from '../types';
import { BALANCE } from '../config/balance';
import { resetForEmerge } from '../core/state';
import { getTier2ParticleCount } from './collider';

export interface EmergeRequirement {
  pq?: number;
  pl?: number;
  energy?: number;
  uQuarks?: number;
  dQuarks?: number;
  electrons?: number;
  neutrinos?: number;
  tier2Particles?: number;
  tier3Particles?: number;
  antimatterParticles?: number;
  protons?: number;
  neutrons?: number;
}

export function getEmergeRequirements(targetLevel: EmergentLevel): EmergeRequirement {
  switch (targetLevel) {
    case 1:
      return BALANCE.emerge1Requirement;
    case 2:
      return BALANCE.emerge2Requirement;
    case 3:
      return BALANCE.emerge3Requirement;
    case 4:
      return BALANCE.emerge4Requirement;
    case 5:
      return BALANCE.emerge5Requirement;
    case 6:
      return BALANCE.emerge6Requirement;
    default:
      return {};
  }
}

export function checkEmergeRequirements(state: GameState, targetLevel: EmergentLevel): { canEmerge: boolean; missing: string[] } {
  if (targetLevel <= state.currentEmergentLevel) {
    return { canEmerge: false, missing: ['Already at this level or higher'] };
  }
  if (targetLevel > state.currentEmergentLevel + 1) {
    return { canEmerge: false, missing: ['Must emerge to next level'] };
  }

  const req = getEmergeRequirements(targetLevel);
  const missing: string[] = [];

  if (req.pq && state.pq < req.pq) {
    missing.push(`Need ${req.pq} Pq (have ${Math.floor(state.pq)})`);
  }
  if (req.pl && state.pl < req.pl) {
    missing.push(`Need ${req.pl} Pl (have ${Math.floor(state.pl)})`);
  }
  if (req.energy && state.energy < req.energy) {
    missing.push(`Need ${req.energy} Energy (have ${Math.floor(state.energy)})`);
  }
  if (req.uQuarks && state.matter.u < req.uQuarks) {
    missing.push(`Need ${req.uQuarks} u quarks (have ${Math.floor(state.matter.u)})`);
  }
  if (req.dQuarks && state.matter.d < req.dQuarks) {
    missing.push(`Need ${req.dQuarks} d quarks (have ${Math.floor(state.matter.d)})`);
  }
  if (req.electrons && state.matter['e-'] < req.electrons) {
    missing.push(`Need ${req.electrons} e- (have ${Math.floor(state.matter['e-'])})`);
  }
  if (req.neutrinos && state.matter.ve < req.neutrinos) {
    missing.push(`Need ${req.neutrinos} νe (have ${Math.floor(state.matter.ve)})`);
  }
  if (req.tier2Particles) {
    const count = getTier2ParticleCount(state);
    if (count < req.tier2Particles) {
      missing.push(`Need ${req.tier2Particles} Tier 2 particles (have ${Math.floor(count)})`);
    }
  }
  if (req.tier3Particles) {
    const count = state.matter.b + state.matter.t + state.matter['tau-'] + state.matter.vtau +
                  state.antimatter.b_bar + state.antimatter.t_bar + state.antimatter['tau+'] + state.antimatter.vtau_bar;
    if (count < req.tier3Particles) {
      missing.push(`Need ${req.tier3Particles} Tier 3 particles (have ${Math.floor(count)})`);
    }
  }
  if (req.antimatterParticles) {
    const count = Object.values(state.antimatter).reduce((a, b) => a + b, 0);
    if (count < req.antimatterParticles) {
      missing.push(`Need ${req.antimatterParticles} antimatter particles (have ${Math.floor(count)})`);
    }
  }
  if (req.protons && state.composites.proton < req.protons) {
    missing.push(`Need ${req.protons} protons (have ${Math.floor(state.composites.proton)})`);
  }
  if (req.neutrons && state.composites.neutron < req.neutrons) {
    missing.push(`Need ${req.neutrons} neutrons (have ${Math.floor(state.composites.neutron)})`);
  }

  return { canEmerge: missing.length === 0, missing };
}

export function emerge(state: GameState, targetLevel: EmergentLevel): GameState {
  const check = checkEmergeRequirements(state, targetLevel);
  if (!check.canEmerge) return state;

  return resetForEmerge(state, targetLevel);
}

export function getEmergeProgress(state: GameState, targetLevel: EmergentLevel): number {
  const req = getEmergeRequirements(targetLevel);
  if (Object.keys(req).length === 0) return 0;

  let totalProgress = 0;
  let totalItems = 0;

  if (req.pq) {
    totalProgress += Math.min(state.pq / req.pq, 1);
    totalItems++;
  }
  if (req.pl) {
    totalProgress += Math.min(state.pl / req.pl, 1);
    totalItems++;
  }
  if (req.energy) {
    totalProgress += Math.min(state.energy / req.energy, 1);
    totalItems++;
  }
  if (req.uQuarks) {
    totalProgress += Math.min(state.matter.u / req.uQuarks, 1);
    totalItems++;
  }
  if (req.dQuarks) {
    totalProgress += Math.min(state.matter.d / req.dQuarks, 1);
    totalItems++;
  }
  if (req.electrons) {
    totalProgress += Math.min(state.matter['e-'] / req.electrons, 1);
    totalItems++;
  }
  if (req.neutrinos) {
    totalProgress += Math.min(state.matter.ve / req.neutrinos, 1);
    totalItems++;
  }
  if (req.tier2Particles) {
    const count = getTier2ParticleCount(state);
    totalProgress += Math.min(count / req.tier2Particles, 1);
    totalItems++;
  }
  if (req.tier3Particles) {
    const count = state.matter.b + state.matter.t + state.matter['tau-'] + state.matter.vtau +
                  state.antimatter.b_bar + state.antimatter.t_bar + state.antimatter['tau+'] + state.antimatter.vtau_bar;
    totalProgress += Math.min(count / req.tier3Particles, 1);
    totalItems++;
  }
  if (req.antimatterParticles) {
    const count = Object.values(state.antimatter).reduce((a, b) => a + b, 0);
    totalProgress += Math.min(count / req.antimatterParticles, 1);
    totalItems++;
  }
  if (req.protons) {
    totalProgress += Math.min(state.composites.proton / req.protons, 1);
    totalItems++;
  }
  if (req.neutrons) {
    totalProgress += Math.min(state.composites.neutron / req.neutrons, 1);
    totalItems++;
  }

  return totalItems > 0 ? totalProgress / totalItems : 0;
}

export function getEmergeLevelName(level: EmergentLevel): string {
  switch (level) {
    case 0: return 'E0: Quark Domain';
    case 1: return 'E1: Lepton Domain';
    case 2: return 'E2: Collider Tier 2';
    case 3: return 'E3: Collider Tier 3';
    case 4: return 'E4: Antimatter';
    case 5: return 'E5: Nucleon Assembly';
    case 6: return 'E6: Atom Builder';
    default: return `E${level}`;
  }
}

export function getEmergeLevelDescription(level: EmergentLevel): string {
  switch (level) {
    case 0: return 'Harvest quarks and generate Pq currency';
    case 1: return 'Unlock lepton harvesting and Pl currency';
    case 2: return 'Unlock the Collider with Tier 2 particle production';
    case 3: return 'Unlock Tier 3 collider for heavy particles';
    case 4: return 'Unlock antimatter production and automation';
    case 5: return 'Build protons and neutrons from quarks';
    case 6: return 'Build atoms and complete the Periodic Table';
    default: return '';
  }
}

/**
 * Collider System
 */

import { GameState, ColliderRunResult, ExoticEventResult, ColliderMode, ColliderTier, BosonParticle } from '../types';
import { BALANCE } from '../config/balance';
import { getPrecisionBonus } from '../core/state';

export function canRunCollider(state: GameState, tier: ColliderTier): { canRun: boolean; reason?: string } {
  if (tier === 2) {
    if (state.currentEmergentLevel < 2) {
      return { canRun: false, reason: 'Requires E2' };
    }
    if (state.pq < BALANCE.colliderT2.baseCost) {
      return { canRun: false, reason: `Need ${BALANCE.colliderT2.baseCost} Pq` };
    }
    if (state.collider.precisionSpend > state.pl) {
      return { canRun: false, reason: 'Not enough Pl for precision' };
    }
    return { canRun: true };
  }

  if (tier === 3) {
    if (state.currentEmergentLevel < 3) {
      return { canRun: false, reason: 'Requires E3' };
    }
    if (!state.colliderUpgrades.tier3Unlocked) {
      return { canRun: false, reason: 'Tier 3 not unlocked' };
    }
    if (state.pq < BALANCE.colliderT3.baseCost) {
      return { canRun: false, reason: `Need ${BALANCE.colliderT3.baseCost} Pq` };
    }
    if (state.energy < BALANCE.colliderT3.energyCost) {
      return { canRun: false, reason: `Need ${BALANCE.colliderT3.energyCost} Energy` };
    }
    if (state.collider.precisionSpend > state.pl) {
      return { canRun: false, reason: 'Not enough Pl for precision' };
    }
    return { canRun: true };
  }

  return { canRun: false, reason: 'Invalid tier' };
}

export function canRunBosonCollider(state: GameState): { canRun: boolean; reason?: string } {
  if (state.currentEmergentLevel < 6) {
    return { canRun: false, reason: 'Requires E6' };
  }
  if (!state.colliderUpgrades.bosonModeUnlocked) {
    return { canRun: false, reason: 'Boson mode not unlocked' };
  }
  const cfg = BALANCE.forces.bosonCollider;
  if (state.pq < cfg.pqCost) {
    return { canRun: false, reason: `Need ${cfg.pqCost} Pq` };
  }
  if (state.pl < cfg.plCost) {
    return { canRun: false, reason: `Need ${cfg.plCost} Pl` };
  }
  if (state.energy < cfg.energyCost) {
    return { canRun: false, reason: `Need ${cfg.energyCost} Energy` };
  }
  return { canRun: true };
}

export function runCollider(state: GameState): { newState: GameState; result: ColliderRunResult } {
  const newState = { ...state };
  const tier = state.collider.tier;
  const mode = state.collider.mode;
  const matterMode = state.collider.matterMode;

  // Determine config based on tier
  const cfg = tier === 2 ? BALANCE.colliderT2 : BALANCE.colliderT3;

  // Pay costs
  newState.pq -= tier === 2 ? BALANCE.colliderT2.baseCost : BALANCE.colliderT3.baseCost;
  newState.pl -= state.collider.precisionSpend;
  if (tier === 3) {
    newState.energy -= BALANCE.colliderT3.energyCost;
  }

  // Calculate upgrade chance
  let upgradeChance = cfg.baseUpgradeChance;
  upgradeChance += state.collider.precisionSpend * cfg.precisionBonusPerPl;
  upgradeChance += getPrecisionBonus(state);

  // Add slotted catalyst bonuses
  upgradeChance += state.collider.slottedPhotons * BALANCE.catalystSlots.photonBoost;
  upgradeChance += state.collider.slottedGluons * BALANCE.catalystSlots.gluonBoost;

  // Antimatter mode penalty
  if (matterMode === 'antimatter' && state.currentEmergentLevel >= 4) {
    upgradeChance += BALANCE.antimatter.antimatterColliderChancePenalty;
  }

  // Overdrive bonus (just more speed, not more chance)
  let runSpeed = 1;
  if (state.tempBuffs.colliderOverdrive.active) {
    runSpeed = BALANCE.exoticEvents.overdriveMultiplier;
  }

  // Check for pity trigger
  const precisionSpend = state.collider.precisionSpend;
  const pityThreshold = cfg === BALANCE.colliderT2
    ? BALANCE.colliderT2.basePityThreshold - precisionSpend * BALANCE.colliderT2.pityReductionPerPl
    : 15; // T3 has lower pity

  let pityTriggered = false;
  if (newState.collider.pity >= pityThreshold) {
    pityTriggered = true;
    upgradeChance = 1; // Guaranteed success
    newState.collider.pity = 0;
  }

  // Roll for upgrade success
  const upgradeRoll = Math.random();
  const success = upgradeRoll < upgradeChance;

  // Initialize result
  const result: ColliderRunResult = {
    success,
    particles: {},
    photonDrop: 0,
    gluonDrop: 0,
    debrisDrop: 0,
    exoticEvent: null,
    pityGained: 0,
    pityTriggered,
    energyGained: 0,
  };

  // Generate particles based on success and mode
  if (success) {
    newState.stats.totalUpgradeSuccesses++;

    if (tier === 2) {
      if (mode === 'quark') {
        const particle = Math.random() < 0.5 ? 's' : 'c';
        if (matterMode === 'matter') {
          result.particles = { [particle]: 1 };
          newState.matter[particle] += 1;
        } else {
          const antiParticle = particle + '_bar' as keyof typeof newState.antimatter;
          result.particles = { [antiParticle]: 1 };
          newState.antimatter[antiParticle] += 1;
        }
      } else {
        const particle = Math.random() < 0.5 ? 'mu-' : 'vmu';
        if (matterMode === 'matter') {
          result.particles = { [particle]: 1 };
          newState.matter[particle] += 1;
        } else {
          const antiParticle = particle === 'mu-' ? 'mu+' : 'vmu_bar';
          result.particles = { [antiParticle]: 1 };
          newState.antimatter[antiParticle] += 1;
        }
      }
    } else {
      // Tier 3
      if (mode === 'quark') {
        const particle = Math.random() < 0.5 ? 'b' : 't';
        if (matterMode === 'matter') {
          result.particles = { [particle]: 1 };
          newState.matter[particle] += 1;
        } else {
          const antiParticle = particle + '_bar' as keyof typeof newState.antimatter;
          result.particles = { [antiParticle]: 1 };
          newState.antimatter[antiParticle] += 1;
        }
      } else {
        const particle = Math.random() < 0.5 ? 'tau-' : 'vtau';
        if (matterMode === 'matter') {
          result.particles = { [particle]: 1 };
          newState.matter[particle] += 1;
        } else {
          const antiParticle = particle === 'tau-' ? 'tau+' : 'vtau_bar';
          result.particles = { [antiParticle]: 1 };
          newState.antimatter[antiParticle] += 1;
        }
      }
    }
  } else {
    // Failure - give base particles
    const failYield = cfg.failureBaseYield ?? BALANCE.colliderT2.failureBaseYield;
    if (mode === 'quark') {
      if (matterMode === 'matter') {
        newState.matter.u += failYield;
        newState.matter.d += failYield;
        result.particles = { u: failYield, d: failYield };
      } else {
        newState.antimatter.u_bar += failYield;
        newState.antimatter.d_bar += failYield;
        result.particles = { u_bar: failYield, d_bar: failYield };
      }
    } else {
      if (matterMode === 'matter') {
        newState.matter['e-'] += failYield * 0.5;
        newState.matter.ve += failYield * 0.5;
        result.particles = { 'e-': failYield * 0.5, ve: failYield * 0.5 };
      } else {
        newState.antimatter['e+'] += failYield * 0.5;
        newState.antimatter.ve_bar += failYield * 0.5;
        result.particles = { 'e+': failYield * 0.5, ve_bar: failYield * 0.5 };
      }
    }

    // Add pity
    if (!pityTriggered) {
      newState.collider.pity += 1;
      result.pityGained = 1;
    }
  }

  // Bonus drops (independent rolls)
  const dropCfg = tier === 2 ? BALANCE.colliderT2 : BALANCE.colliderT3;

  // Gluon drop
  if (Math.random() < dropCfg.gluonDropChance) {
    const amount = 1;
    result.gluonDrop = amount;
    newState.catalysts.gluon += amount;
  }

  // Photon drop
  if (Math.random() < dropCfg.photonDropChance) {
    const amount = 1;
    result.photonDrop = amount;
    newState.catalysts.photon += amount;
  }

  // Debris drop
  if (Math.random() < dropCfg.debrisDropChance) {
    const amount = Math.floor(Math.random() * 3) + 1;
    result.debrisDrop = amount;
    newState.debris += amount;
  }

  // Exotic event
  if (Math.random() < dropCfg.exoticEventChance) {
    result.exoticEvent = generateExoticEvent(newState);
    applyExoticEvent(newState, result.exoticEvent);
    newState.stats.totalExoticEvents++;
  }

  // Energy gain from antimatter collider
  if (matterMode === 'antimatter') {
    const baseEnergy = tier === 2 ? 1 : 3;
    const energyGain = baseEnergy * BALANCE.antimatter.antimatterEnergyBonus;
    result.energyGained = energyGain;
    newState.energy += energyGain;
    newState.stats.totalEnergyProduced += energyGain;
  }

  newState.stats.totalColliderRuns++;

  return { newState, result };
}

export function runBosonCollider(state: GameState): { newState: GameState; result: { success: boolean; boson?: BosonParticle; fallback: { photons: number; gluons: number; debris: number } } } {
  const newState = { ...state };
  const cfg = BALANCE.forces.bosonCollider;

  // Pay costs
  newState.pq -= cfg.pqCost;
  newState.pl -= cfg.plCost;
  newState.energy -= cfg.energyCost;

  const result = {
    success: false,
    boson: undefined as BosonParticle | undefined,
    fallback: { photons: 0, gluons: 0, debris: 0 },
  };

  // Roll for boson
  if (Math.random() < cfg.baseBosonChance) {
    result.success = true;
    // Weighted random boson
    const roll = Math.random();
    if (roll < 0.3) {
      result.boson = 'W+';
      newState.bosons['W+'] += 1;
    } else if (roll < 0.6) {
      result.boson = 'W-';
      newState.bosons['W-'] += 1;
    } else if (roll < 0.85) {
      result.boson = 'Z0';
      newState.bosons.Z0 += 1;
    } else {
      result.boson = 'higgs';
      newState.bosons.higgs += 1;
    }
  } else {
    // Fallback drops
    result.fallback.photons = Math.floor(Math.random() * 3) + 2;
    result.fallback.gluons = Math.floor(Math.random() * 2) + 1;
    result.fallback.debris = Math.floor(Math.random() * 5) + 3;

    newState.catalysts.photon += result.fallback.photons;
    newState.catalysts.gluon += result.fallback.gluons;
    newState.debris += result.fallback.debris;
  }

  newState.stats.totalColliderRuns++;

  return { newState, result };
}

function generateExoticEvent(state: GameState): ExoticEventResult {
  const roll = Math.random();
  const cfg = BALANCE.exoticEvents;

  if (roll < cfg.guaranteedUpgrade) {
    return {
      type: 'guaranteedUpgrade',
      rewards: {},
    };
  } else if (roll < cfg.guaranteedUpgrade + cfg.catalystJackpot) {
    const photons = Math.floor(Math.random() * (cfg.jackpotPhotons.max - cfg.jackpotPhotons.min + 1)) + cfg.jackpotPhotons.min;
    const gluons = Math.floor(Math.random() * (cfg.jackpotGluons.max - cfg.jackpotGluons.min + 1)) + cfg.jackpotGluons.min;
    return {
      type: 'catalystJackpot',
      rewards: { photons, gluons },
    };
  } else {
    return {
      type: 'overdrive',
      rewards: {},
    };
  }
}

function applyExoticEvent(state: GameState, event: ExoticEventResult): void {
  switch (event.type) {
    case 'guaranteedUpgrade':
      // Next run will be guaranteed (handled by pity reset to max)
      state.collider.pity = 100; // Force next success
      break;
    case 'catalystJackpot':
      if (event.rewards.photons) state.catalysts.photon += event.rewards.photons;
      if (event.rewards.gluons) state.catalysts.gluon += event.rewards.gluons;
      break;
    case 'overdrive':
      state.tempBuffs.colliderOverdrive.active = true;
      state.tempBuffs.colliderOverdrive.endTime = Date.now() + BALANCE.exoticEvents.overdriveDuration;
      break;
  }
}

export function getTier2ParticleCount(state: GameState): number {
  return state.matter.s + state.matter.c + state.matter['mu-'] + state.matter.vmu +
         state.antimatter.s_bar + state.antimatter.c_bar + state.antimatter['mu+'] + state.antimatter.vmu_bar;
}

export function canUnlockTier3(state: GameState): boolean {
  return getTier2ParticleCount(state) >= BALANCE.colliderT3.tier2ParticleGate;
}

export function unlockTier3(state: GameState): GameState {
  if (!canUnlockTier3(state)) return state;
  return {
    ...state,
    colliderUpgrades: {
      ...state.colliderUpgrades,
      tier3Unlocked: true,
    },
  };
}

export function setColliderTier(state: GameState, tier: ColliderTier): GameState {
  return {
    ...state,
    collider: { ...state.collider, tier },
  };
}

export function setColliderMode(state: GameState, mode: ColliderMode): GameState {
  return {
    ...state,
    collider: { ...state.collider, mode },
  };
}

export function setColliderMatterMode(state: GameState, matterMode: 'matter' | 'antimatter'): GameState {
  return {
    ...state,
    collider: { ...state.collider, matterMode },
  };
}

export function setPrecisionSpend(state: GameState, amount: number): GameState {
  const max = state.collider.tier === 2
    ? BALANCE.colliderT2.maxPrecisionSpend
    : BALANCE.colliderT3.maxPrecisionSpend;
  return {
    ...state,
    collider: { ...state.collider, precisionSpend: Math.min(Math.max(0, amount), max) },
  };
}

export function setBosonMode(state: GameState, enabled: boolean): GameState {
  return {
    ...state,
    collider: { ...state.collider, isBosonMode: enabled },
  };
}

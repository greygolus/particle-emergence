/**
 * Debris Shop System
 * Provides permanent upgrades purchased with debris
 */

import { GameState } from '../types';
import { BALANCE } from '../config/balance';

export type DebrisUpgradeType = 'energyAmplifier' | 'debrisSynergy' | 'leptonBoost' | 'precisionMastery';

/**
 * Get the cost of the next level of an upgrade
 */
export function getDebrisUpgradeCost(state: GameState, upgrade: DebrisUpgradeType): number {
  const cfg = BALANCE.debrisShop[upgrade];
  const currentLevel = state.debrisUpgrades[upgrade];
  return Math.floor(cfg.baseCost * Math.pow(cfg.costScale, currentLevel));
}

/**
 * Check if player can afford an upgrade
 */
export function canBuyDebrisUpgrade(state: GameState, upgrade: DebrisUpgradeType): boolean {
  const cost = getDebrisUpgradeCost(state, upgrade);
  return state.debris >= cost;
}

/**
 * Purchase a debris shop upgrade
 */
export function buyDebrisUpgrade(state: GameState, upgrade: DebrisUpgradeType): GameState {
  if (!canBuyDebrisUpgrade(state, upgrade)) return state;

  const cost = getDebrisUpgradeCost(state, upgrade);
  const newState = { ...state };

  newState.debris -= cost;
  newState.debrisUpgrades = {
    ...newState.debrisUpgrades,
    [upgrade]: newState.debrisUpgrades[upgrade] + 1,
  };

  return newState;
}

/**
 * Get the effect value of an upgrade at current level
 */
export function getDebrisUpgradeEffect(state: GameState, upgrade: DebrisUpgradeType): number {
  const cfg = BALANCE.debrisShop[upgrade];
  return state.debrisUpgrades[upgrade] * cfg.effectPerLevel;
}

/**
 * Get debris synergy bonus (% Pq/s boost based on debris held)
 */
export function getDebrisSynergyBonus(state: GameState): number {
  const effectPerLevel = getDebrisUpgradeEffect(state, 'debrisSynergy');
  return state.debris * effectPerLevel;
}

/**
 * Get lepton boost multiplier from debris shop
 */
export function getLeptonBoostMultiplier(state: GameState): number {
  return 1 + getDebrisUpgradeEffect(state, 'leptonBoost');
}

/**
 * Get extra precision spend cap from debris shop
 */
export function getExtraPrecisionCap(state: GameState): number {
  return getDebrisUpgradeEffect(state, 'precisionMastery');
}

/**
 * Get energy amplifier bonus (adds to fail energy exponent)
 */
export function getEnergyAmplifierBonus(state: GameState): number {
  return getDebrisUpgradeEffect(state, 'energyAmplifier');
}

/**
 * Get all upgrade info for display
 */
export function getDebrisUpgradeInfo(state: GameState, upgrade: DebrisUpgradeType): {
  name: string;
  description: string;
  currentLevel: number;
  cost: number;
  canAfford: boolean;
  currentEffect: string;
  nextEffect: string;
} {
  const level = state.debrisUpgrades[upgrade];
  const cost = getDebrisUpgradeCost(state, upgrade);
  const cfg = BALANCE.debrisShop[upgrade];

  const info = {
    energyAmplifier: {
      name: 'Energy Amplifier',
      description: 'Boosts exponential energy gain on T2 collider fails',
      formatEffect: (lvl: number) => `+${(lvl * cfg.effectPerLevel * 100).toFixed(0)}% exponent`,
    },
    debrisSynergy: {
      name: 'Debris Synergy',
      description: 'Gain bonus Pq/s based on debris held',
      formatEffect: (lvl: number) => `+${(lvl * cfg.effectPerLevel * 100).toFixed(0)}% per debris`,
    },
    leptonBoost: {
      name: 'Lepton Boost',
      description: '+5% lepton rate AND Pl factor per level',
      formatEffect: (lvl: number) => `+${(lvl * cfg.effectPerLevel * 100).toFixed(0)}%`,
    },
    precisionMastery: {
      name: 'Precision Mastery',
      description: 'Increases max Pl spend for collider',
      formatEffect: (lvl: number) => `+${Math.floor(lvl * cfg.effectPerLevel)} max Pl`,
    },
  };

  const upgradeInfo = info[upgrade];

  return {
    name: upgradeInfo.name,
    description: upgradeInfo.description,
    currentLevel: level,
    cost,
    canAfford: state.debris >= cost,
    currentEffect: upgradeInfo.formatEffect(level),
    nextEffect: upgradeInfo.formatEffect(level + 1),
  };
}

/**
 * Debris Exchange System
 */

import { GameState } from '../types';
import { BALANCE } from '../config/balance';

export type DebrisExchangeType = 'pq' | 'pl' | 'energy' | 'pity';

export function getDebrisExchangeRate(type: DebrisExchangeType): number {
  switch (type) {
    case 'pq': return BALANCE.debris.pqExchangeRate;
    case 'pl': return BALANCE.debris.plExchangeRate;
    case 'energy': return BALANCE.debris.energyExchangeRate;
    case 'pity': return BALANCE.debris.pityContribution;
  }
}

export function getDebrisNeeded(type: DebrisExchangeType, amount: number): number {
  const rate = getDebrisExchangeRate(type);
  return Math.ceil(amount / rate);
}

export function canExchangeDebris(state: GameState, type: DebrisExchangeType, debrisAmount: number): boolean {
  return state.debris >= debrisAmount;
}

export function exchangeDebris(
  state: GameState,
  type: DebrisExchangeType,
  debrisAmount: number
): GameState {
  if (!canExchangeDebris(state, type, debrisAmount)) return state;

  const rate = getDebrisExchangeRate(type);
  const gain = debrisAmount * rate;

  const newState = { ...state };
  newState.debris -= debrisAmount;

  switch (type) {
    case 'pq':
      newState.pq += gain;
      newState.stats.totalPqEarned += gain;
      break;
    case 'pl':
      newState.pl += gain;
      newState.stats.totalPlEarned += gain;
      break;
    case 'energy':
      newState.energy += gain;
      newState.stats.totalEnergyProduced += gain;
      break;
    case 'pity':
      newState.collider = {
        ...newState.collider,
        pity: newState.collider.pity + gain,
      };
      break;
  }

  return newState;
}

export function exchangeAllDebris(state: GameState, type: DebrisExchangeType): GameState {
  return exchangeDebris(state, type, Math.floor(state.debris));
}

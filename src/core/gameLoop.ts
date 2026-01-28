/**
 * Game Loop with Delta Time
 */

import { GameState } from '../types';
import { BALANCE } from '../config/balance';
import {
  getQuarkURate,
  getQuarkDRate,
  getPqFactor,
  getLeptonERate,
  getLeptonNuRate,
  getPlFactor,
  saveGame,
} from './state';

export type TickCallback = (state: GameState, dt: number) => GameState;
export type RenderCallback = (state: GameState) => void;

export interface GameLoop {
  start: () => void;
  stop: () => void;
  getState: () => GameState;
  setState: (state: GameState) => void;
  updateState: (updater: (state: GameState) => GameState) => void;
}

export function createGameLoop(
  initialState: GameState,
  onRender: RenderCallback
): GameLoop {
  let state = initialState;
  let running = false;
  let lastTickTime = Date.now();
  let lastRenderTime = Date.now();
  let lastSaveTime = Date.now();
  let animationFrameId: number | null = null;

  const tickInterval = 1000 / BALANCE.TICK_RATE;
  const renderInterval = 1000 / BALANCE.UI_UPDATE_RATE;

  function tick(dt: number): void {
    // Update play time
    state.stats.playTime += dt;

    // Update cooldowns
    if (state.harvesters.quarkSwitchCooldown > 0) {
      state.harvesters.quarkSwitchCooldown = Math.max(0, state.harvesters.quarkSwitchCooldown - dt);
    }
    if (state.harvesters.leptonSwitchCooldown > 0) {
      state.harvesters.leptonSwitchCooldown = Math.max(0, state.harvesters.leptonSwitchCooldown - dt);
    }
    if (state.collider.cooldown > 0) {
      state.collider.cooldown = Math.max(0, state.collider.cooldown - dt);
    }

    // Update temp buffs
    if (state.tempBuffs.colliderOverdrive.active) {
      if (Date.now() >= state.tempBuffs.colliderOverdrive.endTime) {
        state.tempBuffs.colliderOverdrive.active = false;
      }
    }

    const seconds = dt / 1000;

    // E0: Quark Harvester
    if (state.currentEmergentLevel >= 0) {
      const uRate = getQuarkURate(state);
      const dRate = getQuarkDRate(state);

      if (state.harvesters.quarkPolarity === 'matter') {
        state.matter.u += uRate * seconds;
        state.matter.d += dRate * seconds;
      } else if (state.currentEmergentLevel >= 4) {
        state.antimatter.u_bar += uRate * seconds;
        state.antimatter.d_bar += dRate * seconds;
      }

      // Pq gain from quark flux
      const pqGain = (uRate + dRate) * getPqFactor(state) * seconds;
      state.pq += pqGain;
      state.stats.totalPqEarned += pqGain;
    }

    // E1: Lepton Harvester
    if (state.currentEmergentLevel >= 1) {
      const eRate = getLeptonERate(state);
      const nuRate = getLeptonNuRate(state);

      if (state.harvesters.leptonPolarity === 'matter') {
        state.matter['e-'] += eRate * seconds;
        state.matter.ve += nuRate * seconds;
      } else if (state.currentEmergentLevel >= 4) {
        state.antimatter['e+'] += eRate * seconds;
        state.antimatter.ve_bar += nuRate * seconds;
      }

      // Pl gain from lepton flux
      const plGain = (eRate + nuRate) * getPlFactor(state) * seconds;
      state.pl += plGain;
      state.stats.totalPlEarned += plGain;
    }

    // E6: Active fusion progress
    if (state.currentEmergentLevel >= 6 && state.activeFusion) {
      const element = state.elements.find(e => e.z === state.activeFusion!.z);
      if (element && !element.unlocked) {
        const fusionTime = getFusionTime(element.z, state);
        const elapsed = Date.now() - state.activeFusion.startTime;
        element.fusionProgress = Math.min(elapsed / fusionTime, 1);

        if (element.fusionProgress >= 1) {
          // Fusion complete!
          element.unlocked = true;
          element.fusionProgress = 1;
          element.fusionStartTime = null;
          state.activeFusion = null;
          state.stats.elementsUnlocked++;

          // Check for Forces unlock
          checkForcesUnlock(state);

          // Check for periodic table permanent unlock
          checkPeriodicTablePermanentUnlock(state);
        }
      }
    }

    // Update last tick
    state.lastTick = Date.now();
  }

  function checkForcesUnlock(state: GameState): void {
    if (state.forcesUnlocked) return;

    const unlockedCount = state.elements.filter(e => e.unlocked).length;
    const ironUnlocked = state.elements.find(e => e.z === BALANCE.forces.ironZ)?.unlocked;

    if (unlockedCount >= BALANCE.forces.unlockElementCount || ironUnlocked) {
      state.forcesUnlocked = true;
    }
  }

  function checkPeriodicTablePermanentUnlock(state: GameState): void {
    // Periodic table permanently unlocks after milestone
    if (!state.periodicTableUnlocked && state.stats.totalAtomsBuilt >= BALANCE.atomBuilder.atomUnlockMilestone) {
      state.periodicTableUnlocked = true;
    }
  }

  function getFusionTime(z: number, state: GameState): number {
    let time = BALANCE.periodicTable.fusionBaseTime * Math.pow(BALANCE.periodicTable.fusionTimeScale, z);

    // Apply fusion wall penalty
    if (z > BALANCE.periodicTable.fusionWallZ) {
      time /= BALANCE.periodicTable.postWallEfficiencyDrop;
    }

    // Apply Higgs bonus
    const higgsBonus = 1 + state.bosons.higgs * BALANCE.forces.higgsEfficiencyBonus;
    time /= higgsBonus;

    return time * 1000; // Convert to ms
  }

  function loop(): void {
    if (!running) return;

    const now = Date.now();

    // Process ticks
    const tickDelta = now - lastTickTime;
    if (tickDelta >= tickInterval) {
      tick(tickDelta);
      lastTickTime = now;
    }

    // Render at throttled rate
    const renderDelta = now - lastRenderTime;
    if (renderDelta >= renderInterval) {
      onRender(state);
      lastRenderTime = now;
    }

    // Autosave
    const saveDelta = now - lastSaveTime;
    if (saveDelta >= BALANCE.AUTOSAVE_INTERVAL) {
      saveGame(state);
      lastSaveTime = now;
    }

    animationFrameId = requestAnimationFrame(loop);
  }

  return {
    start() {
      if (running) return;
      running = true;
      lastTickTime = Date.now();
      lastRenderTime = Date.now();
      lastSaveTime = Date.now();
      loop();
    },
    stop() {
      running = false;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    },
    getState() {
      return state;
    },
    setState(newState: GameState) {
      state = newState;
    },
    updateState(updater: (state: GameState) => GameState) {
      state = updater(state);
    },
  };
}

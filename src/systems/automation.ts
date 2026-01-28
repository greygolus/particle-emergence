/**
 * Automation System
 */

import { GameState } from '../types';
import { BALANCE } from '../config/balance';

export type AutomationModuleId =
  | 'autoHarvester'
  | 'autoCollider'
  | 'autoPolarity'
  | 'autoAnnihilate'
  | 'autoAssembly'
  | 'autoAtom'
  | 'autoFusion'
  | 'autoDecay';

export interface AutomationModuleDef {
  id: AutomationModuleId;
  name: string;
  description: string;
  baseCost: number;
  costScale: number;
  requiredLevel: number;
}

export const AUTOMATION_MODULES: AutomationModuleDef[] = [
  {
    id: 'autoHarvester',
    name: 'Auto Harvester Upgrades',
    description: 'Automatically purchases harvester upgrades',
    baseCost: BALANCE.automation.modules.autoHarvester.baseCost,
    costScale: BALANCE.automation.modules.autoHarvester.costScale,
    requiredLevel: 4,
  },
  {
    id: 'autoCollider',
    name: 'Auto Collider',
    description: 'Automatically runs collider with chosen settings',
    baseCost: BALANCE.automation.modules.autoCollider.baseCost,
    costScale: BALANCE.automation.modules.autoCollider.costScale,
    requiredLevel: 4,
  },
  {
    id: 'autoPolarity',
    name: 'Auto Polarity Switch',
    description: 'Automatically switches harvester polarity to maintain ratios',
    baseCost: BALANCE.automation.modules.autoPolarity.baseCost,
    costScale: BALANCE.automation.modules.autoPolarity.costScale,
    requiredLevel: 4,
  },
  {
    id: 'autoAnnihilate',
    name: 'Auto Annihilation',
    description: 'Automatically annihilates matter/antimatter pairs',
    baseCost: BALANCE.automation.modules.autoAnnihilate.baseCost,
    costScale: BALANCE.automation.modules.autoAnnihilate.costScale,
    requiredLevel: 4,
  },
  {
    id: 'autoAssembly',
    name: 'Auto Assembly',
    description: 'Automatically builds protons and neutrons',
    baseCost: BALANCE.automation.modules.autoAssembly.baseCost,
    costScale: BALANCE.automation.modules.autoAssembly.costScale,
    requiredLevel: 5,
  },
  {
    id: 'autoAtom',
    name: 'Auto Atom Builder',
    description: 'Automatically builds atom units',
    baseCost: BALANCE.automation.modules.autoAtom.baseCost,
    costScale: BALANCE.automation.modules.autoAtom.costScale,
    requiredLevel: 6,
  },
  {
    id: 'autoFusion',
    name: 'Auto Fusion',
    description: 'Automatically queues element fusion',
    baseCost: BALANCE.automation.modules.autoFusion.baseCost,
    costScale: BALANCE.automation.modules.autoFusion.costScale,
    requiredLevel: 6,
  },
  {
    id: 'autoDecay',
    name: 'Auto Decay',
    description: 'Automatically uses decay to unlock elements',
    baseCost: BALANCE.automation.modules.autoDecay.baseCost,
    costScale: BALANCE.automation.modules.autoDecay.costScale,
    requiredLevel: 6,
  },
];

export function getModuleCost(module: AutomationModuleDef, level: number): number {
  return Math.ceil(module.baseCost * Math.pow(module.costScale, level));
}

export function canMintChips(state: GameState, count: number = 1): boolean {
  if (state.currentEmergentLevel < 4) return false;
  return state.energy >= BALANCE.automation.chipCost * count;
}

export function mintChips(state: GameState, count: number = 1): GameState {
  if (!canMintChips(state, count)) return state;

  return {
    ...state,
    energy: state.energy - BALANCE.automation.chipCost * count,
    automation: {
      ...state.automation,
      chips: state.automation.chips + count,
    },
  };
}

export function canUnlockModule(state: GameState, moduleId: AutomationModuleId): boolean {
  const module = AUTOMATION_MODULES.find(m => m.id === moduleId);
  if (!module) return false;

  if (state.currentEmergentLevel < module.requiredLevel) return false;
  if (state.automation[moduleId].unlocked) return false;

  const cost = getModuleCost(module, 0);
  return state.automation.chips >= cost;
}

export function unlockModule(state: GameState, moduleId: AutomationModuleId): GameState {
  if (!canUnlockModule(state, moduleId)) return state;

  const module = AUTOMATION_MODULES.find(m => m.id === moduleId)!;
  const cost = getModuleCost(module, 0);

  return {
    ...state,
    automation: {
      ...state.automation,
      chips: state.automation.chips - cost,
      [moduleId]: {
        ...state.automation[moduleId],
        unlocked: true,
        level: 1,
      },
    },
  };
}

export function canUpgradeModule(state: GameState, moduleId: AutomationModuleId): boolean {
  const module = AUTOMATION_MODULES.find(m => m.id === moduleId);
  if (!module) return false;

  if (!state.automation[moduleId].unlocked) return false;

  const cost = getModuleCost(module, state.automation[moduleId].level);
  return state.automation.chips >= cost;
}

export function upgradeModule(state: GameState, moduleId: AutomationModuleId): GameState {
  if (!canUpgradeModule(state, moduleId)) return state;

  const module = AUTOMATION_MODULES.find(m => m.id === moduleId)!;
  const currentLevel = state.automation[moduleId].level;
  const cost = getModuleCost(module, currentLevel);

  return {
    ...state,
    automation: {
      ...state.automation,
      chips: state.automation.chips - cost,
      [moduleId]: {
        ...state.automation[moduleId],
        level: currentLevel + 1,
      },
    },
  };
}

export function toggleModule(state: GameState, moduleId: AutomationModuleId): GameState {
  if (!state.automation[moduleId].unlocked) return state;

  return {
    ...state,
    automation: {
      ...state.automation,
      [moduleId]: {
        ...state.automation[moduleId],
        enabled: !state.automation[moduleId].enabled,
      },
    },
  };
}

export function updateModuleSettings(
  state: GameState,
  moduleId: AutomationModuleId,
  settings: Record<string, unknown>
): GameState {
  return {
    ...state,
    automation: {
      ...state.automation,
      [moduleId]: {
        ...state.automation[moduleId],
        settings: {
          ...state.automation[moduleId].settings,
          ...settings,
        },
      },
    },
  };
}

export function getMaxChipsMintable(state: GameState): number {
  return Math.floor(state.energy / BALANCE.automation.chipCost);
}

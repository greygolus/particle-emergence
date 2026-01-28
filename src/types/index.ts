/**
 * Core Type Definitions for Particle Emergence
 */

// Emergent Levels
export type EmergentLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// Tab IDs
export type TabId =
  | 'lab'
  | 'assembly'
  | 'periodic-table'
  | 'forces'
  | 'automation'
  | 'emerge'
  | 'stats';

// Buy modes
export type BuyMode = 'x1' | 'x10' | 'xMax';

// Particle types
export type MatterParticle =
  | 'u' | 'd'           // Tier 1 quarks
  | 'e-' | 've'         // Tier 1 leptons
  | 's' | 'c'           // Tier 2 quarks
  | 'mu-' | 'vmu'       // Tier 2 leptons
  | 'b' | 't'           // Tier 3 quarks
  | 'tau-' | 'vtau';    // Tier 3 leptons

export type AntimatterParticle =
  | 'u_bar' | 'd_bar'
  | 'e+' | 've_bar'
  | 's_bar' | 'c_bar'
  | 'mu+' | 'vmu_bar'
  | 'b_bar' | 't_bar'
  | 'tau+' | 'vtau_bar';

export type CatalystParticle = 'photon' | 'gluon';

export type CompositeParticle = 'proton' | 'neutron';

export type BosonParticle = 'W+' | 'W-' | 'Z0' | 'higgs';

// Collider modes
export type ColliderMode = 'quark' | 'lepton';
export type ColliderTier = 2 | 3;
export type ColliderMatterMode = 'matter' | 'antimatter';

// Harvester polarity
export type HarvesterPolarity = 'matter' | 'antimatter';

// Particle Inventories
export interface ParticleInventory {
  // Tier 1
  u: number;
  d: number;
  'e-': number;
  ve: number;

  // Tier 2
  s: number;
  c: number;
  'mu-': number;
  vmu: number;

  // Tier 3
  b: number;
  t: number;
  'tau-': number;
  vtau: number;
}

export interface AntimatterInventory {
  u_bar: number;
  d_bar: number;
  'e+': number;
  ve_bar: number;
  s_bar: number;
  c_bar: number;
  'mu+': number;
  vmu_bar: number;
  b_bar: number;
  t_bar: number;
  'tau+': number;
  vtau_bar: number;
}

export interface CatalystInventory {
  photon: number;
  gluon: number;
}

export interface CompositeInventory {
  proton: number;
  neutron: number;
}

export interface BosonInventory {
  'W+': number;
  'W-': number;
  Z0: number;
  higgs: number;
}

// Upgrade levels
export interface QuarkHarvesterUpgrades {
  quarkRate: number;
  quarkEfficiency: number;
}

export interface LeptonHarvesterUpgrades {
  leptonRate: number;
  precision: number;
}

export interface ColliderUpgrades {
  tier3Unlocked: boolean;
  catalystSlots: number;
  gluonBoost: number;
  photonBoost: number;
  bosonModeUnlocked: boolean;
}

export interface AssemblyUpgrades {
  stability: number;
  gluonCatalyst: boolean;
}

export interface AtomUpgrades {
  electronEfficiency: number;
}

// Automation module
export interface AutomationModule {
  unlocked: boolean;
  enabled: boolean;
  level: number;
  settings: Record<string, unknown>;
}

export interface AutomationState {
  chips: number;
  autoHarvester: AutomationModule;
  autoCollider: AutomationModule;
  autoPolarity: AutomationModule;
  autoAnnihilate: AutomationModule;
  autoAssembly: AutomationModule;
  autoAtom: AutomationModule;
  autoFusion: AutomationModule;
  autoDecay: AutomationModule;
}

// Periodic Table Element
export interface Element {
  z: number;
  symbol: string;
  name: string;
  unlocked: boolean;
  fusionProgress: number; // 0-1
  fusionStartTime: number | null;
}

// Decay chain
export interface DecayChain {
  id: string;
  fromZ: number;
  toZ: number;
  bosonType: BosonParticle;
  energyCost: number;
  progress: number;
}

// Lead Sample for decay
export interface LeadSample {
  crafted: boolean;
  durability: number;
  maxDurability: number;
}

// Collider state
export interface ColliderState {
  tier: ColliderTier;
  mode: ColliderMode;
  matterMode: ColliderMatterMode;
  precisionSpend: number;
  pity: number;
  slottedPhotons: number;
  slottedGluons: number;
  isBosonMode: boolean;
  cooldown: number;
}

// Harvester state
export interface HarvesterState {
  quarkPolarity: HarvesterPolarity;
  leptonPolarity: HarvesterPolarity;
  quarkSwitchCooldown: number;
  leptonSwitchCooldown: number;
}

// Temporary buffs
export interface TempBuffs {
  colliderOverdrive: {
    active: boolean;
    endTime: number;
  };
}

// Stats tracking
export interface Stats {
  totalPqEarned: number;
  totalPlEarned: number;
  totalEnergyProduced: number;
  totalColliderRuns: number;
  totalUpgradeSuccesses: number;
  totalExoticEvents: number;
  totalEmerges: number;
  totalAnnihilations: number;
  totalProtonsBuilt: number;
  totalNeutronsBuilt: number;
  totalAtomsBuilt: number;
  elementsUnlocked: number;
  playTime: number;
  sessionStart: number;
}

// Main Game State
export interface GameState {
  version: number;
  lastSave: number;
  lastTick: number;

  // Currencies
  pq: number;
  pl: number;
  energy: number;

  // Debris (from collider)
  debris: number;

  // Atom units
  atomUnits: number;

  // Emergent level progression
  currentEmergentLevel: EmergentLevel;
  highestEmergentLevel: EmergentLevel;

  // Inventories
  matter: ParticleInventory;
  antimatter: AntimatterInventory;
  catalysts: CatalystInventory;
  composites: CompositeInventory;
  bosons: BosonInventory;

  // Upgrade levels (reset on emerge)
  quarkUpgrades: QuarkHarvesterUpgrades;
  leptonUpgrades: LeptonHarvesterUpgrades;
  colliderUpgrades: ColliderUpgrades;
  assemblyUpgrades: AssemblyUpgrades;
  atomUpgrades: AtomUpgrades;

  // Permanent upgrades (persist across emerges)
  permanentUpgrades: {
    // Add permanent upgrade flags here
  };

  // Harvester state
  harvesters: HarvesterState;

  // Collider state
  collider: ColliderState;

  // Automation (persists across emerges once bought)
  automation: AutomationState;

  // Periodic Table (persists after permanent unlock)
  periodicTableUnlocked: boolean;
  elements: Element[];
  leadSample: LeadSample;
  activeFusion: { z: number; startTime: number } | null;
  activeDecay: DecayChain | null;

  // Forces tab unlocked
  forcesUnlocked: boolean;

  // Temp buffs (reset on emerge)
  tempBuffs: TempBuffs;

  // Stats
  stats: Stats;

  // UI state
  currentTab: TabId;
  buyMode: BuyMode;
}

// Collider run result
export interface ColliderRunResult {
  success: boolean;
  particles: Partial<ParticleInventory | AntimatterInventory>;
  photonDrop: number;
  gluonDrop: number;
  debrisDrop: number;
  exoticEvent: ExoticEventResult | null;
  pityGained: number;
  pityTriggered: boolean;
  energyGained: number;
}

export interface ExoticEventResult {
  type: 'guaranteedUpgrade' | 'catalystJackpot' | 'overdrive' | 'bosonDrop';
  rewards: {
    photons?: number;
    gluons?: number;
    particles?: Partial<ParticleInventory>;
    bosons?: Partial<BosonInventory>;
  };
}

// Save data (for versioning)
export interface SaveData {
  version: number;
  state: GameState;
}

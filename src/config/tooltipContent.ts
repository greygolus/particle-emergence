/**
 * Tooltip Content Definitions
 * Contains all text content for particle tooltips and machine info buttons
 */

export interface ParticleTooltipData {
  symbol: string;
  fullName: string;
  tier: 1 | 2 | 3 | null;
  category: 'quark' | 'lepton' | 'antiquark' | 'antilepton' | 'catalyst' | 'composite' | 'boson';
  description: string;
  usedFor: string;
}

export interface MachineInfoData {
  title: string;
  description: string;
  mechanics: string[];
  tips?: string[];
}

// ==========================================
// PARTICLE TOOLTIPS
// ==========================================

export const PARTICLE_TOOLTIPS: Record<string, ParticleTooltipData> = {
  // === TIER 1 QUARKS ===
  u: {
    symbol: 'u',
    fullName: 'Up Quark',
    tier: 1,
    category: 'quark',
    description: 'The lightest quark. Two up quarks and one down quark form a proton.',
    usedFor: 'Building protons (2u + 1d + gluon) and neutrons (1u + 2d + gluon). Generates Pq currency.',
  },
  d: {
    symbol: 'd',
    fullName: 'Down Quark',
    tier: 1,
    category: 'quark',
    description: 'The second lightest quark. Two down quarks and one up quark form a neutron.',
    usedFor: 'Building protons (2u + 1d + gluon) and neutrons (1u + 2d + gluon). Generates Pq currency.',
  },

  // === TIER 1 LEPTONS ===
  'e-': {
    symbol: 'e⁻',
    fullName: 'Electron',
    tier: 1,
    category: 'lepton',
    description: 'The lightest charged lepton. Orbits atomic nuclei to form atoms.',
    usedFor: 'Building atom units. Annihilation with positrons yields energy and photons.',
  },
  've': {
    symbol: 'νe',
    fullName: 'Electron Neutrino',
    tier: 1,
    category: 'lepton',
    description: 'A nearly massless particle. Produced in nuclear reactions.',
    usedFor: 'Generates Pl currency. Can be annihilated with anti-neutrinos.',
  },

  // === TIER 2 QUARKS ===
  s: {
    symbol: 's',
    fullName: 'Strange Quark',
    tier: 2,
    category: 'quark',
    description: 'A heavier quark found in exotic particles. Upgraded from T1 quarks via the collider.',
    usedFor: 'Annihilation yields 2x energy and photons plus 15% gluon chance. Required for T3 unlock.',
  },
  c: {
    symbol: 'c',
    fullName: 'Charm Quark',
    tier: 2,
    category: 'quark',
    description: 'A heavy quark discovered in 1974. Upgraded from T1 quarks via the collider.',
    usedFor: 'Annihilation yields 2x energy and photons plus 15% gluon chance. Required for T3 unlock.',
  },

  // === TIER 2 LEPTONS ===
  'μ-': {
    symbol: 'μ⁻',
    fullName: 'Muon',
    tier: 2,
    category: 'lepton',
    description: 'A heavier cousin of the electron. Unstable, decays in microseconds.',
    usedFor: 'Annihilation yields 2x energy and photons plus 15% gluon chance. Required for T3 unlock.',
  },
  'vμ': {
    symbol: 'νμ',
    fullName: 'Muon Neutrino',
    tier: 2,
    category: 'lepton',
    description: 'The neutrino associated with muons. Produced in pion decay.',
    usedFor: 'Annihilation yields 2x energy and photons plus 15% gluon chance. Required for T3 unlock.',
  },

  // === TIER 3 QUARKS ===
  b: {
    symbol: 'b',
    fullName: 'Bottom Quark',
    tier: 3,
    category: 'quark',
    description: 'A very heavy quark. Third generation of matter.',
    usedFor: 'Annihilation yields 5x energy and photons plus 25% gluon chance.',
  },
  t: {
    symbol: 't',
    fullName: 'Top Quark',
    tier: 3,
    category: 'quark',
    description: 'The heaviest known quark. Mass similar to a gold atom.',
    usedFor: 'Annihilation yields 5x energy and photons plus 25% gluon chance.',
  },

  // === TIER 3 LEPTONS ===
  'τ-': {
    symbol: 'τ⁻',
    fullName: 'Tau',
    tier: 3,
    category: 'lepton',
    description: 'The heaviest lepton. Very short-lived, decays almost instantly.',
    usedFor: 'Annihilation yields 5x energy and photons plus 25% gluon chance.',
  },
  'vτ': {
    symbol: 'ντ',
    fullName: 'Tau Neutrino',
    tier: 3,
    category: 'lepton',
    description: 'The neutrino associated with taus. Last discovered Standard Model fermion.',
    usedFor: 'Annihilation yields 5x energy and photons plus 25% gluon chance.',
  },

  // === ANTIMATTER QUARKS ===
  'ū': {
    symbol: 'ū',
    fullName: 'Anti-Up Quark',
    tier: 1,
    category: 'antiquark',
    description: 'The antimatter counterpart of the up quark.',
    usedFor: 'Annihilate with up quarks for energy and photons.',
  },
  'd̄': {
    symbol: 'd̄',
    fullName: 'Anti-Down Quark',
    tier: 1,
    category: 'antiquark',
    description: 'The antimatter counterpart of the down quark.',
    usedFor: 'Annihilate with down quarks for energy and photons.',
  },
  's̄': {
    symbol: 's̄',
    fullName: 'Anti-Strange Quark',
    tier: 2,
    category: 'antiquark',
    description: 'The antimatter counterpart of the strange quark.',
    usedFor: 'Annihilate with strange quarks for 2x energy, photons, and gluon chance.',
  },
  'c̄': {
    symbol: 'c̄',
    fullName: 'Anti-Charm Quark',
    tier: 2,
    category: 'antiquark',
    description: 'The antimatter counterpart of the charm quark.',
    usedFor: 'Annihilate with charm quarks for 2x energy, photons, and gluon chance.',
  },
  'b̄': {
    symbol: 'b̄',
    fullName: 'Anti-Bottom Quark',
    tier: 3,
    category: 'antiquark',
    description: 'The antimatter counterpart of the bottom quark.',
    usedFor: 'Annihilate with bottom quarks for 5x energy, photons, and gluon chance.',
  },
  't̄': {
    symbol: 't̄',
    fullName: 'Anti-Top Quark',
    tier: 3,
    category: 'antiquark',
    description: 'The antimatter counterpart of the top quark.',
    usedFor: 'Annihilate with top quarks for 5x energy, photons, and gluon chance.',
  },

  // === ANTIMATTER LEPTONS ===
  'e+': {
    symbol: 'e⁺',
    fullName: 'Positron',
    tier: 1,
    category: 'antilepton',
    description: 'The antimatter counterpart of the electron. First antiparticle discovered.',
    usedFor: 'Annihilate with electrons for energy and photons.',
  },
  'v̄e': {
    symbol: 'ν̄e',
    fullName: 'Electron Anti-Neutrino',
    tier: 1,
    category: 'antilepton',
    description: 'The antimatter counterpart of the electron neutrino.',
    usedFor: 'Annihilate with electron neutrinos for energy.',
  },
  'μ+': {
    symbol: 'μ⁺',
    fullName: 'Anti-Muon',
    tier: 2,
    category: 'antilepton',
    description: 'The antimatter counterpart of the muon.',
    usedFor: 'Annihilate with muons for 2x energy, photons, and gluon chance.',
  },
  'v̄μ': {
    symbol: 'ν̄μ',
    fullName: 'Muon Anti-Neutrino',
    tier: 2,
    category: 'antilepton',
    description: 'The antimatter counterpart of the muon neutrino.',
    usedFor: 'Annihilate with muon neutrinos for 2x energy.',
  },
  'τ+': {
    symbol: 'τ⁺',
    fullName: 'Anti-Tau',
    tier: 3,
    category: 'antilepton',
    description: 'The antimatter counterpart of the tau.',
    usedFor: 'Annihilate with taus for 5x energy, photons, and gluon chance.',
  },
  'v̄τ': {
    symbol: 'ν̄τ',
    fullName: 'Tau Anti-Neutrino',
    tier: 3,
    category: 'antilepton',
    description: 'The antimatter counterpart of the tau neutrino.',
    usedFor: 'Annihilate with tau neutrinos for 5x energy.',
  },

  // === CATALYSTS ===
  photon: {
    symbol: 'γ',
    fullName: 'Photon',
    tier: null,
    category: 'catalyst',
    description: 'A quantum of light. Carries electromagnetic force.',
    usedFor: 'Collider slots (+2% success per slot). Required for element fusion. Gained from annihilation.',
  },
  gluon: {
    symbol: 'g',
    fullName: 'Gluon',
    tier: null,
    category: 'catalyst',
    description: 'Carries the strong nuclear force. Binds quarks together.',
    usedFor: 'Assembly recipes (1 per proton/neutron). Collider slots (+3% success). Gluon Catalyst upgrade can preserve them.',
  },

  // === COMPOSITES ===
  proton: {
    symbol: 'p⁺',
    fullName: 'Proton',
    tier: null,
    category: 'composite',
    description: 'Made of 2 up quarks and 1 down quark. Forms atomic nuclei.',
    usedFor: 'Building atom units. Determines the element (atomic number = proton count).',
  },
  neutron: {
    symbol: 'n⁰',
    fullName: 'Neutron',
    tier: null,
    category: 'composite',
    description: 'Made of 1 up quark and 2 down quarks. Stabilizes atomic nuclei.',
    usedFor: 'Building atom units. Provides nuclear stability.',
  },

  // === BOSONS ===
  'W+': {
    symbol: 'W⁺',
    fullName: 'W+ Boson',
    tier: null,
    category: 'boson',
    description: 'Positive weak force carrier. Mediates radioactive decay.',
    usedFor: 'Enables beta-plus decay processes. Boosts certain reactions.',
  },
  'W-': {
    symbol: 'W⁻',
    fullName: 'W- Boson',
    tier: null,
    category: 'boson',
    description: 'Negative weak force carrier. Mediates radioactive decay.',
    usedFor: 'Enables beta-minus decay processes. Boosts certain reactions.',
  },
  'Z0': {
    symbol: 'Z⁰',
    fullName: 'Z Boson',
    tier: null,
    category: 'boson',
    description: 'Neutral weak force carrier. Discovered at CERN in 1983.',
    usedFor: 'Provides stability bonuses to assembly. Enables neutral current interactions.',
  },
  higgs: {
    symbol: 'H',
    fullName: 'Higgs Boson',
    tier: null,
    category: 'boson',
    description: 'The "God particle". Gives other particles their mass.',
    usedFor: 'Provides powerful global bonuses. Ultimate particle achievement.',
  },
};

// ==========================================
// MACHINE INFO
// ==========================================

export const MACHINE_INFO: Record<string, MachineInfoData> = {
  quarkHarvester: {
    title: 'Quark Harvester',
    description: 'Extracts up and down quarks from quantum vacuum fluctuations.',
    mechanics: [
      'Passively produces u and d quarks over time',
      'Quarks are converted to Pq (Quark Points) currency',
      'At E4+, can switch polarity to harvest antiquarks instead',
    ],
    tips: [
      'Quark Rate upgrade: +25% production per level',
      'Quark Efficiency upgrade: +10% Pq conversion per level',
    ],
  },

  leptonHarvester: {
    title: 'Lepton Harvester',
    description: 'Captures electrons and electron neutrinos from particle interactions.',
    mechanics: [
      'Passively produces e⁻ and νe over time',
      'Leptons are converted to Pl (Lepton Points) currency',
      'Precision upgrade improves collider success chance',
      'At E4+, can switch polarity to harvest antileptons',
    ],
    tips: [
      'Lepton Rate upgrade: +25% production per level',
      'Precision upgrade: +1% collider success per level',
      'Electrons are needed later for building atoms',
    ],
  },

  collider: {
    title: 'Particle Collider',
    description: 'High-energy facility that upgrades particles to higher tiers through collision.',
    mechanics: [
      'T2 Mode: Upgrades T1 particles to T2 (strange, charm, muon, etc.)',
      'T3 Mode: Upgrades to T3 (bottom, top, tau) - requires 25 T2 particles',
      'Base success chance: 10% (T2) or 7% (T3)',
      'Precision Pl spend increases success chance per run',
      'Failed runs still yield some T1 particles',
    ],
    tips: [
      'Slot photons (+2% each) and gluons (+3% each) for bonus chance',
      'Debris can be exchanged for resources or pity progress',
      'Exotic events (1-1.5% chance) give powerful bonuses',
    ],
  },

  pity: {
    title: 'Pity System',
    description: 'Safety net that guarantees eventual collider success after repeated failures.',
    mechanics: [
      'Tracks consecutive failed collider runs',
      'T2 threshold: 20 failures (reduced by 0.5 per Pl spent)',
      'T3 threshold: 15 failures (fixed)',
      'Reaching threshold guarantees next run succeeds',
      'Pity counter resets after any successful upgrade',
    ],
    tips: [
      'Spending Pl on precision lowers your pity threshold',
      'Convert 10 debris to gain 1 pity point',
      'You can see current pity progress in the collider panel',
    ],
  },

  assembly: {
    title: 'Nucleon Assembly',
    description: 'Combines quarks and gluons to build protons and neutrons.',
    mechanics: [
      'Proton recipe: 2 up quarks + 1 down quark + 1 gluon',
      'Neutron recipe: 1 up quark + 2 down quarks + 1 gluon',
      'Stability determines success rate (base 50%)',
      'Failed assemblies waste the input particles',
    ],
    tips: [
      'Upgrade Stability to reduce waste (up to 95%)',
      'Gluon Catalyst upgrade: 30% chance to preserve gluons',
      'Z0 bosons provide stability bonuses',
    ],
  },

  annihilation: {
    title: 'Annihilation Chamber',
    description: 'Collides matter with antimatter to release pure energy.',
    mechanics: [
      'Requires matching matter-antimatter pairs (e.g., u + ū)',
      'T1 pairs yield: 0.5-1 energy + 0.5-1 photon',
      'T2 pairs yield: 2 energy + 1.5 photons + 15% gluon chance',
      'T3 pairs yield: 5 energy + 3 photons + 25% gluon chance',
    ],
    tips: [
      'Higher tier particles give much better rewards',
      'This is the main source of energy and photons',
      'Balance matter/antimatter production carefully',
    ],
  },

  atomBuilder: {
    title: 'Atom Builder',
    description: 'Constructs atom units from protons, neutrons, and electrons.',
    mechanics: [
      'Combines protons + neutrons + electrons into atom units',
      'Atom units are used in the Periodic Table for element fusion',
      'Each element requires specific numbers of each component',
    ],
  },

  periodicTable: {
    title: 'Periodic Table',
    description: 'Fuse atom units to discover and unlock chemical elements.',
    mechanics: [
      'Start with Hydrogen (1 proton, 0 neutrons, 1 electron)',
      'Each element requires more atom units and energy',
      'Unlocked elements persist through Emerge resets',
      'Higher elements require photons as catalysts',
    ],
    tips: [
      'Focus on unlocking elements in order',
      'Some elements enable decay chains for heavier elements',
    ],
  },

  forces: {
    title: 'Fundamental Forces',
    description: 'The Boson Collider produces force carrier particles.',
    mechanics: [
      'W+/W- bosons: Enable decay processes',
      'Z0 boson: Provides assembly stability bonus',
      'Higgs boson: Provides powerful global bonuses',
      'Requires high energy and particle investment',
    ],
  },

  debris: {
    title: 'Debris Exchange',
    description: 'Convert leftover debris from collider runs into useful resources.',
    mechanics: [
      'Debris drops from failed and successful collider runs',
      'Can exchange for Pq, Pl, or Energy',
      'Can contribute to pity counter (10 debris = 1 pity)',
    ],
  },
};

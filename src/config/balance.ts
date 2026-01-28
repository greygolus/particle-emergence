/**
 * Central Balance Configuration
 * All game numbers are tuned here for easy adjustment
 */

export const BALANCE = {
  // ===== GENERAL =====
  TICK_RATE: 20, // ticks per second
  UI_UPDATE_RATE: 10, // UI updates per second
  AUTOSAVE_INTERVAL: 15000, // 15 seconds
  OFFLINE_EFFICIENCY: 0.6, // 60% efficiency
  OFFLINE_CAP_HOURS: 8,

  // ===== CURRENCIES =====
  currencies: {
    startPq: 0,
    startPl: 0,
    startEnergy: 0,
  },

  // ===== E0: QUARK DOMAIN =====
  quarkHarvester: {
    baseURate: 1.0, // u quarks per second
    baseDRate: 1.0, // d quarks per second
    basePqFactor: 1.0,

    // Quark Rate upgrade
    quarkRateBonus: 0.25, // +25% per level
    quarkRateBaseCost: 10,
    quarkRateCostScale: 1.15,

    // Quark Efficiency upgrade
    quarkEfficiencyBonus: 0.10, // +10% per level
    quarkEfficiencyBaseCost: 25,
    quarkEfficiencyCostScale: 1.18,
  },

  // E0->E1 requirement (tuned for ~30 min)
  emerge1Requirement: {
    pq: 5000,
    uQuarks: 500,
    dQuarks: 500,
  },

  // ===== E1: LEPTON DOMAIN =====
  leptonHarvester: {
    baseERate: 0.15, // e- per second
    baseNuERate: 0.15, // νe per second
    basePlFactor: 1.0,

    // Lepton Rate upgrade
    leptonRateBonus: 0.25, // +25% per level
    leptonRateBaseCost: 8,
    leptonRateCostScale: 1.15,

    // Precision upgrade
    precisionBonus: 0.01, // +1% collider precision per level
    precisionBaseCost: 15,
    precisionCostScale: 1.20,
  },

  // Cross-synergy cap
  crossSynergyCap: 0.20, // 20% max boost

  // E1->E2 requirement
  emerge2Requirement: {
    pq: 25000,
    pl: 500,
    electrons: 100,
    neutrinos: 100,
  },

  // ===== E2: COLLIDER TIER 2 =====
  colliderT2: {
    baseCost: 100, // Pq cost
    maxPrecisionSpend: 10, // max Pl per run
    baseUpgradeChance: 0.10, // 10%
    precisionBonusPerPl: 0.003, // +0.3% per Pl

    // Bonus drop chances
    gluonDropChance: 0.06, // 6%
    photonDropChance: 0.08, // 8%
    debrisDropChance: 0.25, // 25%
    exoticEventChance: 0.01, // 1%

    // Pity system
    basePityThreshold: 20,
    pityReductionPerPl: 0.5, // threshold reduces by 0.5 per Pl spent

    // Failure yields
    failureBaseYield: 2, // base particles on fail
  },

  // E2->E3 requirement
  emerge3Requirement: {
    pq: 150000,
    pl: 2500,
    tier2Particles: 25, // s+c+μ+νμ total
  },

  // ===== E3: COLLIDER TIER 3 =====
  colliderT3: {
    baseCost: 1000, // Pq cost
    energyCost: 5,
    maxPrecisionSpend: 25,
    baseUpgradeChance: 0.07, // 7%
    precisionBonusPerPl: 0.002, // +0.2% per Pl (max +5%)

    // Enhanced drop chances
    gluonDropChance: 0.10,
    photonDropChance: 0.12,
    debrisDropChance: 0.30,
    exoticEventChance: 0.015,

    // Gate requirement
    tier2ParticleGate: 25,

    // Failure yields
    failureBaseYield: 3,
  },

  // Catalyst slots
  catalystSlots: {
    photonBoost: 0.02, // +2% per photon slotted
    gluonBoost: 0.03, // +3% per gluon slotted
    maxSlots: 5,
  },

  // E3->E4 requirement
  emerge4Requirement: {
    pq: 800000,
    pl: 15000,
    energy: 100,
    tier3Particles: 10,
  },

  // ===== E4: ANTIMATTER =====
  antimatter: {
    polaritySwitchCooldown: 10000, // 10 seconds in ms
    antimatterColliderChancePenalty: -0.02, // -2% upgrade chance
    antimatterEnergyBonus: 1.5, // 50% more energy from antimatter collider
  },

  // Annihilation yields
  annihilation: {
    electronPositron: { energy: 1.0, photons: 1.0 },
    quarkAntiquark: { energy: 0.5, photons: 0.5 },
    tier2Annihilation: { energy: 2.0, photons: 1.5, gluonChance: 0.15 },
    tier3Annihilation: { energy: 5.0, photons: 3.0, gluonChance: 0.25 },
  },

  // Automation
  automation: {
    chipCost: 10, // Energy per chip

    modules: {
      autoHarvester: { baseCost: 5, costScale: 1.5 },
      autoCollider: { baseCost: 10, costScale: 1.6 },
      autoPolarity: { baseCost: 15, costScale: 1.7 },
      autoAnnihilate: { baseCost: 20, costScale: 1.8 },
      autoAssembly: { baseCost: 30, costScale: 1.9 },
      autoAtom: { baseCost: 50, costScale: 2.0 },
      autoFusion: { baseCost: 75, costScale: 2.1 },
      autoDecay: { baseCost: 100, costScale: 2.2 },
    },
  },

  // E4->E5 requirement
  emerge5Requirement: {
    pq: 5000000,
    pl: 100000,
    energy: 500,
    antimatterParticles: 50,
  },

  // ===== E5: NUCLEON ASSEMBLY =====
  assembly: {
    protonRecipe: { u: 2, d: 1, gluons: 1 },
    neutronRecipe: { u: 1, d: 2, gluons: 1 },

    // Stability affects waste
    baseStability: 0.5, // 50% base efficiency
    stabilityBonus: 0.05, // +5% per stability upgrade level
    maxStability: 0.95,

    // Gluon catalyst upgrade
    gluonCatalystUnlockCost: 50000, // Pl cost
    catalyticGluonChance: 0.3, // 30% chance gluon not consumed
  },

  // E5->E6 requirement (20 min target - 1/3 faster)
  emerge6Requirement: {
    pq: 20000000,
    pl: 400000,
    energy: 2000,
    protons: 100,
    neutrons: 100,
  },

  // ===== E6: ATOM BUILDING =====
  atomBuilder: {
    baseProtonCost: 1,
    baseNeutronCost: 1,
    baseElectronCost: 1,
    minElectronCost: 0.4, // floor
    electronEfficiencyBonus: 0.05, // per Pl upgrade level

    // Periodic table unlock milestone
    atomUnlockMilestone: 250,
  },

  // Periodic Table
  periodicTable: {
    // Fusion formulas: time(Z) = baseTime * (timeScale^Z)
    fusionBaseTime: 5, // seconds
    fusionTimeScale: 1.18,

    // Atom cost: baseCost * (costScale^Z)
    fusionBaseCost: 10,
    fusionCostScale: 1.22,

    // Photon cost scales with Z
    fusionPhotonCost: (z: number) => Math.ceil(z * 0.5),
    fusionEnergyCost: (z: number) => Math.ceil(z * 2),

    // Fusion wall
    fusionWallZ: 56, // Iron - after this efficiency drops
    postWallEfficiencyDrop: 0.5, // 50% slower after wall
    maxFusionZ: 82, // Lead
  },

  // Decay system
  decay: {
    leadSampleCost: {
      energy: 100,
      photons: 50,
    },
    leadSampleDurability: 100,
    decayDurabilityCost: 1,
    decayEnergyCost: 10,
    decayBosonCost: 1,
  },

  // ===== E6: FORCES =====
  forces: {
    unlockElementCount: 10, // OR unlock Iron
    ironZ: 26,

    bosonCollider: {
      pqCost: 5000,
      plCost: 200,
      energyCost: 50,
      baseBosonChance: 0.20, // 20%
    },

    // Boson effects
    wBosonDecayBonus: 0.15, // +15% decay speed per W
    zBosonStabilityBonus: 0.05, // +5% stability per Z
    higgsEfficiencyBonus: 0.10, // +10% heavy fusion efficiency per Higgs
  },

  // ===== NUMBER FORMATTING =====
  formatting: {
    scientificThreshold: 1e6,
    decimalPlaces: 2,
  },

  // ===== EXOTIC EVENT WEIGHTS =====
  exoticEvents: {
    guaranteedUpgrade: 0.4,
    catalystJackpot: 0.35,
    overdrive: 0.25,

    overdriveMultiplier: 2,
    overdriveDuration: 30000, // 30 seconds

    jackpotPhotons: { min: 5, max: 10 },
    jackpotGluons: { min: 3, max: 6 },
  },

  // ===== DEBRIS EXCHANGE RATES =====
  debris: {
    pqExchangeRate: 0.1, // 10 debris = 1 Pq
    plExchangeRate: 0.05, // 20 debris = 1 Pl
    energyExchangeRate: 0.02, // 50 debris = 1 E
    pityContribution: 0.1, // 10 debris = 1 pity
  },
};

export type Balance = typeof BALANCE;

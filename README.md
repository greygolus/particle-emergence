# Particle Emergence

An incremental/idle game where you progress through emergent levels of particle physics, from quarks to a complete periodic table.

## Installation & Running

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

The game will be available at `http://localhost:5173` (or the port Vite assigns).

## Gameplay Overview

### Goal
Progress through Emergent Levels E0-E6, unlocking new particle types and systems along the way. The ultimate endgame goal is to complete the entire Periodic Table.

### Currencies
- **Pq (Quark Particles)**: Main currency generated from quark production
- **Pl (Lepton Particles)**: Secondary currency from lepton production
- **Energy**: Produced via antimatter annihilation, used for advanced operations

### Emergent Levels

| Level | Name | Unlocks |
|-------|------|---------|
| E0 | Quark Domain | Quark Harvester, u/d quarks, Pq generation |
| E1 | Lepton Domain | Lepton Harvester, e-/νe particles, Pl generation |
| E2 | Collider Tier 2 | Particle Collider, Tier 2 particles (s,c,μ,ν) |
| E3 | Collider Tier 3 | Tier 3 particles (b,t,τ,ντ), catalyst slots |
| E4 | Antimatter | Antimatter particles, polarity switching, Automation |
| E5 | Nucleon Assembly | Protons, Neutrons, Assembly mechanics |
| E6 | Atom Builder | Atom Units, Periodic Table, Forces (bosons) |

### Systems

#### Harvesters
Passively produce particles over time. Upgrade rates and efficiency.

#### Collider
RNG-based particle upgrade system. Spend resources for a chance to produce higher-tier particles.
- Precision spend increases success chance
- Pity system guarantees success after enough failures
- Exotic events provide special bonuses

#### Annihilation (E4+)
Convert matter+antimatter pairs into Energy and photons.

#### Assembly (E5+)
Combine quarks and gluons into protons and neutrons.

#### Atom Builder (E6)
Create Atom Units from protons, neutrons, and electrons.

#### Periodic Table (E6)
- **Fusion**: Unlock elements by spending Atom Units, photons, and energy
- **Decay**: Use Lead Samples and W bosons to unlock heavy elements

#### Forces (Late E6)
Collect bosons (W±, Z0, Higgs) to enhance various game mechanics.

#### Automation (E4+)
Purchase automation modules with chips (minted from Energy) to automate various tasks.

### Emerge (Reset)
Emerging resets most progress but unlocks new systems and retains:
- Highest Emergent Level reached
- Automation modules
- Periodic Table progress (after permanent unlock)
- Permanent upgrades

## Pacing Targets

Each Emergent Level is designed for approximately 30 minutes of active play:
- E0→E1: ~30 minutes
- E1→E2: ~30 minutes
- E2→E3: ~30 minutes
- E3→E4: ~30 minutes
- E4→E5: ~30 minutes
- E5→E6: ~20 minutes (faster)

Completing the Periodic Table is the long-term endgame goal, requiring multiple sessions.

## Balance Configuration

All game numbers are configured in `src/config/balance.ts`. Key sections:

### Harvester Rates
```typescript
quarkHarvester: {
  baseURate: 1.0,      // Starting u quark rate
  baseDRate: 1.0,      // Starting d quark rate
  quarkRateBonus: 0.25 // +25% per upgrade level
}
```

### Collider Settings
```typescript
colliderT2: {
  baseCost: 100,           // Pq cost per run
  baseUpgradeChance: 0.10, // 10% base success
  basePityThreshold: 20    // Pity triggers at 20 failures
}
```

### Emerge Requirements
```typescript
emerge1Requirement: {
  pq: 5000,     // Pq needed
  uQuarks: 500, // u quarks needed
  dQuarks: 500  // d quarks needed
}
```

Adjust these values to tune the game's pacing.

## Project Structure

```
src/
├── config/
│   ├── balance.ts    # All game numbers
│   └── elements.ts   # Periodic table data
├── core/
│   ├── state.ts      # State management, save/load
│   └── gameLoop.ts   # Main tick loop
├── systems/
│   ├── annihilation.ts
│   ├── assembly.ts
│   ├── atoms.ts
│   ├── automation.ts
│   ├── collider.ts
│   ├── debris.ts
│   ├── emerge.ts
│   └── upgrades.ts
├── types/
│   └── index.ts      # TypeScript interfaces
├── ui/
│   ├── renderer.ts   # Main UI renderer
│   └── tabs/         # Tab components
├── utils/
│   └── format.ts     # Number formatting
├── styles/
│   └── main.css      # Styles
└── main.ts           # Entry point
```

## Save System

- **Autosave**: Every 15 seconds
- **Manual Save**: Click "Save" in footer
- **Export/Import**: Base64-encoded save strings
- **Offline Progress**: 60% efficiency, up to 8 hours

## Technical Details

- Built with Vite + TypeScript
- Vanilla JS (no framework dependencies)
- Tick loop with delta time
- UI throttled to 10 FPS
- localStorage for persistence
- Save versioning with migration support

## License

MIT

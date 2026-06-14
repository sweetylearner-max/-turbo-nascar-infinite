# Turbo Nascar Infinite — Design

**Date:** 2026-06-11

## Problem

A single-HTML-file Three.js arcade racer with infinite escalating rounds, clicker-style meta
progression, kart selection, Mario Kart-style UI, procedural American chiptune, localStorage saves,
and headless balance tests proving the fresh-save skill spread (good player ~10 rounds, bad ~2).
Car feel and fun are the top priorities. The spec's hidden gap: nothing stops a player crawling
around the oval forever — survival needs a forcing function.

## Constraints

- One `index.html`, no build step; Three.js CDN module is the only external fetch.
- Balance must be provable headlessly via `bun test` against the same shipped code.
- Controls: arrows drive, Q/W/E/R/T abilities. Overspeed must punish via wall crashes.
- TypeScript (Bun) for all tooling; no Python, no YAML, no npm dependencies.

## Approaches Considered

1. **Curvilinear sim-core + THE PACK** — physics in track-space `(s = distance along centerline,
   d = lateral offset)`; pure `SimCore` script block; a pack of rivals sweeps the track behind the
   player at per-round compounding speed. Principles: Pure Functions (headless step), Single Source
   of Truth (one TUNING block), Data Drives Behavior (KARTS/UPGRADES/CONDITIONS/WEAPONS tables),
   Separation of Concerns (sim vs render shell). Tradeoff: spline-locked tracks; less familiar math.
2. **Free 2D world-space physics + lap-timer pacing** — conventional car physics with wall collision
   geometry; lap time limit forces pace. Same purity achievable, but 2D wall geometry is error-prone,
   pack/progress math needs path projection anyway, and a timer is less visceral than visible
   headlights closing in. More code for the same outcome.
3. **In-file micro-ECS** — generic entities/components/systems. Data-driven taken to the extreme,
   but introduces framework machinery a one-track racer never amortises (fails SIMPLE/YAGNI).

## Chosen Approach

Approach 1. The narrowing window between "too slow → pack eats you" and "too fast → wall" IS the
skill curve, guarantees eventual death (clicker loop needs death), and is tunable from one constant
pair (`packBase`, `packGrowth`) that the balance sim validates.

## Architecture

- `<script id="sim-core">` — pure, dependency-free: TUNING, track lookup table, fixed-step physics,
  traffic AI, pack, weapons, conditions, economy, save codec, parameterized driver bots,
  `simulateRun`. No DOM, no THREE. Exposed as `SimCore`; tests extract this block verbatim.
- `<script type="module">` — shell: Web Audio (chiptune sequencer, RPM-gear engine, SFX), THREE
  renderer (track ribbon from the same lookup table, karts, traffic, pack, particles, weather),
  input, UI state machine (title → kart → countdown → racing → death → garage), localStorage glue.
- `tests/*.test.ts` (Bun) — extraction loader + physics/balance/economy/save/determinism suites.
- Ability kit roles (each answers a distinct pressure): Rocket = burst traffic clear ahead,
  Guns = sustained clear, Mine = pack stall (rear pressure), Eagle = wide panic-button arc,
  Turbo = pack escape. Tiers escalate count/potency/duration.
- Economy: cost = base × growth^level (growth 1.55–1.8); FP = distance + superlinear round bonus +
  kills + drift style. Worst first death still affords ~2 upgrades (hook guarantee).

## Data Model

`meta` (persisted): `{ v, fp, upgrades: Record<id, level>, karts: string[], kart, bestRound,
deaths, muted }`. `state` (per run): `{ s, d, sTotal, rel, v, latV, hp, round, packTotal, packV,
traffic[], shots[], mines[], hazards[], time, dist, kills, rng, cause }`. All content tables
(KARTS, UPGRADES, CONDITIONS, WEAPONS, SONGS) are data, not branches.

## Error Handling

Corrupt/missing/foreign-version saves → fresh defaults (never throw). Audio context created on
first user gesture (autoplay policy). Frame spiral guarded (max sim steps per frame). WebGL
context loss → reload prompt.

## Testing Strategy

- **Unit (sim):** acceleration, corner-overspeed slide, wall damage, round increment, pack growth,
  determinism (same seed → same outcome), sim-core purity (source contains no DOM/THREE refs).
- **Balance (the contract):** seeded bot cohorts — fresh bad ≈ 2 rounds, fresh good ≈ 10, upgraded
  &gt; fresh, zero-throttle camper dies in round 1, fresh good bot cannot exceed round 16 (death is
  inevitable). `tests/report.ts` prints the tuning table.
- **Browser (agents):** QATester — load, console errors, gameplay screenshots; UIReviewer — menu
  flow story (title → kart → race → death → garage → buy).

## Principles Applied

- **Pure Functions for Testability** — entire game logic is a side-effect-free step function; the
  balance suite drives it at thousands of ticks per second.
- **Single Source of Truth** — one TUNING block; track lookup table shared by physics and renderer;
  tests extract the shipped script rather than a copy.
- **Data Drives Behavior** — karts, upgrades, weapons, round conditions, and songs are tables;
  adding content = adding rows.
- **Separation of Concerns** — sim computes, shell renders/sounds, UI is fn(state).
- **Deviations** — single large file violates File Organization by explicit user requirement
  (single-file deliverable is the point); internal section banners substitute for folders.

## Open Questions

- Q/W/E/R/T mapping order (assumed Rocket/Guns/Mine/Eagle/Turbo) — trivially remappable.
- Project may want a GitHub repo + Pages deploy like clank-lit — needs Ian's call.

# 🦅 TURBO NASCAR INFINITE

**▶ PLAY IT: https://saintpepsi.github.io/turbo-nascar-infinite/**

Single-file Three.js NASCAR roguelite. Outrun THE PACK behind you without overcooking the corners
ahead of you. Die. Bank Freedom Points. Buy absurd upgrades. Go again, longer.

Every upgrade stacks **infinitely** with milestone breakpoints along the way — triple rockets at
LV 5, STAR SPANGLED invulnerable turbo at LV 10, the FREEDOM TRAIN at LV 15, EMINENT DOMAIN to
buy out the neighbours and grow the track itself. Past round 10 the difficulty goes exponential,
so every build dies eventually — the next milestone is always one more restart away. 425
achievements pay out along the whole curve.

## Run it

```bash
bun run serve   # → http://localhost:8923
```

(Or open `index.html` directly — Three.js loads from the jsDelivr CDN, the only external fetch.
For a fully **offline** single file, `bun build-dist.ts` writes `dist/index.html` with Three.js
bundled in — that's what the share zip contains, alongside the player-facing `README.txt`.)

## Controls

| Key | Action |
|---|---|
| ↑ / ↓ | accelerate / brake (hold for reverse) |
| ← / → | steer |
| Q | Rockets · W | Freedom Guns · E | Liberty Mines (stalls the pack) · R | Eagle Strike · T | Nitro USA |
| M | mute · ESC | pause |

## The loop

Every lap is a round. Each round the pack behind you gets faster and the world gets worse —
traffic, oil, night, rain, road rage, wind, meteors, then it stops pretending
("ROUND 14: EVERYTHING IS ON FIRE"). Too slow and the pack eats you; too fast and the wall does.
Deaths pay Freedom Points → Garage upgrades (geometric costs, clicker-style) → longer runs.
Five karts, localStorage saves, procedural chiptune (Camptown Races / Yankee Doodle / Battle Hymn —
public domain, see [Wikipedia: Camptown Races](https://en.wikipedia.org/wiki/Camptown_Races)) and
an engine note with actual gear steps.

## Balance is tested, not vibed

The entire simulation lives in a pure `<script id="sim-core">` block (no DOM, no THREE).
`tests/` extracts it verbatim and drives parameterized driver bots through seeded runs
(`bun test`, 64 tests; `bun run balance` prints the table):

| cohort | mean rounds | top cause |
|---|---|---|
| camper (parked) | 1.0 | pack 10/10 |
| bad player, fresh save | **2.1** | pack |
| good player, fresh save | **8.6** | traffic |
| bad player, +800 FP | 4.9 | pack |
| good player, +800 FP | 10.3 | traffic |
| good player, +2000 FP | 12.4 | traffic |

Spec said "good player survives 10 rounds, bad player 2" — that's the contract the suite enforces.
The idle contract is tested too: a bot handed **50,000 FP** of upgrades still dies by round 22
(exponential difficulty always outruns geometric upgrades — no immortal builds).

## Credits

- **Rohan** — AI Trailblazer
- **Luke** — AI Sherrif
- **Nick** — AI Connosouir (first playtester; the turkeys were his idea)
- **Ian** — gave the orders
- **Claude** — everything else

## Docs

Design rationale: `docs/plans/2026-06-11-turbo-nascar-infinite-design.md`.

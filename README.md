# 🦅 TURBO NASCAR INFINITE
**▶ PLAY IT: https://sweetylearner-max.github.io/-turbo-nascar-infinite/**

Single-file Three.js NASCAR roguelite. Outrun THE PACK behind you without overcooking the corners
ahead of you. Die. Bank Freedom Points. Buy absurd upgrades. Go again, longer.

Every upgrade stacks **infinitely** with milestone breakpoints along the way — triple rockets at
LV 5, STAR SPANGLED invulnerable turbo at LV 10, the FREEDOM TRAIN at LV 15, EMINENT DOMAIN to
buy out the neighbours and grow the track itself. Past round 10 the difficulty goes exponential,
so every build dies eventually — the next milestone is always one more restart away. 425
achievements pay out along the whole curve.

---

## 🎮 How to Play

### 🏁 The Goal
You're a NASCAR driver trying to **outrun THE PACK** — a wave of aggressive AI cars chasing you from behind. Every lap is one round. Survive as many rounds as you can, earn Freedom Points, and spend them on wild upgrades in the Garage.

---

### 🕹️ Controls

| Key | Action |
|---|---|
| ↑ | Accelerate |
| ↓ | Brake / Reverse (hold) |
| ← / → | Steer left / right |
| **Q** | 🚀 Rockets — blast cars out of your way |
| **W** | 🔫 Freedom Guns — rapid-fire forward attack |
| **E** | 💣 Liberty Mines — drop behind you to stall the pack |
| **R** | 🦅 Eagle Strike — powerful area attack |
| **T** | ⚡ Nitro USA — burst of speed |
| **M** | 🔇 Mute music |
| **ESC** | ⏸ Pause |

---

### 🔄 The Game Loop

1. **Race** — Each lap = 1 round. Don't let the pack catch you, don't crash into the wall.
2. **Die** — You *will* die. That's fine. Deaths earn you **Freedom Points (FP)**.
3. **Upgrade** — Spend FP in the **Garage** on powerful upgrades (costs scale up each time).
4. **Go again** — Start a new run with your upgrades carrying over. Survive longer this time.

The loop is like a clicker/roguelite: every run gets you a little further as your upgrades stack up.

---

### ⚠️ The Two Ways to Die

| Threat | Description |
|---|---|
| **THE PACK** | AI cars behind you — too slow and they eat you |
| **THE WALL** | Go too fast into a corner and you'll slam the wall |

**The trick:** balance speed. Too slow = pack kills you. Too fast = wall kills you.

---

### 🌍 How the World Gets Harder

Each round adds new chaos on top of the previous ones:

| Round | New Hazard |
|---|---|
| Early | Traffic cars on track |
| Mid | Oil slicks, night mode, rain |
| Later | Road rage drivers, wind, meteors |
| Round 14+ | **"EVERYTHING IS ON FIRE"** — all hazards at once |

The pack also gets faster every round. Past Round 10, difficulty goes **exponential** — no build survives forever by design.

---

### 🏪 The Garage (Upgrades)

Spend **Freedom Points** between runs on upgrades. Each upgrade stacks infinitely, with special milestone unlocks:

| Level | Milestone Unlock |
|---|---|
| LV 5 | Triple Rockets |
| LV 10 | ⭐ STAR SPANGLED — invulnerable turbo mode |
| LV 15 | 🚂 FREEDOM TRAIN — chain cars behind you |
| LV 20+ | 🏡 EMINENT DOMAIN — buy the neighbours' land and grow the track itself |

Costs scale **geometrically** (clicker-style), so early upgrades are cheap but later ones require many runs.

---

### 🏆 Achievements

There are **425 achievements** spread across the entire difficulty curve — from your very first crash to surviving deep into exponential hell. Every run, no matter how short, is making progress toward something.

---

### 🚗 Five Karts

You have **5 kart slots** to choose from, each with its own save. Try different builds across karts!

Progress is saved automatically via **localStorage** in your browser.

---

### 🎵 Music

Procedural chiptune based on public domain American classics:
- Camptown Races
- Yankee Doodle
- Battle Hymn of the Republic

Engine sounds have actual gear steps — listen for the shift as you accelerate!

---

### 💡 Tips for New Players

- **Don't panic-brake** — smooth steering beats hard braking on corners.
- **Use Liberty Mines (E)** early — they're free and stall the pack.
- **Spend FP every run** — even small upgrades add up fast.
- **Die on purpose early** — farming FP on short runs is faster than grinding long ones.
- **Nitro USA (T) into straights, not corners** — obvious, but easy to forget.

---

## Run it

```bash
bun run serve   # → http://localhost:8923
```

Or open `index.html` directly — Three.js loads from the jsDelivr CDN, the only external fetch.
For a fully **offline** single file, `bun build-dist.ts` writes `dist/index.html` with Three.js
bundled in — that's what the share zip contains, alongside the player-facing `README.txt`.

---

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

---


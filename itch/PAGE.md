# itch.io page kit — TURBO NASCAR INFINITE

Everything needed to set up the itch.io page so it matches the game's look.
Palette source: the `:root` CSS variables in `index.html`
(`--navy:#0b1c4d --navy2:#060f2e --red:#d62828 --gold:#ffd24a --white:#f6f7fb --green:#3ddc68`).

## Theme (Edit theme → Color / Text / Layout)

| itch.io field | value | why |
|---|---|---|
| BG | `#060f2e` | game's night-sky base (`--navy2`) |
| BG 2 | `#0b1c4d` | game's panel navy (`--navy`) |
| Text | `#f6f7fb` | game's UI white (`--white`) |
| Link | `#ffd24a` | game's gold accent (`--gold`) — replaces itch default `#fa5c5c` |
| Button (if shown under More options) | `#d62828` | game's NASCAR red (`--red`) |
| Font | **Lato** | itch's font list has no Arial Black; Lato is the cleanest neutral under our headings |
| Size | **Large** | matches the game's chunky UI |
| Screenshots | **Auto** | sidebar strip works with the dark theme |

## Images (Edit theme → Images)

Generated, exact-size, on-palette — regenerate any time with `bun itch/generate.ts`
(templates in `itch/src/`):

| itch.io slot | file |
|---|---|
| Cover image (game grid/social) | `cover-630x500.png` |
| Banner (replaces page title) | `banner-960x320.png` |
| Background | `background-1920x1080.png` |
| Embed BG (behind the game frame) | `embed-bg-1280x800.png` — or just set the color `#060f2e` |

**Cover image** — itch: *"used whenever itch.io wants to link to your project from another part
of the site. Required (Minimum: 315x250, Recommended: 630x500)"*. `cover-630x500.png` is exactly
the recommended size.

## Gameplay video or trailer

itch wants a **YouTube or Vimeo link** (it can't host the file). Ready-made footage:
`trailer-60s.webm` — ~58s of real chase-cam gameplay: title → countdown → rockets/guns/turbo
through NIGHT SHIFT → ends on the WRECKED! screen with the trophy cascade.

1. Upload `trailer-60s.webm` to YouTube (visibility **Unlisted** is fine for itch embedding)
2. Paste the watch URL into the *Gameplay video or trailer* field

Regenerate anytime with `bun itch/record-trailer.ts` (needs `bun run serve`; longer cut: bump
`DRIVE_MS`). It's silent because headless capture has no audio — YouTube's editor can lay music
over it, or leave it mute; itch autoplays trailers muted anyway.

## Screenshots to upload

itch: *"Optional but highly recommended. Upload 3 to 5 for best results."* Upload these 4 from
`shots/`, in this order (regenerate with `bun tests/smoke.ts` and `bun tests/bigtrack-check.ts`):

1. `file-gameplay.png` — racing, lead with action
2. `file-garage.png` — the upgrade/milestone hook
3. `bigtrack-run.png` — EMINENT DOMAIN long track
4. `file-title.png` — title screen

## Upload & embed settings

- **Kind of project:** HTML — *"This file will be played in the browser"*
- **File:** `turbo-nascar-infinite.zip` (already contains `index.html` at the zip root, self-contained, no CDN)
- **Embed size:** 1280 × 800 · enable **fullscreen button** · mobile friendly **off** (keyboard game)
- **Pricing:** free / no payments
- **Classification:** Game → Racing · also tag: roguelite, idle, incremental, arcade, 3d, singleplayer, browser
- **Description — paste this:**

---

🦅 **TURBO NASCAR INFINITE** 🦅

Outrun THE PACK behind you without overcooking the corners ahead of you.
Die. Bank Freedom Points. Buy absurd upgrades. Go again, longer.

- **Every upgrade stacks forever.** Weapons hit milestones on the way up — triple rockets at LV 5, STAR SPANGLED invulnerable turbo at LV 10, the FREEDOM TRAIN at LV 15.
- **EMINENT DOMAIN:** buy the land around the track. The track physically grows; a lap still pays out at the same distance.
- **Past round 10 the world ramps exponentially.** Every build dies. The next milestone is always one more restart away.
- 425 achievements, 5 karts, turkeys, meteors, procedural chiptune, and a first death worth exactly 100 FP.

⌨️ Arrows drive · Q W E R T fire the Constitution · M mute · ESC pause

Source: https://github.com/SaintPepsi/turbo-nascar-infinite
Also playable at: https://saintpepsi.github.io/turbo-nascar-infinite/

---

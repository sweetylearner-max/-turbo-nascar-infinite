// Records real chase-cam gameplay for the itch.io trailer slot: seeds a save
// with weapons unlocked, starts a run, and drives it with scripted keys
// (throttle duty-cycle for the corners, abilities on a rota).
// Output: itch/trailer-60s.webm (silent — headless capture has no audio).
// Run: bun itch/record-trailer.ts  (needs `bun run serve` on :8923 for the save seed)
import { chromium } from "playwright-core";
import { rename } from "node:fs/promises";

const W = 1280, H = 800;
const DRIVE_MS = 52_000;
const outPath = new URL("trailer-60s.webm", import.meta.url).pathname;
const target = "http://localhost:8923/";
await fetch(target, { method: "HEAD" }); // fail fast if the server is down

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  recordVideo: { dir: new URL(".", import.meta.url).pathname, size: { width: W, height: H } },
});
const page = await ctx.newPage();
await page.goto(target, { waitUntil: "load" });
await page.evaluate(() => {
  localStorage.setItem("tni_save_v1", JSON.stringify({
    v: 2, fp: 250, upgrades: { engine: 4, tires: 6, armor: 6, accel: 3, qual: 2, wrocket: 6, wgun: 10, wmine: 4, weagle: 5, wturbo: 10 },
    karts: ["patriot", "lightning"], kart: "lightning", bestRound: 7, deaths: 12, muted: true, stats: {}, ach: {},
  }));
});
await page.reload({ waitUntil: "load" });
await page.waitForTimeout(1800);                  // title beat
await page.keyboard.press("Enter");
await page.waitForTimeout(900);                   // kart select beat
await page.keyboard.press("Enter");
await page.waitForTimeout(3400);                  // countdown

console.log(`recording ~${Math.round(DRIVE_MS / 1000)}s of chase-cam gameplay …`);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const isDead = () => page.evaluate(() => !document.getElementById("death")?.classList.contains("hidden"));
const start = Date.now();
let beat = 0;
while (Date.now() - start < DRIVE_MS) {
  if (await isDead()) break;                                // end on the death screen, not past it
  // throttle duty-cycle: ~75% keeps speed under corner-slide threshold, with sparks
  await page.keyboard.down("ArrowUp");
  await sleep(750);
  await page.keyboard.up("ArrowUp");
  if (await isDead()) break;
  beat++;
  if (beat % 3 === 0) await page.keyboard.press("q");      // rockets
  if (beat % 4 === 1) {                                     // gun burst
    await page.keyboard.down("w"); await sleep(900); await page.keyboard.up("w");
  }
  if (beat % 11 === 5) await page.keyboard.press("t");      // STAR SPANGLED turbo
  if (beat % 12 === 7) await page.keyboard.press("e");      // mines for the pack
  if (beat % 20 === 9) await page.keyboard.press("r");      // eagle strike
  await sleep(250);
}
await sleep(4000);                                          // linger: WRECKED BY + trophies
const video = page.video();
await page.close();
await ctx.close();
await browser.close();
if (!video) { console.log("TRAILER: FAIL — no video handle"); process.exit(1); }
await rename(await video.path(), outPath);
const size = Bun.file(outPath).size;
console.log(`✓ trailer-60s.webm (${(size / 1e6).toFixed(1)} MB)`);
if (size < 500_000) { console.log("TRAILER: FAIL — file suspiciously small"); process.exit(1); }
console.log("TRAILER: PASS — upload to YouTube (unlisted works) and paste the link on itch");

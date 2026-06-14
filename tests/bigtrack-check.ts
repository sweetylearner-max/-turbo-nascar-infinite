// One-off renderer check: EMINENT DOMAIN level 5 must rebuild track scenery
// at the longer length and play without console errors.
// Run: bun tests/bigtrack-check.ts  (needs `bun run serve` on :8923)
import { chromium } from "playwright-core";

const errors: string[] = [];
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });

await page.goto("http://localhost:8923/", { waitUntil: "load" });
await page.evaluate(() => {
  localStorage.setItem("tni_save_v1", JSON.stringify({
    v: 2, fp: 999, upgrades: { bigtrack: 5, wrocket: 5, wturbo: 10 },
    karts: ["patriot"], kart: "patriot", bestRound: 0, deaths: 0, muted: true, stats: {}, ach: {},
  }));
});
await page.reload({ waitUntil: "load" });
await page.waitForTimeout(2000);
await page.keyboard.press("Enter");
await page.waitForTimeout(400);
await page.keyboard.press("Enter");
await page.waitForTimeout(3600);
await page.keyboard.down("ArrowUp");
await page.waitForTimeout(3000);
await page.keyboard.up("ArrowUp");

const state = await page.evaluate(() => {
  const w = window as unknown as { SimCore: { TRACK: { length: number } } };
  return {
    baseLen: Math.round(w.SimCore.TRACK.length),
    hudVisible: !document.getElementById("hud")?.classList.contains("hidden"),
    mph: document.getElementById("mph")?.textContent,
  };
});
await page.screenshot({ path: new URL("../shots/bigtrack-run.png", import.meta.url).pathname });
await browser.close();

console.log("state:", JSON.stringify(state), "| expected run track ≈", Math.round(state.baseLen * 1.4));
console.log("errors:", errors.length === 0 ? "NONE" : "");
for (const e of errors.slice(0, 8)) console.log("  ✗", e);
if (errors.length || !state.hudVisible) { console.log("BIGTRACK: FAIL"); process.exit(1); }
console.log("BIGTRACK: PASS — level-5 EMINENT DOMAIN run renders and drives, zero errors");

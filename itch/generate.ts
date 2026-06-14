// Renders the itch.io page assets from itch/src/*.html at exact pixel sizes.
// Run: bun itch/generate.ts
import { chromium } from "playwright-core";

const ASSETS = [
  { src: "src/cover.html", out: "cover-630x500.png", w: 630, h: 500 },
  { src: "src/banner.html", out: "banner-960x320.png", w: 960, h: 320 },
  { src: "src/background.html", out: "background-1920x1080.png", w: 1920, h: 1080 },
  { src: "src/embed-bg.html", out: "embed-bg-1280x800.png", w: 1280, h: 800 },
];

const browser = await chromium.launch({ channel: "chrome", headless: true });
for (const a of ASSETS) {
  const page = await browser.newPage({ viewport: { width: a.w, height: a.h } });
  await page.goto("file://" + new URL(a.src, import.meta.url).pathname, { waitUntil: "load" });
  await page.waitForTimeout(250);
  await page.screenshot({ path: new URL(a.out, import.meta.url).pathname });
  await page.close();
  console.log(`✓ ${a.out} (${a.w}×${a.h})`);
}
await browser.close();
console.log("itch assets written to itch/");

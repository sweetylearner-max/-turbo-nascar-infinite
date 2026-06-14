// Browser smoke test — proves the game boots from file:// (the zip scenario).
// Loads the page in headless Chrome, plays into a run, reports console errors.
// Run: bun tests/smoke.ts
import { chromium } from "playwright-core";

const target = process.argv[2] ?? "../index.html";
const fileUrl = /^https?:\/\//.test(target) ? target : "file://" + new URL(target, import.meta.url).pathname;
const errors: string[] = [];

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});

await page.goto(fileUrl, { waitUntil: "load" });
await page.waitForTimeout(2500);

const boot = await page.evaluate(() => ({
  simCore: typeof (globalThis as { SimCore?: object }).SimCore,
  canvas: !!document.querySelector("#scene canvas"),
  titleVisible: !document.getElementById("title")?.classList.contains("hidden"),
}));
await page.screenshot({ path: new URL("../shots/file-title.png", import.meta.url).pathname });

// garage: milestone cards must render without errors (idle-conversion UI)
await page.keyboard.press("g");
await page.waitForTimeout(500);
const garage = await page.evaluate(() => ({
  visible: !document.getElementById("garage")?.classList.contains("hidden"),
  cards: document.querySelectorAll("#upGrid .up").length,
  milestones: document.querySelectorAll("#upGrid .mile").length,
  lvchips: document.querySelectorAll("#upGrid .lvchip").length,
}));
await page.screenshot({ path: new URL("../shots/file-garage.png", import.meta.url).pathname });
await page.keyboard.press("Escape");
await page.waitForTimeout(400);

// play: title → kart select → race (countdown 3.2s) → drive 4s
await page.keyboard.press("Enter");
await page.waitForTimeout(400);
await page.keyboard.press("Enter");
await page.waitForTimeout(3600);
await page.keyboard.down("ArrowUp");
await page.waitForTimeout(4000);
await page.keyboard.up("ArrowUp");

const inRun = await page.evaluate(() => ({
  hudVisible: !document.getElementById("hud")?.classList.contains("hidden"),
  mph: document.getElementById("mph")?.textContent,
  round: document.getElementById("roundN")?.textContent,
}));
await page.screenshot({ path: new URL("../shots/file-gameplay.png", import.meta.url).pathname });
await browser.close();

console.log("URL:", fileUrl);
console.log("boot:", JSON.stringify(boot));
console.log("garage:", JSON.stringify(garage));
console.log("run:", JSON.stringify(inRun));
console.log("console/page errors:", errors.length === 0 ? "NONE" : "");
for (const e of errors.slice(0, 8)) console.log("  ✗", e);
if (errors.length || !boot.canvas || boot.simCore !== "object" || !inRun.hudVisible ||
    !garage.visible || garage.cards < 13 || garage.milestones < 13 || garage.lvchips < 13) {
  console.log("SMOKE: FAIL");
  process.exit(1);
}
console.log(`SMOKE: PASS — game boots and drives from ${fileUrl.split("/")[0]} with zero errors`);

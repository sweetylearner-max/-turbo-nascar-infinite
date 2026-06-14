// Builds dist/index.html — fully self-contained (three.js bundled in, no CDN,
// no importmap). This is the file that goes in the share zip: double-click,
// works offline, works in browsers without importmap support.
// Run: bun build-dist.ts
import { mkdirSync } from "node:fs";

const html = await Bun.file(new URL("index.html", import.meta.url)).text();
const mod = html.match(/<script type="module">([\s\S]*?)<\/script>/);
if (!mod) throw new Error("module script not found");

mkdirSync(new URL(".build", import.meta.url).pathname, { recursive: true });
const entry = new URL(".build/entry.js", import.meta.url).pathname;
await Bun.write(entry, mod[1]);

const result = await Bun.build({ entrypoints: [entry], minify: true, target: "browser" });
if (!result.success) throw new Error(result.logs.map(String).join("\n"));
const bundled = (await result.outputs[0].text()).replaceAll("</script", "<\\/script");

let out = html.replace(/<script type="importmap">[\s\S]*?<\/script>\n?/, "");
out = out.replace(/<script type="module">[\s\S]*?<\/script>/, () => `<script type="module">${bundled}</script>`);
await Bun.write(new URL("dist/index.html", import.meta.url).pathname, out);
console.log(`dist/index.html written (${(out.length / 1024).toFixed(0)} KB, self-contained)`);

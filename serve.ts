const root = import.meta.dir;
const TYPES: Record<string, string> = {
  ".html": "text/html",
  ".png": "image/png",
  ".ts": "text/plain",
  ".md": "text/plain",
};

Bun.serve({
  port: 8923,
  async fetch(req: Request): Promise<Response> {
    const path = new URL(req.url).pathname;
    const rel = path === "/" ? "/index.html" : path;
    if (rel.includes("..")) return new Response("nope", { status: 400 });
    const file = Bun.file(root + rel);
    if (!(await file.exists())) return new Response("not found", { status: 404 });
    const ext = rel.slice(rel.lastIndexOf("."));
    return new Response(file, { headers: { "content-type": TYPES[ext] ?? "application/octet-stream" } });
  },
});

console.log("Turbo Nascar Infinite → http://localhost:8923");

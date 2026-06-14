import { describe, expect, test } from "bun:test";
import { Sim, simSource, ZERO_INPUT } from "./simload";

const DT = 1 / 60;

function stepFor(st: ReturnType<typeof Sim.makeRun>, input: typeof ZERO_INPUT, seconds: number) {
  const events = [];
  const steps = Math.round(seconds / DT);
  for (let i = 0; i < steps; i++) {
    events.push(...Sim.step(st, input, DT));
    if (st.dead) break;
  }
  return events;
}

describe("sim-core extraction", () => {
  test("exposes the SimCore contract", () => {
    expect(typeof Sim.step).toBe("function");
    expect(typeof Sim.makeRun).toBe("function");
    expect(typeof Sim.simulateRun).toBe("function");
    expect(Sim.TRACK.length).toBeGreaterThan(0);
  });

  test("source is pure: no DOM, THREE, or browser APIs", () => {
    const withoutExportGuard = simSource
      .split("\n")
      .filter((line) => !line.includes("typeof window"))
      .join("\n");
    expect(withoutExportGuard).not.toMatch(/\b(document|THREE|localStorage|requestAnimationFrame|navigator|AudioContext)\b/);
    expect(withoutExportGuard).not.toMatch(/\bwindow\b/);
    expect(withoutExportGuard).not.toMatch(/\bDate\.now\b/);
    expect(withoutExportGuard).not.toMatch(/\bMath\.random\b/);
  });
});

describe("track geometry", () => {
  test("length and width are plausible for an oval", () => {
    expect(Sim.TRACK.length).toBeGreaterThan(600);
    expect(Sim.TRACK.length).toBeLessThan(1600);
    expect(Sim.TRACK.width).toBeGreaterThan(10);
  });

  test("centerline wraps: at(0) meets at(length)", () => {
    const a = Sim.TRACK.at(0);
    const b = Sim.TRACK.at(Sim.TRACK.length - 0.01);
    expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeLessThan(3);
  });

  test("track contains both straights and arcs", () => {
    let maxCurv = 0;
    let minCurv = Infinity;
    for (let s = 0; s < Sim.TRACK.length; s += 2) {
      const c = Math.abs(Sim.TRACK.at(s).curv);
      maxCurv = Math.max(maxCurv, c);
      minCurv = Math.min(minCurv, c);
    }
    expect(maxCurv).toBeGreaterThan(0.008);
    expect(minCurv).toBeLessThan(0.002);
  });
});

describe("driving physics", () => {
  test("full throttle accelerates from standstill", () => {
    const st = Sim.makeRun(Sim.makeMeta(), 1);
    stepFor(st, { ...ZERO_INPUT, throttle: 1 }, 2);
    expect(st.v).toBeGreaterThan(20);
    expect(st.dist).toBeGreaterThan(20);
  });

  test("releasing throttle coasts speed down", () => {
    const st = Sim.makeRun(Sim.makeMeta(), 1);
    stepFor(st, { ...ZERO_INPUT, throttle: 1 }, 3);
    const vBefore = st.v;
    stepFor(st, ZERO_INPUT, 3);
    expect(st.v).toBeLessThan(vBefore - 8);
  });

  test("braking stops then slowly reverses", () => {
    const st = Sim.makeRun(Sim.makeMeta(), 1);
    stepFor(st, { ...ZERO_INPUT, throttle: 1 }, 2);
    stepFor(st, { ...ZERO_INPUT, throttle: -1 }, 3);
    expect(st.v).toBeLessThan(-1);
    expect(st.v).toBeGreaterThan(-16);
  });

  test("corner overspeed slides the kart outward", () => {
    const st = Sim.makeRun(Sim.makeMeta(), 1);
    let arcS = -1;
    for (let s = 0; s < Sim.TRACK.length; s += 5) {
      if (Math.abs(Sim.TRACK.at(s).curv) > 0.008) {
        arcS = s;
        break;
      }
    }
    expect(arcS).toBeGreaterThanOrEqual(0);
    st.s = arcS;
    st.sTotal = arcS;
    st.d = 0;
    st.v = Sim.derived(Sim.makeMeta()).topSpeed;
    stepFor(st, { ...ZERO_INPUT, throttle: 1 }, 1);
    expect(Math.abs(st.d)).toBeGreaterThan(1.5);
  });

  test("hard lateral wall impact deals damage and emits slam", () => {
    const st = Sim.makeRun(Sim.makeMeta(), 1);
    const maxHp = st.hp;
    st.d = Sim.TRACK.width / 2 - 1.2;
    st.latV = 14;
    st.v = 40;
    const events = stepFor(st, { ...ZERO_INPUT, throttle: 1 }, 0.5);
    expect(st.hp).toBeLessThan(maxHp);
    expect(events.some((e) => e.type === "slam" || e.type === "scrape")).toBe(true);
  });

  test("crossing the start line increments the round", () => {
    const st = Sim.makeRun(Sim.makeMeta(), 1);
    st.sTotal = Sim.TRACK.length - 5;
    st.s = st.sTotal % Sim.TRACK.length;
    st.v = 50;
    const events = stepFor(st, { ...ZERO_INPUT, throttle: 1 }, 2);
    expect(events.some((e) => e.type === "round")).toBe(true);
    expect(st.round).toBe(2);
  });
});

describe("pack", () => {
  test("pack speed compounds per round", () => {
    expect(Sim.packSpeed(2)).toBeGreaterThan(Sim.packSpeed(1));
    expect(Sim.packSpeed(10)).toBeGreaterThan(Sim.packSpeed(5) * 1.2);
  });

  test("fresh pack is slower than a fresh kart's top speed", () => {
    expect(Sim.packSpeed(1)).toBeLessThan(Sim.derived(Sim.makeMeta()).topSpeed);
  });
});

describe("determinism", () => {
  test("same seed and bot produce identical runs", () => {
    const a = Sim.simulateRun(Sim.makeMeta(), 42, Sim.BOTS.good);
    const b = Sim.simulateRun(Sim.makeMeta(), 42, Sim.BOTS.good);
    expect(a).toEqual(b);
  });

  test("different seeds diverge", () => {
    const seeds = [1, 2, 3, 4, 5, 6];
    const dists = seeds.map((seed) => Sim.simulateRun(Sim.makeMeta(), seed, Sim.BOTS.bad).dist);
    expect(new Set(dists.map((d) => d.toFixed(1))).size).toBeGreaterThan(1);
  });
});

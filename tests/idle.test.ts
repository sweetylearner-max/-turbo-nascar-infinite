import { describe, expect, test } from "bun:test";
import { mean, runCohort, Sim } from "./simload";

describe("infinite stacking", () => {
  test("no upgrade has a finite max level", () => {
    for (const u of Sim.UPGRADES) expect(u.max).toBe(Infinity);
  });

  test("buy keeps working deep into the curve", () => {
    const meta = Sim.makeMeta();
    meta.fp = 10_000_000;
    for (let i = 0; i < 30; i++) expect(Sim.buy(meta, "engine")).toBe(true);
    expect(meta.upgrades.engine).toBe(30);
    expect(Sim.derived(meta).topSpeed).toBeGreaterThan(Sim.derived(Sim.makeMeta()).topSpeed * 1.5);
  });

  test("level 20 rockets is an idle-plausible price (under 100k FP total)", () => {
    let total = 0;
    for (let lvl = 0; lvl < 20; lvl++) total += Sim.costOf("wrocket", lvl);
    expect(total).toBeLessThan(100_000);
    expect(total).toBeGreaterThan(2_000);
  });
});

describe("weapon milestones", () => {
  test("rocket count hits breakpoints 1/2/3/4/5/7", () => {
    expect(Sim.weaponSpec("q", 1).rockets).toBe(1);
    expect(Sim.weaponSpec("q", 3).rockets).toBe(2);
    expect(Sim.weaponSpec("q", 5).rockets).toBe(3);
    expect(Sim.weaponSpec("q", 8).rockets).toBe(4);
    expect(Sim.weaponSpec("q", 12).rockets).toBe(5);
    expect(Sim.weaponSpec("q", 20).rockets).toBe(7);
  });

  test("turbo milestones: grip at 5, invulnerable at 10, kills at 15", () => {
    expect(Sim.weaponSpec("t", 4).invuln).toBe(false);
    expect(Sim.weaponSpec("t", 5).grip).toBe(true);
    expect(Sim.weaponSpec("t", 10).invuln).toBe(true);
    expect(Sim.weaponSpec("t", 15).killer).toBe(true);
    expect(Sim.weaponSpec("t", 12).boost).toBeGreaterThan(Sim.weaponSpec("t", 1).boost);
  });

  test("guns pierce more targets at milestones", () => {
    expect(Sim.weaponSpec("w", 1).targets).toBe(1);
    expect(Sim.weaponSpec("w", 10).targets).toBe(2);
    expect(Sim.weaponSpec("w", 15).targets).toBe(3);
  });

  test("garage can describe the next milestone", () => {
    const next = Sim.nextMilestone("wrocket", 3);
    expect(next).toBeTruthy();
    expect(next?.lvl).toBe(5);
    expect(typeof next?.text).toBe("string");
  });
});

describe("EMINENT DOMAIN (big track)", () => {
  test("track upgrade physically lengthens the run track", () => {
    const meta = Sim.makeMeta();
    meta.upgrades.bigtrack = 5;
    const st = Sim.makeRun(meta, 1);
    expect(st.track.length).toBeGreaterThan(Sim.TRACK.length * 1.3);
  });

  test("rounds still count at the base lap distance", () => {
    const meta = Sim.makeMeta();
    meta.upgrades.bigtrack = 5;
    const st = Sim.makeRun(meta, 1);
    st.sTotal = Sim.TUNING.roundDist - 5;
    st.s = st.sTotal % st.track.length;
    st.v = 50;
    const input = { throttle: 1, steer: 0, q: false, w: false, e: false, r: false, t: false };
    let rounded = false;
    for (let i = 0; i < 120 && !rounded; i++) {
      for (const ev of Sim.step(st, input, 1 / 60)) if (ev.type === "round") rounded = true;
    }
    expect(rounded).toBe(true);
    expect(st.s).toBeLessThan(st.track.length);
  });

  test("level 0 keeps the original track (regression guard)", () => {
    const st = Sim.makeRun(Sim.makeMeta(), 1);
    expect(st.track.length).toBeCloseTo(Sim.TRACK.length, 1);
  });
});

describe("exponential late game", () => {
  test("traffic gains health with rounds", () => {
    const meta = Sim.makeMeta();
    const early = Sim.makeRun(meta, 2);
    const late = Sim.makeRun(meta, 2);
    late.round = 12;
    late.traffic = [];
    for (let i = 0; i < 60; i++) { Sim.step(early, { throttle: 0, steer: 0, q: false, w: false, e: false, r: false, t: false }, 1 / 60); Sim.step(late, { throttle: 0, steer: 0, q: false, w: false, e: false, r: false, t: false }, 1 / 60); }
    const hpOf = (st: typeof early) => Math.max(...st.traffic.map((c) => (c as { hp?: number }).hp ?? 0));
    expect(hpOf(late)).toBeGreaterThan(hpOf(early) * 2);
  });

  test("pack speed goes super-exponential after round 12", () => {
    const r14r13 = Sim.packSpeed(14) / Sim.packSpeed(13);
    const r6r5 = Sim.packSpeed(6) / Sim.packSpeed(5);
    expect(r14r13).toBeGreaterThan(r6r5 + 0.02);
  });

  test("no immortality: 50k FP of upgrades still dies by round 22", () => {
    const rich = Sim.autoSpend(Sim.makeMeta(), 50_000);
    const runs = runCohort(rich, Sim.BOTS.good, [1, 2, 3, 4, 5]);
    for (const r of runs) {
      expect(r.cause).not.toBe("survived");
      expect(r.rounds).toBeLessThanOrEqual(22);
    }
    const m = mean(runs.map((r) => r.rounds));
    expect(m).toBeGreaterThan(mean(runCohort(Sim.makeMeta(), Sim.BOTS.good, [1, 2, 3, 4, 5]).map((r) => r.rounds)));
  });

  test("kills pay more in later rounds", () => {
    const fresh = Sim.makeMeta();
    const early = Sim.fpForRun({ dist: 1000, rounds: 1, kills: 0, driftT: 0, killFp: 60 }, fresh);
    const late = Sim.fpForRun({ dist: 1000, rounds: 1, kills: 0, driftT: 0, killFp: 240 }, fresh);
    expect(late).toBeGreaterThan(early);
  });
});

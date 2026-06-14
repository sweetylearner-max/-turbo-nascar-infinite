import { describe, expect, test } from "bun:test";
import { mean, runCohort, Sim } from "./simload";

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

describe("fresh-save skill spread (the spec contract)", () => {
  const fresh = Sim.makeMeta();
  const bad = runCohort(fresh, Sim.BOTS.bad, SEEDS);
  const good = runCohort(fresh, Sim.BOTS.good, SEEDS);

  test("bad player survives about 2 rounds", () => {
    const m = mean(bad.map((r) => r.rounds));
    expect(m).toBeGreaterThanOrEqual(1.4);
    expect(m).toBeLessThanOrEqual(3.4);
  });

  test("good player survives about 10 rounds", () => {
    const m = mean(good.map((r) => r.rounds));
    expect(m).toBeGreaterThanOrEqual(8);
    expect(m).toBeLessThanOrEqual(12.5);
  });

  test("good player always clearly outlasts bad player", () => {
    const gap = mean(good.map((r) => r.rounds)) - mean(bad.map((r) => r.rounds));
    expect(gap).toBeGreaterThanOrEqual(5);
    for (const r of good) expect(r.rounds).toBeGreaterThanOrEqual(4);
  });

  test("death is inevitable even for the good player", () => {
    for (const r of good) {
      expect(r.cause).not.toBe("");
      expect(r.rounds).toBeLessThanOrEqual(16);
    }
  });
});

describe("camping is not viable", () => {
  test("a parked kart is consumed by the pack in round 1", () => {
    const r = Sim.simulateRun(Sim.makeMeta(), 7, null);
    expect(r.rounds).toBeLessThanOrEqual(1);
    expect(r.cause).toBe("pack");
  });
});

describe("meta progression extends survival (the clicker contract)", () => {
  const fresh = Sim.makeMeta();
  const freshGood = mean(runCohort(fresh, Sim.BOTS.good, SEEDS).map((r) => r.rounds));
  const freshBad = mean(runCohort(fresh, Sim.BOTS.bad, SEEDS).map((r) => r.rounds));

  test("800 FP of upgrades makes the good player last longer", () => {
    const upgraded = Sim.autoSpend(Sim.makeMeta(), 800);
    const m = mean(runCohort(upgraded, Sim.BOTS.good, SEEDS).map((r) => r.rounds));
    expect(m).toBeGreaterThanOrEqual(freshGood + 1);
  });

  test("800 FP of upgrades helps the bad player too", () => {
    const upgraded = Sim.autoSpend(Sim.makeMeta(), 800);
    const m = mean(runCohort(upgraded, Sim.BOTS.bad, SEEDS).map((r) => r.rounds));
    expect(m).toBeGreaterThanOrEqual(freshBad + 0.5);
  });

  test("more investment keeps helping (300 vs 2000 FP)", () => {
    const small = mean(runCohort(Sim.autoSpend(Sim.makeMeta(), 300), Sim.BOTS.good, SEEDS).map((r) => r.rounds));
    const large = mean(runCohort(Sim.autoSpend(Sim.makeMeta(), 2000), Sim.BOTS.good, SEEDS).map((r) => r.rounds));
    expect(large).toBeGreaterThan(small);
  });
});

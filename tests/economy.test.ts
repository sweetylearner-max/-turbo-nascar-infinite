import { describe, expect, test } from "bun:test";
import { Sim } from "./simload";

describe("upgrade costs", () => {
  test("costs grow geometrically per level", () => {
    const ratio = Sim.costOf("engine", 5) / Sim.costOf("engine", 0);
    expect(ratio).toBeGreaterThan(4);
    expect(ratio).toBeLessThan(25);
  });

  test("buy refuses when FP is insufficient", () => {
    const meta = Sim.makeMeta();
    expect(Sim.buy(meta, "engine")).toBe(false);
    expect(meta.upgrades.engine ?? 0).toBe(0);
  });

  test("buy deducts FP and raises level", () => {
    const meta = Sim.makeMeta();
    meta.fp = Sim.costOf("engine", 0) + 5;
    expect(Sim.buy(meta, "engine")).toBe(true);
    expect(meta.upgrades.engine).toBe(1);
    expect(meta.fp).toBe(5);
  });
});

describe("freedom point payouts", () => {
  test("worst possible first death still affords the cheapest upgrade", () => {
    const fresh = Sim.makeMeta();
    const worst = Sim.fpForRun({ dist: 0, rounds: 1, kills: 0, driftT: 0 }, fresh);
    const cheapest = Math.min(...Sim.UPGRADES.map((u) => Sim.costOf(u.id, 0)));
    expect(worst).toBeGreaterThanOrEqual(cheapest);
  });

  test("payout grows superlinearly with rounds", () => {
    const fresh = Sim.makeMeta();
    const r2 = Sim.fpForRun({ dist: 2000, rounds: 2, kills: 0, driftT: 0 }, fresh);
    const r8 = Sim.fpForRun({ dist: 8000, rounds: 8, kills: 0, driftT: 0 }, fresh);
    expect(r8).toBeGreaterThan(r2 * 4);
  });

  test("kills and drift add FP", () => {
    const fresh = Sim.makeMeta();
    const base = Sim.fpForRun({ dist: 3000, rounds: 3, kills: 0, driftT: 0 }, fresh);
    const spicy = Sim.fpForRun({ dist: 3000, rounds: 3, kills: 12, driftT: 20 }, fresh);
    expect(spicy).toBeGreaterThan(base);
  });

  test("lucky flag upgrade multiplies payout", () => {
    const lucky = Sim.makeMeta();
    lucky.upgrades.luck = 5;
    const fresh = Sim.makeMeta();
    const stats = { dist: 5000, rounds: 5, kills: 5, driftT: 10 };
    expect(Sim.fpForRun(stats, lucky)).toBeGreaterThan(Sim.fpForRun(stats, fresh));
  });
});

describe("derived stats respond to upgrades", () => {
  test("engine, tires, armor each move their stat", () => {
    const fresh = Sim.derived(Sim.makeMeta());
    const tuned = Sim.makeMeta();
    tuned.upgrades = { engine: 5, tires: 5, armor: 5 };
    const d = Sim.derived(tuned);
    expect(d.topSpeed).toBeGreaterThan(fresh.topSpeed);
    expect(d.grip).toBeGreaterThan(fresh.grip);
    expect(d.maxHp).toBeGreaterThan(fresh.maxHp);
  });

  test("qualifying upgrade raises the starting round", () => {
    const meta = Sim.makeMeta();
    meta.upgrades.qual = 2;
    expect(Sim.derived(meta).startRound).toBe(3);
  });
});

describe("autoSpend (test/recommendation helper)", () => {
  test("spends grant down and buys at least one upgrade", () => {
    const meta = Sim.autoSpend(Sim.makeMeta(), 500);
    const levels = Object.values(meta.upgrades).reduce((a, b) => a + b, 0);
    expect(levels).toBeGreaterThan(0);
    expect(meta.fp).toBeGreaterThanOrEqual(0);
    expect(meta.fp).toBeLessThan(500);
  });
});

describe("karts", () => {
  test("five karts with one free starter", () => {
    expect(Sim.KARTS.length).toBeGreaterThanOrEqual(5);
    expect(Sim.KARTS.filter((k) => k.cost === 0).length).toBe(1);
  });

  test("stat profiles are distinct", () => {
    const sigs = new Set(Sim.KARTS.map((k) => `${k.spd}|${k.acc}|${k.grp}|${k.arm}`));
    expect(sigs.size).toBe(Sim.KARTS.length);
  });

  test("locked kart purchase gates on FP then unlocks", () => {
    const meta = Sim.makeMeta();
    const locked = Sim.KARTS.find((k) => k.cost > 0);
    if (!locked) throw new Error("no locked kart");
    expect(Sim.buyKart(meta, locked.id)).toBe(false);
    meta.fp = locked.cost;
    expect(Sim.buyKart(meta, locked.id)).toBe(true);
    expect(meta.karts).toContain(locked.id);
    expect(meta.fp).toBe(0);
  });
});

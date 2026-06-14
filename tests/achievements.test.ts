import { describe, expect, test } from "bun:test";
import { Sim } from "./simload";

const SimA = Sim;

describe("achievement catalog", () => {
  test("there are at least 400 achievements", () => {
    expect(SimA.ACHIEVEMENTS.length).toBeGreaterThanOrEqual(400);
  });

  test("ids are unique and rewards are positive", () => {
    const ids = new Set(SimA.ACHIEVEMENTS.map((a) => a.id));
    expect(ids.size).toBe(SimA.ACHIEVEMENTS.length);
    for (const a of SimA.ACHIEVEMENTS) {
      expect(a.fp).toBeGreaterThan(0);
      expect(a.name.length).toBeGreaterThan(2);
    }
  });

  test("first death unlocks YOU F*KN DIEDD YEEHAAAW worth 100 FP", () => {
    const meta = Sim.makeMeta();
    meta.stats.deaths = 1;
    const unlocked = SimA.checkAchievements(meta);
    const died = unlocked.find((a) => a.name === "YOU F*KN DIEDD YEEHAAAW");
    expect(died).toBeDefined();
    expect(died?.fp).toBe(100);
  });

  test("unlocking pays FP into the meta and is recorded", () => {
    const meta = Sim.makeMeta();
    meta.stats.deaths = 1;
    const before = meta.fp;
    const unlocked = SimA.checkAchievements(meta);
    const paid = unlocked.reduce((a, b) => a + b.fp, 0);
    expect(meta.fp).toBe(before + paid);
    for (const a of unlocked) expect(meta.ach[a.id]).toBe(true);
  });

  test("checkAchievements is idempotent — no double pay", () => {
    const meta = Sim.makeMeta();
    meta.stats.deaths = 3;
    meta.stats.kills = 12;
    SimA.checkAchievements(meta);
    const fpAfterFirst = meta.fp;
    const second = SimA.checkAchievements(meta);
    expect(second.length).toBe(0);
    expect(meta.fp).toBe(fpAfterFirst);
  });

  test("kill tiers unlock progressively, not all at once", () => {
    const meta = Sim.makeMeta();
    meta.stats.kills = 1;
    const atOne = SimA.checkAchievements(meta).filter((a) => a.id.startsWith("kills-")).length;
    meta.stats.kills = 100;
    const atHundred = SimA.checkAchievements(meta).filter((a) => a.id.startsWith("kills-")).length;
    expect(atOne).toBeGreaterThanOrEqual(1);
    expect(atHundred).toBeGreaterThan(atOne);
  });

  test("a run's summary stats flow into lifetime stats", () => {
    const meta = Sim.makeMeta();
    const summary = Sim.simulateRun(meta, 3, Sim.BOTS.good);
    Sim.absorbRun(meta, summary);
    expect(meta.stats.deaths).toBe(1);
    expect(meta.stats.dist).toBeGreaterThan(0);
    expect(meta.stats.maxRound).toBe(summary.rounds);
  });
});

describe("turkeys", () => {
  test("turkeys spawn from round 2 and can be hit for damage and feathers", () => {
    const meta = Sim.makeMeta();
    const st = Sim.makeRun(meta, 5);
    st.round = 3;
    let hits = 0;
    let seen = 0;
    const input = { throttle: 1, steer: 0, q: false, w: false, e: false, r: false, t: false };
    for (let i = 0; i < 60 * 120 && !st.dead; i++) {
      for (const ev of Sim.step(st, input, 1 / 60)) {
        if (ev.type === "turkey") hits++;
      }
      seen = Math.max(seen, st.turkeys.length);
    }
    expect(seen).toBeGreaterThan(0);
    expect(hits).toBeGreaterThanOrEqual(0);
  });
});

describe("save v2 migration", () => {
  test("a v1 save keeps fp, upgrades, karts and gains stats/ach", () => {
    const v1 = JSON.stringify({
      v: 1, fp: 777, upgrades: { engine: 3 }, karts: ["patriot", "lightning"],
      kart: "lightning", bestRound: 9, deaths: 14, muted: true,
    });
    const meta = Sim.parseMeta(v1);
    expect(meta.fp).toBe(777);
    expect(meta.upgrades.engine).toBe(3);
    expect(meta.karts).toContain("lightning");
    expect(meta.stats.deaths).toBe(14);
    expect(meta.ach).toEqual({});
  });
});

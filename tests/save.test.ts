import { describe, expect, test } from "bun:test";
import { Sim } from "./simload";

describe("save codec", () => {
  test("serialize then parse roundtrips a lived-in save", () => {
    const meta = Sim.autoSpend(Sim.makeMeta(), 300);
    meta.bestRound = 7;
    meta.deaths = 12;
    meta.muted = true;
    const back = Sim.parseMeta(Sim.serializeMeta(meta));
    expect(back).toEqual(meta);
  });

  test("corrupt JSON falls back to fresh defaults", () => {
    const meta = Sim.parseMeta("{definitely not json");
    expect(meta.fp).toBe(0);
    expect(meta.kart).toBe(Sim.KARTS.find((k) => k.cost === 0)?.id);
  });

  test("null input falls back to fresh defaults", () => {
    const meta = Sim.parseMeta(null);
    expect(meta.bestRound).toBe(0);
    expect(meta.karts.length).toBe(1);
  });

  test("foreign version falls back to fresh defaults", () => {
    const meta = Sim.parseMeta(JSON.stringify({ v: 999, fp: 99999 }));
    expect(meta.fp).toBe(0);
  });

  test("fresh meta starts with the free kart selected", () => {
    const meta = Sim.makeMeta();
    const free = Sim.KARTS.find((k) => k.cost === 0);
    expect(meta.kart).toBe(free?.id);
    expect(meta.karts).toEqual([free?.id]);
  });
});

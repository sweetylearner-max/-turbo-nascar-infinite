import { readFileSync } from "node:fs";

export interface Meta {
  v: number;
  fp: number;
  upgrades: Record<string, number>;
  karts: string[];
  kart: string;
  bestRound: number;
  deaths: number;
  muted: boolean;
  stats: Record<string, number>;
  ach: Record<string, boolean>;
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  fp: number;
  test(m: Meta): boolean;
}

export interface BotProfile {
  cornerMargin: number;
  lookahead: number;
  dodgeRange: number;
  dodgeSkill: number;
  noise: number;
  panic: number;
  useAbilities: boolean;
}

export interface SimInput {
  throttle: number;
  steer: number;
  q: boolean;
  w: boolean;
  e: boolean;
  r: boolean;
  t: boolean;
}

export interface RunState {
  s: number;
  d: number;
  sTotal: number;
  v: number;
  rel: number;
  latV: number;
  hp: number;
  round: number;
  packTotal: number;
  time: number;
  dist: number;
  kills: number;
  killFp: number;
  dead: boolean;
  cause: string;
  track: TrackApi;
  traffic: Array<{ s: number; d: number; v: number; hp?: number }>;
  turkeys: Array<{ s: number; d: number }>;
  [k: string]: unknown;
}

export interface RunSummary {
  rounds: number;
  time: number;
  dist: number;
  kills: number;
  fp: number;
  cause: string;
  driftT: number;
  turkeys: number;
  slams: number;
  scrapes: number;
  killsBy: Record<string, number>;
  used: Record<string, number>;
}

export interface SimEvent {
  type: string;
  [k: string]: unknown;
}

export interface TrackApi {
  length: number;
  width: number;
  at(s: number): { x: number; z: number; tx: number; tz: number; curv: number };
}

export interface WeaponSpec {
  rockets: number;
  targets: number;
  charges: number;
  eagles: number;
  boost: number;
  grip: boolean;
  invuln: boolean;
  killer: boolean;
  stall: number;
  dmg: number;
  [k: string]: unknown;
}

export interface SimCoreApi {
  TUNING: Record<string, number>;
  TRACK: TrackApi;
  KARTS: Array<{
    id: string;
    name: string;
    cost: number;
    spd: number;
    acc: number;
    grp: number;
    arm: number;
    flavor: string;
  }>;
  UPGRADES: Array<{
    id: string;
    name: string;
    base: number;
    growth: number;
    max: number;
    flavor: string;
  }>;
  packSpeed(round: number): number;
  makeMeta(): Meta;
  serializeMeta(m: Meta): string;
  parseMeta(s: string | null): Meta;
  costOf(id: string, level: number): number;
  buy(m: Meta, id: string): boolean;
  buyKart(m: Meta, id: string): boolean;
  derived(m: Meta): {
    topSpeed: number;
    accel: number;
    grip: number;
    maxHp: number;
    regen: number;
    fpMul: number;
    startRound: number;
    tiers: Record<string, number>;
  };
  fpForRun(stats: { dist: number; rounds: number; kills: number; driftT: number; killFp?: number }, m: Meta): number;
  weaponSpec(key: string, lvl: number): WeaponSpec;
  nextMilestone(id: string, lvl: number): { lvl: number; text: string } | null;
  makeTrack(mul: number): TrackApi;
  worldOfT(track: TrackApi, s: number, d: number): { x: number; z: number; tx: number; tz: number };
  makeRun(m: Meta, seed: number): RunState;
  step(st: RunState, input: SimInput, dt: number): SimEvent[];
  BOTS: { good: BotProfile; bad: BotProfile };
  makeBotMem(): Record<string, number>;
  botInput(st: RunState, p: BotProfile, mem: Record<string, number>): SimInput;
  simulateRun(m: Meta, seed: number, p: BotProfile | null, maxTime?: number): RunSummary;
  autoSpend(m: Meta, fp: number): Meta;
  ACHIEVEMENTS: Achievement[];
  checkAchievements(m: Meta): Achievement[];
  absorbRun(m: Meta, r: RunSummary): void;
}

const htmlPath = new URL("../index.html", import.meta.url);
const html = readFileSync(htmlPath, "utf8");
const match = html.match(/<script id="sim-core">([\s\S]*?)<\/script>/);
if (!match) throw new Error('sim-core script block not found in index.html');

export const simSource: string = match[1];

const factory = new Function(`${simSource}\nreturn SimCore;`);
export const Sim = factory() as SimCoreApi;

export const ZERO_INPUT: SimInput = { throttle: 0, steer: 0, q: false, w: false, e: false, r: false, t: false
};

export function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function runCohort(meta: Meta, profile: BotProfile | null, seeds: number[]): RunSummary[] {
  const out: RunSummary[] = [];
  for (const seed of seeds) out.push(Sim.simulateRun(meta, seed, profile));
  return out;
}

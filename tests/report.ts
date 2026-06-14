// Balance tuning report — `bun run balance`
// Prints survival distributions per cohort so TUNING changes are measured, not vibed.
import { mean, runCohort, Sim } from "./simload";

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface Cohort {
  name: string;
  meta: ReturnType<typeof Sim.makeMeta>;
  profile: typeof Sim.BOTS.good | null;
}

const cohorts: Cohort[] = [
  { name: "camper (fresh)", meta: Sim.makeMeta(), profile: null },
  { name: "bad (fresh)", meta: Sim.makeMeta(), profile: Sim.BOTS.bad },
  { name: "good (fresh)", meta: Sim.makeMeta(), profile: Sim.BOTS.good },
  { name: "bad (+800 FP)", meta: Sim.autoSpend(Sim.makeMeta(), 800), profile: Sim.BOTS.bad },
  { name: "good (+300 FP)", meta: Sim.autoSpend(Sim.makeMeta(), 300), profile: Sim.BOTS.good },
  { name: "good (+800 FP)", meta: Sim.autoSpend(Sim.makeMeta(), 800), profile: Sim.BOTS.good },
  { name: "good (+2000 FP)", meta: Sim.autoSpend(Sim.makeMeta(), 2000), profile: Sim.BOTS.good },
];

const rows = cohorts.map(({ name, meta, profile }) => {
  const runs = runCohort(meta, profile, SEEDS);
  const rounds = runs.map((r) => r.rounds);
  const causes = runs.map((r) => r.cause);
  const top = [...new Set(causes)]
    .map((c) => ({ c, n: causes.filter((x) => x === c).length }))
    .sort((a, b) => b.n - a.n)[0];
  return {
    cohort: name,
    rounds: rounds.join(" "),
    mean: Number(mean(rounds).toFixed(2)),
    meanFP: Math.round(mean(runs.map((r) => r.fp))),
    topCause: `${top.c} (${top.n}/${SEEDS.length})`,
  };
});

console.table(rows);

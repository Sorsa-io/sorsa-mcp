#!/usr/bin/env node
// Guards the Sorsa Score opt-in invariant against the compiled endpoint table.
// Usage (after `npm run build`):
//   SORSA_API_KEY=x node scripts/count-tools.mjs

import { existsSync } from "node:fs";

const EXPECTED_DEFAULT = 33;
const EXPECTED_SCORE = 40;
const EXPECTED_SCORE_TOOLS = [
  "get_sorsa_score",
  "get_sorsa_score_changes",
  "get_followers_stats",
  "get_top_followers",
  "get_top_following",
  "get_new_followers_7d",
  "get_new_following_7d",
];

const distEndpoints = new URL("../dist/endpoints.js", import.meta.url);
if (!existsSync(distEndpoints)) {
  console.error("[count-tools] dist/endpoints.js not found — run `npm run build` first.");
  process.exit(1);
}

const { ENDPOINTS, endpointsFor } = await import(distEndpoints.href);

const defaultTools = endpointsFor(false);
const scoreTools = endpointsFor(true);
const markedScoreTools = ENDPOINTS.filter((ep) => ep.optIn === "score");
const defaultNames = new Set(defaultTools.map((ep) => ep.name));
const scoreNames = new Set(scoreTools.map((ep) => ep.name));

const failures = [];

if (defaultTools.length !== EXPECTED_DEFAULT) {
  failures.push(`default tool count is ${defaultTools.length}, expected ${EXPECTED_DEFAULT}`);
}
if (scoreTools.length !== EXPECTED_SCORE) {
  failures.push(`score tool count is ${scoreTools.length}, expected ${EXPECTED_SCORE}`);
}

for (const name of EXPECTED_SCORE_TOOLS) {
  if (!scoreNames.has(name)) {
    failures.push(`${name} is missing when Sorsa Score is enabled`);
  }
  if (defaultNames.has(name)) {
    failures.push(`${name} is registered without the Sorsa Score opt-in`);
  }
  if (!markedScoreTools.some((ep) => ep.name === name)) {
    failures.push(`${name} is not marked optIn: "score"`);
  }
}

for (const ep of markedScoreTools) {
  if (!EXPECTED_SCORE_TOOLS.includes(ep.name)) {
    failures.push(`${ep.name} is unexpectedly marked optIn: "score"`);
  }
}

if (failures.length > 0) {
  console.error("[count-tools] tool-count invariant violated:");
  for (const failure of failures) console.error(`  - ${failure}`);
  console.error(`actual: default=${defaultTools.length} score=${scoreTools.length}`);
  process.exit(1);
}

console.log(`default=${defaultTools.length} score=${scoreTools.length}`);

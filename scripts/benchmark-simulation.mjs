import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { parseDictionary } from '../src/graph/dictionary.ts';
import { buildGraph } from '../src/graph/topology.ts';
import { bfs } from '../src/graph/traversal.ts';
import { selectView } from '../src/rendering/view.ts';
import { RadialSimulation } from '../src/layout/simulation.ts';

const graph = buildGraph(parseDictionary(readFileSync(new URL('../src/data/enable-v1/four-letter.txt', import.meta.url), 'utf8')));
for (const [root, radius, limit] of [['poop', 2, 200], ['bats', 3, 200], ['bats', 3, 600]]) {
  const view = selectView(graph, bfs(graph, root), radius, limit);
  const sim = new RadialSimulation();
  sim.retarget(view);
  const start = performance.now();
  for (let frame = 0; frame < 300; frame++) sim.step(1 / 60);
  const ms = (performance.now() - start) / 300;
  for (const body of sim.bodies.values()) assert([body.x, body.y, body.vx, body.vy].every(Number.isFinite));
  console.log(`${root.toUpperCase()}: ${view.words.length} nodes, ${view.edges.length} edges, ${ms.toFixed(2)} ms per simulation step (Node only; no renderer).`);
  // Interrupt every few ticks to exercise cached visible subsets on real data.
  for (let round = 0; round < 12; round++) {
    sim.retarget(selectView(graph, bfs(graph, round % 2 ? 'poop' : 'omen'), 2));
    sim.step(1 / 60);
  }
  for (const body of sim.bodies.values()) assert([body.x, body.y, body.vx, body.vy].every(Number.isFinite));
  sim.destroy();
}

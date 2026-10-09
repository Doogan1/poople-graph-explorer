import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { parseDictionary } from '../src/graph/dictionary.ts';
import { buildGraph } from '../src/graph/topology.ts';
import { bfs, shortestPath } from '../src/graph/traversal.ts';

const directory = new URL('../src/data/enable-v1/', import.meta.url);
const read = (file) => readFileSync(new URL(file, directory));
const metadata = JSON.parse(read('metadata.json'));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const source = read('enable1.txt');
const extract = read('four-letter.txt');
assert.equal(sha256(source), metadata.sourceSha256);
assert.equal(sha256(extract), metadata.extractSha256);
assert.equal(sha256(read('README-enable2k.txt')), metadata.permissionNoticeSha256);
const words = parseDictionary(source.toString('utf8'));
assert.equal(`${words.join('\n')}\n`, extract.toString('utf8'));
assert.equal(words.length, metadata.normalizedWordCount);
const graph = buildGraph(words);
const root = graph.adjacency.has('poop') ? bfs(graph, 'poop') : null;
console.log(JSON.stringify({
  hashesVerified: true,
  vertices: words.length,
  edges: graph.edgeCount,
  components: graph.components.length,
  isolates: graph.components.filter((component) => component.length === 1).length,
  largestComponent: Math.max(0, ...graph.components.map((component) => component.length)),
  poopReachable: root?.layers.flat().length ?? null,
  poopEccentricity: root?.eccentricity ?? null,
  omenToPoop: graph.adjacency.has('omen') && root ? shortestPath(graph, 'omen', 'poop') : null,
}, null, 2));

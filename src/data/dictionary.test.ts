import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { parseDictionary } from '../graph/dictionary';
import { buildGraph } from '../graph/topology';
import { bfs } from '../graph/traversal';

it('ships a byte-verified dictionary with a reproducible extract and normalization count', () => {
  const directory = new URL('./enable-v1/', import.meta.url);
  const metadata = JSON.parse(readFileSync(new URL('metadata.json', directory), 'utf8'));
  for (const [file, hash] of [
    ['enable1.txt', metadata.sourceSha256],
    ['four-letter.txt', metadata.extractSha256],
    ['README-enable2k.txt', metadata.permissionNoticeSha256],
  ]) {
    expect(createHash('sha256').update(readFileSync(new URL(file, directory))).digest('hex')).toBe(hash);
  }
  const words = parseDictionary(readFileSync(new URL('enable1.txt', directory), 'utf8'));
  expect(words.length).toBe(metadata.normalizedWordCount);
  expect(`${words.join('\n')}\n`).toBe(readFileSync(new URL('four-letter.txt', directory), 'utf8'));
});

it('partitions the real graph and covers exactly the root component with BFS', () => {
  const words = parseDictionary(readFileSync(new URL('./enable-v1/four-letter.txt', import.meta.url), 'utf8'));
  const graph = buildGraph(words);
  expect(graph.words).toContain('poop');
  expect(graph.words).toContain('omen');
  expect(graph.components.flat().sort()).toEqual(graph.words);
  let degreeSum = 0;
  for (const [word, neighbors] of graph.adjacency) {
    expect(new Set(neighbors).size).toBe(neighbors.length);
    expect(neighbors).not.toContain(word);
    degreeSum += neighbors.length;
    for (const neighbor of neighbors) {
      expect([...word].filter((letter, index) => letter !== neighbor[index])).toHaveLength(1);
      expect(graph.adjacency.get(neighbor)).toContain(word);
      expect(graph.componentByWord.get(neighbor)).toBe(graph.componentByWord.get(word));
    }
  }
  expect(degreeSum).toBe(graph.edgeCount * 2);
  const result = bfs(graph, 'poop');
  const component = graph.components[graph.componentByWord.get('poop')!]!;
  expect(result.layers.flat().sort()).toEqual(component);
  expect(result.distances.size).toBe(words.length);
  expect([...result.distances.values()].filter((distance) => distance === null)).toHaveLength(words.length - component.length);
});

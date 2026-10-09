import type { WordGraph } from './topology.ts';
import { normalizeWord } from './dictionary.ts';

export interface BfsResult {
  readonly root: string;
  readonly distances: ReadonlyMap<string, number | null>;
  readonly predecessors: ReadonlyMap<string, string | null>;
  readonly layers: readonly (readonly string[])[];
  readonly eccentricity: number;
}

function requireWord(graph: WordGraph, value: string): string {
  const word = normalizeWord(value);
  if (word === null || !graph.adjacency.has(word)) throw new Error(`Unknown word: ${value}`);
  return word;
}

export function bfs(graph: WordGraph, input: string): BfsResult {
  const root = requireWord(graph, input);
  const distances = new Map<string, number | null>(graph.words.map((word) => [word, null]));
  const predecessors = new Map<string, string | null>(graph.words.map((word) => [word, null]));
  const layers: string[][] = [[root]];
  const queue = [root];
  distances.set(root, 0);
  for (let head = 0; head < queue.length; head++) {
    const word = queue[head]!;
    const nextDistance = distances.get(word)! + 1;
    for (const neighbor of graph.adjacency.get(word)!) {
      if (distances.get(neighbor) !== null) continue;
      distances.set(neighbor, nextDistance);
      predecessors.set(neighbor, word);
      (layers[nextDistance] ??= []).push(neighbor);
      queue.push(neighbor);
    }
  }
  return { root, distances, predecessors, layers, eccentricity: layers.length - 1 };
}

export function shortestPath(graph: WordGraph, source: string, input: string): string[] | null {
  const target = requireWord(graph, input);
  const result = bfs(graph, source);
  if (result.distances.get(target) === null) return null;
  const path: string[] = [];
  let word: string | null = target;
  while (word !== null) {
    path.push(word);
    word = result.predecessors.get(word) ?? null;
  }
  return path.reverse();
}

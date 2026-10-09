import type { WordGraph } from '../graph/topology';
import type { BfsResult } from '../graph/traversal';

export interface GraphView {
  root: string;
  words: readonly string[];
  edges: readonly { id: string; source: string; target: string }[];
  distances: ReadonlyMap<string, number | null>;
  eligibleCount: number;
  reachableCount: number;
  capped: boolean;
}

export function selectView(graph: WordGraph, result: BfsResult, radius: number, limit = 600): GraphView {
  if (!Number.isInteger(radius) || radius < 0 || !Number.isInteger(limit) || limit < 1) {
    throw new Error('Radius must be a nonnegative integer and limit a positive integer.');
  }
  const eligible = result.layers.slice(0, radius + 1).flat();
  const words = eligible.slice(0, limit);
  const included = new Set(words);
  const edges: GraphView['edges'][number][] = [];
  for (const word of [...words].sort()) {
    for (const neighbor of graph.adjacency.get(word)!) {
      if (word < neighbor && included.has(neighbor)) {
        edges.push({ id: `${word}:${neighbor}`, source: word, target: neighbor });
      }
    }
  }
  return {
    root: result.root, words, edges, distances: result.distances,
    eligibleCount: eligible.length,
    reachableCount: result.layers.reduce((total, layer) => total + layer.length, 0),
    capped: eligible.length > words.length,
  };
}

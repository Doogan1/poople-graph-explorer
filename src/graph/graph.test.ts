import { describe, expect, it } from 'vitest';
import { normalizeWord, parseDictionary } from './dictionary';
import { buildGraph, differsByOne } from './topology';
import { bfs, shortestPath } from './traversal';

const square = ['cold', 'cord', 'bold', 'bord', 'zzzz'];

describe('dictionary', () => {
  it('normalizes ASCII four-letter words, deduplicates and sorts stable IDs', () => {
    expect(parseDictionary(' COLD \r\ncord\nCold\n\ncat\nfives\nc0ld\ncöld\nBOLD')).toEqual(['bold', 'cold', 'cord']);
    expect(normalizeWord(' POOP ')).toBe('poop');
  });
  it('rejects non-ASCII input before case conversion', () => {
    expect(normalizeWord('Kiss')).toBeNull();
    expect(normalizeWord('ſoul')).toBeNull();
    expect(parseDictionary('')).toEqual([]);
  });
});

describe('topology', () => {
  it.each([
    ['cold', 'cord', true], ['cold', 'cold', false],
    ['cold', 'bold', true], ['cold', 'bord', false],
    ['abcd', 'abce', true], ['abcd', 'abc', false],
  ])('compares corresponding positions: %s and %s', (a, b, expected) => {
    expect(differsByOne(a, b)).toBe(expected);
  });
  it('builds the exact undirected square without self-loops or duplicate edges', () => {
    const graph = buildGraph([...square, 'COLD']);
    expect(graph.words).toEqual(['bold', 'bord', 'cold', 'cord', 'zzzz']);
    expect(Object.fromEntries(graph.adjacency)).toEqual({
      bold: ['bord', 'cold'], bord: ['bold', 'cord'],
      cold: ['bold', 'cord'], cord: ['bord', 'cold'], zzzz: [],
    });
    expect(graph.edgeCount).toBe(4);
    expect(graph.components).toEqual([['bold', 'bord', 'cold', 'cord'], ['zzzz']]);
    expect(graph.componentByWord.get('zzzz')).toBe(1);
  });
  it('connects every pair sharing a wildcard bucket', () => {
    expect(buildGraph(['bats', 'cats', 'hats']).edgeCount).toBe(3);
  });
  it('rejects malformed vertices at the engine boundary', () => {
    expect(() => buildGraph(['cat'])).toThrow();
    expect(buildGraph([]).components).toEqual([]);
  });
});

describe('traversal', () => {
  it('computes complete BFS layers and explicit unreachable distances', () => {
    const result = bfs(buildGraph(square), 'COLD');
    expect(result.root).toBe('cold');
    expect(result.layers).toEqual([['cold'], ['bold', 'cord'], ['bord']]);
    expect(Object.fromEntries(result.distances)).toEqual({ bold: 1, bord: 2, cold: 0, cord: 1, zzzz: null });
    expect(result.predecessors.get('bord')).toBe('bold');
    expect(result.eccentricity).toBe(2);
  });
  it('handles an isolate without inventing reachability', () => {
    const result = bfs(buildGraph(square), 'zzzz');
    expect(result.layers).toEqual([['zzzz']]);
    expect(result.distances.get('cold')).toBeNull();
    expect(result.eccentricity).toBe(0);
  });
  it('rejects unknown roots and path endpoints', () => {
    const graph = buildGraph(square);
    expect(() => bfs(graph, 'xxxx')).toThrow(/unknown/i);
    expect(() => shortestPath(graph, 'cold', 'xxxx')).toThrow(/unknown/i);
    expect(() => shortestPath(graph, 'xxxx', 'cold')).toThrow(/unknown/i);
  });
  it('reconstructs a representative shortest path and returns null across components', () => {
    const graph = buildGraph(square);
    expect(shortestPath(graph, 'COLD', 'BORD')).toEqual(['cold', 'bold', 'bord']);
    expect(shortestPath(graph, 'cold', 'cold')).toEqual(['cold']);
    expect(shortestPath(graph, 'cold', 'zzzz')).toBeNull();
  });
  it('matches independent pairwise Hamming distance and BFS edge bounds', () => {
    const words = ['aaaa', 'aaab', 'aaba', 'aabb', 'abaa', 'baaa', 'bbbb'];
    const graph = buildGraph(words);
    expect(graph.words).toHaveLength(words.length);
    for (const a of words) {
      for (const b of words) {
        const differences = [...a].filter((letter, index) => letter !== b[index]).length;
        expect(graph.adjacency.get(a)?.includes(b)).toBe(differences === 1);
      }
      const result = bfs(graph, a);
      for (const [word, neighbors] of graph.adjacency) {
        const distance = result.distances.get(word);
        for (const neighbor of neighbors) {
          const other = result.distances.get(neighbor);
          if (typeof distance === 'number' && typeof other === 'number') {
            expect(Math.abs(distance - other)).toBeLessThanOrEqual(1);
          } else {
            expect(other).toBeNull();
          }
        }
      }
    }
  });
});

import { expect, it } from 'vitest';
import { buildGraph } from '../graph/topology';
import { bfs } from '../graph/traversal';
import { selectView } from './view';
import { radialPositions, RING_SPACING } from '../layout/radial';

const graph = buildGraph(['cold', 'cord', 'bold', 'bord', 'zzzz']);
const result = bfs(graph, 'cold');

it('selects only vertices within exact full-graph BFS radius and unique induced edges', () => {
  expect(selectView(graph, result, 0).words).toEqual(['cold']);
  const view = selectView(graph, result, 1);
  expect(view.words).toEqual(['cold', 'bold', 'cord']);
  expect(view.edges.map(({ source, target }) => [source, target])).toEqual([['bold', 'cold'], ['cold', 'cord']]);
  expect(view.reachableCount).toBe(4);
  expect(view.distances.get('bord')).toBe(2);
  expect(view.distances.get('zzzz')).toBeNull();
  expect(selectView(graph, result, 2).edges).toHaveLength(4);
});

it('caps the visible view without changing BFS or losing root predecessor paths', () => {
  const view = selectView(graph, result, 2, 2);
  expect(view.words).toEqual(['cold', 'bold']);
  expect(view.eligibleCount).toBe(4);
  expect(view.capped).toBe(true);
  expect(view.reachableCount).toBe(4);
  expect(view.distances.get('bord')).toBe(2);
});

it('renders isolates as one vertex and rejects invalid view bounds', () => {
  expect(selectView(graph, bfs(graph, 'zzzz'), 3).words).toEqual(['zzzz']);
  expect(() => selectView(graph, result, -1)).toThrow();
  expect(() => selectView(graph, result, 1.5)).toThrow();
  expect(() => selectView(graph, result, 2, 0)).toThrow();
});

it('seeds finite deterministic radial positions with the root at the origin', () => {
  const view = selectView(graph, result, 2);
  const positions = radialPositions(view);
  expect(positions.size).toBe(4);
  expect(positions.get('cold')).toEqual({ x: 0, y: 0 });
  expect(radialPositions(view)).toEqual(positions);
  for (const word of view.words) {
    const point = positions.get(word)!;
    expect(Number.isFinite(point.x) && Number.isFinite(point.y)).toBe(true);
    expect(Math.hypot(point.x, point.y)).toBeCloseTo(view.distances.get(word)! * RING_SPACING);
  }
  expect(positions.get('bold')).not.toEqual(positions.get('cord'));
});

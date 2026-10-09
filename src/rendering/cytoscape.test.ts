import cytoscape from 'cytoscape';
import { expect, it } from 'vitest';
import { buildGraph } from '../graph/topology';
import { bfs } from '../graph/traversal';
import { radialPositions } from '../layout/radial';
import { selectView } from './view';
import { updateGraph, updatePositions, LAYER_COLORS } from './cytoscape';

it('updates the renderer with exact distances and preserves surviving word identity', () => {
  const graph = buildGraph(['cold', 'cord', 'bold', 'bord', 'zzzz']);
  const cy = cytoscape({ headless: true });
  try {
    const first = selectView(graph, bfs(graph, 'cold'), 1);
    updateGraph(cy, first, radialPositions(first), true);
    expect(cy.nodes('.word').map((node) => node.id()).sort()).toEqual(['bold', 'cold', 'cord']);
    expect(cy.edges()).toHaveLength(2);
    expect(cy.getElementById('bold').data('color')).toBe(LAYER_COLORS[1]);
    expect(cy.nodes('.ring')).toHaveLength(1);
    const survivingNode = cy.getElementById('cold')[0];
    const next = selectView(graph, bfs(graph, 'bord'), 1);
    updateGraph(cy, next, radialPositions(next), false);
    expect(cy.getElementById('cold')).toHaveLength(0);
    const third = selectView(graph, bfs(graph, 'cord'), 2);
    updateGraph(cy, third, radialPositions(third), false);
    const cordNode = cy.getElementById('cord')[0];
    updateGraph(cy, first, radialPositions(first), false);
    expect(cy.getElementById('cord')[0]).toBe(cordNode);
    expect(cy.getElementById('cold')[0]).not.toBe(survivingNode);
    expect(cy.getElementById('cold').position()).toEqual({ x: 0, y: 0 });
    expect(cy.nodes('.ring')).toHaveLength(0);
    const isolate = selectView(graph, bfs(graph, 'zzzz'), 3);
    updateGraph(cy, isolate, radialPositions(isolate), true);
    expect(cy.nodes('.word')).toHaveLength(1);
    expect(cy.edges()).toHaveLength(0);
    expect(cy.nodes('.ring')).toHaveLength(0);
  } finally { cy.destroy(); }
});

it('updates frame coordinates and moving ring origin without replacing topology', () => {
  const graph = buildGraph(['cold', 'cord']);
  const view = selectView(graph, bfs(graph, 'cold'), 1);
  const cy = cytoscape({ headless: true });
  try {
    updateGraph(cy, view, radialPositions(view), true);
    const word = cy.getElementById('cold')[0];
    const edge = cy.edges()[0];
    updatePositions(cy, new Map([['cold', { x: 10, y: 20 }], ['cord', { x: 40, y: 80 }]]), { x: 10, y: 20 });
    expect(cy.getElementById('cold')[0]).toBe(word);
    expect(cy.edges()[0]).toBe(edge);
    expect(cy.getElementById('cold').position()).toEqual({ x: 10, y: 20 });
    expect(cy.nodes('.ring').first().position()).toEqual({ x: 10, y: 20 });
  } finally { cy.destroy(); }
});

import cytoscape, { type Core } from 'cytoscape';
import type { GraphView } from './view';
import { RING_SPACING, type Position } from '../layout/radial';

export const LAYER_COLORS = ['#f6e7ad', '#79c6ce', '#b6afe5', '#eaa378'];

export function updatePositions(cy: Core, positions: ReadonlyMap<string, Position>, origin: Position): void {
  cy.batch(() => {
    cy.nodes('.word').positions((node) => positions.get(node.id())!);
    cy.nodes('.ring').positions(() => origin);
  });
}

export function updateGraph(cy: Core, view: GraphView, positions: ReadonlyMap<string, Position>, rings: boolean): void {
  const ids = new Set([...view.words, ...view.edges.map((edge) => edge.id)]);
  cy.batch(() => {
    cy.elements().filter((element) => !ids.has(element.id())).remove();
    for (const word of view.words) {
      const distance = view.distances.get(word)!;
      const data = { id: word, label: word.toUpperCase(), distance, color: LAYER_COLORS[distance] };
      let node = cy.getElementById(word);
      if (node.empty()) node = cy.add({ group: 'nodes', data, classes: 'word', position: positions.get(word), grabbable: false });
      else node.data(data).position(positions.get(word)!);
      node.toggleClass('root', word === view.root);
    }
    for (const edge of view.edges) {
      if (cy.getElementById(edge.id).empty()) cy.add({ group: 'edges', data: edge });
    }
    if (rings) {
      const maxDistance = Math.max(0, ...view.words.map((word) => view.distances.get(word)!));
      for (let distance = 1; distance <= maxDistance; distance++) {
        cy.add({ group: 'nodes', classes: 'ring', data: { id: `ring:${distance}`, diameter: 2 * distance * RING_SPACING }, position: { x: 0, y: 0 }, grabbable: false, selectable: false });
      }
    }
  });
}

export function createGraph(container: HTMLElement, onRoot: (word: string) => void, onHover: (word: string | null) => void): Core {
  const cy = cytoscape({
    container, elements: [], layout: { name: 'preset' }, minZoom: 0.15, maxZoom: 5,
    style: [
      { selector: 'node.word', style: { 'background-color': 'data(color)', width: 24, height: 24, label: 'data(label)', color: '#e4eee8', 'font-size': 13, 'text-valign': 'bottom', 'text-margin-y': 7, 'min-zoomed-font-size': 15, 'text-outline-width': 2, 'text-outline-color': '#11231f', 'border-width': 1, 'border-color': '#11231f', 'z-index': 2 } },
      { selector: 'node.word[distance <= 1]', style: { 'min-zoomed-font-size': 0 } },
      { selector: 'node.root', style: { width: 40, height: 40, 'border-width': 3, 'border-color': '#fff9dc', 'font-weight': 'bold' } },
      { selector: 'node.word.hover', style: { 'border-width': 3, 'border-color': '#ffffff', 'min-zoomed-font-size': 0, 'z-index': 4 } },
      { selector: 'edge', style: { width: 1, 'line-color': '#708b80', opacity: 0.35, 'curve-style': 'straight', 'z-index': 1 } },
      { selector: 'node.ring', style: { width: 'data(diameter)', height: 'data(diameter)', 'background-opacity': 0, 'border-width': 1, 'border-color': '#496256', 'border-style': 'dashed', events: 'no', 'z-index': 0 } },
    ],
  });
  cy.on('tap', 'node.word', (event) => onRoot(event.target.id()));
  cy.on('mouseover', 'node.word', (event) => { event.target.addClass('hover'); onHover(event.target.id()); });
  cy.on('mouseout', 'node.word', (event) => { event.target.removeClass('hover'); onHover(null); });
  return cy;
}

import type { GraphView } from '../rendering/view';

export interface Position { x: number; y: number }
export const RING_SPACING = 180;

export function radialPositions(view: GraphView): ReadonlyMap<string, Position> {
  const layers = new Map<number, string[]>();
  for (const word of view.words) {
    const distance = view.distances.get(word)!;
    const layer = layers.get(distance) ?? [];
    layer.push(word);
    layers.set(distance, layer);
  }
  const positions = new Map<string, Position>();
  for (const [distance, words] of layers) {
    words.forEach((word, index) => {
      const angle = 2 * Math.PI * index / words.length - Math.PI / 2;
      const radius = distance * RING_SPACING;
      positions.set(word, distance === 0 ? { x: 0, y: 0 } : { x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
    });
  }
  return positions;
}

import { useEffect, useRef, useState } from 'react';
import type { Core } from 'cytoscape';
import type { GraphView } from '../rendering/view';
import { createGraph, updateGraph } from '../rendering/cytoscape';
import { radialPositions } from '../layout/radial';

interface Props { view: GraphView; rings: boolean; onRoot: (word: string) => void }

export default function GraphCanvas({ view, rings, onRoot }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const renderer = useRef<Core | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  useEffect(() => {
    const element = container.current!;
    const cy = createGraph(element, onRoot, setHovered);
    renderer.current = cy;
    const observer = new ResizeObserver(() => {
      cy.resize();
      const words = cy.nodes('.word');
      if (words.nonempty()) cy.fit(words, 48);
    });
    observer.observe(element);
    return () => { observer.disconnect(); cy.destroy(); renderer.current = null; };
  }, [onRoot]);
  useEffect(() => { updateGraph(renderer.current!, view, radialPositions(view), rings); }, [view, rings]);
  useEffect(() => { renderer.current!.fit(renderer.current!.nodes('.word'), 48); }, [view]);

  function zoom(factor: number) {
    const cy = renderer.current!;
    cy.zoom({ level: cy.zoom() * factor, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
  }
  const inspectedWord = hovered && view.words.includes(hovered) ? hovered : view.root;
  return <div className="graph-frame">
    <div ref={container} className="graph-canvas" role="img" aria-label={`Word graph centered on ${view.root.toUpperCase()}; ${view.words.length} visible words. Use root input or the visible word selector for keyboard navigation.`} />
    <div className="camera-controls" aria-label="Graph camera">
      <button type="button" onClick={() => zoom(1.3)} aria-label="Zoom in">+</button>
      <button type="button" onClick={() => zoom(1 / 1.3)} aria-label="Zoom out">−</button>
      <button type="button" onClick={() => renderer.current!.fit(renderer.current!.nodes('.word'), 48)}>Fit view</button>
    </div>
    <div className="node-inspector"><strong>{inspectedWord.toUpperCase()}</strong> · distance {view.distances.get(inspectedWord)} {inspectedWord === view.root ? '· selected root' : '· click to re-root'}</div>
  </div>;
}

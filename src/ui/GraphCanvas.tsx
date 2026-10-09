import { useEffect, useRef, useState } from 'react';
import type { Core } from 'cytoscape';
import type { GraphView } from '../rendering/view';
import { createGraph, updateGraph, updatePositions } from '../rendering/cytoscape';
import { RING_SPACING } from '../layout/radial';
import { RadialSimulation } from '../layout/simulation';
import { useReducedMotion } from './useReducedMotion';

interface Props { view: GraphView; rings: boolean; onRoot: (word: string) => void }

export default function GraphCanvas({ view, rings, onRoot }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const renderer = useRef<Core | null>(null);
  const simulation = useRef<RadialSimulation | null>(null);
  const skipped = useRef(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState({ layer: 0, elapsed: 0, workMs: 0, frameMs: 0, generation: 0, settled: false, instant: false, temperature: 1 });
  const systemReduced = useReducedMotion();
  const [minimalMotion, setMinimalMotion] = useState(false);
  const reduced = systemReduced || minimalMotion;

  useEffect(() => {
    const element = container.current!;
    const cy = createGraph(element, onRoot, setHovered);
    renderer.current = cy;
    simulation.current = new RadialSimulation();
    const observer = new ResizeObserver(() => {
      cy.resize();
      const words = cy.nodes('.word');
      if (words.nonempty()) cy.fit(words, 48);
    });
    observer.observe(element);
    return () => {
      observer.disconnect(); simulation.current!.destroy(); cy.destroy();
      renderer.current = null; simulation.current = null;
    };
  }, [onRoot]);

  useEffect(() => {
    const sim = simulation.current!;
    sim.retarget(view);
    skipped.current = false;
    if (reduced) sim.instantSettle();
  }, [view, reduced]);

  useEffect(() => {
    const sim = simulation.current!;
    const cy = renderer.current!;
    updateGraph(cy, view, sim.positions(), rings);
    updatePositions(cy, sim.positions(), sim.origin);
    // Only initial camera placement is automatic on re-root; later pan/zoom stays intact.
    if (sim.generation === 1) {
      const radius = Math.max(1, ...view.words.map((word) => view.distances.get(word)!)) * RING_SPACING + 60;
      cy.zoom(Math.max(cy.minZoom(), Math.min(cy.maxZoom(), (Math.min(cy.width(), cy.height()) - 96) / (radius * 2))));
      cy.pan({ x: cy.width() / 2, y: cy.height() / 2 });
    }
  }, [view, rings, reduced]);

  useEffect(() => {
    let frame = 0;
    let cancelled = false;
    let previous = 0;
    let lastReport = 0;
    let frames = 0;
    let totalWork = 0;
    let totalInterval = 0;
    function tick(now: number) {
      if (cancelled) return;
      const sim = simulation.current!;
      const cy = renderer.current!;
      const interval = previous ? now - previous : 16.67;
      previous = now;
      const start = performance.now();
      if (!paused && !reduced && !skipped.current && !sim.settled) {
        sim.step(interval / 1000);
        updatePositions(cy, sim.positions(), sim.origin);
      }
      totalWork += performance.now() - start;
      totalInterval += interval;
      frames++;
      if (now - lastReport >= 500) {
        setStatus({ layer: sim.activeLayer, elapsed: sim.elapsed, workMs: totalWork / frames, frameMs: totalInterval / frames, generation: sim.generation, settled: sim.settled, instant: skipped.current, temperature: sim.temperature });
        lastReport = now; frames = 0; totalWork = 0; totalInterval = 0;
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [paused, reduced, onRoot]);

  function fit() {
    const cy = renderer.current!;
    cy.fit(cy.nodes('.word'), 48);
  }
  function zoom(factor: number) {
    const cy = renderer.current!;
    cy.zoom({ level: cy.zoom() * factor, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
  }
  function settle() {
    const sim = simulation.current!;
    sim.instantSettle(); skipped.current = true;
    updatePositions(renderer.current!, sim.positions(), sim.origin);
    fit();
  }
  function restart() {
    const sim = simulation.current!;
    sim.retarget(view); skipped.current = false;
    if (reduced) sim.instantSettle();
    updatePositions(renderer.current!, sim.positions(), sim.origin);
  }
  const inspectedWord = hovered && view.words.includes(hovered) ? hovered : view.root;
  return <>
    <div className="simulation-controls">
      <button type="button" onClick={() => setPaused((value) => !value)} disabled={reduced}>{paused ? 'Resume' : 'Pause'}</button>
      <button type="button" onClick={settle}>Skip animation</button>
      <button type="button" onClick={restart}>Restart transition</button>
      <label className="checkbox"><input type="checkbox" checked={reduced} disabled={systemReduced} onChange={(event) => setMinimalMotion(event.target.checked)} />Reduced motion</label>
      <span className="simulation-status">{reduced ? 'Reduced motion · instant placement' : paused ? 'Paused' : status.settled ? (status.instant ? 'Instantly settled' : 'Settled') : status.temperature < 1 ? `Cooling · ${Math.round(status.temperature * 100)}% temperature` : `Running · radial wave layer ${status.layer}`} · {status.elapsed.toFixed(1)}s · transition {status.generation}</span>
    </div>
    <div className="graph-frame">
      <div ref={container} className="graph-canvas" role="img" aria-label={`Animated word graph rooted at ${view.root.toUpperCase()}; ${view.words.length} visible words. Use root input or the visible word selector for keyboard navigation.`} />
      <div className="camera-controls" aria-label="Graph camera">
        <button type="button" onClick={() => zoom(1.3)} aria-label="Zoom in">+</button>
        <button type="button" onClick={() => zoom(1 / 1.3)} aria-label="Zoom out">−</button>
        <button type="button" onClick={fit}>Fit view</button>
      </div>
      <div className="node-inspector"><strong>{inspectedWord.toUpperCase()}</strong> · distance {view.distances.get(inspectedWord)} {inspectedWord === view.root ? '· selected root' : '· click to re-root'}</div>
    </div>
    <p className="muted frame-diagnostics">Recent mean frame interval: {status.frameMs.toFixed(1)} ms · simulation + coordinate submission: {status.workMs.toFixed(1)} ms/frame. Canvas drawing is not included in submission time.</p>
  </>;
}

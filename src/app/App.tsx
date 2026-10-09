import { useCallback, useMemo, useState, type SubmitEvent } from 'react';
import { graph, metadata } from '../data/dictionary';
import { normalizeWord } from '../graph/dictionary';
import { bfs } from '../graph/traversal';
import { selectView, MAX_VISIBLE_WORDS } from '../rendering/view';
import { LAYER_COLORS } from '../rendering/cytoscape';
import GraphCanvas from '../ui/GraphCanvas';

const format = (value: number) => value.toLocaleString('en-US');
const initialRoot = graph.adjacency.has('poop') ? 'poop' : null;

export default function App() {
  const [root, setRoot] = useState<string | null>(initialRoot);
  const [input, setInput] = useState(initialRoot?.toUpperCase() ?? '');
  const [error, setError] = useState('');
  const [radius, setRadius] = useState(2);
  const [rings, setRings] = useState(true);
  const result = useMemo(() => root ? bfs(graph, root) : null, [root]);
  const view = useMemo(() => result ? selectView(graph, result, radius) : null, [result, radius]);
  const selectRoot = useCallback((word: string) => {
    setRoot(word); setInput(word.toUpperCase()); setError('');
  }, []);
  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const word = normalizeWord(input);
    if (!word) { setError('Enter exactly four letters, A–Z.'); return; }
    if (!graph.adjacency.has(word)) { setError(`${word.toUpperCase()} is not in this ENABLE dictionary.`); return; }
    selectRoot(word);
  }

  return <main className="explorer">
    <header className="explorer-header">
      <div><span className="eyebrow">Poople Graph Explorer · M2</span><h1>One letter changes everything.</h1></div>
      <p className="muted">ENABLE · {format(graph.words.length)} words · {format(graph.edgeCount)} edges<br />Progressive radial force simulation</p>
    </header>
    <section className="workspace" aria-labelledby="explore-heading">
      <div className="toolbar">
        <h2 id="explore-heading" className="sr-only">Explore the word graph</h2>
        <form onSubmit={submit} className="root-form" noValidate>
          <label htmlFor="root-input">Root word</label>
          <div className="input-row"><input id="root-input" value={input} onChange={(event) => setInput(event.target.value)} autoComplete="off" spellCheck={false} aria-invalid={!!error} aria-describedby={error ? 'root-error' : 'root-help'} /><button type="submit">Explore</button></div>
        </form>
        <div><label htmlFor="radius">Visible distance</label><select id="radius" value={radius} onChange={(event) => setRadius(Number(event.target.value))}>
          {[0, 1, 2, 3].map((distance) => <option key={distance} value={distance}>{distance === 0 ? 'Root only' : `Up to ${distance} moves`}</option>)}
        </select></div>
        <label className="checkbox"><input type="checkbox" checked={rings} onChange={(event) => setRings(event.target.checked)} />Guide rings</label>
        <button type="button" className="quiet" onClick={() => selectRoot('poop')} disabled={!graph.adjacency.has('poop')}>Back to POOP</button>
      </div>
      {error && <p id="root-error" className="error" role="alert">{error}</p>}
      <p id="root-help" className="graph-help">Click a word to re-root. Scroll or pinch to zoom; drag the background to pan. Hover or zoom in for outer word labels. Root input accepts any word in the loaded dictionary.</p>
      {view && result ? <>
        <GraphCanvas view={view} rings={rings} onRoot={selectRoot} />
        <div className="view-info" aria-live="polite">
          <p><strong>{root!.toUpperCase()}</strong> · showing <strong>{format(view.words.length)}</strong> words and <strong>{format(view.edges.length)}</strong> edges within {radius} moves.</p>
          <p className="muted">{format(view.reachableCount - view.words.length)} reachable words hidden from this view. {view.capped && `Rendering capped at ${MAX_VISIBLE_WORDS} words; ${format(view.eligibleCount - view.words.length)} words inside the requested radius are omitted in BFS order.`}</p>
        </div>
        <div className="legend" aria-label="Shortest-path distance legend">
          {LAYER_COLORS.slice(0, Math.min(radius, result.eccentricity) + 1).map((color, distance) => <span key={distance}><i style={{ background: color }} />{distance === 0 ? 'Root · distance 0' : `Distance ${distance}`}</span>)}
        </div>
        <div className="keyboard-navigation"><label htmlFor="visible-word">Select a visible word (keyboard navigation)</label><select id="visible-word" value={root!} onChange={(event) => selectRoot(event.target.value)}>
          {[...view.words].sort().map((word) => <option key={word} value={word}>{word.toUpperCase()} · distance {view.distances.get(word)}</option>)}
        </select></div>
        <p className="muted">Rings show shortest-path distance from the root. Angles and edge lengths do not represent graph distance.</p>
      </> : <p>Select a valid word to begin.</p>}
    </section>
    <section className="graph-summary" aria-labelledby="summary-heading">
      <h2 id="summary-heading">Complete graph, exact distances</h2>
      <dl className="stats">
        <div><dt>Loaded words</dt><dd>{format(graph.words.length)}</dd></div>
        <div><dt>Components</dt><dd>{format(graph.components.length)}</dd></div>
        <div><dt>Root component</dt><dd>{view ? format(view.reachableCount) : '—'}</dd></div>
        <div><dt>Root eccentricity</dt><dd>{result?.eccentricity ?? '—'}</dd></div>
      </dl>
      <p className="muted">BFS and metrics use all loaded words, regardless of the visible radius or render cap. {view ? `${format(graph.words.length - view.reachableCount)} words are unreachable from ${view.root.toUpperCase()}.` : ''} The disconnected global graph has no finite extended-distance diameter.</p>
    </section>
    <footer><p>{metadata.attribution} <a href={metadata.sourceUrl}>Source & provenance</a> · revision <code>{metadata.sourceCommit.slice(0, 12)}</code></p><p className="muted">The official Poople dictionary remains an unverified future input. This explorer uses the pinned ENABLE snapshot.</p></footer>
  </main>;
}

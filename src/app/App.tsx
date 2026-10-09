import { graph, metadata } from '../data/dictionary';
import { bfs } from '../graph/traversal';

const root = graph.adjacency.has('poop') ? bfs(graph, 'poop') : null;
const reachableCount = root?.layers.reduce((sum, layer) => sum + layer.length, 0) ?? 0;
const isolateCount = graph.components.filter((component) => component.length === 1).length;
const largestComponent = Math.max(0, ...graph.components.map((component) => component.length));
const format = (value: number) => value.toLocaleString('en-US');

export default function App() {
  return (
    <main>
      <header>
        <span className="eyebrow">Poople Graph Explorer · M0</span>
        <h1>Four letters.<br />A world of connections.</h1>
        <p className="intro">A verified foundation for exploring word ladders. Two words share an edge exactly when one letter changes in the same position.</p>
      </header>

      <section aria-labelledby="graph-heading">
        <div className="section-heading">
          <h2 id="graph-heading">The complete loaded graph</h2>
          <span className="badge">ENABLE · locally bundled</span>
        </div>
        <dl className="stats">
          <div><dt>Words</dt><dd>{format(graph.words.length)}</dd></div>
          <div><dt>Undirected edges</dt><dd>{format(graph.edgeCount)}</dd></div>
          <div><dt>Components</dt><dd>{format(graph.components.length)}</dd></div>
          <div><dt>Isolated words</dt><dd>{format(isolateCount)}</dd></div>
        </dl>
        <p>Largest component: <strong>{format(largestComponent)} words</strong>. All counts are computed from the loaded dictionary.</p>
        {graph.components.length > 1 && <p className="muted">The graph is disconnected. Its global diameter is not finite under the extended-distance convention.</p>}
      </section>

      <section aria-labelledby="root-heading">
        <h2 id="root-heading">A first look from POOP</h2>
        {root ? <>
          <p><strong>{format(reachableCount)}</strong> reachable words · <strong>{format(graph.words.length - reachableCount)}</strong> unreachable words · component eccentricity <strong>{root.eccentricity}</strong>.</p>
          <p className="muted">BFS uses the entire graph. Each band below reports the number of words at that exact shortest-path distance.</p>
          <ol className="layers" start={0} aria-label="BFS distance layers from POOP">
            {root.layers.map((layer, distance) => <li key={distance}>
              <span>Distance {distance}</span><strong>{format(layer.length)}</strong><span>words</span>
            </li>)}
          </ol>
        </> : <p>POOP is absent from this dictionary. A valid root must be selected once root input is added in M1.</p>}
      </section>

      <footer>
        <p><strong>Foundation only.</strong> Graph rendering comes in M1; the interruptible radial force animation comes in M2.</p>
        <p>{metadata.attribution}</p>
        <p><a href={metadata.sourceUrl}>Dictionary source</a> · <a href={metadata.permissionNoticeUrl}>ENABLE permission documentation</a> · revision <code>{metadata.sourceCommit.slice(0, 12)}</code></p>
        <p className="muted">The official Poople dictionary remains an unverified future input. This explorer currently uses ENABLE.</p>
      </footer>
    </main>
  );
}

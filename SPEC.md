# Poople Graph Explorer — Product and Technical Specification

**Status:** Initial specification for implementation and experimentation  
**Primary goal:** Make shortest-path distance *visible* through an interactive, continuously animated, radially constrained graph layout.  
**First milestone:** A convincing, interruptible root-change animation on a real four-letter word graph—not a complete graph-analysis dashboard.

## 1. Vision

Build a standalone interactive network explorer for the graph of four-letter words. Two words are adjacent precisely when they differ at **exactly one corresponding character position** (Hamming distance 1). Users choose a root word and see its breadth-first-search (BFS) distance layers arranged as concentric radial regions. Clicking another word changes the root: **the existing graph physically reorganizes**, rather than disappearing and being redrawn or jumping between two unrelated layouts.

The defining interaction is the transition: the newly selected root smoothly comes to the center, neighbors move into the first distance band, and progressively more distant vertices follow. Force-directed behavior should remain visible during the change. Layers stabilize in a wave, but their vertices may continue moving tangentially to reflect their graph relationships.

The project began with an interest in the daily word-ladder game *Poople* (target word `POOP`). It should also be a general graph-theoretic exploration tool, not merely a game solver.

## 2. Objectives and non-goals

### Objectives

1. Show the graph induced by a configurable dictionary of four-letter alphabetic words.
2. Re-root at any valid word and compute exact BFS distance layers.
3. Use a **radially constrained force-directed simulation**, not only a precomputed circular layout.
4. Preserve vertex identity, position, and ideally velocity across root changes; allow interruption/re-targeting at any point.
5. Make simulation behavior adjustable and inspectable through a **layout laboratory**.
6. Provide correct shortest paths and useful graph properties later, without entangling them with rendering or physics.
7. Support a future switch between ENABLE and Poople's *verified* game dictionary.

### Non-goals for the first milestone

- Reproducing Poople's exact official dictionary or daily schedule without a verified source.
- Full graph-invariant dashboard, automated puzzle suggestions, user accounts, backend, database, or multiplayer.
- Production-grade performance for graphs far larger than the expected four-letter word graph.
- Perfectly optimized layouts. The first goal is an observable, controllable simulation with room to experiment.

## 3. Graph model and data provenance

Define the simple, undirected graph `G = (V, E)` where:

- `V`: distinct normalized four-letter words from the selected dictionary.
- `{u,v} ∈ E` iff `u` and `v` differ in exactly one of the four character positions.
- No self-loops, duplicate words, or multi-edges.
- Word IDs are stable within a loaded dictionary; display labels are uppercase.

**Initial data source:** a pinned, locally stored copy of `enable1.txt` from `https://github.com/dolph/dictionary` (inspect the license and include proper attribution). The app should load the dictionary as a static asset and work offline after bundling; do not depend on GitHub being reachable at runtime. Record source URL, retrieval date, source commit/hash, normalized word count, and optional SHA-256 in a small metadata file. Filter to exactly `[a-z]{4}`. Do not invent or approximate the official Poople dataset. Provide an import path for a custom newline-separated list in a later milestone or as a small optional enhancement.

**Efficient edge construction:** bucket each word by its four single-wildcard patterns (e.g., `*OOP`, `P*OP`, `PO*P`, `POO*`). Each bucket forms a clique; deduplicate edges. Prefer this over an all-pairs O(|V|²) comparison. Compute connected components once per dictionary. Keep disconnected components represented accurately: distance is unavailable/infinite between different components, and the global diameter is not finite under the extended-distance convention. Report component diameters separately.

**BFS:** for each root, compute distances `d_r(v)`, predecessors (for a representative shortest path), and layer memberships `L_k(r) = {v ∈ V : d_r(v)=k}`. The active visualization may show only the root's connected component. Isolates and disconnected words must never be silently treated as reachable.

## 4. User experience: the signature root transition

### Entry state

- Default root `POOP` if present; otherwise prompt for a valid root.
- Main canvas occupies the majority of the screen. Root input/search, visible layer radius, play/pause/reset, and layout settings are available without hiding the graph.
- Graph nodes retain labels or tooltips as appropriate. On dense layouts, use zoom-sensitive labels, hover, selection, and search rather than showing every label simultaneously.
- Colors distinguish BFS layers. Use an accessible palette and a legend; do not encode distance by color alone.

### Changing the root

1. User selects a visible vertex or enters a word.
2. Immediately compute BFS distances from the new root; retain the graph's **current world positions and velocities**.
3. Translate the simulation's target origin toward the new root (or move the camera deliberately; choose one consistent strategy so the perceived motion is intentional). The new root is smoothly brought to the canvas center and pinned there.
4. Assign every reachable vertex a target radius `R(d_r(v))`; `R(0)=0` and `R(k)` increases monotonically, with enough spacing for labels and edge geometry. Begin with `R(k) = k × spacing`, configurable.
5. Apply repulsive and edge-spring forces plus a radial restoring force whose strength activates **progressively by BFS layer**.
6. Once inner layers have settled sufficiently, strengthen their radial constraints while later layers keep adjusting. **Do not permanently freeze their angles** by default.
7. Allow users to select a third root while the previous animation is in flight: cancel or supersede the previous targets, preserve current positions/velocities, and re-target to the newest root without a jump.
8. Respect `prefers-reduced-motion`; provide a skip/instant-settle option and pause control.

### Two experimental policies

- **Primary — progressive radial constraint:** tighten each layer toward its target radius while allowing tangential motion. This is the default.
- **Alternative — progressive vertex locking:** after a layer stabilizes, lock each vertex's full position. This is intentionally experimental; it may create poor downstream local minima.
- **Baseline — direct interpolation:** useful as a control for evaluating whether the physics-driven approach actually improves clarity and feel.

Keep these policies interchangeable behind a layout strategy interface; do not bake one into graph rendering.

### Physics sketch

At a high level, minimize/approximate forces corresponding to:

`E(X) = k_s Σ_{uv∈E} (||x_u−x_v||−ℓ)^2 + k_q Σ_{u≠v} 1/(||x_u−x_v||+ε) + Σ_v k_r(v,t) (||x_v−x_root||−R(d_r(v)))²`

Implementation need not use numerical optimization directly. A practical force integration step is sufficient. Key details:

- Root force/pinning is explicit.
- Layer-dependent radial strength `k_r(v,t)` ramps smoothly, not abruptly.
- Edge springs and node repulsion remain active during the animation.
- Include damping, bounded time step, maximum velocity/acceleration, and collision handling or a minimum separation to prevent instability.
- Guard zero-distance normalization and NaNs; avoid O(n²) repulsion if the active graph is too large (quadtree/Barnes–Hut or appropriate approximation).
- Consider warm starts, seeded placement for newly displayed vertices, and optional angular continuity to prevent unnecessary swapping/rotation.
- Treat the conceptual energy above as a design guide, not an exact finalized objective; test and tune with real data.

**Important tradeoff:** exact BFS radial distance is mathematically meaningful, but the Euclidean positions are only a visualization. A radial ring is **not** a claim that vertices within that ring are mutually close, nor that any Euclidean length encodes graph geodesic length.

## 5. Layout laboratory

Provide real, connected controls (not decorative controls) for:

- Layout mode (progressive radial / full position locking / interpolation).
- Radial strength and layer wave delay (or propagation speed).
- Spring strength and preferred edge length.
- Repulsion strength and damping.
- Ring spacing, stabilization tolerance, and optional animation speed.
- Pause/resume, restart current transition, reset camera, and optional display of guide rings and velocity vectors.

Show current root, active settling layer, frame/simulation status, number of active vertices, and optionally energy or convergence diagnostics. Parameter changes should be reflected live where safe; parameters that require restart should say so explicitly. Offer presets and export/import of parameter settings as JSON after the base animation works.

## 6. Graph exploration capabilities (subsequent milestones)

### First after animation is convincing

- Enter/select a target and show one shortest path with distance and intermediates.
- Count shortest paths exactly, and show the **shortest-path DAG**: all vertices and edges belonging to at least one shortest `source → target` path. Do not equate showing one predecessor chain with the full DAG.
- Show BFS layer counts and expandable word lists; click any listed word to re-root.
- Show degree, component size, root eccentricity, and reachability.

### Later analysis

- Components, degree distribution, clustering, articulation points, bridges, biconnected components.
- Radius, center, periphery, and **exact diameter of an identified component**, with witness pair(s); use asynchronous or worker-based computations if costly. Make exact versus estimated metrics explicit.
- Export CSV/JSON of graph properties and layouts.
- Compare two verified dictionaries: removed/added vertices and edges, changed shortest paths, and changed layer membership.
- Poople mode: evaluate legal moves by change in distance to `POOP`; optionally overlay daily challenge only when its selection rules and dictionary have been verified.

## 7. Proposed architecture

Suggested stack: **Vite + React + TypeScript**, **Cytoscape.js** for graph display/interactions initially, **Vitest** for pure algorithms, and a dedicated simulation/controller module for custom animation. Avoid introducing an animation library automatically: assess whether `requestAnimationFrame` plus a force engine suffices, or whether `d3-force` is justified. Framer Motion / Motion can animate surrounding UI, but do not assume it should own thousands of node positions. Cytoscape supports manual positions and layouts; verify performance before committing to a per-node animation approach.

Suggested boundaries (names are provisional):

```
src/
  graph/       # dictionary normalization, adjacency, BFS, components, paths
  layout/      # pure-ish physics, radial targets, stage scheduler, strategies
  rendering/   # Cytoscape adapter, drawing and view/viewport concerns
  ui/          # word search, controls, metrics, layer lists
  data/        # word list metadata and loading
  app/         # state orchestration and integration
```

**Graph engine** should have no React/Cytoscape dependency. **Simulation state** should own node positions, velocities, pinning, targets, and an interruptible generation/version token. **Rendering** should consume simulation state and emit selection/input events; it must not secretly replace the simulation positions. Keep static graph topology separate from frequently updated position state to prevent unnecessary React rerenders.

Performance: benchmark actual vertex/edge counts after loading ENABLE. Start by rendering a bounded BFS radius or component subset if necessary; label when vertices are hidden or sampled. **Never sample the underlying graph for BFS or metrics**. For very large visible node sets, consider Canvas/WebGL or a worker-based simulation rather than insisting on Cytoscape if it struggles. Keep layout coordinate calculations world-space and decouple them from viewport zoom/pan.

## 8. Milestones and acceptance criteria

### M0 — Foundation and provenance
- Scaffold Vite/React/TS, lint/test tooling, and README.
- Pin/load local ENABLE data, normalize four-letter words, build adjacency/components.
- Unit tests: word normalization, one-letter differences, known tiny graphs, disconnected vertices, BFS layers.
- Report graph counts derived from data—no hard-coded counts.

### M1 — Real graph with stable root selection
- Render the root's selected subgraph and zoom/pan/select vertices.
- Root input validation and accurate BFS distance-coloring.
- Show/hide radial guide rings. Ensure nodes remain identifiable.
- Distinguish full graph metrics from visually sampled display.

### M2 — **Signature physics transition** (first meaningful demo)
- Existing positions survive root changes.
- Selected word smoothly becomes the pinned central root.
- Spring, repulsion, and radial constraints are visibly active.
- Layer strengths propagate outward over time.
- New root selection mid-transition does not crash, jump, or reuse stale animation jobs.
- Pause/resume, reduced motion, and reasonable frame rate on the chosen visible node count.
- Manual QA with repeated `POOP → OMEN → POOP`, rapid interruptions, and changes in layer radius.

### M3 — Layout laboratory
- Live parameter tuning and the three layout strategies.
- Diagnostic overlay, preset/reset controls, and optional exported parameter configuration.
- Record observed performance and key tuning decisions.

### M4 — Graph-theory explorer
- Paths, shortest-path DAG, BFS distribution, eccentricity, connected components, basic metrics.
- Exact diameter on demand, off the UI thread if needed, with component context and witness pair.

### M5 — Dictionary and game comparison
- Import/switch dictionaries and display verified provenance.
- Compare word sets and changed shortest paths, including `OMEN → POOP`.
- Don't assert the game has an exact nine-move optimum until recreated using the game's verified word set.

## 9. Quality and verification

- Unit-test edge symmetry, no loops/duplicates, correct Hamming-distance predicate, BFS invariant `|d(u)-d(v)| ≤ 1` for edges in a component, shortest-path reconstruction, and component behavior.
- Include small hand-checkable test graphs with known distance layers, multiple shortest paths, and disconnected cases.
- Test animation state transitions independently from UI wherever possible: new-root cancellation, no `NaN`/`Infinity`, pinned-root invariant, and correct ordering of strength activation.
- Verify input validation and keyboard accessibility. Implement hover/focus styles, adequate contrast, and a reduced-motion path.
- Run build, tests, and lint where configured after changes; report failures candidly.

## 10. Decisions and open questions

**Chosen:** separate explorer repository rather than forking the Poople engine as the foundation; static local dictionary; radial force layout with progressive layer constraints; explicit separation of graph algorithms, simulation, renderer, and UI; prioritize animation.

**Open to experiment:** renderer performance at full component scale; whether force integration lives in a worker; selection of a specific force library versus custom integrator; global motion versus a bounded neighborhood view; camera-follow mechanics; how best to seed angles; stability criterion; exact rings versus softly constrained radial bands.

**External references to inspect (not assumed dependencies):**
- Poople engine: https://github.com/PoopleGame/poople
- Poople developer write-up: https://pooplegame.com/blog/dev/how-we-built-poople
- Cytoscape documentation: https://js.cytoscape.org/
- ENABLE word list: https://github.com/dolph/dictionary

## 11. First Codex instruction

Read `SPEC.md` and `AGENTS.md`. **Do not implement the entire specification at once.** First inspect the working directory, propose a concise architecture and implementation plan for M0–M2, flag any assumption requiring verification (especially dictionary provenance and renderer performance), and then proceed with M0 only unless explicitly asked to implement more. Keep the animation engine testable and independent of Cytoscape.

# Poople Graph Explorer

An interactive four-letter word graph explorer, built incrementally toward an interruptible, radially constrained force-directed re-root animation. Product requirements are in [SPEC.md](SPEC.md).

## Current milestone: M1

The foundation and renderer are implemented: Vite/React/TypeScript, lint and test tooling, a versioned local ENABLE dictionary, pure graph algorithms, and Cytoscape graph rendering. Select a root by typing, clicking a node, or using the keyboard word selector. Choose a visible BFS radius, toggle guide rings, zoom/pan, and fit the camera. The current radial layout updates instantly on re-root; simulation and the signature continuous animation are M2.

## Run

Use Node 24 LTS (Node 22.18+ also meets the minimum).

```sh
npm ci
npm run dev
```

Open the localhost URL printed by Vite. The app makes no runtime dictionary requests and bundles a four-letter extract, so a locally served production build works without an external network connection. This does not yet provide a service worker or offline page caching.

```sh
npm test
npm run lint
npm run typecheck
npm run build
npm run data:verify
npm run preview
```

## Data and reproducibility

The source is [dolph/dictionary](https://github.com/dolph/dictionary), pinned at `233d25a56b9ac8bef906916ccf091a976995cce0`. Original bytes, the bundled extract, permission documentation and metadata live in `src/data/enable-v1/`. ENABLE credits Alan Beale and M. Cooper; its published documentation dedicates the word list to the public domain. The mirror has no separate license file; see [data provenance](src/data/README.md) for the evidence and its scope.

Metadata records retrieval date, source URLs/revision, SHA-256 hashes, normalization and word count. `node scripts/prepare-data.mjs` regenerates the extract and metadata from retained source bytes; `npm run data:verify` checks the hashes, exact extract, count and graph summary without a network request. Review any metadata changes when regenerating rather than treating regeneration as verification.

Measured from this snapshot: **3,903 vertices, 21,002 undirected edges, 78 components, 65 isolates**. The largest component has **3,807 words** and contains POOP; its eccentricity from POOP is **14**. These are ENABLE measurements, not official Poople game facts. Counts in the application are computed from data, not hard-coded.

The exact official Poople dictionary remains an **unverified future input**.

## Implementation decisions

- `src/graph/` has no React, renderer, animation or browser dependencies. Lowercase words are stable IDs; presentation uses uppercase labels. Parsing filters invalid dictionary lines; graph construction rejects invalid supplied vertices.
- Wildcard buckets generate a simple undirected graph. Adjacency is deterministic and symmetric; connected components are computed once per loaded dictionary. Arrays are frozen; maps are exposed through TypeScript read-only interfaces and must not be mutated by consumers.
- `bfs` returns a distance entry for every loaded word; `null` means unreachable. Unknown roots/endpoints throw. Layers contain only reachable vertices. Eccentricity is scoped to the root's component. The disconnected global graph has no finite extended-distance diameter; exact component diameters are later work.
- `shortestPath` returns one deterministic predecessor chain, or `null` for disconnected endpoints. It does not claim to compute the shortest-path DAG or path count.
- `src/data/dictionary.ts` loads the small static extract and builds topology once outside React. The M0 page reads that complete graph. There is no visibility sampling yet.
- `src/rendering/view.ts` selects radius 0–3 (default 2), capped at 600 words in BFS traversal order. This keeps a root predecessor path for every included node. It reports full reachable/eligible counts separately from visible word/edge counts. No BFS or metrics are computed using Cytoscape's displayed subset.
- `src/layout/radial.ts` seeds deterministic world-space rings at 180-unit spacing; Cytoscape consumes those positions using the preset layout. This is the static M1 baseline; positions reset on re-root pending M2's simulation. Angles/edge lengths carry no graph-distance meaning.
- The Cytoscape adapter updates surviving node objects rather than rebuilding the renderer. Guide rings are noninteractive background nodes, excluded from view counts, graph algorithms and camera fitting. Camera coordinates are independent of world positions. React does not store per-node coordinates; the host destroys Cytoscape and disconnects its resize observer on unmount.
- Root and neighbor labels remain visible; outer labels appear on hover or at closer zoom. The legend and word inspector report numeric distance; keyboard root input and a visible-word selector provide alternatives to canvas interactions.
- M2 will introduce simulation-owned positions/velocities, smoothly retargeted radial constraints and cancellation generations. Animated renderer throughput, forces and the root-centering policy still need measurement; M1 does not establish an animation frame-rate benchmark.

## Verification and review

Tests use hand-checkable square, clique and disconnected fixtures plus an independent Hamming-distance oracle. They cover normalization, edge symmetry, no loops/duplicates, components, BFS membership, unreachable distances, unknown words, path reconstruction and real-data provenance/partition checks.

M1 adds tested view radius/cap selection, unchanged complete-graph distances, finite radial positions, induced edges and headless adapter updates/identity. All 23 tests, lint, typecheck, build and data verification pass.

Manual M1 checks: `POOP → OMEN → POOP`, canvas-node re-rooting, unknown `XXXX` preserving the current graph, isolate `ABRI` (one node/zero edges; eccentricity 0), radius changes, BATS radius 3 (600 visible words, 595 omitted within the radius), ring toggle and camera buttons. Inspect narrow viewports, keyboard root/word selection, hover labels and background panning. The public repository is at https://github.com/Doogan1/poople-graph-explorer.

Animation QA (rapid interruptions, pause/resume and reduced motion) belongs to M2, when animation exists. M1 changes remain uncommitted for milestone review.

The repository tracks source code, tests and pinned data. Generated builds, installed dependencies and the local npm cache are excluded by `.gitignore`.

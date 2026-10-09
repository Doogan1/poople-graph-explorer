# Poople Graph Explorer

An interactive four-letter word graph explorer, built incrementally toward an interruptible, radially constrained force-directed re-root animation. Product requirements are in [SPEC.md](SPEC.md).

## Current milestone: M2

The foundation, renderer and signature simulation are implemented: Vite/React/TypeScript, lint and test tooling, a versioned local ENABLE dictionary, pure graph algorithms, Cytoscape graph rendering, and an interruptible radial force controller. Select a root by typing, clicking a node, or using the keyboard word selector. Choose a visible BFS radius, toggle guide rings, zoom/pan, fit the camera, pause/resume, restart, or skip animation. Reduced motion is available as a checkbox and automatically honors the system preference.

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
- `src/rendering/view.ts` selects radius 0–3 (default 2), capped at 200 words in BFS traversal order. This keeps a root predecessor path for every included node. It reports full reachable/eligible counts separately from visible word/edge counts. No BFS or metrics are computed using Cytoscape's displayed subset. M2 lowered the M1 cap of 600 after measuring poor animated throughput.
- `src/layout/radial.ts` seeds newly seen words deterministically with 180-unit ring spacing. `src/layout/simulation.ts` owns cached bodies, velocities, targets and a stopped/manual d3-force engine. Existing bodies survive view changes. Hidden bodies are retained but excluded from active forces; newly displayed words are seeded, so entering/leaving the bounded view can still change visible topology. Angles/edge lengths carry no graph-distance meaning.
- Re-rooting rebases every cached coordinate around the selected root and adds an equal display offset. Existing displayed positions are continuous, non-root velocities are preserved, and the new root is pinned at local `(0, 0)`. The offset exponentially approaches zero, bringing the root to the world center while the camera stays independent. Root velocity is explicitly zeroed; a never-seen root starts at the origin because it has no prior position to preserve.
- Spring forces (preferred length 95), Barnes–Hut repulsion, collision radius 18 and damping remain active. Radial strength ramps with a 0.45-second layer delay and 0.8-second smoothstep ramp. Progressive radius correction damps radial velocity while retaining tangential motion. These values are experimental tuning choices, not mathematical optima. M3 will expose the layout laboratory.
- Integration runs at fixed 1/60-second steps, bounds each received time gap to 0.05 seconds, and caps per-tick velocity at 30 world units. Under sustained low frame rate the simulation runs slower than wall time. Zero-radius normalization uses a deterministic direction. Instant settle projects radii, zeros velocity and centers the origin; skip holds that state until restart/re-root. Reduced motion applies instant placement and disables animation.
- The Cytoscape adapter updates surviving node objects rather than rebuilding the renderer. Per-frame updates submit only coordinates; topology and styles change on view updates. Guide rings follow the moving display origin and are noninteractive, excluded from view counts, graph algorithms and camera fitting. React stores controls and throttled diagnostics, never node coordinates. One cancellable requestAnimationFrame loop owns stepping; there are no per-root timers. The host stops the controller, cancels its frame loop, destroys Cytoscape and disconnects its resize observer on unmount.
- Root and neighbor labels remain visible; outer labels appear on hover or at closer zoom. The legend and word inspector report numeric distance; keyboard root input and a visible-word selector provide alternatives to canvas interactions.
- Camera pan/zoom is preserved when roots change. Initial placement, explicit Fit view and container resizing can change the camera. Guide rings follow the moving root during a transition; exact distance remains in labels/legend while nodes approach their target radii.

## Verification and review

Tests use hand-checkable square, clique and disconnected fixtures plus an independent Hamming-distance oracle. They cover normalization, edge symmetry, no loops/duplicates, components, BFS membership, unreachable distances, unknown words, path reconstruction and real-data provenance/partition checks.

The 31 tests cover graph/data invariants, view radius/cap selection, unchanged complete-graph distances, finite radial seeds, induced edges, adapter identity/coordinate submission and simulation invariants: pinned root, finite long runs, preserved re-root positions and velocities, newest transition generation, outward radial activation, bounded time gaps, instant settle, cache reuse, isolates, angular motion during the transition, and cooling to stationary positions with reheating on re-root. Tests, lint, typecheck, build and data verification pass. The build warns about its approximately 677 kB JavaScript chunk (220 kB gzipped); bundle splitting remains a possible optimization.

After the outer radial wave completes, force temperature decays exponentially and damping increases. Repulsion, springs, collisions and the custom radial force all cool together. Once temperature falls below 0.5%, velocities are zeroed and coordinate submissions stop. Default radius two settles after approximately 5.7 seconds of simulation time; radius three after approximately 6.1 seconds. This is a deterministic cooldown policy, not proof of an optimal force equilibrium. Tangential motion remains available during the transition; no permanent position locks are added. Re-rooting, radius changes and restart reheat the simulation while preserving cached positions.

Manual checks include `POOP → OMEN → OMER → POOP` in rapid succession; pause, unknown input and re-root while paused, resume, restart, skip, reduced-motion checkbox, and `ABRI` (one node/zero edges). A paused canvas screenshot remained byte-identical after invalid input. BATS radius 3 now shows 200 vertices/1,331 edges and explicitly reports 995 omitted inside the requested radius. Inspect node clicking, narrow viewports, keyboard root/word selection, ring toggling, hover labels and panning. System reduced-motion listener behavior is implemented; browser QA exercised the equivalent app toggle without changing the user's OS setting.

Observed on this machine/in-app browser: default POOP (93 nodes, 331 edges) averaged around 16.7 ms/frame (~60 fps), with about 1 ms of simulation/coordinate submission. Animated BATS at the former 600-node cap averaged 146 ms/frame (~7 fps); at 200 nodes it averaged 38.5 ms/frame (~26 fps), with 4.2 ms submission work. These are short local samples, not cross-device guarantees; submission time excludes canvas drawing. Dense Cytoscape rendering is still a performance limitation.

For reproducible simulation-only timing and real-data interruption checks, run `node scripts/benchmark-simulation.mjs`. One local Node run measured 0.90 ms/step at 93 nodes, 1.88 ms at 200, and 4.02 ms at 600. It includes no renderer, so these measurements do not predict browser frame rate.

The public repository is at https://github.com/Doogan1/poople-graph-explorer. M2 includes the cooling refinement. The layout laboratory (M3) and advanced paths/metrics (M4) remain deferred.

## Deployment

[Live GitHub Pages site](https://doogan1.github.io/poople-graph-explorer/).

`.github/workflows/pages.yml` verifies tests, lint and dictionary hashes, builds with the `/poople-graph-explorer/` asset base, then publishes `dist` using GitHub Pages Actions. Pushes to `main` deploy automatically; the workflow can also be dispatched manually from GitHub Actions. Node 24 and the npm lockfile make the build reproducible. The Pages repository setting uses GitHub Actions as its source.

No server, GCP resource, runtime secrets or database is required. For a local production preview using the same asset path, run `npm run build -- --base=/poople-graph-explorer/` and `npm run preview`, then open `/poople-graph-explorer/` on the printed localhost URL. Normal `npm run dev` stays at `/`.

The repository tracks source code, tests and pinned data. Generated builds, installed dependencies and the local npm cache are excluded by `.gitignore`.

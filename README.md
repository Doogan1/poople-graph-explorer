# Poople Graph Explorer

An interactive four-letter word graph explorer, built incrementally toward an interruptible, radially constrained force-directed re-root animation. Product requirements are in [SPEC.md](SPEC.md).

## Current milestone: M0

The foundation is implemented: Vite/React/TypeScript, lint and test tooling, a versioned local ENABLE dictionary, normalization, wildcard-bucket adjacency, connected components, complete-graph BFS layers and representative shortest paths. The initial page reports computed graph counts and BFS layer sizes from POOP. Graph rendering and root input are M1; simulation and animation are M2.

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
- M1 will introduce a Cytoscape adapter and explicit visible-radius selection, with all BFS still on the complete graph. M2 will introduce simulation-owned positions/velocities, smoothly retargeted radial constraints and cancellation generations. Renderer performance and the root-centering policy need measurement before choosing the final implementation.

## Verification and review

Tests use hand-checkable square, clique and disconnected fixtures plus an independent Hamming-distance oracle. They cover normalization, edge symmetry, no loops/duplicates, components, BFS membership, unreachable distances, unknown words, path reconstruction and real-data provenance/partition checks.

For manual M0 review, open the page at desktop and narrow viewport sizes, check the counts against `npm run data:verify`, and navigate attribution links with the keyboard. Animation QA (`POOP → OMEN → POOP`, rapid interruptions, pause/resume and reduced motion) belongs to M2, when animation exists.

The repository tracks source code, tests and pinned data. Generated builds, installed dependencies and the local npm cache are excluded by `.gitignore`.

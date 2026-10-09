# M0 Foundation Implementation Plan

**Goal:** Deliver a locally bundled, reproducible four-letter dictionary and tested graph engine with a minimal React summary page.

**Architecture:** Pure TypeScript modules own normalization, topology, components, BFS and path reconstruction. The data module builds one complete graph from a bundled asset; React displays computed values. Rendering and simulation are reserved for M1 and M2.

**Tech stack:** Vite, React, TypeScript, Vitest, ESLint. Node 24 is available.

**Spec:** `SPEC.md`; approved M0–M2 architecture in chat. Execute inline in the existing directory; do not commit or alter the supplied specification.

## Constraints

- Only normalized `[a-z]{4}` words; stable lowercase IDs and uppercase labels.
- Undirected edges iff exactly one corresponding character differs.
- Full loaded graph used for BFS and metrics; unreachable distances explicit.
- Pin ENABLE source revision, SHA-256, normalization count and permission evidence.
- No runtime network calls. No claims about the official Poople dictionary.

## Tasks

### 1. Tooling and reproducible data

- [x] Create package scripts for dev, build, typecheck, lint, test, and data verification.
- [x] Add strict TypeScript, Vite and ESLint configuration, HTML entry and ignores.
- [x] Retrieve `enable1.txt` from dolph/dictionary revision `233d25a56b9ac8bef906916ccf091a976995cce0`.
- [x] Preserve source bytes and permission evidence, record retrieval date, URLs, hash and normalized count in metadata.
- [x] Install pinned dependency versions and preserve the npm lockfile.

### 2. Graph engine (test first)

Create `src/graph/dictionary.ts`, `topology.ts`, `traversal.ts`, and `graph.test.ts`.

- [x] Write normalization tests: uppercase, whitespace, CRLF, duplicate words, invalid/non-ASCII tokens and empty input.
- [x] Write tiny fixtures with a four-node square (`cold`, `cord`, `bold`, `bord`) plus `zzzz`; assert exact neighbors, two components, BFS layers, unreachable word, unknown root and shortest paths.
- [x] Run tests against stubs and observe assertion failures before implementing behavior.
- [x] Implement wildcard buckets and symmetric adjacency; compute components once. Expose `buildGraph(words)`, `bfs(graph, root)`, `shortestPath(graph, source, target)` and `parseDictionary(text)`.
- [x] Verify all adjacency pairs against independent Hamming-distance checks and BFS edge invariants; run the tests again.

### 3. Integration and documentation

Create `src/data/dictionary.ts`, `src/app/App.tsx`, `src/main.tsx`, and `src/styles.css`.

- [x] Load the pinned text with a Vite raw import and compute topology independently of React.
- [x] Show computed vertex/edge/component/isolate counts and POOP BFS reachability, with source attribution. No graph renderer or animation controls in M0.
- [x] Add real-data tests for hash/count metadata, adjacency symmetry, component partition and BFS coverage.
- [x] Document run commands, provenance reproduction and module boundaries in README.
- [x] Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` and `npm run data:verify`; inspect outputs before reporting completion.
- [x] Stop at the M0 review boundary; retain M1 and M2 as the next work.

# M1 Rendering Implementation Plan

**Goal:** Render the real dictionary graph with valid root selection, exact BFS colors and controllable guide rings.
**Spec:** `SPEC.md`, M1; M0–M2 architecture approved in chat and M1 explicitly requested.
**Architecture:** Complete-graph BFS feeds a pure visible-view selector; a separate static radial placement module provides initial world coordinates. Cytoscape consumes topology and positions through an adapter. React owns root/view controls, not node coordinates. The current layout is an M1 baseline, not M2 physics.
**Execution:** Inline in the existing checkout. Leave changes uncommitted for milestone review.

- [x] Test view selection with a square plus isolate: radius zero/one/two, full-graph BFS unchanged, edge uniqueness, unknown input and a budget-limited outer layer.
- [x] Implement `selectView(graph, bfsResult, radius, limit)` returning visible words/edges, eligible count, capped flag and full reachable count. Default radius 2; range 0–3; maximum 600 rendered words. Fill in BFS traversal order so included words retain a predecessor path to the root.
- [x] Test and implement static radial coordinates: root at origin, finite positions, correct distance radii and repeatable placement. Keep coordinates independent of React/Cytoscape.
- [x] Test adapter updates in headless Cytoscape for correct edges/colors/positions, persistent surviving node identity and removal of stale words/rings. Render guide rings as noninteractive background elements; exclude them from metrics and camera fitting.
- [x] Add React graph host with lifecycle cleanup/ResizeObserver, zoom/pan, click-to-root, hover word/distance details, guide toggle and fit/zoom controls.
- [x] Replace M0 landing with graph-first M1 interface: validated root form, visible radius, keyboard node selector, text distance legend, complete graph/component counts and explicit hidden/capped counts. Keep provenance and M0 graph tests.
- [x] Run tests, lint, typecheck, build and data verification. Inspect POOP/OMEN re-rooting, unknown input, isolate, ring toggle, zoom/pan and narrow viewport. No physics or animation controls yet.
- [x] Update README with design choices, test results and manual checks; independent code review; stop at M1.

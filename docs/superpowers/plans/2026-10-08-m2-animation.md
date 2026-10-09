# M2 Signature Animation Implementation Plan

**Goal:** Interruptible force-driven re-rooting with preserved world positions, progressive radial constraints, pause/resume and reduced motion.
**Spec:** `SPEC.md`, M2; M0–M2 design approved and M2 explicitly requested after pushing M1.
**Architecture:** A pure TypeScript controller owns cached positions/velocities and a stopped, manually stepped d3-force simulation. Barnes–Hut repulsion, links and collision forces stay active. Layer-dependent radial strengths ramp outward. Cytoscape only consumes snapshots. React owns controls and throttled diagnostics.

Root local coordinates are pinned at zero. Re-rooting rebases cached positions while compensating with a display offset, preserving current rendered coordinates; the offset smoothly tends to zero. A single requestAnimationFrame loop reads current targets, with cancellation on unmount and no per-root timers. Visible-view changes preserve cached bodies; hidden bodies are excluded from forces but retained for later reappearance. BFS remains on the complete dictionary.

- [x] Write controller tests for finite positions, root pinning, preserved rendered positions and velocities, superseded transitions, bounded time steps, outward constraint activation, instant settle and changing visible subsets.
- [x] Run tests against a stub, implement controller with deterministic seeding and velocity bounds, then verify tests.
- [x] Separate topology updates from per-frame coordinates in the adapter; make guide rings follow the current displayed origin. Test ring and coordinate updates without changing topology.
- [x] Integrate one cancellable frame loop, pause/resume, skip/instant settle, restart, reduced-motion media query, and throttled status/frame-time diagnostics. Keep camera stable during re-root and fit only explicitly/on resize.
- [x] Run complete tests/lint/typecheck/build/data verification; browser QA POOP→OMEN→POOP, rapid mid-flight selections, pause/re-root/resume, visible-radius changes, isolate and reduced motion.
- [x] Record measured frame timing separately from tuning assumptions, update README, run independent review, and stop for M2 review with changes uncommitted.

# Codex instructions — Poople Graph Explorer

## Mission
Build an interactive four-letter word graph explorer whose signature is an **interruptible, radially constrained, force-directed re-root animation**. Read `SPEC.md` for the authoritative product and technical requirements.

## How to work
- Before substantial edits: inspect the repository, identify the current milestone, and provide a short plan with assumptions/tradeoffs.
- **Work incrementally.** Do not attempt M0–M5 in one pass. Prioritize M0 (graph/data), M1 (rendering), then M2 (signature animation). Ask for review at meaningful milestone boundaries when working interactively.
- Favor a small, demonstrable vertical slice over broad untested scaffolding. Avoid speculative abstractions and premature dependencies.
- Preserve intentional user changes and unrelated files. Do not overwrite, delete, reset, or commit unless requested.
- If a tool or dependency is unavailable, state the blocker clearly; don't claim tests or builds were run when they weren't.
- Keep a concise implementation note in the README for design decisions and how to run the project.

## Core invariants
- Words are normalized four-letter strings. An undirected edge exists iff two words differ at exactly **one character position**.
- The graph engine is independent of React, Cytoscape, and animation code.
- **BFS and metrics always use the complete loaded graph**, regardless of any visibility or performance sampling in the renderer.
- Handle disconnected components and unknown words explicitly. Never invent graph statistics or game dictionary facts.
- Position/velocity state belongs to the simulation, not React. On re-root, preserve current positions and smoothly re-target; avoid layout resets.
- Pin the selected root at the center in simulation coordinates. Progressive radial constraints should allow tangential motion in the default layout strategy.
- A new root selection during an animation supersedes prior schedules cleanly; no stale updates, `NaN`s, jumps, or unmounted component writes.
- UI controls must affect the actual model; never add placebo controls.

## Preferred implementation
- Vite, React, TypeScript; Cytoscape.js as the *initial* renderer, subject to benchmarking.
- Pure TypeScript utilities for dictionary parsing, graph construction, BFS, components, and shortest paths.
- Separate layout controller for forces, layer propagation, constraints, and animation strategies. Use a library only when it tangibly simplifies the task.
- Keep per-frame coordinate updates outside React component state where feasible. Keep camera and world coordinates separate.
- Ship the dictionary as a versioned static asset with source/license and reproducibility metadata; don't require external network calls at runtime.
- Keep the exact official Poople dictionary an **unverified future input** until its provenance can be confirmed.

## Tests and review
- Test graph adjacency, BFS, layer membership, components, and disconnected cases with tiny fixtures.
- Test the simulation's invariants (finite positions, pinned root, superseded transitions) where practical.
- After code changes, run the relevant test, lint, typecheck, and build scripts available in the repository; summarize the results.
- For animation work, explicitly describe what to inspect manually (especially `POOP → OMEN → POOP`, rapid re-rooting, pause/resume, and reduced motion).
- Clearly separate measured results from guesses and experimental design choices.

## Current first task
Read this file and `SPEC.md`. Inspect the directory. Propose the architecture and M0–M2 execution sequence, then implement **M0 only** unless the user explicitly expands the scope.

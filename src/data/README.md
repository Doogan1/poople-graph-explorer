# ENABLE data provenance

`enable-v1/enable1.txt` preserves the original bytes from the pinned dolph/dictionary revision recorded in `metadata.json`. `four-letter.txt` is the deterministic extract actually bundled into the app. No external requests are needed at runtime.

The dolph mirror has no separate license file. ENABLE's published documentation, retained as `README-enable2k.txt`, states that the word list was placed in the public domain. This document describes the millennial ENABLE edition; it is permission evidence for the ENABLE family, not proof that this mirror exactly matches that edition. Its word counts are not used as measurements of our data. Credits: Alan Beale and M. Cooper; mirror: dolph.

The metadata records source revision, URLs, retrieval date, normalization rule, normalized count, and SHA-256 hashes for original bytes, derived extract and permission evidence. This is an ENABLE dataset, not a verified official Poople dictionary.

To reproduce the extract from the retained source: `node scripts/prepare-data.mjs`. To independently check metadata, bytes and computed graph counts: `npm run data:verify`. These commands work locally without downloads. Node 22.18+ or 24 is required for built-in TypeScript stripping used by the data scripts.

# IFC Web Viewer — Test Plan

Living document. Each slice adds its acceptance criteria and records how they were verified.

## How we test

| Level | Tool | What it covers |
|-------|------|----------------|
| Unit | Vitest, `tests/domain/` | Pure logic: file validation, tree building, property formatting |
| Integration | Vitest, `tests/integration/` | IFC conversion with the real library. Needs a private sample model in `samples/`; skipped automatically when absent (for example on GitHub) |
| Manual / browser | Dev server + real IFC file | Rendering, camera, UI behaviour |
| CI | GitHub Actions (`.github/workflows/ci.yml`) | Lint, type-check, build and tests on every push and pull request |

Test model used so far: `Architectural Model_g_gane.ifc` (Revit 2026 export, IFC4X3_ADD2, 10.1 MB, 656 elements with geometry).

## Slice S1 — Load and display (R1, R2, R3, R4, R9)

| # | Acceptance criterion | Requirement | How verified | Result |
|---|----------------------|-------------|--------------|--------|
| S1-1 | Choosing or dropping an `.ifc` file shows the model | R1 | Manual: file input with the sample | Pass |
| S1-2 | IFC4X3 loads. IFC2x3 and IFC4 are accepted by validation | R1 | Unit tests (schema detection); IFC4X3 loaded manually | Pass. IFC2x3 and IFC4 **files** not yet loaded (planned S6) |
| S1-3 | Progress is shown (reading, converting %, loading) | R1 | Manual: all three stages observed | Pass |
| S1-4 | UI stays responsive during conversion | R1 | Long-task observer during a 10 MB load: no task over 50 ms | Pass. Frame-rate measurement was not possible because the browser pane was hidden |
| S1-5 | Load time is reasonable | R1 | Measured end to end | 1.8 s for 10.1 MB |
| S1-6 | Left-drag orbits, wheel zooms, right-drag pans | R2 | Manual: drag and wheel checked; right-drag pan not exercised | Pass (pan unverified) |
| S1-7 | Model is centred and fully visible after load and on Reset view | R3 | Manual screenshots | Pass |
| S1-8 | Model upright (Z-up IFC shown Y-up) | R3 | Manual | Pass |
| S1-9 | Model is clearly lit; light and dark background toggle | R4 | Manual | Pass |
| S1-10 | Wrong extension, empty file, non-IFC text, unsupported schema each show a readable error | R9 | Unit tests + manual with 4 bad files | Pass |
| S1-11 | Valid header but corrupt data shows a readable error, not a library message | R9 | Manual with a crafted file (found and fixed in S1) | Pass |
| S1-12 | After any error the previous model stays loaded and usable | R9 | Manual | Pass |
| S1-13 | Exactly one canvas under React dev double-mount | Design section 2 | Manual DOM count | Pass |
| S1-14 | File over 200 MB rejected | R1 | Unit test | Pass |

### Known gaps carried forward
- Right-drag pan not exercised in S1 testing.
- IFC2x3 and IFC4 sample files still needed (S6).
- Very large files (near the 200 MB cap) not yet tried. Memory use unknown.
- Production build not yet run in a browser (S6). The build succeeds, but a bundle over 2 MB is flagged.

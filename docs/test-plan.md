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

## Slice S2 — Model info panel (R5)

| # | Acceptance criterion | Requirement | How verified | Result |
|---|----------------------|-------------|--------------|--------|
| S2-1 | After load the panel shows file name, size, IFC schema, project name and element count | R5 | Manual with the sample: `Architectural Model_g_gane.ifc`, 9.7 MB, IFC4X3_ADD2, project `16-048`, 656 elements. Values match the S1 spike | Pass |
| S2-2 | File size is formatted like Windows Explorer (1024-based, one decimal) | R5 | Unit tests (11 cases including bounds and invalid input) | Pass |
| S2-3 | Project name uses `Name`, falls back to `LongName`, ignores blank or non-text values | R5 | Unit tests using the real `getItemsData` shape | Pass |
| S2-4 | A project with no usable name shows "Unnamed project" | R5 | Code path only. Not exercised in the browser (no such model available) | Untested in browser |
| S2-5 | Opening a second model replaces the panel content and disposes the first model | R1, R5 | Manual: same file reopened under a different name. One canvas, one panel, no console errors | Pass (same model only) |
| S2-6 | A failed open leaves the previous model and its panel unchanged | R9 | Manual with a bad file after a good one | Pass |
| S2-7 | Panel readable in the light and dark themes | R4 | Manual screenshots | Pass |

### Known gaps carried forward
- S2-4 needs a model without a project name. Look for one in S6, when IFC2x3 and IFC4 samples are added.
- Replacing a model was only tested with the same file, not a different model.
- The camera is framed before the sidebar appears; it looked correct at 800 px wide, but narrow windows were not tested. **Reset view** re-frames.
- "Elements (with geometry)" counts items that have 3D geometry. A curtain wall or ramp that only groups other elements is not counted itself.

# IFC Web Viewer — Design (v1.1)

Status: **Approved v1.1**
Implements: `docs/requirements.md` v1.1

## 1. Technology decisions

| Area | Choice | Why |
|------|--------|-----|
| Language | TypeScript (strict) | Catches errors early; required by the That Open libraries' typings |
| UI | React 19 | Owner's preference; good fit for panels, tree and toolbar |
| Build / dev server | Vite | Fast, standard, first-class WASM/worker support |
| 3D rendering | Three.js 0.186 (plain, no React Three Fiber), OrbitControls from `three/addons` | IFC libraries are imperative and work directly with Three.js |
| IFC conversion + display | `@thatopen/fragments` 3.4.7 (`IfcImporter`, `FragmentsModels`) on `web-ifc` 0.0.77 | Actively maintained; provides load, raycast, highlight, visibility, properties and spatial structure in a worker. `web-ifc-three` (last updated Jan 2024) is rejected. `@thatopen/components` is deferred: it adds a wrapper layer and dependencies we do not need for the MVP, and can be added later |
| Self-hosting | Fragments worker and `web-ifc` WASM served from our own `public/` | No runtime dependency on a CDN |
| Unit tests | Vitest | Same config as Vite |
| Hosting | Static site | No backend needed (R-NFR privacy) |

Versions are pinned exactly in `package.json`. The That Open API changes between minor versions, so upgrades are deliberate.

## 2. Architecture

Two layers with one strict boundary.

```
┌──────────────────────────── React UI layer ────────────────────────────┐
│ App                                                                     │
│  ├─ DropZone / FilePicker        (R1)                                   │
│  ├─ ViewportCanvas               (hosts the <canvas>; R2, R3, R4)       │
│  ├─ ModelInfoPanel               (R5)                                   │
│  ├─ SpatialTree                  (R6)                                   │
│  ├─ PropertiesPanel              (R7)                                   │
│  ├─ VisibilityPanel              (R8)                                   │
│  └─ ErrorBanner                  (R9)                                   │
│                        ▲ plain data (JSON-like)   │ commands            │
├────────────────────────┼─────────────────────────┼─────────────────────┤
│                  useViewer() hook  (only bridge)                        │
├────────────────────────┼─────────────────────────┼─────────────────────┤
│ Engine layer (no React imports)                   ▼                     │
│  ViewerEngine                                                           │
│   ├─ scene, camera, renderer, OrbitControls        (Three.js)           │
│   ├─ IfcImporter + FragmentsModels (web-ifc WASM, worker)               │
│   ├─ Selection  (raycast pick + highlight)                              │
│   └─ Visibility (hide / isolate by class or node)                       │
└─────────────────────────────────────────────────────────────────────────┘
        Pure logic (no Three, no React) lives in src/domain/ and is unit-tested
```

**The boundary rule:** React never holds Three.js objects. The engine emits plain-data events (`modelLoaded`, `selectionChanged`, `progress`, `error`) and accepts commands (`loadFile`, `select`, `hideClass`, `isolate`, `resetView`). This avoids the classic bug of React re-renders rebuilding the scene.

**Lifecycle rule:** the engine has `init(container)` and `dispose()`. The React hook creates it in an effect and disposes it in the cleanup, so React dev-mode double-mounting does not produce two canvases.

## 3. Folder structure

```
ifc_web_viewer/
├─ docs/                 requirements.md, design.md, test-plan.md
├─ samples/              sample IFC files (git-ignored if large)
├─ public/               static assets, web-ifc WASM
├─ src/
│  ├─ main.tsx  App.tsx
│  ├─ engine/            ViewerEngine.ts, selection.ts, visibility.ts
│  ├─ domain/            validateIfcFile.ts, buildSpatialTree.ts,
│  │                     formatProperties.ts, types.ts   (pure, tested)
│  ├─ hooks/             useViewer.ts
│  └─ ui/                DropZone, ModelInfoPanel, SpatialTree, ...
├─ tests/                unit tests mirroring src/domain
├─ package.json  tsconfig.json  vite.config.ts  .gitignore  README.md
```

## 4. Data flow: file to screen

1. User drops a file. `validateIfcFile` (domain) checks extension, size limit and the `ISO-10303-21` header. Failure goes to the ErrorBanner (R9).
2. The file is read as an `ArrayBuffer` and handed to `engine.loadFile`.
3. `IfcImporter.process()` converts the IFC bytes to Fragments binary and reports progress (R1). `FragmentsModels.load()` then loads that binary into a worker-backed model.
4. The model object is added to the Three.js scene, the camera is framed with `getMergedBox()` (R3), and the model is wired to the camera update loop so culling and level of detail work. `modelLoaded` fires with `{ name, sizeBytes, schema, projectName, elementCount }` (R5).
5. The engine calls `getSpatialStructure()` and hands the raw result to `buildSpatialTree` (domain), which returns the tree for the UI (R6).
6. A click calls `raycast()` to find an element. The engine highlights it and emits `selectionChanged` with the element's local ID. Properties come from `getItemsData()` on demand, are formatted by `formatProperties`, and are shown (R7).
7. Visibility commands use `getItemsOfCategories()` and `setVisible()` to hide or isolate elements by IFC class or tree node (R8).

## 5. Requirement traceability

| Req | Realised by | Verified by |
|-----|-------------|-------------|
| R1 | DropZone, `validateIfcFile`, `engine.loadFile` | Unit test (validation) + manual load of sample |
| R2 | Orbit controls in ViewerEngine | Manual |
| R3 | `engine.frameModel` | Manual (checklist) |
| R4 | Scene lighting, background toggle | Manual |
| R5 | `modelLoaded` event, ModelInfoPanel | Unit test (info mapping) + manual |
| R6 | `buildSpatialTree`, SpatialTree | Unit test (tree building) |
| R7 | Selection, `formatProperties`, PropertiesPanel | Unit test (formatting) + manual |
| R8 | Visibility module, VisibilityPanel | Manual + unit test (class grouping) |
| R9 | `validateIfcFile`, ErrorBanner, engine error handling | Unit test + manual (bad file) |

## 6. Build plan (vertical slices)

Each slice runs the full mini-cycle: acceptance criteria, code, tests, review, commit.

| Slice | Delivers | Reqs |
|-------|----------|------|
| S0 | Repo, Vite + React + TS skeleton, lint, test runner, CI-ready scripts | none |
| S1 | Spike-then-build: load the sample IFC and orbit around it; validation and errors | R1 R2 R3 R4 R9 |
| S2 | Model info panel | R5 |
| S3 | Pick element, properties panel | R7 |
| S4 | Spatial tree | R6 |
| S5 | Visibility by class, isolate, reset | R8 |
| S6 | Polish, README, production build, deploy | NFR |

## 7. Risks and mitigations

| Risk | Mitigation |
|------|-----------|
| Fragments API differs from what we expect | S1 starts with a spike against the installed typings, and the engine wraps the library so changes stay in one folder |
| WASM or worker file path breaks in dev or production | Serve `web-ifc` WASM and the Fragments worker from `public/`; test the production build in S6 |
| `IfcImporter` skips some IFC classes by default | In S1 compare what is displayed against the sample model and extend the class list if elements are missing |
| Schema not handled (IFC2x3, IFC4, IFC4X3) | S1 loads the IFC4X3 sample; S6 adds small IFC2x3 and IFC4 test files |
| Large files freeze the UI | Parse in a worker, show progress, set a file-size cap (default 200 MB) |
| React re-render or double-mount duplicates the scene | Boundary rule and `dispose()` (section 2) |
| Property lookups slow on big models | Fetch properties only for the selected element |

## 8. Out of scope for design
Deployment target and CI provider are decided in S6.

## 9. Change log
- v0.1: initial design
- v1.1: approved. Use `@thatopen/fragments` directly instead of `@thatopen/components`; self-host worker and WASM; schema support widened to IFC2x3, IFC4, IFC4X3

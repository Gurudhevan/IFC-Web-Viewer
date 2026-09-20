# IFC Web Viewer — Requirements (v1.1)

Status: **Approved v1.1** (MVP scope R1–R9 confirmed by owner)

## 1. Problem statement
BIM models are usually opened in heavy desktop software. This project is a browser-based viewer:
open an IFC file from your computer, look around it, and inspect its elements and properties.

## 2. Users
- **Primary:** a learner/developer (also a Revit user) who wants to open and inspect IFC models.
- **Later:** project teammates who want a lightweight way to review models.

## 3. Scope

### In scope (MVP)
| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| R1 | Load an IFC file by drag-and-drop or file picker | `.ifc` files in schemas IFC2x3, IFC4 and IFC4X3 load and display; a progress indicator is shown; the UI stays responsive while loading |
| R2 | Orbit, pan and zoom the camera | Left-drag rotates, right-drag pans, wheel zooms |
| R3 | Auto-frame the model | After load, the whole model is visible and centred |
| R4 | Default lighting and background | Model is clearly visible with no setup; light/dark background toggle |
| R5 | Model info panel | Shows file name, file size, IFC schema version, project name and element count |
| R6 | Spatial tree | Tree of Project > Site > Building > Storey; clicking a node highlights its elements |
| R7 | Select an element | Clicking an element highlights it and shows its name, IFC class, GlobalId and property sets |
| R8 | Visibility controls | Hide/show elements by IFC class (walls, slabs, doors, ...); isolate selection; reset view |
| R9 | Clear error handling | Non-IFC or corrupt files show a readable message; the viewer stays usable |

### Out of scope (MVP)
- Accounts, cloud storage, or server-side upload
- Editing or exporting IFC
- Measurement, sectioning, clash detection, annotations
- Other formats (glTF / OBJ / STL / USD): possible later release
- Multiple models loaded at once

## 4. Non-functional requirements
- **Privacy:** files are processed entirely in the browser and never uploaded.
- **Browsers:** current Chrome, Edge and Firefox on desktop.
- **Performance:** interactive camera movement on a typical laptop for a mid-size building model; loading must not freeze the page. Exact targets set after testing with real files.
- **Maintainability:** automated tests for non-visual logic (file validation, tree building, property formatting); the project starts with one command.

## 5. Assumptions
- Stack: React + TypeScript + Vite, plain Three.js for rendering (no React Three Fiber).
- IFC conversion and display with `@thatopen/fragments` on top of `web-ifc` (WASM). See `docs/design.md` for pinned versions.
- The app is a static site (no backend), so it can be hosted anywhere.
- Test files: IFC exported from Revit plus a few small public sample files.

## 6. Resolved questions
1. Test file: owner has a sample IFC file (location to be added under `samples/`).
2. TypeScript: accepted.

## 7. Change log
- v0.1: initial draft (glTF/OBJ/STL viewer)
- v0.2: format changed to IFC-only; added spatial tree, element selection and properties, visibility controls
- v1.0: approved; open questions resolved
- v1.1: R1 now names IFC2x3, IFC4 and IFC4X3 (owner's sample file is IFC4X3_ADD2)

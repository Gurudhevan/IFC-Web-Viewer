# IFC Web Viewer

A browser-based viewer for IFC (BIM) models. Files are processed locally in the browser and are never uploaded.

Built with React, TypeScript, Vite, Three.js and `@thatopen/fragments`.

## Documentation

- [Requirements](docs/requirements.md): what the app must do
- [Design](docs/design.md): how it is built and the slice plan

## Getting started

Requires Node 20+.

```bash
npm install
npm run dev
```

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and produce a production build |
| `npm run lint` | Lint the code |
| `npm test` | Run unit tests once |
| `npm run test:watch` | Run tests on every change |

## Sample models

Put `.ifc` files in `samples/`. They are git-ignored.

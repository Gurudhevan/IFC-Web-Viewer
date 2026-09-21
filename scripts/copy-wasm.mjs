// Copies the web-ifc WASM binary into public/ so the app serves it itself
// instead of loading it from a CDN. Runs after `npm install`.
import { copyFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const target = `${root}public/wasm`

mkdirSync(target, { recursive: true })
copyFileSync(`${root}node_modules/web-ifc/web-ifc.wasm`, `${target}/web-ifc.wasm`)
console.log('Copied web-ifc.wasm to public/wasm/')

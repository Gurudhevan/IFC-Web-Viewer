import { IfcImporter } from '@thatopen/fragments'

/**
 * Converts IFC bytes to Fragments binary in a Web Worker so the page stays responsive (R1).
 */

export interface ConvertRequest {
  bytes: Uint8Array
  /** Absolute URL of the folder that contains web-ifc.wasm, with a trailing slash. */
  wasmPath: string
}

export type ConvertMessage =
  | { type: 'progress'; value: number }
  | { type: 'done'; bytes: Uint8Array }
  | { type: 'error'; message: string }

function post(message: ConvertMessage, transfer: ArrayBuffer[] = []) {
  self.postMessage(message, { transfer })
}

self.onmessage = async (event: MessageEvent<ConvertRequest>) => {
  const { bytes, wasmPath } = event.data
  try {
    const importer = new IfcImporter()
    importer.wasm = { absolute: true, path: wasmPath }

    let lastPercent = -1
    const result = await importer.process({
      bytes,
      // process() never resolves without a progress callback (found in the S1 spike).
      progressCallback: (progress) => {
        const percent = Math.floor(progress * 100)
        if (percent === lastPercent) return
        lastPercent = percent
        post({ type: 'progress', value: progress })
      },
    })
    post({ type: 'done', bytes: result }, [result.buffer as ArrayBuffer])
  } catch (error) {
    post({ type: 'error', message: error instanceof Error ? error.message : String(error) })
  }
}

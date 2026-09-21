import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { IfcImporter, SingleThreadedFragmentsModel } from '@thatopen/fragments'
import { describe, expect, it } from 'vitest'

// The sample models are private and git-ignored, so this test only runs on machines that have one.
const SAMPLE = 'samples/Architectural Model_g_gane.ifc'

describe.skipIf(!existsSync(SAMPLE))('IFC conversion (local sample, IFC4X3_ADD2)', () => {
  it('converts the model and keeps its physical elements', async () => {
    const importer = new IfcImporter()
    importer.wasm = { absolute: true, path: path.resolve('node_modules/web-ifc') + '/' }

    const fragmentBytes = await importer.process({
      bytes: new Uint8Array(readFileSync(SAMPLE)),
      // process() never resolves without a progress callback (S1 spike finding).
      progressCallback: () => {},
    })

    const model = new SingleThreadedFragmentsModel('sample', fragmentBytes)
    try {
      const withGeometry = await model.getItemsWithGeometry()
      const categories = await model.getCategories()

      expect(withGeometry.length).toBeGreaterThan(0)
      expect(categories).toEqual(
        expect.arrayContaining(['IFCWALL', 'IFCSLAB', 'IFCDOOR', 'IFCWINDOW', 'IFCBUILDINGSTOREY']),
      )
    } finally {
      model.dispose()
    }
  }, 60_000)
})

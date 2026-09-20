import { describe, expect, it } from 'vitest'
import {
  MAX_FILE_BYTES,
  isSupportedSchema,
  parseIfcHeader,
  validateIfcFile,
} from '../../src/domain/validateIfcFile'

const header = (schema: string) =>
  `ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION(('ViewDefinition [CoordinationView]'),'2;1');\n` +
  `FILE_NAME('model.ifc','2026-09-14T13:33:38-05:00',(''),(''),'x','y','');\n` +
  `FILE_SCHEMA((${schema}));\nENDSEC;\n\nDATA;\n#1=IFCORGANIZATION($,'A',$,$,$);\n`

describe('parseIfcHeader', () => {
  it('returns the schema list from a valid header', () => {
    expect(parseIfcHeader(header("'IFC4X3_ADD2'"))).toEqual({ schemas: ['IFC4X3_ADD2'] })
  })

  it('returns several schemas when the header lists more than one', () => {
    expect(parseIfcHeader(header("'IFC4','IFC4X3'"))?.schemas).toEqual(['IFC4', 'IFC4X3'])
  })

  it('tolerates a byte-order mark and leading whitespace', () => {
    expect(parseIfcHeader('﻿\n  ' + header("'IFC2X3'"))?.schemas).toEqual(['IFC2X3'])
  })

  it('returns null when the ISO-10303-21 marker is missing', () => {
    expect(parseIfcHeader('{"not": "ifc"}')).toBeNull()
  })

  it('returns an empty schema list when FILE_SCHEMA is absent', () => {
    expect(parseIfcHeader('ISO-10303-21;\nHEADER;\nENDSEC;\n')).toEqual({ schemas: [] })
  })
})

describe('isSupportedSchema', () => {
  it.each(['IFC2X3', 'IFC4', 'IFC4X3', 'IFC4X3_ADD2', 'IFC4_ADD2', 'ifc4x3_add1'])(
    'accepts %s',
    (schema) => {
      expect(isSupportedSchema(schema)).toBe(true)
    },
  )

  it.each(['IFC2X2', 'IFC5', 'CIS2', '', 'IFC'])('rejects %s', (schema) => {
    expect(isSupportedSchema(schema)).toBe(false)
  })
})

describe('validateIfcFile', () => {
  const ok = { name: 'model.ifc', size: 10_000_000 }

  it('accepts a valid IFC4X3 file and reports its schema', () => {
    expect(validateIfcFile(ok, header("'IFC4X3_ADD2'"))).toEqual({
      ok: true,
      schema: 'IFC4X3_ADD2',
    })
  })

  it('accepts an upper-case extension', () => {
    expect(validateIfcFile({ ...ok, name: 'MODEL.IFC' }, header("'IFC4'")).ok).toBe(true)
  })

  it('rejects a file without an .ifc extension', () => {
    const result = validateIfcFile({ ...ok, name: 'model.obj' }, header("'IFC4'"))
    expect(result).toEqual({ ok: false, message: expect.stringContaining('not an IFC file') })
  })

  it('rejects an empty file', () => {
    const result = validateIfcFile({ ...ok, size: 0 }, '')
    expect(result).toEqual({ ok: false, message: expect.stringContaining('empty') })
  })

  it('rejects a file over the size limit and states the limit', () => {
    const result = validateIfcFile({ ...ok, size: MAX_FILE_BYTES + 1 }, header("'IFC4'"))
    expect(result).toEqual({ ok: false, message: expect.stringContaining('200 MB') })
  })

  it('accepts a file exactly at the size limit', () => {
    expect(validateIfcFile({ ...ok, size: MAX_FILE_BYTES }, header("'IFC4'")).ok).toBe(true)
  })

  it('rejects a corrupt file with a missing header', () => {
    const result = validateIfcFile(ok, 'this is plain text')
    expect(result).toEqual({ ok: false, message: expect.stringContaining('valid IFC file') })
  })

  it('rejects a file with no FILE_SCHEMA entry', () => {
    const result = validateIfcFile(ok, 'ISO-10303-21;\nHEADER;\nENDSEC;\n')
    expect(result).toEqual({ ok: false, message: expect.stringContaining('schema') })
  })

  it('rejects an unsupported schema and names it', () => {
    const result = validateIfcFile(ok, header("'IFC5'"))
    expect(result).toEqual({ ok: false, message: expect.stringContaining('IFC5') })
  })
})

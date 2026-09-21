/** Largest file the viewer accepts (requirements R1, design section 7). */
export const MAX_FILE_BYTES = 200 * 1024 * 1024

/** How many bytes of the file to read when checking the header. */
export const HEADER_BYTES = 64 * 1024

export interface FileFacts {
  name: string
  size: number
}

export type ValidationResult = { ok: true; schema: string } | { ok: false; message: string }

/**
 * Reads the STEP header of an IFC file.
 * Returns null when the text does not start with the ISO-10303-21 marker.
 */
export function parseIfcHeader(head: string): { schemas: string[] } | null {
  const text = head.replace(/^﻿/, '').trimStart()
  if (!text.toUpperCase().startsWith('ISO-10303-21')) return null

  const block = /FILE_SCHEMA\s*\(\s*\(([^)]*)\)\s*\)/i.exec(text)
  const schemas = block ? [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1].toUpperCase()) : []
  return { schemas }
}

/** IFC2x3, IFC4 and IFC4X3 families, including their addenda (ADD1, ADD2, ...). */
export function isSupportedSchema(schema: string): boolean {
  return /^(IFC2X3|IFC4|IFC4X3)(_[A-Z0-9]+)?$/.test(schema.toUpperCase())
}

/**
 * Checks a file before it is converted. `head` is the first bytes of the file as text.
 * Pure function so it can be unit tested without a browser.
 */
export function validateIfcFile(file: FileFacts, head: string): ValidationResult {
  if (!file.name.toLowerCase().endsWith('.ifc')) {
    return { ok: false, message: `"${file.name}" is not an IFC file. Please choose a file ending in .ifc.` }
  }
  if (file.size === 0) {
    return { ok: false, message: `"${file.name}" is empty.` }
  }
  if (file.size > MAX_FILE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(0)
    return {
      ok: false,
      message: `"${file.name}" is ${mb} MB. The maximum supported size is ${MAX_FILE_BYTES / (1024 * 1024)} MB.`,
    }
  }

  const parsed = parseIfcHeader(head)
  if (!parsed) {
    return {
      ok: false,
      message: `"${file.name}" does not look like a valid IFC file (missing ISO-10303-21 header).`,
    }
  }
  if (parsed.schemas.length === 0) {
    return { ok: false, message: `Could not find the IFC schema in "${file.name}".` }
  }

  const unsupported = parsed.schemas.find((s) => !isSupportedSchema(s))
  if (unsupported) {
    return {
      ok: false,
      message: `Unsupported IFC schema "${unsupported}". Supported schemas: IFC2x3, IFC4, IFC4X3.`,
    }
  }

  return { ok: true, schema: parsed.schemas[0] }
}

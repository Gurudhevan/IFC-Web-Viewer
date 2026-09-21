import { describe, expect, it } from 'vitest'
import { extractProjectName, formatFileSize } from '../../src/domain/modelInfo'

describe('formatFileSize', () => {
  it.each([
    [0, '0 B'],
    [512, '512 B'],
    [1023, '1023 B'],
    [1024, '1.0 KB'],
    [1536, '1.5 KB'],
    [10_147_607, '9.7 MB'],
    [200 * 1024 * 1024, '200.0 MB'],
    [1024 ** 3, '1.0 GB'],
  ])('formats %i bytes as %s', (bytes, expected) => {
    expect(formatFileSize(bytes)).toBe(expected)
  })

  it.each([-5, Number.NaN, Number.POSITIVE_INFINITY])('falls back to 0 B for %s', (bytes) => {
    expect(formatFileSize(bytes)).toBe('0 B')
  })
})

describe('extractProjectName', () => {
  it('reads the Name attribute of an IfcProject item', () => {
    // Shape taken from a real Fragments getItemsData() result
    const data = {
      _category: { value: 'IFCPROJECT' },
      Name: { value: '16-048', type: 'IFCLABEL' },
      LongName: { value: 'FBL', type: 'IFCLABEL' },
    }
    expect(extractProjectName(data)).toBe('16-048')
  })

  it('falls back to LongName when Name is missing', () => {
    expect(extractProjectName({ LongName: { value: 'FBL' } })).toBe('FBL')
  })

  it('falls back to LongName when Name is blank', () => {
    expect(extractProjectName({ Name: { value: '   ' }, LongName: { value: 'FBL' } })).toBe('FBL')
  })

  it('trims surrounding whitespace', () => {
    expect(extractProjectName({ Name: { value: '  Tower A ' } })).toBe('Tower A')
  })

  it('returns null when neither name is usable', () => {
    expect(extractProjectName({ Name: { value: null }, LongName: { value: '' } })).toBeNull()
    expect(extractProjectName({})).toBeNull()
  })

  it('ignores values that are not strings', () => {
    expect(extractProjectName({ Name: { value: 42 } })).toBeNull()
  })

  it.each([undefined, null, 'text', 7, []])('returns null for non-object input %s', (input) => {
    expect(extractProjectName(input)).toBeNull()
  })
})

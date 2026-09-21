const UNITS = ['B', 'KB', 'MB', 'GB'] as const

/** Human-readable file size using 1024-based units, matching what Windows Explorer shows. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`

  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(1)} ${UNITS[unit]}`
}

function readText(data: Record<string, unknown>, key: string): string | null {
  const attribute = data[key]
  if (typeof attribute !== 'object' || attribute === null) return null
  const value = (attribute as { value?: unknown }).value
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

/**
 * Picks a display name for the project from an IfcProject's item data:
 * `Name` first, then `LongName`. Returns null when neither has usable text.
 */
export function extractProjectName(data: unknown): string | null {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return null
  const item = data as Record<string, unknown>
  return readText(item, 'Name') ?? readText(item, 'LongName')
}

interface ToolbarProps {
  fileName: string | null
  hasModel: boolean
  dark: boolean
  disabled: boolean
  onOpen: () => void
  onResetView: () => void
  onToggleDark: () => void
}

export function Toolbar({
  fileName,
  hasModel,
  dark,
  disabled,
  onOpen,
  onResetView,
  onToggleDark,
}: ToolbarProps) {
  return (
    <header className="toolbar">
      <strong className="title">IFC Web Viewer</strong>
      <span className="file-name" title={fileName ?? undefined}>
        {fileName ?? 'No model open'}
      </span>
      <button type="button" onClick={onOpen} disabled={disabled}>
        Open file
      </button>
      <button type="button" onClick={onResetView} disabled={!hasModel}>
        Reset view
      </button>
      <button type="button" onClick={onToggleDark} aria-pressed={dark}>
        {dark ? 'Light background' : 'Dark background'}
      </button>
    </header>
  )
}

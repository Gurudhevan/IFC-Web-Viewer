import { useState, type DragEvent, type ReactNode } from 'react'

interface DropZoneProps {
  disabled: boolean
  /** Show the "drop a file" prompt (used while no model is open). */
  showPrompt: boolean
  onFile: (file: File) => void
  onChoose: () => void
  children: ReactNode
}

/** Wraps the viewport: accepts a dropped .ifc file and shows the empty-state prompt. */
export function DropZone({ disabled, showPrompt, onFile, onChoose, children }: DropZoneProps) {
  const [dragging, setDragging] = useState(false)

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file && !disabled) onFile(file)
  }

  return (
    <div
      className="dropzone"
      onDragOver={(event) => {
        event.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setDragging(false)
      }}
      onDrop={handleDrop}
    >
      {children}

      {showPrompt && (
        <div className="prompt">
          <h1>IFC Web Viewer</h1>
          <p>Drop an .ifc file here to view it. Files stay on your computer.</p>
          <button type="button" disabled={disabled} onClick={onChoose}>
            Choose file
          </button>
        </div>
      )}

      {dragging && <div className="drag-overlay">Drop to open</div>}
    </div>
  )
}

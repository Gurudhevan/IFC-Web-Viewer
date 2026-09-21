import { useRef } from 'react'
import './App.css'
import { useViewer } from './hooks/useViewer'
import { DropZone } from './ui/DropZone'
import { ErrorBanner } from './ui/ErrorBanner'
import { LoadingOverlay } from './ui/LoadingOverlay'
import { Toolbar } from './ui/Toolbar'

export default function App() {
  const { containerRef, state, dark, loadFile, resetView, toggleDark, dismissError } = useViewer()
  const inputRef = useRef<HTMLInputElement>(null)
  const openPicker = () => inputRef.current?.click()

  return (
    <div className={`app${dark ? ' dark' : ''}`}>
      <Toolbar
        fileName={state.model?.fileName ?? null}
        hasModel={state.model !== null}
        dark={dark}
        disabled={state.loading}
        onOpen={openPicker}
        onResetView={resetView}
        onToggleDark={toggleDark}
      />

      <DropZone
        disabled={state.loading}
        showPrompt={state.model === null && !state.loading}
        onFile={loadFile}
        onChoose={openPicker}
      >
        <div className="viewport" ref={containerRef} />
        {state.loading && <LoadingOverlay stage={state.stage} progress={state.progress} />}
        {state.error && <ErrorBanner message={state.error} onDismiss={dismissError} />}
      </DropZone>

      <input
        ref={inputRef}
        type="file"
        accept=".ifc"
        hidden
        data-testid="file-input"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) loadFile(file)
          event.target.value = '' // allows choosing the same file again
        }}
      />
    </div>
  )
}

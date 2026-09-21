import { useCallback, useEffect, useRef, useState } from 'react'
import { ViewerEngine, type LoadedModelInfo, type LoadStage } from '../engine/ViewerEngine'

export interface ViewerState {
  loading: boolean
  stage: LoadStage
  /** 0..1, only meaningful while `stage` is `converting`. */
  progress: number
  model: LoadedModelInfo | null
  error: string | null
}

const initialState: ViewerState = {
  loading: false,
  stage: 'reading',
  progress: 0,
  model: null,
  error: null,
}

/**
 * The only bridge between React and the ViewerEngine. React state holds plain data only;
 * the engine (and every Three.js object) stays outside React.
 */
export function useViewer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<ViewerEngine | null>(null)
  const [state, setState] = useState<ViewerState>(initialState)
  const [dark, setDark] = useState(false)
  const darkRef = useRef(dark)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const engine = new ViewerEngine()
    engine.init(container)
    engine.setDarkBackground(darkRef.current)
    engineRef.current = engine

    const unsubscribe = [
      engine.on('progress', ({ stage, value }) =>
        setState((s) => ({ ...s, loading: true, stage, progress: value })),
      ),
      engine.on('modelLoaded', (model) =>
        setState((s) => ({ ...s, loading: false, model, error: null })),
      ),
      engine.on('error', ({ message }) =>
        setState((s) => ({ ...s, loading: false, error: message })),
      ),
    ]

    // Cleanup matters: React dev mode mounts effects twice, and this must not leave two canvases.
    return () => {
      unsubscribe.forEach((off) => off())
      engine.dispose()
      engineRef.current = null
    }
  }, [])

  const loadFile = useCallback((file: File) => {
    setState((s) => ({ ...s, loading: true, stage: 'reading', progress: 0, error: null }))
    void engineRef.current?.loadFile(file)
  }, [])

  const resetView = useCallback(() => engineRef.current?.resetView(), [])

  const toggleDark = useCallback(() => {
    setDark((current) => {
      const next = !current
      darkRef.current = next
      engineRef.current?.setDarkBackground(next)
      return next
    })
  }, [])

  const dismissError = useCallback(() => setState((s) => ({ ...s, error: null })), [])

  return { containerRef, state, dark, loadFile, resetView, toggleDark, dismissError }
}

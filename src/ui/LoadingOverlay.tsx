import type { LoadStage } from '../engine/ViewerEngine'

const LABELS: Record<LoadStage, string> = {
  reading: 'Reading file…',
  converting: 'Converting IFC…',
  loading: 'Loading model…',
}

interface LoadingOverlayProps {
  stage: LoadStage
  progress: number
}

export function LoadingOverlay({ stage, progress }: LoadingOverlayProps) {
  const percent = Math.round(progress * 100)
  return (
    <div className="loading" role="status" aria-live="polite">
      <p>
        {LABELS[stage]}
        {stage === 'converting' ? ` ${percent}%` : ''}
      </p>
      {/* Only the conversion stage reports real progress; the others show an indeterminate bar. */}
      <progress max={100} value={stage === 'converting' ? percent : undefined} />
    </div>
  )
}

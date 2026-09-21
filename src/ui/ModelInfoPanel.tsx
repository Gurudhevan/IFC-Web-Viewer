import { formatFileSize } from '../domain/modelInfo'
import type { LoadedModelInfo } from '../engine/ViewerEngine'

interface ModelInfoPanelProps {
  model: LoadedModelInfo
}

export function ModelInfoPanel({ model }: ModelInfoPanelProps) {
  return (
    <section className="panel" aria-labelledby="model-info-title">
      <h2 id="model-info-title">Model info</h2>
      <dl className="info-list">
        <dt>File</dt>
        <dd className="wrap">{model.fileName}</dd>
        <dt>Size</dt>
        <dd>{formatFileSize(model.sizeBytes)}</dd>
        <dt>IFC schema</dt>
        <dd>{model.schema}</dd>
        <dt>Project</dt>
        <dd className="wrap">{model.projectName ?? 'Unnamed project'}</dd>
        <dt>Elements (with geometry)</dt>
        <dd>{model.elementCount.toLocaleString()}</dd>
      </dl>
    </section>
  )
}

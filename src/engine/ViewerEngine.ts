import { FragmentsModels, type FragmentsModel } from '@thatopen/fragments'
import fragmentsWorkerUrl from '@thatopen/fragments/worker?url'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { HEADER_BYTES, validateIfcFile } from '../domain/validateIfcFile'
import type { ConvertMessage, ConvertRequest } from './convert.worker'

export type LoadStage = 'reading' | 'converting' | 'loading'

export interface LoadedModelInfo {
  fileName: string
  sizeBytes: number
  schema: string
}

export interface EngineEventMap {
  /** `value` is 0..1 and only meaningful during the `converting` stage. */
  progress: { stage: LoadStage; value: number }
  modelLoaded: LoadedModelInfo
  error: { message: string }
}

type Handler<K extends keyof EngineEventMap> = (payload: EngineEventMap[K]) => void

const LIGHT_BACKGROUND = 0xf1f3f6
const DARK_BACKGROUND = 0x1b1d21

/**
 * Owns the 3D scene, the IFC conversion and the loaded model.
 * Knows nothing about React: it takes commands and emits plain-data events (design section 2).
 */
export class ViewerEngine {
  private renderer: THREE.WebGLRenderer | null = null
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000)
  private controls: OrbitControls | null = null
  private resizeObserver: ResizeObserver | null = null
  private frameHandle = 0

  private fragments: FragmentsModels | null = null
  private model: FragmentsModel | null = null
  private modelCounter = 0
  private convertWorker: Worker | null = null

  private loading = false
  private disposed = false
  private readonly handlers: { [K in keyof EngineEventMap]: Set<Handler<K>> } = {
    progress: new Set(),
    modelLoaded: new Set(),
    error: new Set(),
  }

  init(container: HTMLElement): void {
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)
    this.renderer = renderer

    this.scene.background = new THREE.Color(LIGHT_BACKGROUND)
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f98, 1.6))
    const sun = new THREE.DirectionalLight(0xffffff, 1.6)
    sun.position.set(30, 60, 40)
    this.scene.add(sun)

    this.camera.position.set(10, 8, 10)
    const controls = new OrbitControls(this.camera, renderer.domElement)
    controls.enableDamping = false
    // Fragments culls and refines geometry per view, so it needs to know when the camera moves.
    controls.addEventListener('change', () => void this.fragments?.update())
    this.controls = controls

    this.resizeObserver = new ResizeObserver(() => this.resize(container))
    this.resizeObserver.observe(container)
    this.resize(container)

    const tick = () => {
      this.frameHandle = requestAnimationFrame(tick)
      renderer.render(this.scene, this.camera)
    }
    tick()
  }

  on<K extends keyof EngineEventMap>(event: K, handler: Handler<K>): () => void {
    this.handlers[event].add(handler)
    return () => this.handlers[event].delete(handler)
  }

  setDarkBackground(dark: boolean): void {
    this.scene.background = new THREE.Color(dark ? DARK_BACKGROUND : LIGHT_BACKGROUND)
  }

  /** Moves the camera so the whole model is visible and centred (R3). */
  resetView(): void {
    if (!this.model || !this.controls) return
    const box = this.model.box
    if (box.isEmpty()) return

    const sphere = box.getBoundingSphere(new THREE.Sphere())
    const halfFov = THREE.MathUtils.degToRad(this.camera.fov) / 2
    const distance = (sphere.radius / Math.sin(halfFov)) * 1.1
    const direction = new THREE.Vector3(1, 0.7, 1).normalize()

    this.camera.position.copy(sphere.center).addScaledVector(direction, distance)
    this.camera.near = Math.max(distance / 1000, 0.01)
    this.camera.far = Math.max(distance * 50, 1000)
    this.camera.updateProjectionMatrix()
    this.controls.target.copy(sphere.center)
    this.controls.update()
  }

  async loadFile(file: File): Promise<void> {
    if (this.loading) {
      this.emit('error', { message: 'A model is already loading. Please wait for it to finish.' })
      return
    }
    this.loading = true
    try {
      this.emit('progress', { stage: 'reading', value: 0 })
      const head = await file.slice(0, HEADER_BYTES).text()
      const check = validateIfcFile({ name: file.name, size: file.size }, head)
      if (!check.ok) {
        this.emit('error', { message: check.message })
        return
      }

      const ifcBytes = new Uint8Array(await file.arrayBuffer())
      const fragmentBytes = await this.convert(ifcBytes)
      if (this.disposed) return

      this.emit('progress', { stage: 'loading', value: 0 })
      await this.showModel(fragmentBytes)
      if (this.disposed) return

      this.emit('modelLoaded', { fileName: file.name, sizeBytes: file.size, schema: check.schema })
    } catch (error) {
      if (this.disposed) return
      // Library errors are not meant for users; keep the detail in the console for debugging.
      console.error(`Failed to open "${file.name}"`, error)
      this.emit('error', {
        message: `Could not open "${file.name}". The file may be damaged or contain data the viewer cannot read.`,
      })
    } finally {
      this.loading = false
    }
  }

  dispose(): void {
    this.disposed = true
    cancelAnimationFrame(this.frameHandle)
    this.resizeObserver?.disconnect()
    this.controls?.dispose()
    this.convertWorker?.terminate()
    this.convertWorker = null
    this.model = null
    void this.fragments?.dispose().catch(() => {})
    this.fragments = null
    if (this.renderer) {
      this.renderer.dispose()
      // Releases the GPU context immediately; matters when React dev mode mounts twice.
      this.renderer.forceContextLoss()
      this.renderer.domElement.remove()
      this.renderer = null
    }
    for (const set of Object.values(this.handlers)) set.clear()
  }

  private emit<K extends keyof EngineEventMap>(event: K, payload: EngineEventMap[K]): void {
    if (this.disposed) return
    for (const handler of this.handlers[event]) handler(payload)
  }

  private resize(container: HTMLElement): void {
    const { clientWidth: width, clientHeight: height } = container
    if (!this.renderer || width === 0 || height === 0) return
    this.renderer.setSize(width, height)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    void this.fragments?.update(true)
  }

  private convert(bytes: Uint8Array): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('./convert.worker.ts', import.meta.url), { type: 'module' })
      this.convertWorker = worker
      const finish = () => {
        worker.terminate()
        if (this.convertWorker === worker) this.convertWorker = null
      }

      worker.onmessage = (event: MessageEvent<ConvertMessage>) => {
        const message = event.data
        if (message.type === 'progress') {
          this.emit('progress', { stage: 'converting', value: message.value })
        } else if (message.type === 'done') {
          finish()
          resolve(message.bytes)
        } else {
          finish()
          reject(new Error(message.message))
        }
      }
      worker.onerror = (event) => {
        finish()
        reject(new Error(event.message || 'The conversion worker crashed.'))
      }

      this.emit('progress', { stage: 'converting', value: 0 })
      const request: ConvertRequest = {
        bytes,
        wasmPath: new URL(`${import.meta.env.BASE_URL}wasm/`, window.location.href).href,
      }
      worker.postMessage(request, { transfer: [bytes.buffer] })
    })
  }

  private async showModel(fragmentBytes: Uint8Array): Promise<void> {
    if (!this.fragments) this.fragments = new FragmentsModels(fragmentsWorkerUrl)
    const fragments = this.fragments

    // The old model is only removed once the new one converted successfully.
    if (this.model) {
      this.scene.remove(this.model.object)
      await fragments.disposeModel(this.model.modelId)
      this.model = null
    }

    const model = await fragments.load(fragmentBytes, { modelId: `model-${++this.modelCounter}` })
    if (this.disposed) return
    model.useCamera(this.camera)
    this.scene.add(model.object)
    this.model = model
    await fragments.update(true)
    this.resetView()
  }
}

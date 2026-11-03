// 랜드마크 3D 모형(glb)을 three.js 로 그리는 maplibre 커스텀 레이어. 나무 레이어(treesLayer.ts)와 같은 방식이다.
// 모형마다 자기 위치를 원점으로 쓴다: 대전 전체 좌표(0.8 정도)를 GPU float32 로 계산하면 오차가 수 m 라서
// 원점 이동·축소는 CPU(배정밀도)에서 투영 행렬에 합친다.
// three·GLTFLoader 는 크기가 커서 레이어를 만들 때 불러온다(지도 화면 안에서만 쓰이는 파일).
import type { CustomLayerInterface, Map as MapLibreMap } from 'maplibre-gl'
import { MercatorCoordinate } from 'maplibre-gl'
import { LANDMARKS_LAYER_ID, LANDMARK_FADE_ZOOM, LANDMARK_MODEL_DIR, landmarkFade, type Landmark } from '@/lib/landmarks'

export type LandmarksLayer = CustomLayerInterface & {
  // 2D 보기에서는 모형을 그리지 않는다
  setVisible: (visible: boolean) => void
  // 화면 좌표(지도 캔버스 기준 px)에서 눌린 모형. 없으면 null
  pick: (point: { x: number; y: number }) => Landmark | null
}

// 지도와 같은 빛 방향: style 의 light(position [1.5, 210, 30] = 남서쪽 위)에서 오는 약한 방향광 + 고른 주변광
const LIGHT = { ambient: 0.72, hemisphere: 0.16, directional: 0.52, position: [-0.29, 0.5, 1] as const }

// riseZoom: [시작 줌, 끝 줌]. 주면 줌이 이 구간을 지나는 동안 모형이 땅에서 솟는다(건물이 솟는 것과 같은 구간, S1 연출)
export async function createLandmarksLayer(landmarks: Landmark[], opts: { riseZoom?: [number, number] } = {}): Promise<LandmarksLayer> {
  const THREE = await import('three')
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
  // 지도와 같은 색을 그대로 내보낸다(색 변환 없이)
  THREE.ColorManagement.enabled = false

  const loader = new GLTFLoader()
  const disposables: { dispose(): void }[] = []

  type Item = {
    landmark: Landmark
    scene: InstanceType<typeof THREE.Scene>
    group: InstanceType<typeof THREE.Group>
    materials: InstanceType<typeof THREE.MeshLambertMaterial>[]
    origin: MercatorCoordinate
    unit: number
    // 마지막으로 그린 투영 행렬(눌림 판정용)
    proj: InstanceType<typeof THREE.Matrix4>
    drawn: boolean
  }

  // GLB 는 Y 가 위, 긴 변이 X, 앞이 +Z(남쪽). 지도 장면은 x 동쪽·y 남쪽·z 위라서 (X, Y, Z) → (X, Z, Y) 로 바꾼 뒤
  // 북 기준 시계 방향 bearing 만큼 돌린다(모형 +X 가 처음 동쪽 = 방위 90°). 방향이 뒤집히는 변환이라 면의 앞뒤는 가리지 않고(DoubleSide) 그린다
  const orient = (bearingDeg: number, scale: number, heightScale: number) => {
    const phi = ((bearingDeg - 90) * Math.PI) / 180
    const c = Math.cos(phi)
    const s = Math.sin(phi)
    const swap = new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1)
    const rotate = new THREE.Matrix4().set(c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)
    return rotate.multiply(swap).multiply(new THREE.Matrix4().makeScale(scale, scale * heightScale, scale))
  }

  const items: Item[] = []
  for (const landmark of landmarks) {
    const gltf = await loader.loadAsync(`${LANDMARK_MODEL_DIR}${landmark.model}`)
    const materials: Item['materials'] = []
    // 재질 색(벽·지붕·유리 등 투톤)은 그대로 두고 빛만 받는 재질로 바꾼다
    const swapped = new Map<unknown, InstanceType<typeof THREE.MeshLambertMaterial>>()
    gltf.scene.traverse(obj => {
      const mesh = obj as InstanceType<typeof THREE.Mesh>
      if (!mesh.isMesh) return
      const source = mesh.material as InstanceType<typeof THREE.MeshStandardMaterial>
      let material = swapped.get(source)
      if (!material) {
        material = new THREE.MeshLambertMaterial({ color: source.color.clone(), side: THREE.DoubleSide })
        swapped.set(source, material)
        materials.push(material)
        disposables.push(material, source)
      }
      mesh.material = material
      mesh.frustumCulled = false
      disposables.push(mesh.geometry)
    })
    const group = new THREE.Group()
    group.add(gltf.scene)
    group.matrixAutoUpdate = false
    group.matrix.copy(orient(landmark.bearingDeg, landmark.scale, landmark.heightScale))
    const scene = new THREE.Scene()
    scene.add(group)
    scene.add(new THREE.AmbientLight(0xffffff, LIGHT.ambient * Math.PI))
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d2e0, LIGHT.hemisphere * Math.PI))
    const sun = new THREE.DirectionalLight(0xffffff, LIGHT.directional * Math.PI)
    sun.position.set(...LIGHT.position)
    scene.add(sun)
    const origin = MercatorCoordinate.fromLngLat([landmark.lng, landmark.lat], 0)
    items.push({ landmark, scene, group, materials, origin, unit: origin.meterInMercatorCoordinateUnits(), proj: new THREE.Matrix4(), drawn: false })
  }

  let renderer: InstanceType<typeof THREE.WebGLRenderer> | null = null
  let map: MapLibreMap | null = null
  let visible = true
  const camera = new THREE.Camera()
  const main = new THREE.Matrix4()
  const toMercator = new THREE.Matrix4()
  const raycaster = new THREE.Raycaster()

  const layer: LandmarksLayer = {
    id: LANDMARKS_LAYER_ID,
    type: 'custom',
    renderingMode: '3d',
    setVisible(v) {
      visible = v
      map?.triggerRepaint()
    },
    onAdd(mapInstance, gl) {
      map = mapInstance
      renderer = new THREE.WebGLRenderer({ canvas: mapInstance.getCanvas(), context: gl, antialias: true })
      renderer.autoClear = false
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace
    },
    render(_gl, args) {
      if (!renderer || !map) return
      const zoom = map.getZoom()
      const fade = landmarkFade(zoom, LANDMARK_FADE_ZOOM)
      main.fromArray(args.defaultProjectionData.mainMatrix as unknown as number[])
      // 높이 방향 배율: 건물이 솟는 것과 같은 줌 구간(S1 연출). 그 밖(일정 화면 등)은 항상 1
      let grow = 1
      if (opts.riseZoom) grow = Math.min(1, Math.max(0, (zoom - opts.riseZoom[0]) / (opts.riseZoom[1] - opts.riseZoom[0])))
      renderer.resetState()
      for (const item of items) {
        item.drawn = visible && fade > 0.001 && grow > 0.001
        if (!item.drawn) continue
        for (const material of item.materials) {
          material.opacity = fade
          material.transparent = fade < 0.999
        }
        toMercator.makeTranslation(item.origin.x, item.origin.y, item.origin.z).scale(new THREE.Vector3(item.unit, item.unit, item.unit * grow))
        item.proj.copy(main).multiply(toMercator)
        camera.projectionMatrix.copy(item.proj)
        renderer.render(item.scene, camera)
      }
    },
    pick(point) {
      const canvas = map?.getCanvas()
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      const ndcX = (point.x / rect.width) * 2 - 1
      const ndcY = 1 - (point.y / rect.height) * 2
      let best: { landmark: Landmark; distance: number } | null = null
      for (const item of items) {
        if (!item.drawn) continue
        const inverse = item.proj.clone().invert()
        const near = new THREE.Vector3(ndcX, ndcY, -1).applyMatrix4(inverse)
        const far = new THREE.Vector3(ndcX, ndcY, 1).applyMatrix4(inverse)
        raycaster.set(near, far.sub(near).normalize())
        const hit = raycaster.intersectObject(item.group, true)[0]
        if (hit && (!best || hit.distance < best.distance)) best = { landmark: item.landmark, distance: hit.distance }
      }
      return best?.landmark ?? null
    },
    onRemove() {
      for (const d of disposables) d.dispose()
      renderer?.dispose()
      renderer = null
      map = null
    },
  }
  return layer
}

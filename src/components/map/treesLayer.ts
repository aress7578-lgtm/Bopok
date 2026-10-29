// 나무를 three.js 로 그리는 maplibre 커스텀 레이어(B안).
// 나무 점마다 구(수관)와 원기둥(줄기)을 InstancedMesh 로 한 번에 그린다. 부드러운 빛만 쓰고 그림자는 없다.
// three 는 크기가 커서 레이어를 만들 때 불러온다(지도 화면 안에서만 쓰이는 파일이라 첫 화면 번들에는 안 들어간다).
import type { CustomLayerInterface, Map as MapLibreMap } from 'maplibre-gl'
import { MercatorCoordinate } from 'maplibre-gl'
import { PALETTE, TREE_CROWN_SQUASH, TREE_LIGHT, TREE_TRUNK_RADIUS_M, TREES_LAYER_ID } from '@/lib/map-config'

// [동쪽 m, 북쪽 m, 수관 반지름 m, 나무 꼭대기 높이 m, 수관 색]
export type TreeRow = [number, number, number, number, string]
export type TreesData = { origin: [number, number]; count: number; trees: TreeRow[] }

export type TreesLayer = CustomLayerInterface & {
  // 2D 보기에서는 나무를 그리지 않는다
  setVisible: (visible: boolean) => void
}

// 한 나무의 수관 중심 높이: 꼭대기에서 (눌린) 반지름만큼 내려온 곳. 줄기는 땅에서 여기까지
export function crownCenterHeight(top: number, radius: number) {
  return Math.max(top - radius * TREE_CROWN_SQUASH, radius * TREE_CROWN_SQUASH)
}

export async function createTreesLayer(data: TreesData): Promise<TreesLayer> {
  const THREE = await import('three')
  // 지도와 같은 색을 그대로 내보낸다(색 변환 없이)
  THREE.ColorManagement.enabled = false

  const origin = MercatorCoordinate.fromLngLat(data.origin, 0)
  const unit = origin.meterInMercatorCoordinateUnits()

  let renderer: InstanceType<typeof THREE.WebGLRenderer> | null = null
  let map: MapLibreMap | null = null
  let visible = true
  const scene = new THREE.Scene()
  const camera = new THREE.Camera()
  const disposables: { dispose(): void }[] = []

  // 위(z) 방향이 높이인 좌표계: x 동쪽, y 북쪽(메르카토르는 남쪽이 +y 라 아래에서 y 를 뒤집는다)
  const crownGeometry = new THREE.SphereGeometry(1, 18, 14)
  const trunkGeometry = new THREE.CylinderGeometry(TREE_TRUNK_RADIUS_M * 0.8, TREE_TRUNK_RADIUS_M, 1, 8)
  trunkGeometry.rotateX(Math.PI / 2) // 원기둥 축을 위(z)로
  trunkGeometry.translate(0, 0, 0.5) // 바닥이 z=0
  const crownMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff })
  const trunkMaterial = new THREE.MeshLambertMaterial({ color: new THREE.Color(PALETTE.trunk) })
  disposables.push(crownGeometry, trunkGeometry, crownMaterial, trunkMaterial)

  const n = data.trees.length
  const crowns = new THREE.InstancedMesh(crownGeometry, crownMaterial, n)
  const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, n)
  const m = new THREE.Matrix4()
  const color = new THREE.Color()
  data.trees.forEach(([x, y, radius, top, hex], i) => {
    const center = crownCenterHeight(top, radius)
    m.compose(new THREE.Vector3(x, y, center), new THREE.Quaternion(), new THREE.Vector3(radius, radius, radius * TREE_CROWN_SQUASH))
    crowns.setMatrixAt(i, m)
    crowns.setColorAt(i, color.set(hex))
    m.compose(new THREE.Vector3(x, y, 0), new THREE.Quaternion(), new THREE.Vector3(1, 1, center))
    trunks.setMatrixAt(i, m)
  })
  crowns.instanceMatrix.needsUpdate = true
  if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true
  trunks.instanceMatrix.needsUpdate = true
  // 인스턴스가 한 덩어리로 컬링되지 않게(원점 기준으로 흩어져 있음)
  crowns.frustumCulled = false
  trunks.frustumCulled = false

  // 미터 → 메르카토르: 동쪽 +x, 북쪽은 -y, 위 +z
  const world = new THREE.Group()
  world.position.set(origin.x, origin.y, origin.z)
  world.scale.set(unit, -unit, unit)
  world.add(crowns, trunks)
  scene.add(world)
  // 부드럽고 고른 빛: 주변광을 세게, 위쪽 왼쪽에서 약한 방향광
  // three 는 람베르트 빛을 1/π 로 나눠서 쓰므로 둘 다 π 를 곱해 "색 × 세기" 로 보이게 한다
  scene.add(new THREE.AmbientLight(0xffffff, TREE_LIGHT.ambient * Math.PI))
  const sun = new THREE.DirectionalLight(0xffffff, TREE_LIGHT.directional * Math.PI)
  sun.position.set(-1, 1.2, 2.2)
  scene.add(sun)

  const layer: TreesLayer = {
    id: TREES_LAYER_ID,
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
      if (!renderer || !visible) return
      camera.projectionMatrix.fromArray(args.defaultProjectionData.mainMatrix as unknown as number[])
      renderer.resetState()
      renderer.render(scene, camera)
    },
    onRemove() {
      for (const d of disposables) d.dispose()
      crowns.dispose()
      trunks.dispose()
      renderer?.dispose()
      renderer = null
      map = null
    },
  }
  return layer
}

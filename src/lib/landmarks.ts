// 지도에 세우는 랜드마크 3D 모형 3곳 (시연용). 값은 모두 고정값이고 런타임에 계산하지 않는다.
// 위치·방향·크기는 건물 벡터 타일(public/tiles/buildings, 줌 16)의 건물 바닥 모양에서 구했다:
//  - 중심 = 바닥 모양의 무게중심
//  - bearingDeg = 최소 회전 사각형의 긴 변 방향(모형의 긴 변은 X축). 북쪽에서 시계 방향 도(°)
//  - scale = 바닥 모양 긴 변 ÷ 모형 긴 변(0.8~1.3)에서 출발해, 주변 건물보다 확실히 두드러지도록 키웠다(최대 2.0), 높이는 heightScale 로 더 키웠다
//  - 위에서 본 화면에서 바닥 윤곽과 겹쳐 보고 중심·방향을 몇 m, 몇 도 보정했다
//  - hideFids = 모형이 대신하는 원래 건물의 fid. 줌이 가까워지면 서서히 사라진다
// 장소 좌표는 OpenStreetMap(Nominatim) 조회값으로 확인했다(© OpenStreetMap contributors).

export type Landmark = {
  id: string
  name: string
  // public/models 의 파일 이름
  model: string
  lng: number
  lat: number
  // 모형 +X 축이 가리키는 방위(북 기준 시계 방향, 도)
  bearingDeg: number
  scale: number
  // 높이 방향만 더 키우는 배율. 주변 건물보다 우뚝 솟아 보이게 한다
  heightScale: number
  hideFids: number[]
  // 장소 데이터(demo-geo)의 장소 id. 있으면 모형을 눌렀을 때 그 장소로 연결한다
  placeId?: string
}

export const LANDMARKS: Landmark[] = [
  { id: 'science-museum', name: '국립중앙과학관', model: 'science-museum.glb', lng: 127.375263, lat: 36.375062, bearingDeg: 10.8, scale: 1.65, heightScale: 1.3, hideFids: [96430], placeId: '국립중앙과학관' },
  { id: 'arts-center', name: '대전예술의전당', model: 'arts-center.glb', lng: 127.383798, lat: 36.366591, bearingDeg: 90, scale: 1.75, heightScale: 1.3, hideFids: [133229] },
  { id: 'art-museum', name: '대전시립미술관', model: 'art-museum.glb', lng: 127.385743, lat: 36.366824, bearingDeg: 90.9, scale: 1.65, heightScale: 1.3, hideFids: [118740], placeId: '대전시립미술관' },
]

export const LANDMARK_SCALE_RANGE: [number, number] = [0.8, 2]
export const LANDMARKS_LAYER_ID = 'landmarks-3d'
export const LANDMARK_MODEL_DIR = '/models/'
// 모형이 서서히 나타나는 줌 구간(그보다 멀리서는 보이지 않는다). 원래 건물은 같은 구간에서 사라진다
export const LANDMARK_FADE_ZOOM: [number, number] = [14.5, 15.5]
// 숨긴 원래 건물을 줌으로 서서히 지우는 전용 레이어(레이어 단위로만 진하기를 바꿀 수 있어서 따로 둔다)
export const LANDMARK_HIDDEN_LAYER_ID = 'buildings-landmark-hidden'
export const LANDMARK_HIDDEN_SHADOW_LAYER_ID = 'shadows-landmark-hidden'

export const hiddenFids = (landmarks: Landmark[] = LANDMARKS): number[] => landmarks.flatMap(l => l.hideFids)

// 줌에 따른 나타남 정도 0 → 1
export function landmarkFade(zoom: number, range: [number, number] = LANDMARK_FADE_ZOOM): number {
  return Math.min(1, Math.max(0, (zoom - range[0]) / (range[1] - range[0])))
}

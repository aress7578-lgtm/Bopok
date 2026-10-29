// 3D 지도 설정 값 (시연 권역: 엑스포과학공원·한밭수목원 일대)
export const MAP_STYLE_URL = '/map/style.json'
// 번들러가 워커 경로를 깨뜨려서, scripts/copy-map-assets.mjs 가 복사한 파일을 직접 불러온다
export const MAP_WORKER_URL = '/map/maplibre-gl-worker.mjs'

export const MAP_CENTER = { longitude: 127.385, latitude: 36.372 }
export const MAP_ZOOM = 15.5
export const MAP_PITCH = 55
export const MAP_BEARING = -20

export const MAP_MIN_ZOOM = 13
export const MAP_MAX_ZOOM = 18
// 시연 권역(127.370~127.400, 36.360~36.385)보다 넉넉하게 [서, 남, 동, 북]
export const MAP_MAX_BOUNDS: [number, number, number, number] = [127.33, 36.33, 127.43, 36.41]

export const MAP_FLAT_DURATION_MS = 800
export const MAP_BG_COLOR = '#F3F1EC'
export const MAP_FONT_FAMILY = "'Pretendard', 'Noto Sans KR', sans-serif"

// 3D 건물 (scripts/build-buildings.mjs 가 만든 파일)
export const BUILDINGS_URL = '/data/daejeon-buildings.geojson'
export const BUILDINGS_SOURCE_ID = 'buildings'
export const BUILDINGS_NEAR_LAYER_ID = 'buildings-near'
export const BUILDINGS_FAR_LAYER_ID = 'buildings-far'
// 건물은 땅·공원·물 위, 도로·지명 아래. 숨겨 둔 원래 건물 레이어 다음에 오는 첫 도로 레이어 앞에 끼운다
export const BUILDINGS_BEFORE_ID = 'tunnel_motorway_casing'
export const BUILDINGS_FALLBACK_H = 6

// 경로 선·핀
export const ROUTE_SOURCE_ID = 'routes'
// 건물 위, 지명(글자) 아래
export const ROUTE_BEFORE_ID = 'waterway_line_label'
export const ROUTE_COLORS = {
  ok: '#1D4ED8',      // 조건 충족
  warn: '#EA580C',    // 조정 필요
  info: '#A8A196',    // 정보 부족
  ride: '#8A847B',    // 탈것 구간
  casing: '#FFFFFF',
}

// 구간만 보기
export const FOCUS_PITCH = 60
export const FOCUS_MOVE_MS = 900
export const FOCUS_RISE_MS = 500
// 범위 밖 건물: 높이 배율 / 색 / 진하기
export const FAR_HEIGHT_SCALE = 0.35
export const FAR_COLOR = '#EEEBE6'
export const FAR_OPACITY = 0.3
export const VEIL_OPACITY = 0.45
export const VEIL_SOURCE_ID = 'focus-veil'

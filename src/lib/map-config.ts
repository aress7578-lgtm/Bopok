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

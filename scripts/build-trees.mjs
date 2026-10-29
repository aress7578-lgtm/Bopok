// 공원·숲·잔디 면 안에 나무 위치를 흩뿌려 나무 도형(줄기·수관) GeoJSON 으로 만든다 (시연 권역만)
// 실행: pnpm data:trees (pnpm data:buildings 가 이어서 실행한다)
// 공원 면은 OpenStreetMap(Overpass API)에서 시연 권역 범위만 한 번 받아 data/raw/osm-green-demo.json 에 저장해서 쓴다.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import osmtogeojson from 'osmtogeojson'
import { mulberry32, scatterInPolygon } from './lib/geometry.mjs'
import {
  PALETTE, TREE_BBOX, TREE_CROWN_RADIUS_M, TREE_CROWN_TOP_M, TREE_MAX_COUNT, TREE_MIN_SPACING_M, TREE_TRUNK_RADIUS_M,
} from '../src/lib/map-config.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const RAW = path.join(root, 'data/raw/osm-green-demo.json')
const OUT = path.join(root, 'public/data/daejeon-trees.geojson')
const SEED = 20261029
const AREA_PER_TREE_M2 = 400     // 면적 이만큼당 한 그루 정도(최소 간격 때문에 실제로는 조금 적다)
const STEPS_TRUNK = 8, STEPS_CROWN = 14
const OVERPASS = 'https://overpass-api.de/api/interpreter'

// ───────── 1) OSM 에서 공원·숲·잔디 면 받기 (한 번만) ─────────
if (!fs.existsSync(RAW)) {
  const [w, s, e, n] = TREE_BBOX
  const box = `${s},${w},${n},${e}`
  const query = `[out:json][timeout:90];(
    way["leisure"~"^(park|garden|common)$"](${box});
    way["landuse"~"^(forest|grass|meadow|recreation_ground|village_green)$"](${box});
    way["natural"~"^(wood|scrub|grassland)$"](${box});
    relation["leisure"~"^(park|garden)$"](${box});
    relation["landuse"~"^(forest|grass|meadow|recreation_ground)$"](${box});
    relation["natural"~"^(wood|scrub|grassland)$"](${box});
  );out geom;`
  const res = await fetch(OVERPASS, { method: 'POST', headers: { 'User-Agent': 'bopok-build-script/1.0 (data prep)', Accept: 'application/json' }, body: new URLSearchParams({ data: query }) })
  if (!res.ok) throw new Error(`Overpass 요청 실패: ${res.status}`)
  fs.mkdirSync(path.dirname(RAW), { recursive: true })
  fs.writeFileSync(RAW, await res.text())
}
const osm = JSON.parse(fs.readFileSync(RAW, 'utf8'))
const polygons = osmtogeojson(osm).features
  .filter(f => f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'))
  .flatMap(f => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates))

// ───────── 2) 미터 단위 평면 좌표(권역 중심 기준)로 바꿔서 나무 위치 흩뿌리기 ─────────
const lat0 = (TREE_BBOX[1] + TREE_BBOX[3]) / 2, lon0 = (TREE_BBOX[0] + TREE_BBOX[2]) / 2
const M_PER_DEG_LAT = 110574
const M_PER_DEG_LON = 111320 * Math.cos((lat0 * Math.PI) / 180)
const toXY = ([lon, lat]) => [(lon - lon0) * M_PER_DEG_LON, (lat - lat0) * M_PER_DEG_LAT]
const toLonLat = ([x, y]) => [lon0 + x / M_PER_DEG_LON, lat0 + y / M_PER_DEG_LAT]

const rng = mulberry32(SEED)
const occupied = new Map()
let points = []
for (const rings of polygons.map(p => p.map(r => r.map(toXY)))) {
  points.push(...scatterInPolygon(rings, { rng, minSpacing: TREE_MIN_SPACING_M, areaPerTree: AREA_PER_TREE_M2, occupied }))
}
// 권역 전체 최대 그루 수를 넘으면 난수로 골고루 덜어낸다
const candidates = points.length
if (points.length > TREE_MAX_COUNT) {
  const order = points.map((p, i) => [rng(), i]).sort((a, b) => a[0] - b[0]).slice(0, TREE_MAX_COUNT).map(x => x[1]).sort((a, b) => a - b)
  points = order.map(i => points[i])
}

// ───────── 3) 원 도형 만들기 ─────────
const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
const mix = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('')
const r6 = v => Math.round(v * 1e6) / 1e6
const circle = ([x, y], radius, steps) => {
  const ring = []
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2
    ring.push(toLonLat([x + Math.cos(a) * radius, y + Math.sin(a) * radius]).map(r6))
  }
  ring.push(ring[0])
  return { type: 'Polygon', coordinates: [ring] }
}
const between = ([a, b], t) => Math.round((a + (b - a) * t) * 10) / 10
const features = []
points.forEach((p, i) => {
  const rr = between(TREE_CROWN_RADIUS_M, rng())
  const top = between(TREE_CROWN_TOP_M, rng())
  const color = mix(PALETTE.crowns[0], PALETTE.crowns[1], rng())
  features.push({ type: 'Feature', properties: { kind: 'trunk', id: i }, geometry: circle(p, TREE_TRUNK_RADIUS_M, STEPS_TRUNK) })
  features.push({ type: 'Feature', properties: { kind: 'crown', id: i, h: top, c: color }, geometry: circle(p, rr, STEPS_CROWN) })
})
const text = JSON.stringify({ type: 'FeatureCollection', features })
fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, text)

console.log(`공원·숲·잔디 면 ${polygons.length}개 → 나무 후보 ${candidates.toLocaleString()}그루 → ${points.length.toLocaleString()}그루 (최대 ${TREE_MAX_COUNT.toLocaleString()}, 최소 간격 ${TREE_MIN_SPACING_M}m)`)
console.log(`파일 ${path.relative(root, OUT)} ${(text.length / 1024).toFixed(0)}KB sha256 ${crypto.createHash('sha256').update(text).digest('hex').slice(0, 16)}`)

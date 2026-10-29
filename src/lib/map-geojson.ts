import { along, length as turfLength, lineString } from '@turf/turf'
import type { Feature, FeatureCollection, LineString } from 'geojson'
import { FEATURE_TOILET } from '../config/flags'
import { geoNodes, segmentGeo, type GeoNode, type SegmentGeo } from './demo-geo'
import type { JudgeResult, OptionKey, SegmentResult } from './judge'
import type { Coord } from './map-types'

export type RouteStatus = 'ok' | 'warn' | 'info'
export type RouteRole = 'main' | 'detour' | 'ride'

export type RouteProps = {
  id: string
  // 목록·선택과 이어지는 본 구간 id (우회로 선도 본 구간 id 를 가진다)
  segmentId: string
  role: RouteRole
  status: RouteStatus
  selected: boolean
  // 선 진하기: 선택된 수정안에 우회로가 들어갔을 때만 우회로를 진하게
  emphasis: number
}

export type MapPin = {
  id: string
  kind: 'start' | 'rest' | 'stairs' | 'toilet'
  coord: Coord
  label: string
  indoor?: boolean
  segmentId?: string
}

export type Geo = { nodes: Record<string, GeoNode>; segments: Record<string, SegmentGeo> }
const DEMO_GEO: Geo = { nodes: geoNodes, segments: segmentGeo }

// 출처가 없는 구간은 정보 부족(회색 점선)으로 본다
function statusOf(r: SegmentResult): RouteStatus {
  if (!r.segment.source) return 'info'
  return r.status
}

export function buildRouteGeoJSON(
  result: JudgeResult,
  stopIndex: number,
  opts: { selectedId?: string | null; option?: OptionKey | number; geo?: Geo } = {},
): FeatureCollection<LineString, RouteProps> {
  const { selectedId = null, option = 0, geo = DEMO_GEO } = opts
  const features: Feature<LineString, RouteProps>[] = []
  for (const r of result.stops[stopIndex]?.segments ?? []) {
    const segment = r.segment
    const main = geo.segments[segment.id]
    if (main && main.path.length >= 2) {
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: main.path },
        properties: {
          id: segment.id, segmentId: segment.id, role: main.ride ? 'ride' : 'main', status: statusOf(r),
          selected: segment.id === selectedId, emphasis: 1,
        },
      })
    }
    const ramp = segment.ramp && geo.segments[segment.ramp.id]
    if (segment.ramp && ramp && ramp.path.length >= 2) {
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: ramp.path },
        properties: {
          id: segment.ramp.id, segmentId: segment.id, role: 'detour', status: 'ok',
          selected: segment.id === selectedId, emphasis: option >= 1 ? 1 : 0.5,
        },
      })
    }
  }
  return { type: 'FeatureCollection', features }
}

function midpoint(path: Coord[]): Coord {
  const line = lineString(path)
  return along(line, turfLength(line) / 2).geometry.coordinates as Coord
}

export function buildPins(result: JudgeResult, stopIndex: number, geo: Geo = DEMO_GEO): MapPin[] {
  const pins: MapPin[] = []
  const seen = new Set<string>()
  const addNode = (nodeId: string, first: boolean) => {
    const node = geo.nodes[nodeId]
    if (!node || seen.has(node.id)) return
    const kind = node.kind === 'start' ? 'start' : node.kind === 'rest' ? 'rest' : node.kind === 'toilet' ? 'toilet' : null
    if (!kind) return
    if (kind === 'toilet' && !FEATURE_TOILET) return
    if (kind === 'start' && !first) return
    seen.add(node.id)
    pins.push({
      id: node.id, kind, coord: node.coord,
      label: kind === 'start' ? `출발: ${node.name}` : node.restType === 'indoor' ? `${node.name} (실내)` : node.name,
      indoor: node.restType === 'indoor',
    })
  }
  const segs = result.stops[stopIndex]?.segments ?? []
  segs.forEach((r, i) => {
    const g = geo.segments[r.segment.id]
    if (!g) return
    addNode(g.from, i === 0)
    addNode(g.to, false)
    if (r.segment.stairs && r.segment.stairs > 0 && g.path.length >= 2) {
      pins.push({
        id: `stairs-${r.segment.id}`, kind: 'stairs', coord: midpoint(g.path),
        label: `! 계단 ${r.segment.stairs}칸`, segmentId: r.segment.id,
      })
    }
  })
  return pins
}

// 장소의 모든 선을 포함하는 범위 [서, 남, 동, 북]
export function routeBounds(fc: FeatureCollection<LineString, RouteProps>): [number, number, number, number] | null {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity
  for (const f of fc.features) for (const [x, y] of f.geometry.coordinates) { w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y) }
  return Number.isFinite(w) ? [w, s, e, n] : null
}

import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { FeatureCollection } from 'geojson'
import { segmentGeo } from './demo-geo'
import { crossingBearing, focusZone, nearBuildingIds, veilPolygon } from './map-focus'
import { MAP_MAX_BOUNDS } from './map-config'

const buildings = JSON.parse(fs.readFileSync(path.join(__dirname, '../../public/data/daejeon-buildings.geojson'), 'utf8')) as FeatureCollection

describe('focusZone', () => {
  it('경로 주변 범위의 상자가 경로를 감싼다', () => {
    const zone = focusZone(segmentGeo.hb3.path)!
    const [w, s, e, n] = zone.bounds
    expect(w).toBeLessThan(127.3836)
    expect(e).toBeGreaterThan(127.3846)
    expect(s).toBeLessThan(36.3680)
    expect(n).toBeGreaterThan(36.3688)
  })

  it('점이 하나뿐이면 범위가 없다', () => {
    expect(focusZone([[127.38, 36.37]])).toBeNull()
  })
})

describe('nearBuildingIds', () => {
  it('범위 밖 건물은 빼고, 넓힐수록 늘어난다', () => {
    const near60 = nearBuildingIds(buildings, focusZone(segmentGeo.hb3.path, 60)!)
    const near400 = nearBuildingIds(buildings, focusZone(segmentGeo.hb3.path, 400)!)
    expect(near60.length).toBeLessThan(buildings.features.length)
    expect(near400.length).toBeGreaterThanOrEqual(near60.length)
    expect(new Set(near60).size).toBe(near60.length)
  })

  it('상자가 겹쳐도 실제로 안 닿으면 제외한다', () => {
    const zone = focusZone(segmentGeo.hb3.path, 60)!
    const ids = new Set(nearBuildingIds(buildings, zone))
    const far = buildings.features.filter(f => !ids.has(f.properties!.fid))
    expect(far.length).toBeGreaterThan(0)
  })
})

describe('veilPolygon', () => {
  it('바깥 사각형과 범위 모양 구멍을 가진다', () => {
    const zone = focusZone(segmentGeo.hb3.path)!
    const veil = veilPolygon(MAP_MAX_BOUNDS, zone)
    expect(veil.geometry.coordinates).toHaveLength(2)
    expect(veil.geometry.coordinates[0]).toHaveLength(5)
  })
})

describe('crossingBearing', () => {
  it('동쪽으로 가는 구간은 북쪽을 바라봐서 왼쪽→오른쪽으로 보인다(0도)', () => {
    expect(crossingBearing([[127.38, 36.37], [127.39, 36.37]])).toBeCloseTo(0, 0)
  })

  it('북쪽으로 가는 구간은 서쪽을 바라본다(-90도)', () => {
    expect(crossingBearing([[127.38, 36.37], [127.38, 36.38]])).toBeCloseTo(-90, 0)
  })
})

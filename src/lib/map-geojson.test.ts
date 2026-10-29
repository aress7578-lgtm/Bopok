import { describe, expect, it } from 'vitest'
import { placeSegments } from './demo-data'
import { applyOption, conditionFromAnswers, judge } from './judge'
import { buildPins, buildRouteGeoJSON, routeBounds } from './map-geojson'

const stops = [{ name: '한밭수목원', known: true, segments: placeSegments['한밭수목원'] }]
const base = conditionFromAnswers([1, 1, 1, 0, 0]) // 20분 / 60분 / 계단 피하기 / 천천히

const statusOf = (fc: ReturnType<typeof buildRouteGeoJSON>, id: string) => fc.features.find(f => f.properties.id === id)?.properties.status

describe('buildRouteGeoJSON', () => {
  it('기본 조건: 계단 구간(hb3)은 주황, 앞 구간은 파랑', () => {
    const fc = buildRouteGeoJSON(judge(stops, base), 0)
    expect(statusOf(fc, 'hb3')).toBe('warn')
    expect(statusOf(fc, 'hb1')).toBe('ok')
    expect(statusOf(fc, 'hb2')).toBe('ok')
  })

  it('계단 피하기를 끄면 계단 구간이 파랑으로 바뀐다', () => {
    const fc = buildRouteGeoJSON(judge(stops, { ...base, avoidStairs: false }), 0)
    expect(statusOf(fc, 'hb3')).toBe('ok')
  })

  it('우회로는 수정안을 고르기 전엔 흐리고, 고르면 진하다', () => {
    const result = judge(stops, base)
    const detour = (option: number) => buildRouteGeoJSON(result, 0, { option }).features.find(f => f.properties.role === 'detour')?.properties
    expect(detour(0)?.emphasis).toBe(0.5)
    expect(detour(1)?.emphasis).toBe(1)
    expect(detour(0)?.segmentId).toBe('hb3')
  })

  it('선택된 구간만 selected', () => {
    const fc = buildRouteGeoJSON(judge(stops, base), 0, { selectedId: 'hb3' })
    const selected = fc.features.filter(f => f.properties.selected).map(f => f.properties.id)
    expect(selected).toEqual(['hb3', 'hb3r']) // 본 구간과 그 우회로
  })

  it('구간만 보기에서는 선택하지 않은 구간 선이 흐려진다', () => {
    const fc = buildRouteGeoJSON(judge(stops, base), 0, { selectedId: 'hb3', dimOthers: true })
    const emphasis = (id: string) => fc.features.find(f => f.properties.id === id)?.properties.emphasis
    expect(emphasis('hb3')).toBe(1)
    expect(emphasis('hb1')).toBe(0.3)
    expect(emphasis('hb3r')).toBe(0.5) // 선택 구간의 우회로는 원래 흐림
  })

  it('출처가 없는 구간은 정보 부족(info)', () => {
    const noSource = [{ name: 'x', known: true, segments: [{ ...placeSegments['한밭수목원'][0], source: undefined }] }]
    expect(statusOf(buildRouteGeoJSON(judge(noSource, base), 0), 'hb1')).toBe('info')
  })

  it('수정안 B 적용 결과도 선이 그려진다 (우회로 구간 id)', () => {
    const applied = judge(applyOption(stops, 2, base), base)
    const fc = buildRouteGeoJSON(applied, 0)
    expect(fc.features.some(f => f.properties.id === 'hb3r')).toBe(true)
  })

  it('좌표가 없는 구간은 건너뛴다', () => {
    const unknownSeg = [{ name: 'x', known: true, segments: [{ id: 'zz', label: 'zz', distanceM: 10, source: 's' }] }]
    expect(buildRouteGeoJSON(judge(unknownSeg, base), 0).features).toHaveLength(0)
  })
})

describe('buildPins', () => {
  it('출발·쉼터·계단 핀이 나온다 (화장실은 플래그가 꺼져 있어 없음)', () => {
    const pins = buildPins(judge(stops, base), 0)
    expect(pins.find(p => p.kind === 'start')?.label).toBe('출발: 주차장')
    expect(pins.find(p => p.kind === 'rest')?.indoor).toBe(true)
    expect(pins.find(p => p.kind === 'stairs')?.label).toBe('! 계단 24칸')
    expect(pins.some(p => p.kind === 'toilet')).toBe(false)
  })

  it('계단 핀은 구간 선의 가운데 근처', () => {
    const pin = buildPins(judge(stops, base), 0).find(p => p.kind === 'stairs')!
    expect(pin.coord[0]).toBeGreaterThan(127.3836)
    expect(pin.coord[0]).toBeLessThan(127.3846)
  })
})

describe('routeBounds', () => {
  it('모든 선을 포함한다', () => {
    const b = routeBounds(buildRouteGeoJSON(judge(stops, base), 0))!
    expect(b[0]).toBeLessThanOrEqual(127.3836)
    expect(b[2]).toBeGreaterThanOrEqual(127.3866)
  })
})

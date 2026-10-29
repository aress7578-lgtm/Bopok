import { describe, expect, it } from 'vitest'
import {
  EXPLORE_VIEW, GLYPH_DURATION_MS, GLYPH_STAGGER_MS, GLYPH_STAGGER_SEEN_MS, INTRO_VIEW, LINE2_OVERLAP_MS, PLACE_PINS,
  TITLE_LINES, TOUR_WAYPOINTS, glyphDelays, titleDoneAt,
} from './landing-intro'
import { MAP_MAX_BOUNDS, TREE_BBOX } from './map-config'
import { maxPitchForZoom } from './map-limits'

describe('glyphDelays', () => {
  it('글자마다 70ms 씩 늦게 시작하고 띄어쓰기는 칸을 쓰지 않는다', () => {
    const [line1] = glyphDelays(TITLE_LINES, GLYPH_STAGGER_MS)
    const chars = [...TITLE_LINES[0]]
    const glyphDelaysOnly = chars.map((c, i) => [c, line1[i]] as const).filter(([c]) => c !== ' ').map(([, d]) => d)
    expect(glyphDelaysOnly).toEqual(glyphDelaysOnly.map((_, i) => i * GLYPH_STAGGER_MS))
  })

  it('둘째 줄은 첫 줄이 끝나기 500ms 전에 이어서 시작한다', () => {
    const [line1, line2] = glyphDelays(TITLE_LINES, GLYPH_STAGGER_MS)
    const line1End = Math.max(...line1) + GLYPH_DURATION_MS
    expect(Math.min(...line2.filter((_, i) => TITLE_LINES[1][i] !== ' '))).toBe(line1End - LINE2_OVERLAP_MS)
  })

  it('다시 들어온 경우는 간격이 25ms 로 훨씬 짧다', () => {
    expect(titleDoneAt(TITLE_LINES, GLYPH_STAGGER_SEEN_MS)).toBeLessThan(titleDoneAt(TITLE_LINES, GLYPH_STAGGER_MS))
  })

  it('제목이 모두 내려오는 시각', () => {
    expect(titleDoneAt(TITLE_LINES, GLYPH_STAGGER_MS)).toBeGreaterThan(2000)
  })
})

describe('카메라 값', () => {
  it('웨이포인트와 핀이 시연 권역 안, 이동 범위 안에 있다', () => {
    const [w, s, e, n] = TREE_BBOX
    for (const v of [INTRO_VIEW, ...TOUR_WAYPOINTS]) {
      expect(v.center[0]).toBeGreaterThanOrEqual(w)
      expect(v.center[0]).toBeLessThanOrEqual(e)
      expect(v.center[1]).toBeGreaterThanOrEqual(s)
      expect(v.center[1]).toBeLessThanOrEqual(n)
    }
    for (const p of PLACE_PINS) {
      expect(p.coord[0]).toBeGreaterThan(MAP_MAX_BOUNDS[0])
      expect(p.coord[0]).toBeLessThan(MAP_MAX_BOUNDS[2])
    }
  })

  it('웨이포인트는 4~5곳이고 첫 곳은 도착 지점', () => {
    expect(TOUR_WAYPOINTS.length).toBeGreaterThanOrEqual(4)
    expect(TOUR_WAYPOINTS.length).toBeLessThanOrEqual(5)
    expect(TOUR_WAYPOINTS[0]).toEqual(EXPLORE_VIEW)
  })

  it('둘러보기 기울기는 60~66 이고 줌별 제한이 60 이면 60 으로 맞춰진다', () => {
    for (const v of TOUR_WAYPOINTS) {
      expect(v.pitch).toBeGreaterThanOrEqual(60)
      expect(v.pitch).toBeLessThanOrEqual(66)
      expect(Math.min(v.pitch, maxPitchForZoom(v.zoom))).toBe(60)
    }
  })

  it('첫 화면은 평면(pitch 0)', () => {
    expect(INTRO_VIEW.pitch).toBe(0)
    expect(INTRO_VIEW.zoom).toBe(14.6)
  })
})

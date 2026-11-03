import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { LANDMARKS, LANDMARK_FADE_ZOOM, LANDMARK_SCALE_RANGE, hiddenFids, landmarkFade } from './landmarks'
import { MAP_MAX_BOUNDS } from './map-config'

// 대전 경계 안(건물 타일이 있는 범위)
const [west, south, east, north] = MAP_MAX_BOUNDS

describe('랜드마크 고정값', () => {
  it('세 곳이고 id 와 모형 파일이 겹치지 않는다', () => {
    expect(LANDMARKS).toHaveLength(3)
    expect(new Set(LANDMARKS.map(l => l.id)).size).toBe(3)
    expect(new Set(LANDMARKS.map(l => l.model)).size).toBe(3)
  })

  it('좌표가 대전 경계 안이다', () => {
    for (const l of LANDMARKS) {
      expect(l.lng).toBeGreaterThan(west)
      expect(l.lng).toBeLessThan(east)
      expect(l.lat).toBeGreaterThan(south)
      expect(l.lat).toBeLessThan(north)
    }
  })

  it('숨길 건물이 비어 있지 않고 곳끼리 겹치지 않는다', () => {
    for (const l of LANDMARKS) {
      expect(l.hideFids.length).toBeGreaterThan(0)
      for (const fid of l.hideFids) expect(Number.isInteger(fid) && fid > 0).toBe(true)
    }
    const all = hiddenFids()
    expect(new Set(all).size).toBe(all.length)
  })

  it('scale 은 0.8~2, 방향은 0~360 도', () => {
    for (const l of LANDMARKS) {
      expect(l.scale).toBeGreaterThanOrEqual(LANDMARK_SCALE_RANGE[0])
      expect(l.scale).toBeLessThanOrEqual(LANDMARK_SCALE_RANGE[1])
      expect(l.heightScale).toBeGreaterThanOrEqual(1)
      expect(l.heightScale).toBeLessThanOrEqual(2)
      expect(l.bearingDeg).toBeGreaterThanOrEqual(0)
      expect(l.bearingDeg).toBeLessThan(360)
    }
  })

  it('모형 파일(glb)이 public/models 에 있고 glTF 머리말이 맞다', () => {
    for (const l of LANDMARKS) {
      const file = path.join(__dirname, '../../public/models', l.model)
      expect(fs.existsSync(file)).toBe(true)
      expect(fs.readFileSync(file).subarray(0, 4).toString('ascii')).toBe('glTF')
    }
  })
})

describe('landmarkFade', () => {
  const [z0, z1] = LANDMARK_FADE_ZOOM
  it('줌 14.5 미만은 0, 15.5 이상은 1, 사이는 서서히', () => {
    expect([z0, z1]).toEqual([14.5, 15.5])
    expect(landmarkFade(14)).toBe(0)
    expect(landmarkFade(z0)).toBe(0)
    expect(landmarkFade(15)).toBeCloseTo(0.5)
    expect(landmarkFade(z1)).toBe(1)
    expect(landmarkFade(18)).toBe(1)
  })
})

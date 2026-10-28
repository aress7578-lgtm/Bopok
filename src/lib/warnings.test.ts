import { describe, expect, it } from 'vitest'
import { buildFinalPlan } from './final-plan'
import { conditionFromAnswers } from './judge'
import { defaultPlaces } from './plan-data'
import { buildShareText } from './share-text'

const original = conditionFromAnswers([1, 1, 1, 0, 0])

describe('확정 경고', () => {
  it('A안(이것만으로는 부족)으로 확정하면 연속 걷기 경고 1줄', () => {
    const plan = buildFinalPlan(defaultPlaces, 1, original)
    expect(plan.warnings).toEqual(['⚠ 쉬지 않고 걷는 시간이 조건(20분)을 넘어요 (약 29~32분)'])
  })

  it('B안(조건 충족)으로 확정하면 경고 없음', () => {
    expect(buildFinalPlan(defaultPlaces, 2, original).warnings).toEqual([])
  })

  it('수정안 없이 확정하면 연속 걷기와 계단 경고', () => {
    expect(buildFinalPlan(defaultPlaces, 0, original).warnings).toEqual([
      '⚠ 쉬지 않고 걷는 시간이 조건(20분)을 넘어요 (약 27~30분)',
      '⚠ 계단 구간이 남아 있어요 (한밭수목원 1곳)',
    ])
  })

  it('하루 총 걷기 초과 경고', () => {
    const plan = buildFinalPlan(defaultPlaces, 2, { ...original, dayMin: 30 })
    expect(plan.warnings).toEqual(['⚠ 하루 총 걷는 시간이 조건(30분)을 넘어요 (약 52~57분)'])
  })
})

describe('공유 글 경고', () => {
  const a = buildFinalPlan(defaultPlaces, 1, original)

  it('경고 문장을 일정 아래, 안내 문구 위에 넣는다', () => {
    const lines = buildShareText(a, true).split('\n')
    const warn = lines.indexOf(a.warnings[0])
    expect(warn).toBeGreaterThan(lines.findIndex(l => l.startsWith('하루 걷기')))
    expect(warn).toBeLessThan(lines.indexOf('출발 전 운영 여부를 꼭 확인하세요'))
  })

  it('플래그를 끄면 경고가 빠진다', () => {
    expect(buildShareText(a, false)).not.toContain('⚠')
  })

  it('경고가 없는 안은 빈 줄이 늘지 않는다', () => {
    const b = buildFinalPlan(defaultPlaces, 2, original)
    expect(buildShareText(b, true)).toBe(buildShareText(b, false))
  })
})

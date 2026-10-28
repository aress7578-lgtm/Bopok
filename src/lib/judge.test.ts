import { describe, expect, it } from 'vitest'
import { placesToStops } from './demo-data'
import { buildFinalPlan } from './final-plan'
import { applyOption, conditionFromAnswers, formatRange, judge } from './judge'
import { defaultPlaces } from './plan-data'

const stops = placesToStops(defaultPlaces)
const original = conditionFromAnswers([1, 1, 1, 0, 0]) // 20분 / 60분 / 10분 / 계단 피하기 / 천천히

describe('judge', () => {
  it('원래 조건이면 조정 필요 — 지금 화면과 같은 숫자', () => {
    const r = judge(stops, original)
    expect(r.verdict).toBe('adjust')
    expect(r.reason).toBe('한밭수목원 안에 계단 구간이 있어요')
    expect(formatRange(r.day)).toBe('약 50~55분')
    expect(formatRange(r.longest)).toBe('약 27~30분')
    expect(r.unknown).toEqual(['점심 (둔산동 식당)'])
    const hb = r.stops[r.focus].segments.map(s => [s.segment.label, formatRange(s.time), s.status])
    expect(hb).toEqual([
      ['주차장 → 입구', '약 5~6분', 'ok'],
      ['입구 → 실내 쉼터', '약 6~7분', 'ok'],
      ['실내 쉼터 → 전망 데크', '약 7~8분', 'warn'],
      ['전망 데크 → 정원', '약 9~10분', 'warn'],
    ])
  })

  it('계단 피하기를 끄고 연속 30분이면 정보 부족', () => {
    const r = judge(stops, { ...original, avoidStairs: false, continuousMin: 30 })
    expect(r.violations).toEqual([])
    expect(r.verdict).toBe('info')
  })

  it('"잘 모르겠어요"와 미응답은 기본값', () => {
    expect(conditionFromAnswers([3, 3, 3, 2, 2])).toEqual(original)
    expect(conditionFromAnswers([])).toEqual(original)
  })

  it('A안은 경사로로 2분 더 걷고, B안은 쉼터에서 쉬어 최장 18~20분', () => {
    const a = judge(applyOption(stops, 1, original), original)
    expect(formatRange(a.day)).toBe('약 52~57분')
    expect(formatRange(a.longest)).toBe('약 29~32분')
    const b = judge(applyOption(stops, 2, original), original)
    expect(formatRange(b.longest)).toBe('약 18~20분')
    expect(b.violations).toEqual([])
  })
})

describe('buildFinalPlan', () => {
  it('B안 타임라인은 원본 확정 화면과 같다', () => {
    const plan = buildFinalPlan(defaultPlaces, 2, original)
    expect(plan.rows).toEqual([
      { time: '10:00', name: '한밭수목원', detail: '걷기 약 29~32분 · 추정치 · 실내 쉼터에서 10분 쉬기' },
      { time: '12:00', name: '점심 (둔산동)', detail: '정보 없음 · 수목원 → 식당 택시 약 5분' },
      { time: '13:30', name: '국립중앙과학관', detail: '걷기 약 15~17분 · 추정치' },
      { time: '16:00', name: '대전시립미술관', detail: '예약 · 걷기 약 8~9분 · 추정치' },
    ])
    expect(plan.total).toBe('하루 걷기 약 52~57분 · 쉬지 않고 걷는 시간 최대 약 20분')
    expect(plan.notice).toHaveLength(3)
  })
})

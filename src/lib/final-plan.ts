import { placesToStops } from './demo-data'
import { applyOption, formatRange, judge, round, type Condition, type JudgeResult, type OptionKey } from './judge'
import type { PlaceRow } from './plan-data'
import { buildWarnings } from './warnings'

export type FinalPlan = {
  rows: { time: string; name: string; detail: string }[]
  total: string
  notice: string[]
  warnings: string[]
  result: JudgeResult
}

// 고른 수정안을 적용한 확정 일정을 다시 판정해, 화면과 공유 글이 같은 값을 쓰게 한다.
export function buildFinalPlan(places: PlaceRow[], option: OptionKey, condition: Condition): FinalPlan {
  const stops = applyOption(placesToStops(places), option, condition)
  const result = judge(stops, condition)
  const rows = places.map((p, i) => {
    const stop = result.stops[i]
    const name = p.finalName ?? p.name
    if (!stop.known) {
      return { time: p.time, name, detail: ['정보 없음', p.finalNote].filter(Boolean).join(' · ') }
    }
    const parts: string[] = []
    if (p.tag.startsWith('예약')) parts.push('예약')
    parts.push(`걷기 ${formatRange(stop.walk)}`, '추정치')
    const rest = stop.segments.find(s => s.segment.restMin)
    if (rest) parts.push(`${rest.segment.shelterName ?? '쉴 곳'}에서 ${rest.segment.restMin}분 쉬기`)
    return { time: p.time, name, detail: parts.join(' · ') }
  })
  return {
    rows,
    total: `하루 걷기 ${formatRange(result.day)} · 쉬지 않고 걷는 시간 최대 약 ${round(result.longest.high)}분`,
    notice: places.filter((_, i) => result.stops[i].known).map(p => `${p.name} 042-○○○-○○○○`),
    warnings: buildWarnings(result, condition),
    result,
  }
}

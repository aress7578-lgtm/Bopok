'use client'

import { usePlan } from '@/components/PlanProvider'
import { usePlanJudge } from '@/components/usePlanJudge'
import { applyOption, formatRange, judge, round, type JudgeResult } from '@/lib/judge'

const restTotal = (r: JudgeResult) =>
  r.stops.reduce((sum, st) => sum + st.segments.reduce((s, x) => s + (x.segment.restMin ?? 0), 0), 0)

export function OptionsScreen() {
  const { state, update, go } = usePlan()
  const { condition, stops, result: base } = usePlanJudge()
  const { option, places } = state
  const a = judge(applyOption(stops, 1, condition), condition)
  const b = judge(applyOption(stops, 2, condition), condition)
  const rampUsed = stops.some(st => st.segments.some(s => s.stairs && s.ramp))
  const extra = round(a.day.base) - round(base.day.base)
  const restSeg = b.stops.flatMap(st => st.segments).find(s => s.segment.restMin)?.segment
  const keep = places.flatMap(p => {
    if (p.tag === '꼭 갈 곳') return [`${p.name} (꼭 갈 곳)`]
    const m = p.tag.match(/^예약 (.+)$/)
    return m ? [`${p.name} (${m[1]} 예약)`] : []
  })
  const options = [
    ['A 동선 조정', rampUsed ? `계단 대신 경사로로 가요. ${extra}분 더 걸어요.` : '바꿀 수 있는 계단 구간이 없어요.', a],
    ['B 휴식 추가', restSeg ? `${rampUsed ? '경사로로 가고, ' : ''}${restSeg.shelterName ?? '중간 쉴 곳'}에서 ${condition.restMin}분 쉬어요.` : '쉬어 갈 구간이 없어요.', b],
  ] as const
  return <div className="planner-content options-page">
    <p className="question-count">5 / 6 · 수정안</p><h1>이렇게 고칠 수 있어요</h1><p className="question-help">수정안은 앞의 변경을 포함해 하나씩 쌓여요.</p>
    <div className="option-grid">{options.map(([name, desc, r], i) => {
      const ok = r.violations.length === 0
      return <article className={option === i + 1 ? 'option-card chosen' : 'option-card'} key={name}><small>{name}</small><h3>{desc}</h3><em className={ok ? 'status-ok' : 'status-warn'}>{ok ? '✓ 조건 충족' : '이것만으로는 부족'}</em>{[['하루 총 걷기', `${formatRange(base.day)} → ${formatRange(r.day)}`], ['가장 긴 연속 걷기', `${formatRange(base.longest)} → ${formatRange(r.longest)}`], ['휴식 시간', `${restTotal(base)}분 → ${restTotal(r)}분`], ['추가 비용', '없음'], ['바뀐 장소', '없음']].map(([label, value]) => <div className="metric" key={label}><span>{label}</span><b>{value}</b></div>)}<p>유지: {keep.length > 0 ? keep.join(', ') : '장소는 그대로예요'}</p><button onClick={() => update({ option: i + 1 })}>{option === i + 1 ? '✓ 정했어요' : '이 안으로 정하기'}</button></article>
    })}</div>
    <div className="ad-box"><small>광고</small><b>[광고 자리]</b><p>광고는 판정과 수정안에 영향을 주지 않아요.</p></div>
    <div className="planner-actions"><button className="back" onClick={() => go('/plan/result')}>조건 바꿔 보기</button><button className="button" disabled={!option} onClick={() => go('/plan/final')}>이 안으로 확정</button></div>
  </div>
}

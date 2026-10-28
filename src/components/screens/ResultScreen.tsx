'use client'

import { usePlan } from '@/components/PlanProvider'
import { usePlanJudge } from '@/components/usePlanJudge'
import { formatRange, unknownLabel } from '@/lib/judge'

export function ResultScreen() {
  const { update, go } = usePlan()
  const { condition, result } = usePlanJudge()
  const segments = result.stops[result.focus]?.segments ?? []
  const dayOver = result.day.high > condition.dayMin + 1e-9
  const longestOver = result.longest.high > condition.continuousMin + 1e-9
  const verdictBadge = result.verdict === 'adjust'
    ? <span className="verdict warn">! 조정 필요</span>
    : result.verdict === 'ok'
      ? <span className="verdict ok">✓ 조건 충족</span>
      : <span className="verdict info">? 정보 부족</span>
  const unknownName = result.unknown[0]
  const unknownTitle = unknownName?.startsWith('점심') ? `${unknownLabel(unknownName)}는` : `${unknownName}은(는)`
  return <div className="planner-content result-page">
    <div className="title-row"><div><p className="question-count">4 / 6 · 판정 결과</p><h1>{result.reason}</h1></div>{verdictBadge}</div>
    {result.unknown.length > 0 && <p className="missing-note">정보 없는 장소 {result.unknown.length}곳</p>}
    <div className="day-summary"><div><small>하루 총 걷는 시간</small><b>{formatRange(result.day)} <em>추정치</em></b>{dayOver ? <span className="over">조건 {condition.dayMin}분 · ! 넘어요</span> : <span>조건 {condition.dayMin}분 · ✓</span>}</div><div><small>가장 긴 연속 걷기</small><b>{formatRange(result.longest)} <em>추정치</em></b>{longestOver ? <span className="over">조건 {condition.continuousMin}분 · ! 넘어요</span> : <span>조건 {condition.continuousMin}분 · ✓</span>}</div></div>
    <details className="condition-tuner"><summary>조건 바꿔 보기</summary><p>쉬지 않고 걷기 <b>−　{condition.continuousMin}분　＋</b></p><p>하루 총 걷기 <b>−　{condition.dayMin}분　＋</b></p><p>계단 피하기 <b>{condition.avoidStairs ? '켜짐' : '꺼짐'}</b></p></details>
    <div className="result-grid">
      <div className="route-map"><span className="map-label">구간만 보기　 2D로 보기</span><i className="route-blue r1" /><i className="route-orange r2" /><i className="route-gray r3" /><b className="map-pin p1">A</b><b className="map-pin p2">B</b><b className="map-pin p3">C</b></div>
      <div className="segment-list"><h3>구간별 근거</h3>{segments.map(s => <div key={s.segment.id} className={s.segment.id === result.selectedSegmentId ? 'selected-segment' : undefined}><span><b>{s.segment.label}</b><small>{formatRange(s.time)}{s.segment.stairs ? ` · 계단 ${s.segment.stairs}칸` : ''}{s.segment.note ? ` · ${s.segment.note}` : ''}</small></span>{s.status === 'ok' ? <em className="status-ok">✓ 조건 충족</em> : <em className="status-warn">! 조정 필요</em>}</div>)}</div>
    </div>
    {unknownName && <div className="missing-card"><b>{unknownTitle} 아직 길 정보가 없어요</b><button onClick={() => go('/review')}>다녀오시면 알려주세요</button></div>}
    <div className="planner-actions"><button className="back" onClick={() => go('/plan/confirm')}>이전</button>{result.verdict === 'adjust'
      ? <button className="button" onClick={() => go('/plan/options')}>수정안 보기</button>
      : <button className="button" onClick={() => { update({ option: 0 }); go('/plan/final') }}>이대로 확정하기</button>}</div>
  </div>
}

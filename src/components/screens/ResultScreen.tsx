'use client'

import { useCallback, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { usePlan } from '@/components/PlanProvider'
import { usePlanJudge } from '@/components/usePlanJudge'
import { formatSourceLine } from '@/lib/format-source'
import { formatRange, unknownLabel, type Condition, type TunedCondition } from '@/lib/judge'
import { buildPins, buildRouteGeoJSON, routeBounds } from '@/lib/map-geojson'

// 서버에는 WebGL이 없어서 지도는 브라우저에서만 불러온다
const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => <div className="map-loading" role="status">지도를 불러오는 중이에요</div>,
})

export function ResultScreen() {
  const { state, update, go } = usePlan()
  const { chosen, condition, result } = usePlanJudge()
  const tuned: TunedCondition = state.tuned ?? {}
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [flat, setFlat] = useState(false)
  const [mapFailed, setMapFailed] = useState(false)
  const onMapFail = useCallback(() => setMapFailed(true), [])
  const [selected, setSelected] = useState<string | null>(null)
  const segments = result.stops[result.focus]?.segments ?? []
  // 지도 선과 구간 목록이 같은 선택을 따라간다. 선택한 구간이 사라지면 판정의 기본 선택으로 돌아간다
  const selId = segments.some(s => s.segment.id === selected) ? selected : result.selectedSegmentId
  const select = useCallback((id: string) => {
    setSelected(id)
    setOpen(prev => ({ ...prev, [id]: true }))
  }, [])
  const routes = useMemo(() => {
    const fc = buildRouteGeoJSON(result, result.focus, { selectedId: selId, option: state.option })
    return fc.features.length > 0 ? fc : null
  }, [result, selId, state.option])
  const pins = useMemo(() => buildPins(result, result.focus), [result])
  const fit = useMemo(() => (routes ? routeBounds(routes) : null), [routes])
  // 조건 바꿔 보기: 부모님이 고른 값과 같아지면 덮어쓴 값을 지운다
  const setTuned = (key: keyof TunedCondition, value: number | boolean) => {
    const next: TunedCondition = { ...tuned, [key]: value }
    if (next[key] === chosen[key as keyof Condition]) delete next[key]
    update({ tuned: next })
  }
  const stepTuned = (key: 'continuousMin' | 'dayMin', delta: number, min: number, max: number) =>
    setTuned(key, Math.min(max, Math.max(min, condition[key] + delta)))
  const differs = Object.keys(tuned).length > 0
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
    <details className="condition-tuner"><summary>조건 바꿔 보기</summary><p>쉬지 않고 걷기 <b className="tuner-ctrl"><button aria-label="쉬지 않고 걷기 줄이기" onClick={() => stepTuned('continuousMin', -5, 5, 60)}>−</button>{condition.continuousMin}분<button aria-label="쉬지 않고 걷기 늘리기" onClick={() => stepTuned('continuousMin', 5, 5, 60)}>＋</button></b></p><p>하루 총 걷기 <b className="tuner-ctrl"><button aria-label="하루 총 걷기 줄이기" onClick={() => stepTuned('dayMin', -10, 10, 240)}>−</button>{condition.dayMin}분<button aria-label="하루 총 걷기 늘리기" onClick={() => stepTuned('dayMin', 10, 10, 240)}>＋</button></b></p><p>계단 피하기 <button className="tuner-toggle" aria-pressed={condition.avoidStairs} onClick={() => setTuned('avoidStairs', !condition.avoidStairs)}>{condition.avoidStairs ? '켜짐' : '꺼짐'}</button></p>{differs && <p className="tuner-diff"><span>부모님이 고른 조건과 달라요</span><button onClick={() => update({ tuned: {} })}>원래 조건으로 되돌리기</button></p>}</details>
    <div className="result-grid">
      <div className="route-map map-live"><MapView flat={flat} onFail={onMapFail} routes={routes} pins={pins} fit={fit} onSelectSegment={select} />{!mapFailed && <span className="map-label">구간만 보기　 <button className="map-flat" onClick={() => setFlat(v => !v)}>{flat ? '3D로 보기' : '2D로 보기'}</button></span>}</div>
      <div className="segment-list"><h3>구간별 근거</h3>{segments.map(s => <div key={s.segment.id} className={s.segment.id === selId ? 'selected-segment' : undefined}><span><button className="seg-toggle" aria-expanded={!!open[s.segment.id]} onClick={() => { setSelected(s.segment.id); setOpen(prev => ({ ...prev, [s.segment.id]: !prev[s.segment.id] })) }}><b>{s.segment.label}</b><small>{formatRange(s.time)}{s.segment.stairs ? ` · 계단 ${s.segment.stairs}칸` : ''}{s.segment.note ? ` · ${s.segment.note}` : ''}</small></button>{open[s.segment.id] && <small className="seg-source">{formatSourceLine(s.segment.source, s.segment.checkedAt)}</small>}</span>{s.status === 'ok' ? <em className="status-ok">✓ 조건 충족</em> : <em className="status-warn">! 조정 필요</em>}</div>)}</div>
    </div>
    {unknownName && <div className="missing-card"><b>{unknownTitle} 아직 길 정보가 없어요</b><button onClick={() => go('/review')}>다녀오시면 알려주세요</button></div>}
    <div className="planner-actions"><button className="back" onClick={() => go('/plan/confirm')}>이전</button>{result.verdict === 'adjust'
      ? <button className="button" onClick={() => go('/plan/options')}>수정안 보기</button>
      : <button className="button" onClick={() => { update({ option: 0 }); go('/plan/final') }}>이대로 확정하기</button>}</div>
  </div>
}

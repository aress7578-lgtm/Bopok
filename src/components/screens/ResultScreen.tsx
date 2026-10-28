'use client'

import { usePlan } from '@/components/PlanProvider'

export function ResultScreen() {
  const { go } = usePlan()
  return <div className="planner-content result-page">
    <div className="title-row"><div><p className="question-count">4 / 6 · 판정 결과</p><h1>한밭수목원 안에 계단 구간이 있어요</h1></div><span className="verdict warn">! 조정 필요</span></div>
    <p className="missing-note">정보 없는 장소 1곳</p>
    <div className="day-summary"><div><small>하루 총 걷는 시간</small><b>약 50~55분 <em>추정치</em></b><span>조건 60분 · ✓</span></div><div><small>가장 긴 연속 걷기</small><b>약 27~30분 <em>추정치</em></b><span className="over">조건 20분 · ! 넘어요</span></div></div>
    <details className="condition-tuner"><summary>조건 바꿔 보기</summary><p>쉬지 않고 걷기 <b>−　20분　＋</b></p><p>하루 총 걷기 <b>−　60분　＋</b></p><p>계단 피하기 <b>켜짐</b></p></details>
    <div className="result-grid">
      <div className="route-map"><span className="map-label">구간만 보기　 2D로 보기</span><i className="route-blue r1" /><i className="route-orange r2" /><i className="route-gray r3" /><b className="map-pin p1">A</b><b className="map-pin p2">B</b><b className="map-pin p3">C</b></div>
      <div className="segment-list"><h3>구간별 근거</h3><div><span><b>주차장 → 입구</b><small>약 5~6분 · 추정치</small></span><em className="status-ok">✓ 조건 충족</em></div><div><span><b>입구 → 실내 쉼터</b><small>약 6~7분 · 쉼터(실내)</small></span><em className="status-ok">✓ 조건 충족</em></div><div className="selected-segment"><span><b>실내 쉼터 → 전망 데크</b><small>약 7~8분 · 계단 24칸</small></span><em className="status-warn">! 조정 필요</em></div><div><span><b>전망 데크 → 정원</b><small>약 9~10분</small></span><em className="status-warn">! 조정 필요</em></div></div>
    </div>
    <div className="missing-card"><b>점심 장소는 아직 길 정보가 없어요</b><button onClick={() => go('/review')}>다녀오시면 알려주세요</button></div>
    <div className="planner-actions"><button className="back" onClick={() => go('/plan/confirm')}>이전</button><button className="button" onClick={() => go('/plan/options')}>수정안 보기</button></div>
  </div>
}

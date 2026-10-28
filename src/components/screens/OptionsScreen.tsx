'use client'

import { usePlan } from '@/components/PlanProvider'

export function OptionsScreen() {
  const { state, update, go } = usePlan()
  const { option } = state
  return <div className="planner-content options-page">
    <p className="question-count">5 / 6 · 수정안</p><h1>이렇게 고칠 수 있어요</h1><p className="question-help">수정안은 앞의 변경을 포함해 하나씩 쌓여요.</p>
    <div className="option-grid">{[
      ['A 동선 조정','계단 대신 경사로로 가요. 2분 더 걸어요.','이것만으로는 부족','약 50~55분 → 약 52~57분','약 27~30분 → 약 29~32분','0분 → 0분'],
      ['B 휴식 추가','경사로로 가고, 실내 쉼터에서 10분 쉬어요.','✓ 조건 충족','약 50~55분 → 약 52~57분','약 27~30분 → 약 18~20분','0분 → 10분'],
    ].map((item, i) => <article className={option === i + 1 ? 'option-card chosen' : 'option-card'} key={item[0]}><small>{item[0]}</small><h3>{item[1]}</h3><em className={i ? 'status-ok' : 'status-warn'}>{item[2]}</em>{[['하루 총 걷기',item[3]],['가장 긴 연속 걷기',item[4]],['휴식 시간',item[5]],['추가 비용','없음'],['바뀐 장소','없음']].map(([label,value]) => <div className="metric" key={label}><span>{label}</span><b>{value}</b></div>)}<p>유지: 한밭수목원 (꼭 갈 곳), 대전시립미술관 (16:00 예약)</p><button onClick={() => update({ option: i + 1 })}>{option === i + 1 ? '✓ 정했어요' : '이 안으로 정하기'}</button></article>)}</div>
    <div className="ad-box"><small>광고</small><b>[광고 자리]</b><p>광고는 판정과 수정안에 영향을 주지 않아요.</p></div>
    <div className="planner-actions"><button className="back" onClick={() => go('/plan/result')}>조건 바꿔 보기</button><button className="button" disabled={!option} onClick={() => go('/plan/final')}>이 안으로 확정</button></div>
  </div>
}

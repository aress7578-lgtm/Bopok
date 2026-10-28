'use client'

import { usePlan } from '@/components/PlanProvider'

export function FinalScreen() {
  const { go, notify } = usePlan()
  return <div className="planner-content share-page">
    <p className="question-count">6 / 6 · 확정</p><h1>확정된 하루 일정</h1><p className="question-help">가족에게 보내기 좋게 꼭 필요한 내용만 정리했어요.</p>
    <div className="timeline">{[['10:00','한밭수목원','걷기 약 29~32분 · 추정치 · 실내 쉼터에서 10분 쉬기'],['12:00','점심 (둔산동)','정보 없음 · 수목원 → 식당 택시 약 5분'],['13:30','국립중앙과학관','걷기 약 15~17분 · 추정치'],['16:00','대전시립미술관','예약 · 걷기 약 8~9분 · 추정치']].map(row => <div key={row[0]}><time>{row[0]}</time><span><b>{row[1]}</b><small>{row[2]}</small></span></div>)}</div>
    <div className="day-total">하루 걷기 약 52~57분 · 쉬지 않고 걷는 시간 최대 약 20분 <em>추정치</em></div>
    <div className="notice"><b>출발 전 운영 여부를 꼭 확인하세요</b><p>한밭수목원 042-○○○-○○○○<br />국립중앙과학관 042-○○○-○○○○<br />대전시립미술관 042-○○○-○○○○</p></div>
    <div className="share-actions"><button className="button" onClick={() => notify('일정 글을 복사했어요')}>가족에게 보내기</button><button className="save-button" onClick={() => notify('일정 글을 복사했어요')}>복사하기</button></div>
    <button className="direct-link" onClick={() => go('/review')}>다녀오셨나요? 구간 평가하기</button>
    <button className="back home-bottom" onClick={() => go('/')}>처음으로</button>
  </div>
}

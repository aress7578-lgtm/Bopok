'use client'

import { usePlan } from '@/components/PlanProvider'

export function ConfirmScreen() {
  const { go } = usePlan()
  return <div className="planner-content confirm-page">
    <p className="question-count">3 / 6 · 확인</p><h1>이렇게 정리했어요</h1><p className="question-help">맞는지 확인해 주세요.</p>
    <div className="confirm-list">{[['10:00','한밭수목원','꼭 갈 곳'],['12:00','점심 (둔산동 식당)','정보 없음'],['13:30','국립중앙과학관',''],['16:00','대전시립미술관','예약 16:00']].map(row => <div key={row[0]}><time>{row[0]}</time><span><b>{row[1]}</b>{row[2] && <small className={row[2] === '정보 없음' ? 'unknown-tag' : ''}>{row[2]}</small>}</span><button>장소 바꾸기</button></div>)}</div>
    <button className="add-place">+ 장소 추가</button>
    <div className="planner-actions"><button className="back" onClick={() => go('/plan/schedule')}>이전</button><button className="button" onClick={() => go('/plan/result')}>판정받기</button></div>
  </div>
}

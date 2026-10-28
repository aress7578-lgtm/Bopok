'use client'

import { usePlan } from '@/components/PlanProvider'

export function ReviewScreen() {
  const { go, notify } = usePlan()
  return <div className="planner-content review-page">
    <button className="back" onClick={() => go('/plan/final')}>← 확정 일정으로</button><h1>다녀오신 길을 알려주세요</h1><p className="question-help">다음 가족의 판정이 더 정확해져요.</p>
    <div className="review-list">{['주차장 → 입구','입구 → 실내 쉼터','실내 쉼터 → 전망 데크 (경사로)','전망 데크 → 정원','점심 장소 안 길'].map(item => <div key={item}><b>{item}</b><button onClick={() => notify('평가 질문을 열었어요')}>평가하기</button></div>)}</div>
  </div>
}
